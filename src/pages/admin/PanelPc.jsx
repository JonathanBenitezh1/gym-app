import { useState, useEffect, useCallback, useMemo } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAvisos } from '../../components/Avisos'
import {
  obtenerClases, crearClase, editarClase,
  crearHorario, editarHorario, eliminarHorario, obtenerHorariosAdmin,
  obtenerUsuarios, cambiarRol, restablecerPassword,
  obtenerReservas, confirmarPagoEfectivo,
  obtenerProfesores, verificarClase
} from '../../services/adminService'
import { SkeletonLista } from '../../components/Skeleton'
import {
  IconoPanel, IconoSalir, IconoLapiz, IconoBasura, IconoReloj,
  IconoUsuarios, IconoBuscar, IconoCheck, IconoLlave
} from '../../components/Iconos'
import { precio, rangoHorario, hora } from '../../utils/formato'
import logoDtc from '../img/logo_png.png'

const RAMAS = ['gimnasio', 'disciplina', 'profesional']
const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']
const ROLES = ['alumno', 'profesor', 'profesional', 'admin']

const SECCIONES = [
  { id: 'panel',    texto: 'Panel' },
  { id: 'clases',   texto: 'Clases' },
  { id: 'horarios', texto: 'Horarios' },
  { id: 'usuarios', texto: 'Usuarios' },
  { id: 'reservas', texto: 'Reservas' }
]

export default function PanelPC() {
  const { usuario, cerrarSesion } = useAuth()
  const { exito, error: avisarError, confirmar } = useAvisos()
  const navigate = useNavigate()

  const [seccion, setSeccion]     = useState('panel')
  const [clases, setClases]       = useState([])
  const [horarios, setHorarios]   = useState([])
  const [usuarios, setUsuarios]   = useState([])
  const [reservas, setReservas]   = useState([])
  const [profesores, setProfesores] = useState([])
  const [cargando, setCargando]   = useState(true)

  const cargarTodo = useCallback(async () => {
    const [c, h, u, r, p] = await Promise.allSettled([
      obtenerClases(), obtenerHorariosAdmin(), obtenerUsuarios(),
      obtenerReservas(), obtenerProfesores()
    ])
    if (c.status === 'fulfilled') setClases(c.value)
    if (h.status === 'fulfilled') setHorarios(h.value)
    if (u.status === 'fulfilled') setUsuarios(u.value)
    if (r.status === 'fulfilled') setReservas(r.value)
    if (p.status === 'fulfilled') setProfesores(p.value)
    if ([c, h, u, r, p].some(x => x.status === 'rejected')) {
      avisarError('Algunos datos no se pudieron cargar')
    }
    setCargando(false)
  }, [avisarError])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  useEffect(() => {
    const socket = io(import.meta.env.VITE_SOCKET_URL)
    const refrescar = () => cargarTodo()
    socket.on('nueva_reserva', refrescar)
    socket.on('pago_confirmado', refrescar)
    socket.on('reserva_cancelada', refrescar)
    socket.on('nuevo_pago', refrescar)
    return () => socket.disconnect()
  }, [cargarTodo])

  const salir = async () => {
    if (await confirmar({ titulo: '¿Cerrar sesión?', textoConfirmar: 'Cerrar sesión' })) {
      cerrarSesion()
      navigate('/')
    }
  }

  const comunes = { alExito: exito, alError: avisarError, alRecargar: cargarTodo, confirmar }

  return (
    <div className="min-h-screen pb-12">

      <header
        className="sticky top-0 z-20"
        style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}
      >
        <div className="contenedor-ancho flex items-center justify-between py-3">
          <div className="flex items-center gap-3">
            <img src={logoDtc} alt="DTC Fight & Fitness" className="h-9 w-auto" />
            <div>
              <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
                <IconoPanel size={15} /> Administración
              </p>
              <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>{usuario?.nombre}</p>
            </div>
          </div>
          <button onClick={salir} className="btn btn-fantasma btn-chico" aria-label="Cerrar sesión">
            <IconoSalir size={18} />
          </button>
        </div>

        <div className="contenedor-ancho fila-scroll pb-2.5">
          {SECCIONES.map(s => (
            <button
              key={s.id}
              onClick={() => setSeccion(s.id)}
              className={`pildora ${seccion === s.id ? 'pildora-activa' : ''}`}
            >
              {s.texto}
            </button>
          ))}
        </div>
      </header>

      <main className="contenedor-ancho pt-5">
        {cargando ? <SkeletonLista filas={4} /> : (
          <>
            {seccion === 'panel'    && <Tablero reservas={reservas} clases={clases} horarios={horarios} usuarios={usuarios} {...comunes} />}
            {seccion === 'clases'   && <SeccionClases clases={clases} profesores={profesores} {...comunes} />}
            {seccion === 'horarios' && <SeccionHorarios horarios={horarios} clases={clases} {...comunes} />}
            {seccion === 'usuarios' && <SeccionUsuarios usuarios={usuarios} {...comunes} />}
            {seccion === 'reservas' && <SeccionReservas reservas={reservas} {...comunes} />}
          </>
        )}
      </main>
    </div>
  )
}

