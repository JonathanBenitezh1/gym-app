import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  obtenerCuotas, guardarConfigCuota, registrarPagoCuota,
  corregirVenceCuota, obtenerPagosCuota
} from '../../services/adminService'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoBuscar, IconoWhatsapp, IconoCheck } from '../../components/Iconos'
import { precio, fechaCorta, fechaHora, leerMonto } from '../../utils/formato'
import { linkWhatsapp, mensajeCuota } from '../../utils/whatsapp'

const ESTADOS = {
  al_dia:    { texto: 'Al día',     insignia: 'insignia-exito' },
  gracia:    { texto: 'En gracia',  insignia: 'insignia-alerta' },
  vencida:   { texto: 'Vencida',    insignia: 'insignia-error' },
  sin_cuota: { texto: 'Sin pagar',  insignia: 'insignia-neutra' }
}
const FILTROS = [
  { id: 'todos',     texto: 'Todos' },
  { id: 'vencida',   texto: 'Vencidas' },
  { id: 'gracia',    texto: 'En gracia' },
  { id: 'sin_cuota', texto: 'Sin pagar' },
  { id: 'al_dia',    texto: 'Al día' }
]
const METODOS = [
  { id: 'efectivo',      texto: 'Efectivo' },
  { id: 'transferencia', texto: 'Transferencia' },
  { id: 'mercadopago',   texto: 'Mercado Pago' },
  { id: 'otro',          texto: 'Otro' }
]

/** "Vence el 10/10" / "Venció el 10/09" / "Nunca pagó" */
function detalleVence(s) {
  if (!s.cuota_vence) return 'Nunca pagó'
  if (s.estado === 'al_dia') return `Vence el ${fechaCorta(s.cuota_vence)}`
  if (s.estado === 'gracia') {
    return `Venció el ${fechaCorta(s.cuota_vence)} · ${s.dias_restantes === 1 ? 'queda 1 día' : `quedan ${s.dias_restantes} días`}`
  }
  return `Venció el ${fechaCorta(s.cuota_vence)}`
}

