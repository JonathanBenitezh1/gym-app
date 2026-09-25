import { useState, useEffect, useCallback, useMemo } from 'react'
import {
  obtenerCuotas, guardarConfigCuota, registrarPagoCuota,
  corregirVenceCuota, obtenerPagosCuota, obtenerPlanesAdmin, asignarPlanSocio
} from '../../services/adminService'
import { useSocketEventos } from '../../hooks/useSocketEventos'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoBuscar, IconoWhatsapp, IconoCheck } from '../../components/Iconos'
import { precio, fechaCorta, fechaHora, leerMonto } from '../../utils/formato'
import { linkWhatsapp, mensajeCuota } from '../../utils/whatsapp'

const ESTADOS = {
  al_dia:    { texto: 'Al día',     insignia: 'insignia-exito' },
  gracia:    { texto: 'En gracia',  insignia: 'insignia-alerta' },
  vencida:   { texto: 'Vencida',    insignia: 'insignia-error' },
  sin_cuota: { texto: 'Sin plan',   insignia: 'insignia-neutra' }
}
const FILTROS = [
  { id: 'todos',     texto: 'Todos' },
  { id: 'pedidos',   texto: 'Pidieron plan' },
  { id: 'vencida',   texto: 'Vencidos' },
  { id: 'gracia',    texto: 'En gracia' },
  { id: 'sin_cuota', texto: 'Sin plan' },
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
  if (!s.cuota_vence) return 'Nunca pagó un plan'
  if (s.estado === 'al_dia') return `Vence el ${fechaCorta(s.cuota_vence)}`
  if (s.estado === 'gracia') {
    return `Venció el ${fechaCorta(s.cuota_vence)} · ${s.dias_restantes === 1 ? 'queda 1 día' : `quedan ${s.dias_restantes} días`}`
  }
  return `Venció el ${fechaCorta(s.cuota_vence)}`
}

/**
 * Cobro de los planes mensuales. Cada socio tiene un plan (Planes) que vence
 * en una fecha, con días de gracia. Arriba aparecen los que pidieron un plan
 * desde la app: cobrarlo se los asigna.
 */
