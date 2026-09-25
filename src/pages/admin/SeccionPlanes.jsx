import { useState, useEffect, useCallback } from 'react'
import { obtenerPlanesAdmin, crearPlan, editarPlan, eliminarPlan } from '../../services/adminService'
import { useSocketEventos } from '../../hooks/useSocketEventos'
import Interruptor from '../../components/Interruptor'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoLapiz, IconoBasura, IconoUsuarios } from '../../components/Iconos'
import { precio, leerMonto, textoDias, rangoHorario } from '../../utils/formato'

/**
 * Planes mensuales (25/09/2026). El gimnasio arma cada plan con las clases
 * que incluye: "Lucha", "Lucha + Gym", "Completa". El socio lo pide desde la
 * app, se cobra en Cuotas y con eso elige su lugar fijo en los horarios.
 */

const PLAN_VACIO = { nombre: '', precio: '', descripcion: '', incluye_todo: false, clases_ids: [] }

export default function SeccionPlanes({ clases, horarios, alExito, alError, confirmar }) {
  const [planes, setPlanes] = useState([])
  const [cargando, setCargando] = useState(true)
  const [form, setForm] = useState(PLAN_VACIO)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState(PLAN_VACIO)
  const [guardando, setGuardando] = useState(false)
  const [cambiando, setCambiando] = useState(null)

  const cargar = useCallback(async () => {
    try {
      setPlanes(await obtenerPlanesAdmin())
    } catch {
      alError('No pudimos cargar los planes')
    } finally {
      setCargando(false)
    }
  }, [alError])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ planes_actualizados: cargar })

  const aPedido = (datos) => {
    const monto = leerMonto(datos.precio)
    if (!Number.isFinite(monto)) return { error: 'Escribí el precio por mes' }
    if (!datos.incluye_todo && datos.clases_ids.length === 0) return { error: 'Elegí al menos una clase, o marcá que incluye todas' }
    return { pedido: { ...datos, precio: monto, clases_ids: datos.incluye_todo ? [] : datos.clases_ids } }
  }

  const crear = async (e) => {
    e.preventDefault()
    const { error, pedido } = aPedido(form)
    if (error) return alError(error)
    setGuardando(true)
    try {
      await crearPlan(pedido)
      setForm(PLAN_VACIO)
      await cargar()
      alExito('Plan creado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos crear el plan')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = async (plan) => {
    const { error, pedido } = aPedido(formEdit)
    if (error) return alError(error)
    const saca = plan.incluye_todo
      ? !pedido.incluye_todo
      : !pedido.incluye_todo && plan.clases_ids.some(id => !pedido.clases_ids.includes(id))
    if (saca && plan.socios > 0) {
      const seguir = await confirmar({
        titulo: 'Le sacás clases al plan',
        mensaje: `${plan.socios} ${plan.socios === 1 ? 'socio tiene' : 'socios tienen'} este plan. Los que tengan lugar fijo en una clase que sale lo pierden.`,
        textoConfirmar: 'Guardar igual',
        peligroso: true
      })
      if (!seguir) return
    }
    setGuardando(true)
    try {
      await editarPlan(plan.id, pedido)
      setEditando(null)
      await cargar()
      alExito('Plan actualizado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el plan')
    } finally {
      setGuardando(false)
    }
  }

  const alternarActivo = async (plan, activo) => {
    setCambiando(plan.id)
    try {
      await editarPlan(plan.id, { activo })
      await cargar()
      alExito(activo ? 'El plan se ofrece de nuevo' : 'El plan ya no se ofrece. Quien lo tiene lo puede renovar.')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar el plan')
    } finally {
      setCambiando(null)
    }
  }

  const borrar = async (plan) => {
    const seguro = await confirmar({
      titulo: `¿Eliminar el plan ${plan.nombre}?`,
      mensaje: plan.socios > 0
        ? 'Hay socios con este plan: no se puede borrar. Desactivalo para que deje de ofrecerse.'
        : 'Deja de ofrecerse. Los pagos anteriores conservan el nombre del plan.',
      textoConfirmar: 'Eliminar',
      peligroso: true
    })
    if (!seguro) return
    try {
      await eliminarPlan(plan.id)
      await cargar()
      alExito('Plan eliminado')
    } catch (err) {
      alError(err.response?.data?.error || 'No se pudo eliminar el plan')
    }
  }

  const nombreClase = (id) => clases.find(c => c.id === id)?.nombre ?? 'Clase borrada'
  const horariosDe = (claseId) => horarios.filter(h => h.clase_id === claseId && h.activo)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">

      <form onSubmit={crear} className="tarjeta flex h-fit flex-col gap-3 p-4">
        <h2 className="titulo-seccion">Nuevo plan</h2>
        <CamposPlan datos={form} alCambiar={setForm} clases={clases} />
        <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque">
          {guardando ? 'Creando…' : 'Crear plan'}
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <h2 className="titulo-seccion">Planes ({planes.length})</h2>
        {cargando ? <SkeletonLista filas={3} /> : planes.length === 0 ? (
          <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
            Todavía no hay planes. Armá uno por disciplina y los combinados que ofrezcas.
          </div>
        ) : planes.map(p => (
          <article key={p.id} className="tarjeta p-4" style={{ opacity: p.activo ? 1 : 0.7 }}>
            {editando === p.id ? (
              <div className="flex flex-col gap-3">
                <CamposPlan datos={formEdit} alCambiar={setFormEdit} clases={clases} />
                <div className="flex gap-2">
                  <button onClick={() => guardar(p)} disabled={guardando} className="btn btn-primario flex-1">
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditando(null)} className="btn btn-contorno">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{p.nombre}</p>
                  <p className="mt-0.5 text-sm font-bold" style={{ color: 'var(--color-acento)' }}>
                    {precio(p.precio)} <span className="text-xs font-normal" style={{ color: 'var(--color-texto-3)' }}>por mes</span>
                  </p>
                  {p.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-texto-3)' }}>{p.descripcion}</p>
                  )}
                  <ul className="mt-2 flex flex-col gap-1 text-xs" style={{ color: 'var(--color-texto-2)' }}>
                    {p.incluye_todo ? (
                      <li className="font-semibold" style={{ color: 'var(--color-acento)' }}>Todas las clases, también las nuevas</li>
                    ) : p.clases_ids.map(id => (
                      <li key={id}>
                        <span className="font-semibold">{nombreClase(id)}</span>
                        {horariosDe(id).map(h => (
                          <span key={h.id} className="block" style={{ color: 'var(--color-texto-3)' }}>
                            {textoDias(h.dias)} · {rangoHorario(h.hora_inicio, h.hora_fin)}
                          </span>
                        ))}
                      </li>
                    ))}
                  </ul>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Interruptor
                      activo={p.activo}
                      etiqueta={`Plan ${p.nombre} activo`}
                      disabled={cambiando === p.id}
                      alCambiar={activo => alternarActivo(p, activo)}
                    />
                    <span className="insignia insignia-neutra"><IconoUsuarios size={11} /> {p.socios} {p.socios === 1 ? 'socio' : 'socios'}</span>
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    aria-label="Editar plan"
                    onClick={() => {
                      setEditando(p.id)
                      setFormEdit({
                        nombre: p.nombre, precio: String(p.precio), descripcion: p.descripcion || '',
                        incluye_todo: p.incluye_todo, clases_ids: p.clases_ids
                      })
                    }}
                    className="btn btn-contorno btn-chico"
                  >
                    <IconoLapiz size={15} />
                  </button>
                  <button aria-label="Eliminar plan" onClick={() => borrar(p)} className="btn btn-peligro btn-chico">
                    <IconoBasura size={15} />
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

function CamposPlan({ datos, alCambiar, clases }) {
  const activas = clases.filter(c => c.activo || datos.clases_ids.includes(c.id))
  const alternarClase = (id) => alCambiar(d => ({
    ...d,
    clases_ids: d.clases_ids.includes(id) ? d.clases_ids.filter(x => x !== id) : [...d.clases_ids, id]
  }))
  return (
    <>
      <div>
        <label className="etiqueta-campo">Nombre</label>
        <input className="campo" required maxLength={100} placeholder="Lucha, Lucha + Gym, Completa…"
               value={datos.nombre} onChange={e => alCambiar(d => ({ ...d, nombre: e.target.value }))} />
      </div>
      <div>
        <label className="etiqueta-campo">Precio por mes</label>
        <input className="campo" required inputMode="decimal" placeholder="30.000"
               value={datos.precio} onChange={e => alCambiar(d => ({ ...d, precio: e.target.value }))} />
      </div>
      <div>
        <label className="etiqueta-campo">Qué incluye</label>
        <label className="mb-2 flex cursor-pointer items-center gap-2.5 text-sm">
          <input type="checkbox" className="h-4 w-4 accent-sky-300" checked={datos.incluye_todo}
                 onChange={e => alCambiar(d => ({ ...d, incluye_todo: e.target.checked }))} />
          Todas las clases (pase completo)
        </label>
        {!datos.incluye_todo && (
          activas.length === 0 ? (
            <p className="text-xs" style={{ color: 'var(--color-alerta)' }}>Primero creá las clases.</p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {activas.map(c => (
                <button
                  key={c.id}
                  type="button"
                  aria-pressed={datos.clases_ids.includes(c.id)}
                  onClick={() => alternarClase(c.id)}
                  className={`pildora ${datos.clases_ids.includes(c.id) ? 'pildora-activa' : ''}`}
                >
                  {c.nombre}
                </button>
              ))}
            </div>
          )
        )}
      </div>
      <div>
        <label className="etiqueta-campo">Descripción (opcional)</label>
        <textarea className="campo resize-none" rows={2} maxLength={500} placeholder="Qué conviene saber del plan"
                  value={datos.descripcion} onChange={e => alCambiar(d => ({ ...d, descripcion: e.target.value }))} />
      </div>
    </>
  )
}