export default function SeccionCuotas({ alExito, alError, confirmar }) {
  const [datos, setDatos]       = useState(null)
  const [filtro, setFiltro]     = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto]   = useState(null) // { id, modo: 'cobrar' | 'corregir' | 'historial' }

  const cargar = useCallback(async () => {
    try {
      setDatos(await obtenerCuotas())
    } catch {
      alError('No pudimos cargar las cuotas')
      setDatos(prev => prev ?? false)
    }
  }, [alError])

  useEffect(() => { cargar() }, [cargar])

  const conteo = useMemo(() => {
    const c = { al_dia: 0, gracia: 0, vencida: 0, sin_cuota: 0 }
    for (const s of datos?.socios ?? []) c[s.estado]++
    return c
  }, [datos])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (datos?.socios ?? []).filter(s =>
      (filtro === 'todos' || s.estado === filtro) &&
      (!texto || s.nombre.toLowerCase().includes(texto) || String(s.dni).includes(texto))
    )
  }, [datos, filtro, busqueda])

  if (datos === null) return <SkeletonLista filas={4} />
  if (datos === false) return null

  const alternar = (id, modo) =>
    setAbierto(actual => actual?.id === id && actual.modo === modo ? null : { id, modo })

  return (
    <div className="flex flex-col gap-4">
      <ConfigCuota config={datos.config} alError={alError} alGuardar={async (nueva) => {
        try {
          await guardarConfigCuota(nueva)
          await cargar()
          alExito('Configuración guardada')
          return true
        } catch (err) {
          alError(err.response?.data?.error || 'No pudimos guardar la configuración')
          return false
        }
      }} />

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        <Cifra valor={conteo.vencida} texto="Vencidas" color="var(--color-error)" />
        <Cifra valor={conteo.gracia} texto="En gracia" color="var(--color-alerta)" />
        <Cifra valor={conteo.sin_cuota} texto="Sin pagar" />
        <Cifra valor={conteo.al_dia} texto="Al día" color="var(--color-exito)" />
      </div>

      <div className="tarjeta flex flex-col gap-3 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
            <IconoBuscar size={17} />
          </span>
          <input
            id="buscar-cuota" className="campo pl-10" placeholder="Buscar por nombre o DNI"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="fila-scroll">
          {FILTROS.map(f => (
            <button
              key={f.id} onClick={() => setFiltro(f.id)}
              className={`pildora ${filtro === f.id ? 'pildora-activa' : ''}`}
            >
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>
          {datos.socios.length === 0 ? 'Todavía no hay socios activos.' : 'Ningún socio con ese filtro.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {visibles.map(s => {
            const whatsapp = ['gracia', 'vencida'].includes(s.estado) && linkWhatsapp(s.telefono, mensajeCuota(s))
            return (
              <article key={s.id} className="tarjeta flex flex-col gap-3 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>DNI {s.dni}</p>
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-2)' }}>{detalleVence(s)}</p>
                  </div>
                  <span className={`insignia ${ESTADOS[s.estado].insignia} shrink-0`}>{ESTADOS[s.estado].texto}</span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => alternar(s.id, 'cobrar')} className="btn btn-primario btn-chico">
                    Cobrar cuota
                  </button>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-contorno btn-chico">
                      <IconoWhatsapp size={14} /> Recordar
                    </a>
                  )}
                  <button onClick={() => alternar(s.id, 'historial')} className="btn btn-fantasma btn-chico">Pagos</button>
                  <button onClick={() => alternar(s.id, 'corregir')} className="btn btn-fantasma btn-chico">Corregir fecha</button>
                </div>

                {abierto?.id === s.id && abierto.modo === 'cobrar' && (
                  <FormCobro
                    socio={s} config={datos.config} confirmar={confirmar} alError={alError}
                    alCancelar={() => setAbierto(null)}
                    alCobrar={async (pago) => {
                      try {
                        const r = await registrarPagoCuota(s.id, pago)
                        setAbierto(null)
                        await cargar()
                        alExito(`Cobrado. ${s.nombre.split(' ')[0]} queda al día hasta el ${fechaCorta(r.cuota_vence)}`)
                      } catch (err) {
                        alError(err.response?.data?.error || 'No pudimos registrar el pago')
                      }
                    }}
                  />
                )}
                {abierto?.id === s.id && abierto.modo === 'corregir' && (
                  <FormCorregir
                    socio={s} alCancelar={() => setAbierto(null)}
                    alGuardar={async (vence) => {
                      try {
                        await corregirVenceCuota(s.id, vence)
                        setAbierto(null)
                        await cargar()
                        alExito('Fecha corregida')
                      } catch (err) {
                        alError(err.response?.data?.error || 'No pudimos corregir la fecha')
                      }
                    }}
                  />
                )}
                {abierto?.id === s.id && abierto.modo === 'historial' && (
                  <Historial usuarioId={s.id} alError={alError} />
                )}
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Cifra({ valor, texto, color }) {
  return (
    <div className="tarjeta p-3.5">
      <p className="text-xl font-bold" style={{ color: valor > 0 && color ? color : 'var(--color-texto)' }}>{valor}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{texto}</p>
    </div>
  )
}

function FormCobro({ socio, config, confirmar, alCobrar, alCancelar, alError }) {
  const [meses, setMeses]   = useState(1)
  const [monto, setMonto]   = useState(String(config.precio || ''))
  const [metodo, setMetodo] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)

  const cambiarMeses = (m) => {
    setMeses(m)
    // Si el monto sigue siendo el sugerido, se actualiza con los meses.
    if (config.precio) setMonto(String(config.precio * m))
  }

  const enviar = async (e) => {
    e.preventDefault()
    const valor = leerMonto(monto)
    if (!Number.isFinite(valor)) return alError('Revisá el monto: solo números, por ejemplo 15.000')
    const ok = await confirmar({
      titulo: `¿Cobrar ${meses === 1 ? '1 mes' : `${meses} meses`} a ${socio.nombre}?`,
      mensaje: `${precio(valor)} en ${METODOS.find(m => m.id === metodo).texto.toLowerCase()}.`,
      textoConfirmar: 'Cobrar'
    })
    if (!ok) return
    setEnviando(true)
    await alCobrar({ meses, monto: valor, metodo })
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} className="aparecer flex flex-col gap-2.5 rounded-xl p-3" style={{ backgroundColor: 'var(--color-elevado)' }}>
      <div className="grid grid-cols-3 gap-2">
        <div>
          <label htmlFor={`meses-${socio.id}`} className="etiqueta-campo">Meses</label>
          <select id={`meses-${socio.id}`} className="campo" value={meses} onChange={e => cambiarMeses(Number(e.target.value))}>
            {Array.from({ length: 12 }, (_, i) => i + 1).map(m => <option key={m} value={m}>{m}</option>)}
          </select>
        </div>
        <div>
          <label htmlFor={`monto-${socio.id}`} className="etiqueta-campo">Monto</label>
          <input id={`monto-${socio.id}`} className="campo" inputMode="decimal" required value={monto} onChange={e => setMonto(e.target.value)} />
        </div>
        <div>
          <label htmlFor={`metodo-${socio.id}`} className="etiqueta-campo">Cómo pagó</label>
          <select id={`metodo-${socio.id}`} className="campo" value={metodo} onChange={e => setMetodo(e.target.value)}>
            {METODOS.map(m => <option key={m.id} value={m.id}>{m.texto}</option>)}
          </select>
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={alCancelar} className="btn btn-fantasma btn-chico flex-1">Cancelar</button>
        <button type="submit" disabled={enviando} className="btn btn-primario btn-chico flex-1">
          <IconoCheck size={14} /> {enviando ? 'Cobrando…' : 'Cobrar'}
        </button>
      </div>
    </form>
  )
}

