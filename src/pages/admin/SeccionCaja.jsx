import { useState, useEffect, useCallback } from 'react'
import { obtenerCaja, obtenerCobros, cerrarCaja } from '../../services/adminService'
import { useSocketEventos } from '../../hooks/useSocketEventos'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoFlecha, IconoDescargar, IconoCheck } from '../../components/Iconos'
import { precio, fechaCorta, fechaHora, hoyISO, leerMonto } from '../../utils/formato'
import { aCsv, descargar } from '../../utils/csv'

/**
 * Caja del día (plan de mejoras 1.4): lo cobrado en el mostrador, planes y
 * semanales, con quién lo cobró; totales por medio de pago y el cierre con el
 * efectivo contado. Abajo, exportar los cobros de un período a Excel (1.5).
 */

const METODOS = {
  efectivo: 'Efectivo', transferencia: 'Transferencia', mercadopago: 'Mercado Pago', otro: 'Otro'
}

const sumarDias = (texto, n) => {
  const d = new Date(`${texto}T12:00:00`)
  d.setDate(d.getDate() + n)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function SeccionCaja({ alExito, alError, confirmar }) {
  const hoy = hoyISO()
  const [fecha, setFecha] = useState(hoy)
  const [caja, setCaja] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setCaja(await obtenerCaja(fecha))
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cargar la caja')
      setCaja(prev => prev ?? false)
    }
  }, [fecha, alError])

  useEffect(() => { cargar() }, [cargar])
  // Un cobro nuevo, desde otra PC o desde otra sección, se ve al instante.
  useSocketEventos({ cobro_registrado: cargar, pago_confirmado: cargar })

  const esHoy = fecha === hoy

  return (
    <div className="flex flex-col gap-4">
      <div className="tarjeta flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="flex items-center gap-2">
          <button onClick={() => setFecha(f => sumarDias(f, -1))} className="btn btn-contorno btn-chico" aria-label="Día anterior">
            <IconoFlecha size={15} />
          </button>
          <input
            type="date" className="campo w-auto" value={fecha} max={hoy} aria-label="Día de la caja"
            onChange={e => e.target.value && setFecha(e.target.value)}
          />
          <button
            onClick={() => setFecha(f => sumarDias(f, 1))} disabled={esHoy}
            className="btn btn-contorno btn-chico" aria-label="Día siguiente"
          >
            <IconoFlecha size={15} style={{ transform: 'rotate(180deg)' }} />
          </button>
        </div>
        {!esHoy && <button onClick={() => setFecha(hoy)} className="btn btn-fantasma btn-chico">Volver a hoy</button>}
      </div>

      {caja === null ? <SkeletonLista filas={3} /> : caja === false ? null : (
        <>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            <Cifra titulo="Total cobrado" valor={precio(caja.totales.total)} acento />
            <Cifra titulo="Efectivo" valor={precio(caja.totales.efectivo)} />
            <Cifra titulo="Transferencia" valor={precio(caja.totales.transferencia)} />
            <Cifra titulo="Mercado Pago y otros" valor={precio(caja.totales.mercadopago + caja.totales.otro)} />
          </div>

          <section className="tarjeta p-4">
            <h2 className="titulo-seccion mb-3">
              Cobros {esHoy ? 'de hoy' : `del ${fechaCorta(fecha)}`} ({caja.cobros.length})
            </h2>
            {caja.cobros.length === 0 ? (
              <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>No hubo cobros este día.</p>
            ) : (
              <ul className="flex flex-col">
                {caja.cobros.map((c, i) => (
                  <li key={i} className="flex items-start justify-between gap-3 py-2.5"
                      style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">
                        <span style={{ color: 'var(--color-texto-3)' }}>{c.hora}</span> · {c.socio}
                      </p>
                      <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>{c.concepto}</p>
                      <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                        {METODOS[c.metodo] ?? c.metodo}{c.cobro && ` · cobró ${c.cobro.split(' ')[0]}`}
                      </p>
                    </div>
                    <p className="shrink-0 text-sm font-bold">{precio(c.monto)}</p>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <Cierre
            fecha={fecha} caja={caja} confirmar={confirmar} alError={alError}
            alCerrar={async (datos) => {
              try {
                const r = await cerrarCaja(fecha, datos)
                await cargar()
                const d = r.diferencia
                alExito(d === 0 ? 'Caja cerrada: coincide' : `Caja cerrada: ${d > 0 ? 'sobran' : 'faltan'} ${precio(Math.abs(d))}`)
                return true
              } catch (err) {
                alError(err.response?.data?.error || 'No pudimos cerrar la caja')
                return false
              }
            }}
          />
        </>
      )}

      <Exportar hoy={hoy} alError={alError} alExito={alExito} />
    </div>
  )
}

function Cifra({ titulo, valor, acento }) {
  return (
    <div className="tarjeta p-3.5">
      <p className="text-lg font-bold tracking-tight" style={{ color: acento ? 'var(--color-acento)' : 'var(--color-texto)' }}>{valor}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{titulo}</p>
    </div>
  )
}

/** Cierre con el efectivo contado. Se puede rehacer: queda el último. */
function Cierre({ fecha, caja, confirmar, alCerrar, alError }) {
  const [rehaciendo, setRehaciendo] = useState(false)
  const [contado, setContado] = useState('')
  const [nota, setNota] = useState('')
  const [enviando, setEnviando] = useState(false)

  const esperado = caja.totales.efectivo
  const valor = leerMonto(contado)
  const diferencia = Number.isFinite(valor) ? valor - esperado : null
  const c = caja.cierre

  if (c && !rehaciendo) {
    const d = c.contado_efectivo - c.esperado_efectivo
    // Si después del cierre entró otro cobro en efectivo, el cierre quedó viejo.
    const desactualizado = c.esperado_efectivo !== esperado
    return (
      <section className="tarjeta p-4" style={{ borderColor: d === 0 && !desactualizado ? 'var(--color-exito)' : 'var(--color-alerta)' }}>
        <h2 className="titulo-seccion mb-2">Caja cerrada</h2>
        <p className="text-sm">
          Esperado {precio(c.esperado_efectivo)} · contado {precio(c.contado_efectivo)} ·{' '}
          <strong style={{ color: d === 0 ? 'var(--color-exito)' : 'var(--color-alerta)' }}>
            {d === 0 ? 'coincide' : `${d > 0 ? 'sobran' : 'faltan'} ${precio(Math.abs(d))}`}
          </strong>
        </p>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>
          {c.cerrado_por && `Cerró ${c.cerrado_por} · `}{fechaHora(c.updated_at)}{c.nota && ` · ${c.nota}`}
        </p>
        {desactualizado && (
          <p className="mt-2 text-xs" style={{ color: 'var(--color-alerta)' }}>
            Después del cierre entraron cobros en efectivo: ahora tendría que haber {precio(esperado)}. Rehacé el cierre.
          </p>
        )}
        <button onClick={() => { setContado(''); setNota(c.nota ?? ''); setRehaciendo(true) }} className="btn btn-contorno btn-chico mt-3">
          Rehacer el cierre
        </button>
      </section>
    )
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!Number.isFinite(valor) || valor < 0) return alError('Escribí el efectivo contado, por ejemplo 150.000')
    const ok = await confirmar({
      titulo: `¿Cerrar la caja del ${fechaCorta(fecha)}?`,
      mensaje: diferencia === 0
        ? `El efectivo coincide: ${precio(esperado)}.`
        : `Tendría que haber ${precio(esperado)} y contaste ${precio(valor)}: ${diferencia > 0 ? 'sobran' : 'faltan'} ${precio(Math.abs(diferencia))}.`,
      textoConfirmar: 'Cerrar caja'
    })
    if (!ok) return
    setEnviando(true)
    if (await alCerrar({ contado_efectivo: valor, nota })) setRehaciendo(false)
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} className="tarjeta flex flex-col gap-3 p-4">
      <h2 className="titulo-seccion">Cierre de caja</h2>
      <p className="text-sm" style={{ color: 'var(--color-texto-2)' }}>
        Según los cobros, en efectivo tendría que haber <strong style={{ color: 'var(--color-texto)' }}>{precio(esperado)}</strong>.
      </p>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="caja-contado" className="etiqueta-campo">Efectivo contado</label>
          <input id="caja-contado" className="campo" inputMode="decimal" required placeholder="150.000"
                 value={contado} onChange={e => setContado(e.target.value)} />
          {diferencia !== null && (
            <p className="mt-1 text-xs font-semibold" style={{ color: diferencia === 0 ? 'var(--color-exito)' : 'var(--color-alerta)' }}>
              {diferencia === 0 ? 'Coincide' : `${diferencia > 0 ? 'Sobran' : 'Faltan'} ${precio(Math.abs(diferencia))}`}
            </p>
          )}
        </div>
        <div>
          <label htmlFor="caja-nota" className="etiqueta-campo">Nota (opcional)</label>
          <input id="caja-nota" className="campo" maxLength={500} placeholder="Retiré $50.000 para el alquiler…"
                 value={nota} onChange={e => setNota(e.target.value)} />
        </div>
      </div>
      <div className="flex gap-2">
        {rehaciendo && <button type="button" onClick={() => setRehaciendo(false)} className="btn btn-fantasma flex-1">Cancelar</button>}
        <button type="submit" disabled={enviando} className="btn btn-primario flex-1">
          <IconoCheck size={16} /> {enviando ? 'Cerrando…' : 'Cerrar caja'}
        </button>
      </div>
    </form>
  )
}

/** Los cobros de un período, a Excel, para el contador. */
function Exportar({ hoy, alError, alExito }) {
  const [desde, setDesde] = useState(`${hoy.slice(0, 8)}01`)
  const [hasta, setHasta] = useState(hoy)
  const [bajando, setBajando] = useState(false)

  const exportar = async () => {
    setBajando(true)
    try {
      const { cobros } = await obtenerCobros(desde, hasta)
      if (cobros.length === 0) return alError('No hay cobros en ese período')
      const csv = aCsv(cobros, [
        { titulo: 'Fecha', valor: c => fechaCorta(c.fecha) },
        { titulo: 'Hora', valor: c => c.hora },
        { titulo: 'Socio', valor: c => c.socio },
        { titulo: 'DNI', valor: c => c.dni },
        { titulo: 'Tipo', valor: c => c.tipo === 'plan' ? 'Plan mensual' : 'Semanal' },
        { titulo: 'Concepto', valor: c => c.concepto },
        { titulo: 'Medio de pago', valor: c => METODOS[c.metodo] ?? c.metodo },
        { titulo: 'Cobró', valor: c => c.cobro },
        { titulo: 'Monto', valor: c => c.monto }
      ])
      descargar(`cobros_${desde}_a_${hasta}.csv`, csv)
      alExito(`Listo: ${cobros.length} cobros`)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos exportar los cobros')
    } finally {
      setBajando(false)
    }
  }

  return (
    <section className="tarjeta flex flex-col gap-3 p-4">
      <h2 className="titulo-seccion">Exportar cobros a Excel</h2>
      <div className="flex flex-wrap items-end gap-2">
        <div>
          <label htmlFor="exp-desde" className="etiqueta-campo">Desde</label>
          <input id="exp-desde" type="date" className="campo w-auto" value={desde} max={hasta} onChange={e => setDesde(e.target.value)} />
        </div>
        <div>
          <label htmlFor="exp-hasta" className="etiqueta-campo">Hasta</label>
          <input id="exp-hasta" type="date" className="campo w-auto" value={hasta} min={desde} max={hoy} onChange={e => setHasta(e.target.value)} />
        </div>
        <button onClick={exportar} disabled={bajando || !desde || !hasta} className="btn btn-contorno">
          <IconoDescargar size={16} /> {bajando ? 'Armando…' : 'Descargar'}
        </button>
      </div>
      <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
        Hasta un año por vez. Abre en Excel con los montos listos para sumar.
      </p>
    </section>
  )
}