/* ═══ TABLERO ════════════════════════════════════════════ */

function Tablero({ reservas, clases, horarios, usuarios, alExito, alError, alRecargar }) {
  const datos = useMemo(() => {
    const activas    = reservas.filter(r => r.estado !== 'cancelado')
    const pagadas    = reservas.filter(r => r.estado === 'pagado')
    const pendientes = reservas.filter(r => r.estado === 'pendiente')
    return {
      activas: activas.length,
      pagadas: pagadas.length,
      pendientes: pendientes.length,
      canceladas: reservas.filter(r => r.estado === 'cancelado').length,
      recaudado: pagadas.reduce((acc, r) => acc + Number(r.total || 0), 0),
      porCobrar: pendientes.reduce((acc, r) => acc + Number(r.total || 0), 0),
      alumnos: usuarios.filter(u => u.rol === 'alumno').length,
      ultimas: activas.slice(0, 8),
      aConfirmar: pendientes.filter(r => r.metodo === 'efectivo')
    }
  }, [reservas, usuarios])

  const confirmar = async (id) => {
    try {
      await confirmarPagoEfectivo(id)
      await alRecargar()
      alExito('Pago confirmado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos confirmar el pago')
    }
  }

  return (
    <div className="flex flex-col gap-5">

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Metrica valor={datos.activas}    titulo="Reservas activas" />
        <Metrica valor={precio(datos.recaudado)} titulo="Recaudado" acento />
        <Metrica valor={datos.pendientes} titulo="Pendientes de pago" alerta={datos.pendientes > 0} />
        <Metrica valor={precio(datos.porCobrar)} titulo="Por cobrar" />
        <Metrica valor={datos.alumnos}    titulo="Alumnos" />
        <Metrica valor={clases.length}    titulo="Clases" />
        <Metrica valor={horarios.length}  titulo="Horarios" />
        <Metrica valor={datos.canceladas} titulo="Canceladas" />
      </div>

      {datos.aConfirmar.length > 0 && (
        <section className="tarjeta p-4" style={{ borderColor: 'var(--color-alerta)' }}>
          <h2 className="titulo-seccion mb-3">
            Esperando confirmación de pago en efectivo ({datos.aConfirmar.length})
          </h2>
          <ul className="flex flex-col gap-2">
            {datos.aConfirmar.map(r => (
              <li key={r.id} className="flex items-center justify-between gap-3 rounded-xl p-3"
                  style={{ backgroundColor: 'var(--color-elevado)' }}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.alumno}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>
                    {r.clase} · {r.dia_semana} {hora(r.hora_inicio)} · DNI {r.dni}
                  </p>
                </div>
                <div className="flex shrink-0 items-center gap-2">
                  <span className="text-sm font-bold">{precio(r.total)}</span>
                  <button onClick={() => confirmar(r.id)} className="btn btn-primario btn-chico">
                    <IconoCheck size={14} /> Cobrado
                  </button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="tarjeta p-4">
        <h2 className="titulo-seccion mb-3">Últimas reservas</h2>
        {datos.ultimas.length === 0 ? (
          <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>Todavía no hay reservas.</p>
        ) : (
          <ul className="flex flex-col">
            {datos.ultimas.map(r => (
              <li key={r.id} className="flex items-center justify-between gap-3 py-2.5"
                  style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium">{r.alumno}</p>
                  <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>
                    {r.clase} · {r.dia_semana} {hora(r.hora_inicio)} · {r.tipo}
                  </p>
                </div>
                <div className="shrink-0 text-right">
                  <p className="text-sm font-bold">{precio(r.total)}</p>
                  <InsigniaEstado estado={r.estado} />
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Metrica({ valor, titulo, acento, alerta }) {
  return (
    <div className="tarjeta p-3.5">
      <p
        className="text-xl font-bold tracking-tight"
        style={{ color: acento ? 'var(--color-acento)' : alerta ? 'var(--color-alerta)' : 'var(--color-texto)' }}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{titulo}</p>
    </div>
  )
}

function InsigniaEstado({ estado }) {
  const mapa = {
    pagado:    ['insignia-exito',  'Pagada'],
    cancelado: ['insignia-error',  'Cancelada'],
    pendiente: ['insignia-alerta', 'Pendiente']
  }
  const [clase, texto] = mapa[estado] || mapa.pendiente
  return <span className={`insignia ${clase} mt-1`}>{texto}</span>
}

/* ═══ CLASES ═════════════════════════════════════════════ */

const CLASE_VACIA = { nombre: '', rama: 'gimnasio', descripcion: '', duracion: 60, profesor_id: '' }

function SeccionClases({ clases, profesores, alExito, alError, alRecargar, confirmar }) {
  const [form, setForm]         = useState(CLASE_VACIA)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [guardando, setGuardando] = useState(false)

  const crear = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await crearClase({ ...form, profesor_id: form.profesor_id || null })
      setForm(CLASE_VACIA)
      await alRecargar()
      alExito('Clase creada')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos crear la clase')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = async (id) => {
    setGuardando(true)
    try {
      // Al desactivar avisamos qué pasa con las reservas ya hechas
      if (formEdit.activo === false) {
        const info = await verificarClase(id)
        if (info.pagadas > 0 || info.pendientes > 0) {
          const seguir = await confirmar({
            titulo: 'Esta clase tiene reservas',
            mensaje:
              `Hay ${info.pagadas} reserva(s) ya pagada(s) y ${info.pendientes} pendiente(s). ` +
              `Las pendientes se cancelan automáticamente y se devuelven los cupos. ` +
              `A los alumnos que ya pagaron vas a tener que contactarlos para coordinar.`,
            textoConfirmar: 'Desactivar igual',
            peligroso: true
          })
          if (!seguir) { setGuardando(false); return }
        }
      }
      await editarClase(id, { ...formEdit, profesor_id: formEdit.profesor_id || null })
      setEditando(null)
      await alRecargar()
      alExito('Clase actualizada')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar la clase')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">

      <form onSubmit={crear} className="tarjeta flex h-fit flex-col gap-3 p-4">
        <h2 className="titulo-seccion">Nueva clase</h2>
        <div>
          <label className="etiqueta-campo">Nombre</label>
          <input className="campo" required placeholder="Boxeo, Funcional…"
                 value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
        </div>
        <div>
          <label className="etiqueta-campo">Tipo</label>
          <select className="campo" value={form.rama} onChange={e => setForm(f => ({ ...f, rama: e.target.value }))}>
            {RAMAS.map(r => <option key={r} value={r} className="capitalize">{r}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta-campo">Profesor</label>
          <select className="campo" value={form.profesor_id}
                  onChange={e => setForm(f => ({ ...f, profesor_id: e.target.value }))}>
            <option value="">Sin asignar</option>
            {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
          </select>
        </div>
        <div>
          <label className="etiqueta-campo">Duración (minutos)</label>
          <input type="number" min="15" className="campo" value={form.duracion}
                 onChange={e => setForm(f => ({ ...f, duracion: e.target.value }))} />
        </div>
        <div>
          <label className="etiqueta-campo">Descripción</label>
          <textarea className="campo resize-none" rows={2} placeholder="Nivel, requisitos…"
                    value={form.descripcion} onChange={e => setForm(f => ({ ...f, descripcion: e.target.value }))} />
        </div>
        <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque">
          {guardando ? 'Creando…' : 'Crear clase'}
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <h2 className="titulo-seccion">Clases del gimnasio ({clases.length})</h2>
        {clases.length === 0 ? (
          <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
            Todavía no cargaste ninguna clase.
          </div>
        ) : clases.map(c => (
          <article key={c.id} className="tarjeta p-4">
            {editando === c.id ? (
              <div className="flex flex-col gap-3">
                <input className="campo" value={formEdit.nombre}
                       onChange={e => setFormEdit(f => ({ ...f, nombre: e.target.value }))} />
                <div className="flex gap-2">
                  <select className="campo flex-1" value={formEdit.rama}
                          onChange={e => setFormEdit(f => ({ ...f, rama: e.target.value }))}>
                    {RAMAS.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                  <input type="number" className="campo w-28" value={formEdit.duracion}
                         onChange={e => setFormEdit(f => ({ ...f, duracion: e.target.value }))} />
                </div>
                <select className="campo" value={formEdit.profesor_id || ''}
                        onChange={e => setFormEdit(f => ({ ...f, profesor_id: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <textarea className="campo resize-none" rows={2} value={formEdit.descripcion || ''}
                          onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))} />
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-sky-300" checked={Boolean(formEdit.activo)}
                         onChange={e => setFormEdit(f => ({ ...f, activo: e.target.checked }))} />
                  Clase activa
                </label>
                <div className="flex gap-2">
                  <button onClick={() => guardar(c.id)} disabled={guardando} className="btn btn-primario flex-1">
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditando(null)} className="btn btn-contorno">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{c.nombre}</p>
                  <p className="truncate text-xs capitalize" style={{ color: 'var(--color-texto-2)' }}>
                    {c.rama} · {c.duracion} min · {c.nombre_profesor || 'Sin profesor'}
                  </p>
                  {c.descripcion && (
                    <p className="mt-1 line-clamp-2 text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      {c.descripcion}
                    </p>
                  )}
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`insignia ${c.activo ? 'insignia-exito' : 'insignia-error'}`}>
                      {c.activo ? 'Activa' : 'Inactiva'}
                    </span>
                    <span className="insignia insignia-neutra">
                      {c.cantidad_horarios || 0} horarios
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditando(c.id)
                    setFormEdit({
                      nombre: c.nombre, rama: c.rama, profesor_id: c.profesor_id || '',
                      descripcion: c.descripcion || '', duracion: c.duracion, activo: c.activo
                    })
                  }}
                  className="btn btn-contorno btn-chico shrink-0"
                >
                  <IconoLapiz size={15} />
                </button>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

/* ═══ HORARIOS ═══════════════════════════════════════════ */

const HORARIO_VACIO = {
  clase_id: '', dia_semana: 'Lunes', hora_inicio: '', hora_fin: '',
  cupos_totales: '', precio: ''
}

function SeccionHorarios({ horarios, clases, alExito, alError, alRecargar, confirmar }) {
  const [form, setForm] = useState(HORARIO_VACIO)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [guardando, setGuardando] = useState(false)

  const crear = async (e) => {
    e.preventDefault()
    if (form.hora_fin <= form.hora_inicio) {
      return alError('La hora de fin tiene que ser posterior a la de inicio')
    }
    setGuardando(true)
    try {
      await crearHorario(form)
      setForm(HORARIO_VACIO)
      await alRecargar()
      alExito('Horario creado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos crear el horario')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = async (id) => {
    if (formEdit.hora_fin <= formEdit.hora_inicio) {
      return alError('La hora de fin tiene que ser posterior a la de inicio')
    }
    setGuardando(true)
    try {
      await editarHorario(id, formEdit)
      setEditando(null)
      await alRecargar()
      alExito('Horario actualizado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el horario')
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (h) => {
    const seguro = await confirmar({
      titulo: '¿Eliminar este horario?',
      mensaje: `${h.clase} · ${h.dia_semana} ${rangoHorario(h.hora_inicio, h.hora_fin)}. Si tiene reservas asociadas no se va a poder borrar.`,
      textoConfirmar: 'Eliminar',
      peligroso: true
    })
    if (!seguro) return
    try {
      await eliminarHorario(h.id)
      await alRecargar()
      alExito('Horario eliminado')
    } catch {
      alError('No se pudo eliminar: probablemente tenga reservas. Desactivalo en vez de borrarlo.')
    }
  }

  const activas = clases.filter(c => c.activo)

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,22rem)_1fr]">

      <form onSubmit={crear} className="tarjeta flex h-fit flex-col gap-3 p-4">
        <h2 className="titulo-seccion">Nuevo horario</h2>
        <div>
          <label className="etiqueta-campo">Clase</label>
          <select className="campo" required value={form.clase_id}
                  onChange={e => setForm(f => ({ ...f, clase_id: e.target.value }))}>
            <option value="">Elegí una clase</option>
            {activas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.rama})</option>)}
          </select>
          {activas.length === 0 && (
            <p className="mt-1 text-xs" style={{ color: 'var(--color-alerta)' }}>
              Primero creá una clase activa.
            </p>
          )}
        </div>
        <div>
          <label className="etiqueta-campo">Día</label>
          <select className="campo" value={form.dia_semana}
                  onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))}>
            {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
          </select>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="etiqueta-campo">Desde</label>
            <input type="time" required className="campo" value={form.hora_inicio}
                   onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="etiqueta-campo">Hasta</label>
            <input type="time" required className="campo" value={form.hora_fin}
                   onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
          </div>
        </div>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="etiqueta-campo">Cupos</label>
            <input type="number" min="1" required className="campo" value={form.cupos_totales}
                   onChange={e => setForm(f => ({ ...f, cupos_totales: e.target.value }))} />
          </div>
          <div className="flex-1">
            <label className="etiqueta-campo">Precio</label>
            <input type="number" min="0" required className="campo" value={form.precio}
                   onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
          </div>
        </div>
        <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque">
          {guardando ? 'Creando…' : 'Crear horario'}
        </button>
      </form>

      <div className="flex flex-col gap-2.5">
        <h2 className="titulo-seccion">Horarios cargados ({horarios.length})</h2>
        {horarios.length === 0 ? (
          <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
            Todavía no hay horarios.
          </div>
        ) : horarios.map(h => (
          <article key={h.id} className="tarjeta p-4">
            {editando === h.id ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{h.clase}</p>
                <select className="campo" value={formEdit.dia_semana}
                        onChange={e => setFormEdit(f => ({ ...f, dia_semana: e.target.value }))}>
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
                <div className="flex gap-2">
                  <input type="time" className="campo flex-1" value={formEdit.hora_inicio}
                         onChange={e => setFormEdit(f => ({ ...f, hora_inicio: e.target.value }))} />
                  <input type="time" className="campo flex-1" value={formEdit.hora_fin}
                         onChange={e => setFormEdit(f => ({ ...f, hora_fin: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="etiqueta-campo">Cupos totales</label>
                    <input type="number" min="0" className="campo" value={formEdit.cupos_totales}
                           onChange={e => setFormEdit(f => ({ ...f, cupos_totales: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className="etiqueta-campo">Disponibles</label>
                    <input type="number" min="0" className="campo" value={formEdit.cupos_disponibles}
                           onChange={e => setFormEdit(f => ({ ...f, cupos_disponibles: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className="etiqueta-campo">Precio</label>
                    <input type="number" min="0" className="campo" value={formEdit.precio}
                           onChange={e => setFormEdit(f => ({ ...f, precio: e.target.value }))} />
                  </div>
                </div>
                <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                  <input type="checkbox" className="h-4 w-4 accent-sky-300" checked={Boolean(formEdit.activo)}
                         onChange={e => setFormEdit(f => ({ ...f, activo: e.target.checked }))} />
                  Horario activo
                </label>
                <div className="flex gap-2">
                  <button onClick={() => guardar(h.id)} disabled={guardando} className="btn btn-primario flex-1">
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditando(null)} className="btn btn-contorno">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold">{h.clase}</p>
                  <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
                    <IconoReloj size={13} />
                    {h.dia_semana} · {rangoHorario(h.hora_inicio, h.hora_fin)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>
                    <IconoUsuarios size={13} />
                    {h.cupos_disponibles}/{h.cupos_totales} · {precio(h.precio)}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1.5">
                    <span className={`insignia ${h.activo ? 'insignia-exito' : 'insignia-error'}`}>
                      {h.activo ? 'Activo' : 'Inactivo'}
                    </span>
                    {!h.clase_activa && <span className="insignia insignia-alerta">Clase inactiva</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    onClick={() => {
                      setEditando(h.id)
                      setFormEdit({
                        dia_semana: h.dia_semana,
                        hora_inicio: h.hora_inicio.slice(0, 5),
                        hora_fin: h.hora_fin.slice(0, 5),
                        cupos_totales: h.cupos_totales,
                        cupos_disponibles: h.cupos_disponibles,
                        precio: h.precio,
                        activo: h.activo
                      })
                    }}
                    className="btn btn-contorno btn-chico"
                  >
                    <IconoLapiz size={15} />
                  </button>
                  <button onClick={() => borrar(h)} className="btn btn-peligro btn-chico">
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

/* ═══ USUARIOS ═══════════════════════════════════════════ */

function SeccionUsuarios({ usuarios, alExito, alError, alRecargar, confirmar }) {
  const [busqueda, setBusqueda] = useState('')
  const [filtroRol, setFiltroRol] = useState('todos')
  const [restablecida, setRestablecida] = useState(null)

  const restablecer = async (u) => {
    const seguro = await confirmar({
      titulo: '¿Restablecer la contraseña?',
      mensaje: `Se va a generar una contraseña temporal para ${u.nombre}. La actual deja de funcionar al instante, y va a tener que elegir una nueva la próxima vez que entre.`,
      textoConfirmar: 'Restablecer',
      peligroso: true
    })
    if (!seguro) return

    try {
      const resultado = await restablecerPassword(u.id)
      setRestablecida({ nombre: u.nombre, clave: resultado.password_temporal })
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos restablecer la contraseña')
    }
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return usuarios.filter(u => {
      const coincide = !texto ||
        u.nombre?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto) ||
        String(u.dni).includes(texto)
      return coincide && (filtroRol === 'todos' || u.rol === filtroRol)
    })
  }, [usuarios, busqueda, filtroRol])

  const cambiar = async (u, nuevoRol) => {
    if (nuevoRol === u.rol) return

    // Dar permisos de administrador merece una confirmación explícita:
    // un admin puede modificar precios, roles y cobros de todo el gimnasio.
    if (nuevoRol === 'admin') {
      const seguro = await confirmar({
        titulo: '¿Darle permisos de administrador?',
        mensaje: `${u.nombre} va a poder gestionar clases, precios, usuarios y pagos de todo el gimnasio.`,
        textoConfirmar: 'Sí, hacerlo administrador',
        peligroso: true
      })
      if (!seguro) { await alRecargar(); return }
    }

    try {
      await cambiarRol(u.id, nuevoRol)
      await alRecargar()
      alExito(`${u.nombre} ahora es ${nuevoRol}`)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar el rol')
      await alRecargar()
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="tarjeta flex flex-col gap-3 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
            <IconoBuscar size={17} />
          </span>
          <input
            className="campo pl-10"
            placeholder="Buscar por nombre, email o DNI"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="fila-scroll">
          {['todos', ...ROLES].map(r => (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              className={`pildora capitalize ${filtroRol === r ? 'pildora-activa' : ''}`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      <p className="titulo-seccion">{visibles.length} de {usuarios.length} usuarios</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {visibles.map(u => (
          <article key={u.id} className="tarjeta flex items-center gap-3 p-3.5">
            <span
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full font-bold"
              style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-acento)' }}
            >
              {u.nombre?.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{u.nombre}</p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>
                {u.email}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>DNI {u.dni}</p>
            </div>
            <div className="flex shrink-0 flex-col items-end gap-1.5">
              <select
                className="campo w-auto !min-h-9 !py-1.5 text-xs capitalize"
                value={u.rol}
                onChange={e => cambiar(u, e.target.value)}
                aria-label={`Rol de ${u.nombre}`}
              >
                {ROLES.map(r => <option key={r} value={r}>{r}</option>)}
              </select>
              <button
                onClick={() => restablecer(u)}
                className="btn btn-fantasma btn-chico !text-[11px]"
              >
                <IconoLlave size={13} /> Restablecer clave
              </button>
            </div>
          </article>
        ))}
      </div>

      {restablecida && (
        <ModalClaveTemporal
          datos={restablecida}
          alCerrar={() => setRestablecida(null)}
          alExito={alExito}
        />
      )}
    </div>
  )
}

/** Muestra la contraseña temporal. Es la única vez que se puede ver. */
function ModalClaveTemporal({ datos, alCerrar, alExito }) {
  const copiar = async () => {
    try {
      await navigator.clipboard.writeText(datos.clave)
      alExito('Contraseña copiada')
    } catch {
      // Si el navegador bloquea el portapapeles, igual está a la vista
    }
  }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,.6)' }}
      onClick={alCerrar}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="tarjeta aparecer w-full max-w-sm p-5"
        style={{ backgroundColor: 'var(--color-elevado)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 className="text-base font-bold">Contraseña temporal de {datos.nombre}</h2>
        <p className="mt-2 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          Pasásela ahora: por seguridad no se guarda y no vas a poder volver a verla.
        </p>

        <div
          className="mt-4 flex items-center justify-between gap-3 rounded-xl px-4 py-3"
          style={{ backgroundColor: 'var(--color-fondo)' }}
        >
          <code className="text-xl font-bold tracking-[0.2em]" style={{ color: 'var(--color-acento)' }}>
            {datos.clave}
          </code>
          <button onClick={copiar} className="btn btn-contorno btn-chico shrink-0">
            Copiar
          </button>
        </div>

        <p className="mt-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>
          Cuando entre con esta clave, la app le va a pedir que elija una propia.
        </p>

        <button onClick={alCerrar} className="btn btn-primario btn-bloque mt-5">
          Ya se la pasé
        </button>
      </div>
    </div>
  )
}

/* ═══ RESERVAS ═══════════════════════════════════════════ */

function SeccionReservas({ reservas, alExito, alError, alRecargar }) {
  const [filtro, setFiltro] = useState('activas')
  const [busqueda, setBusqueda] = useState('')

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return reservas.filter(r => {
      const porEstado =
        filtro === 'todas'      ? true :
        filtro === 'activas'    ? r.estado !== 'cancelado' :
        filtro === 'pendientes' ? r.estado === 'pendiente' :
        filtro === 'pagadas'    ? r.estado === 'pagado' :
                                  r.estado === 'cancelado'
      const porTexto = !texto ||
        r.alumno?.toLowerCase().includes(texto) ||
        String(r.dni).includes(texto) ||
        r.clase?.toLowerCase().includes(texto)
      return porEstado && porTexto
    })
  }, [reservas, filtro, busqueda])

  const confirmar = async (id) => {
    try {
      await confirmarPagoEfectivo(id)
      await alRecargar()
      alExito('Pago confirmado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos confirmar el pago')
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="tarjeta flex flex-col gap-3 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
            <IconoBuscar size={17} />
          </span>
          <input
            className="campo pl-10"
            placeholder="Buscar por alumno, DNI o clase"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="fila-scroll">
          {['activas', 'pendientes', 'pagadas', 'canceladas', 'todas'].map(f => (
            <button
              key={f}
              onClick={() => setFiltro(f)}
              className={`pildora capitalize ${filtro === f ? 'pildora-activa' : ''}`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <p className="titulo-seccion">{visibles.length} reservas</p>

      <div className="grid gap-2.5 sm:grid-cols-2">
        {visibles.map(r => (
          <article key={r.id} className="tarjeta p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.alumno}</p>
                <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                  {r.clase} · {r.dia_semana} {hora(r.hora_inicio)}
                </p>
                <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                  DNI {r.dni} · {r.tipo}
                </p>
                <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>
                  Pago: {r.metodo || 'sin elegir'}
                </p>
              </div>
              <div className="shrink-0 text-right">
                <p className="font-bold">{precio(r.total)}</p>
                <InsigniaEstado estado={r.estado} />
              </div>
            </div>

            {r.estado === 'pendiente' && r.metodo === 'efectivo' && (
              <button onClick={() => confirmar(r.id)} className="btn btn-primario btn-chico btn-bloque mt-3">
                <IconoCheck size={14} /> Confirmar cobro
              </button>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}