function FormCorregir({ socio, alGuardar, alCancelar }) {
  const [vence, setVence] = useState(socio.cuota_vence || '')
  return (
    <form
      onSubmit={e => { e.preventDefault(); if (vence) alGuardar(vence) }}
      className="aparecer flex flex-wrap items-end gap-2 rounded-xl p-3" style={{ backgroundColor: 'var(--color-elevado)' }}
    >
      <div className="flex-1">
        <label htmlFor={`vence-${socio.id}`} className="etiqueta-campo">Pagado hasta</label>
        <input id={`vence-${socio.id}`} type="date" required className="campo" value={vence} onChange={e => setVence(e.target.value)} />
      </div>
      <button type="button" onClick={alCancelar} className="btn btn-fantasma btn-chico">Cancelar</button>
      <button type="submit" className="btn btn-primario btn-chico">Guardar</button>
    </form>
  )
}

function Historial({ usuarioId, alError }) {
  const [pagos, setPagos] = useState(null)
  useEffect(() => {
    obtenerPagosCuota(usuarioId).then(setPagos).catch(() => { alError('No pudimos cargar los pagos'); setPagos([]) })
  }, [usuarioId, alError])

  if (pagos === null) return <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Cargando…</p>
  if (pagos.length === 0) return <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Todavía no tiene pagos de cuota.</p>
  return (
    <ul className="flex flex-col text-xs" style={{ borderTop: '1px solid var(--color-linea-sutil)' }}>
      {pagos.map(p => (
        <li key={p.id} className="flex justify-between gap-3 py-2" style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
          <span style={{ color: 'var(--color-texto-2)' }}>
            {fechaHora(p.created_at)} · {p.meses === 1 ? '1 mes' : `${p.meses} meses`} · {p.metodo}
            {p.registrado_por && ` · cobró ${p.registrado_por.split(' ')[0]}`}
          </span>
          <span className="shrink-0 font-medium">{precio(p.monto)} → {fechaCorta(p.vence_nuevo)}</span>
        </li>
      ))}
    </ul>
  )
}

function ConfigCuota({ config, alGuardar, alError }) {
  const [abierta, setAbierta] = useState(false)
  const [form, setForm] = useState(config)
  const [guardando, setGuardando] = useState(false)

  const resumen = config.modo_vencimiento === 'mensual'
    ? 'Vence un mes después del vencimiento anterior'
    : `Vence el día ${config.dia_vencimiento} de cada mes`

  if (!abierta) {
    return (
      <div className="tarjeta flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Cuota {config.precio ? precio(config.precio) : 'sin precio cargado'}</p>
          <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
            {resumen} · {config.dias_gracia} días de gracia
          </p>
        </div>
        <button onClick={() => { setForm(config); setAbierta(true) }} className="btn btn-contorno btn-chico shrink-0">Configurar</button>
      </div>
    )
  }

  const enviar = async (e) => {
    e.preventDefault()
    // Un precio que no se entiende viajaba como null y el servidor lo
    // guardaba como 0: la cuota quedaba gratis sin ningún aviso.
    const valor = leerMonto(form.precio)
    if (!Number.isFinite(valor)) return alError('Revisá el precio: solo números, por ejemplo 15.000')
    setGuardando(true)
    const ok = await alGuardar({
      ...form,
      dia_vencimiento: Number(form.dia_vencimiento),
      dias_gracia: Number(form.dias_gracia),
      precio: valor
    })
    setGuardando(false)
    if (ok) setAbierta(false)
  }

  return (
    <form onSubmit={enviar} className="tarjeta aparecer flex flex-col gap-3 p-4">
      <h2 className="titulo-seccion">Configuración de la cuota</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cuota-precio" className="etiqueta-campo">Precio por mes</label>
          <input id="cuota-precio" className="campo" inputMode="decimal" value={form.precio}
                 onChange={e => setForm({ ...form, precio: e.target.value })} />
        </div>
        <div>
          <label htmlFor="cuota-gracia" className="etiqueta-campo">Días de gracia</label>
          <input id="cuota-gracia" type="number" min="0" max="30" className="campo" value={form.dias_gracia}
                 onChange={e => setForm({ ...form, dias_gracia: e.target.value })} />
        </div>
        <div>
          <label htmlFor="cuota-modo" className="etiqueta-campo">Cómo vence</label>
          <select id="cuota-modo" className="campo" value={form.modo_vencimiento}
                  onChange={e => setForm({ ...form, modo_vencimiento: e.target.value })}>
            <option value="mensual">Un mes desde el vencimiento anterior</option>
            <option value="dia_fijo">El mismo día del mes para todos</option>
          </select>
        </div>
        {form.modo_vencimiento === 'dia_fijo' && (
          <div>
            <label htmlFor="cuota-dia" className="etiqueta-campo">Día de vencimiento (1 a 28)</label>
            <input id="cuota-dia" type="number" min="1" max="28" className="campo" value={form.dia_vencimiento}
                   onChange={e => setForm({ ...form, dia_vencimiento: e.target.value })} />
          </div>
        )}
      </div>
      <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
        Si el socio paga al día o en gracia, el mes sigue desde su vencimiento anterior. Si viene de más atrás, arranca de nuevo desde que paga.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierta(false)} className="btn btn-fantasma flex-1">Cancelar</button>
        <button type="submit" disabled={guardando} className="btn btn-primario flex-1">{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