export default function SeccionCuotas({ alExito, alError, confirmar }) {
  const [datos, setDatos]       = useState(null)
  const [planes, setPlanes]     = useState([])
  const [filtro, setFiltro]     = useState('todos')
  const [busqueda, setBusqueda] = useState('')
  const [abierto, setAbierto]   = useState(null) // { id, modo: 'cobrar' | 'plan' | 'corregir' | 'historial' }

  const cargar = useCallback(async () => {
    try {
      const [cuotas, listaPlanes] = await Promise.all([obtenerCuotas(), obtenerPlanesAdmin()])
      setDatos(cuotas)
      setPlanes(listaPlanes)
    } catch {
      alError('No pudimos cargar las cuotas')
      setDatos(prev => prev ?? false)
    }
  }, [alError])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ plan_pedido: cargar, planes_actualizados: cargar })

  const conteo = useMemo(() => {
    const c = { al_dia: 0, gracia: 0, vencida: 0, sin_cuota: 0, pedidos: 0 }
    for (const s of datos?.socios ?? []) {
      c[s.estado]++
      if (s.plan_pedido_id) c.pedidos++
    }
    return c
  }, [datos])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (datos?.socios ?? []).filter(s =>
      (filtro === 'todos' || s.estado === filtro || (filtro === 'pedidos' && s.plan_pedido_id)) &&
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

      {planes.length === 0 && (
        <div className="tarjeta p-4 text-sm" style={{ borderColor: 'var(--color-alerta)', color: 'var(--color-texto-2)' }}>
          Todavía no hay planes. Armalos en la pestaña <strong>Planes</strong> para poder cobrarlos.
        </div>
      )}

      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-5">
        <Cifra valor={conteo.pedidos} texto="Pidieron plan" color="var(--color-acento)" />
        <Cifra valor={conteo.vencida} texto="Vencidos" color="var(--color-error)" />
        <Cifra valor={conteo.gracia} texto="En gracia" color="var(--color-alerta)" />
        <Cifra valor={conteo.sin_cuota} texto="Sin plan" />
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
                    <p className="mt-1 text-xs font-medium">
                      {s.plan ? `Plan ${s.plan}` : 'Sin plan'}
                      {s.plan && s.fijos > 0 && <span style={{ color: 'var(--color-texto-3)' }}> · {s.fijos} {s.fijos === 1 ? 'lugar fijo' : 'lugares fijos'}</span>}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-2)' }}>{detalleVence(s)}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <span className={`insignia ${ESTADOS[s.estado].insignia}`}>{ESTADOS[s.estado].texto}</span>
                    {s.plan_pedido && <span className="insignia insignia-acento">Pidió {s.plan_pedido}</span>}
                  </div>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button onClick={() => alternar(s.id, 'cobrar')} disabled={planes.length === 0} className="btn btn-primario btn-chico">
                    {s.plan_pedido ? `Cobrar ${s.plan_pedido}` : 'Cobrar plan'}
                  </button>
                  {whatsapp && (
                    <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="btn btn-contorno btn-chico">
                      <IconoWhatsapp size={14} /> Recordar
                    </a>
                  )}
                  <button onClick={() => alternar(s.id, 'historial')} className="btn btn-fantasma btn-chico">Pagos</button>
                  <button onClick={() => alternar(s.id, 'plan')} className="btn btn-fantasma btn-chico">Cambiar plan</button>
                  <button onClick={() => alternar(s.id, 'corregir')} className="btn btn-fantasma btn-chico">Corregir fecha</button>
                </div>

                {abierto?.id === s.id && abierto.modo === 'cobrar' && (
                  <FormCobro
                    socio={s} planes={planes} confirmar={confirmar} alError={alError}
                    alCancelar={() => setAbierto(null)}
                    alCobrar={async (pago) => {
                      try {
                        const r = await registrarPagoCuota(s.id, pago)
                        setAbierto(null)
                        await cargar()
                        alExito(`Cobrado. ${s.nombre.split(' ')[0]} queda con ${r.plan} hasta el ${fechaCorta(r.cuota_vence)}`)
                      } catch (err) {
                        alError(err.response?.data?.error || 'No pudimos registrar el pago')
                      }
                    }}
                  />
                )}
                {abierto?.id === s.id && abierto.modo === 'plan' && (
                  <FormPlan
                    socio={s} planes={planes} confirmar={confirmar}
                    alCancelar={() => setAbierto(null)}
                    alGuardar={async (plan_id) => {
                      try {
                        await asignarPlanSocio(s.id, plan_id)
                        setAbierto(null)
                        await cargar()
                        alExito('Plan cambiado, sin cobro')
                      } catch (err) {
                        alError(err.response?.data?.error || 'No pudimos cambiar el plan')
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

// Los planes que se le pueden cobrar: los que se ofrecen y el suyo, aunque
// se haya dejado de ofrecer (lo puede seguir renovando).
const planesPara = (socio, planes) => planes.filter(p => p.activo || p.id === socio.plan_id)

function FormCobro({ socio, planes, confirmar, alCobrar, alCancelar, alError }) {
  const opciones = planesPara(socio, planes)
  const inicial = opciones.find(p => p.id === socio.plan_pedido_id) ?? opciones.find(p => p.id === socio.plan_id) ?? opciones[0]
  const [planId, setPlanId] = useState(inicial?.id ?? '')
  const [meses, setMeses]   = useState(1)
  const [monto, setMonto]   = useState(inicial ? String(inicial.precio) : '')
  const [metodo, setMetodo] = useState('efectivo')
  const [enviando, setEnviando] = useState(false)

  const plan = opciones.find(p => p.id === Number(planId))

  // El monto sugerido sigue al plan y a los meses; se puede cambiar a mano.
  const sugerir = (nuevoPlan, m) => { if (nuevoPlan) setMonto(String(nuevoPlan.precio * m)) }
  const cambiarPlan = (id) => { setPlanId(id); sugerir(opciones.find(p => p.id === Number(id)), meses) }
  const cambiarMeses = (m) => { setMeses(m); sugerir(plan, m) }

  const enviar = async (e) => {
    e.preventDefault()
    if (!plan) return alError('Elegí el plan que paga')
    const valor = leerMonto(monto)
    if (!Number.isFinite(valor)) return alError('Revisá el monto: solo números, por ejemplo 15.000')
    const cambia = socio.plan_id && socio.plan_id !== plan.id
    const ok = await confirmar({
      titulo: `¿Cobrar ${plan.nombre} a ${socio.nombre}?`,
      mensaje: `${meses === 1 ? '1 mes' : `${meses} meses`}, ${precio(valor)} en ${METODOS.find(m => m.id === metodo).texto.toLowerCase()}.` +
        (cambia ? ` Cambia de ${socio.plan} a ${plan.nombre}: pierde los lugares fijos de las clases que no están en el plan nuevo.` : ''),
      textoConfirmar: 'Cobrar'
    })
    if (!ok) return
    setEnviando(true)
    await alCobrar({ plan_id: plan.id, meses, monto: valor, metodo })
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} className="aparecer flex flex-col gap-2.5 rounded-xl p-3" style={{ backgroundColor: 'var(--color-elevado)' }}>
      <div>
        <label htmlFor={`plan-${socio.id}`} className="etiqueta-campo">Plan</label>
        <select id={`plan-${socio.id}`} className="campo" required value={planId} onChange={e => cambiarPlan(e.target.value)}>
          {opciones.map(p => (
            <option key={p.id} value={p.id}>
              {p.nombre} · {precio(p.precio)}{p.id === socio.plan_pedido_id ? ' (pedido)' : p.id === socio.plan_id ? ' (actual)' : ''}
            </option>
          ))}
        </select>
      </div>
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

function FormPlan({ socio, planes, confirmar, alGuardar, alCancelar }) {
  const opciones = planesPara(socio, planes)
  const [planId, setPlanId] = useState(socio.plan_id ?? '')

  const enviar = async (e) => {
    e.preventDefault()
    const nuevo = planId === '' ? null : Number(planId)
    if (nuevo === (socio.plan_id ?? null)) return alCancelar()
    const nombre = opciones.find(p => p.id === nuevo)?.nombre
    const ok = await confirmar({
      titulo: nuevo ? `¿Pasar a ${socio.nombre} al plan ${nombre}?` : `¿Sacarle el plan a ${socio.nombre}?`,
      mensaje: 'No se cobra ni cambia la fecha de vencimiento. Pierde los lugares fijos de las clases que no estén en el plan nuevo.',
      textoConfirmar: 'Cambiar'
    })
    if (ok) alGuardar(nuevo)
  }

  return (
    <form onSubmit={enviar} className="aparecer flex flex-wrap items-end gap-2 rounded-xl p-3" style={{ backgroundColor: 'var(--color-elevado)' }}>
      <div className="flex-1">
        <label htmlFor={`cambiar-plan-${socio.id}`} className="etiqueta-campo">Plan, sin cobrar</label>
        <select id={`cambiar-plan-${socio.id}`} className="campo" value={planId} onChange={e => setPlanId(e.target.value)}>
          <option value="">Sin plan</option>
          {opciones.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
        </select>
      </div>
      <button type="button" onClick={alCancelar} className="btn btn-fantasma btn-chico">Cancelar</button>
      <button type="submit" className="btn btn-primario btn-chico">Guardar</button>
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
  if (pagos.length === 0) return <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Todavía no tiene pagos de plan.</p>
  return (
    <ul className="flex flex-col text-xs" style={{ borderTop: '1px solid var(--color-linea-sutil)' }}>
      {pagos.map(p => (
        <li key={p.id} className="flex justify-between gap-3 py-2" style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
          <span style={{ color: 'var(--color-texto-2)' }}>
            {fechaHora(p.created_at)} · {p.plan_nombre && `${p.plan_nombre} · `}{p.meses === 1 ? '1 mes' : `${p.meses} meses`} · {p.metodo}
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
          <p className="text-sm font-semibold">Vencimiento de los planes</p>
          <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
            {resumen} · {config.dias_gracia} días de gracia · la puerta abre {config.margen_ingreso_min} min antes de cada clase
          </p>
        </div>
        <button onClick={() => { setForm(config); setAbierta(true) }} className="btn btn-contorno btn-chico shrink-0">Configurar</button>
      </div>
    )
  }

  const enviar = async (e) => {
    e.preventDefault()
    // El precio es de cada plan desde el 25/09/2026: el general no se manda.
    const { precio: _general, ...resto } = form
    const margen = Number(form.margen_ingreso_min)
    if (!Number.isInteger(margen) || margen < 0 || margen > 180) {
      return alError('El margen de la puerta va de 0 a 180 minutos')
    }
    setGuardando(true)
    const ok = await alGuardar({
      ...resto,
      dia_vencimiento: Number(form.dia_vencimiento),
      dias_gracia: Number(form.dias_gracia),
      margen_ingreso_min: margen
    })
    setGuardando(false)
    if (ok) setAbierta(false)
  }

  return (
    <form onSubmit={enviar} className="tarjeta aparecer flex flex-col gap-3 p-4">
      <h2 className="titulo-seccion">Vencimiento de los planes</h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="cuota-margen" className="etiqueta-campo">Puerta: minutos antes de la clase</label>
          <input id="cuota-margen" type="number" min="0" max="180" className="campo" value={form.margen_ingreso_min}
                 onChange={e => setForm({ ...form, margen_ingreso_min: e.target.value })} />
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
        Si el socio paga al día o en gracia, el mes sigue desde su vencimiento anterior. Si viene de más atrás, arranca de nuevo desde que paga. Terminada la gracia, sus lugares fijos se liberan. Los precios se cargan en cada plan.
      </p>
      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierta(false)} className="btn btn-fantasma flex-1">Cancelar</button>
        <button type="submit" disabled={guardando} className="btn btn-primario flex-1">{guardando ? 'Guardando…' : 'Guardar'}</button>
      </div>
    </form>
  )
}
