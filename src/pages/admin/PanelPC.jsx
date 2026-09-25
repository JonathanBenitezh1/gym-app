import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAvisos } from '../../components/Avisos'
import { useSocketEventos } from '../../hooks/useSocketEventos'
import {
  obtenerClases, crearClase, editarClase,
  crearHorario, editarHorario, eliminarHorario, obtenerHorariosAdmin,
  obtenerUsuarios, cambiarRol, restablecerPassword,
  obtenerReservas, confirmarPagoEfectivo,
  obtenerProfesores, verificarClase, cambiarEstadoUsuario, cambiarApto,
  crearCuentaPuerta, cerrarSesionesUsuario
} from '../../services/adminService'
import SeccionActividad from './SeccionActividad'
import SeccionEstadisticas from './SeccionEstadisticas'
import SeccionCuotas from './SeccionCuotas'
import SeccionPlanes from './SeccionPlanes'
import Interruptor from '../../components/Interruptor'
import SelectorDias from '../../components/SelectorDias'
import FotoSocio from '../../components/FotoSocio'
import SeccionRutinas from '../../components/SeccionRutinas'
import BotonPresencia from '../../components/BotonPresencia'
import { linkWhatsapp, mensajePagoPendiente } from '../../utils/whatsapp'
import { SkeletonLista } from '../../components/Skeleton'
import {
  IconoPanel, IconoSalir, IconoLapiz, IconoBasura, IconoReloj,
  IconoUsuarios, IconoBuscar, IconoCheck, IconoLlave, IconoWhatsapp
} from '../../components/Iconos'
import { precio, rangoHorario, hora, textoDias, diasCortos } from '../../utils/formato'
import logoDtc from '../img/logo_png.png'
import { GIMNASIO } from '../../config/gimnasio'
import { estadoApto } from '../../utils/apto'

const RAMAS = ['gimnasio', 'disciplina', 'profesional']
const ROLES = ['alumno', 'profesor', 'profesional', 'recepcion', 'admin']
const NOMBRE_ROL = {
  alumno: 'Alumno', profesor: 'Profesor', profesional: 'Profesional',
  recepcion: 'Recepción', admin: 'Admin', todos: 'Todos', 'sin apto': 'Sin apto'
}

const SECCIONES = [
  { id: 'panel',    texto: 'Panel' },
  { id: 'numeros',  texto: 'Estadísticas' },
  { id: 'clases',   texto: 'Clases' },
  { id: 'horarios', texto: 'Horarios' },
  { id: 'planes',   texto: 'Planes' },
  { id: 'cuotas',   texto: 'Cuotas' },
  { id: 'usuarios', texto: 'Usuarios' },
  { id: 'reservas', texto: 'Reservas' },
  { id: 'rutinas',  texto: 'Rutinas' },
  { id: 'actividad', texto: 'Actividad' }
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

  // El esqueleto aparece solo si la carga pasa de 300 ms: si la API contesta
  // rápido, mostrarlo un instante y sacarlo se ve como un parpadeo.
  const [esperaLarga, setEsperaLarga] = useState(false)
  useEffect(() => {
    if (!cargando) return
    const temporizador = setTimeout(() => setEsperaLarga(true), 300)
    return () => clearTimeout(temporizador)
  }, [cargando])

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

  useSocketEventos({
    nueva_reserva: () => cargarTodo(),
    pago_confirmado: () => cargarTodo(),
    reserva_cancelada: () => cargarTodo(),
    nuevo_pago: () => cargarTodo()
  })

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
        {/* En un celular no entraba: el título pisaba "Puerta" y el botón de
            salir quedaba fuera de la pantalla. El texto se achica y los
            botones no. */}
        <div className="contenedor-ancho flex items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoDtc} alt={GIMNASIO.nombre} className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="flex items-center gap-1.5 text-sm font-bold leading-tight">
                <span className="hidden sm:inline-flex"><IconoPanel size={15} /></span>
                <span className="sm:hidden">Admin</span>
                <span className="hidden sm:inline">Administración</span>
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>{usuario?.nombre}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5 sm:gap-2">
            <button onClick={() => navigate('/puerta')} className="btn btn-contorno btn-chico">Puerta</button>
            <BotonPresencia alExito={exito} alError={avisarError} />
            <button onClick={salir} className="btn btn-fantasma btn-chico" aria-label="Cerrar sesión">
              <IconoSalir size={18} />
            </button>
          </div>
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
        {cargando ? (esperaLarga ? <SkeletonLista filas={4} /> : null) : (
          <>
            {seccion === 'panel'    && <Tablero reservas={reservas} clases={clases} horarios={horarios} usuarios={usuarios} {...comunes} />}
            {seccion === 'numeros'  && <SeccionEstadisticas alError={avisarError} />}
            {seccion === 'clases'   && <SeccionClases clases={clases} profesores={profesores} {...comunes} />}
            {seccion === 'horarios' && <SeccionHorarios horarios={horarios} clases={clases} {...comunes} />}
            {seccion === 'planes'   && <SeccionPlanes clases={clases} horarios={horarios} {...comunes} />}
            {seccion === 'cuotas'   && <SeccionCuotas alExito={exito} alError={avisarError} confirmar={confirmar} />}
            {seccion === 'usuarios' && <SeccionUsuarios usuarios={usuarios} {...comunes} />}
            {seccion === 'reservas' && <SeccionReservas reservas={reservas} {...comunes} />}
            {seccion === 'rutinas'  && <SeccionRutinas alExito={exito} alError={avisarError} />}
            {seccion === 'actividad' && <SeccionActividad alError={avisarError} />}
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
                    {r.clase} · {diasCortos(r.dias)} {hora(r.hora_inicio)} · DNI {r.dni}
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
                    {r.clase} · {diasCortos(r.dias)} {hora(r.hora_inicio)} · {r.tipo}
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
  const [cambiando, setCambiando] = useState(null)

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

  // Afuera del editor, con el interruptor: manda solo { activo }.
  const alternarActivo = async (c, activo) => {
    setCambiando(c.id)
    try {
      // Al desactivar avisamos qué pasa con las reservas ya hechas
      if (!activo) {
        const info = await verificarClase(c.id)
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
          if (!seguir) return
        }
      }
      await editarClase(c.id, { activo })
      await alRecargar()
      alExito(activo ? 'Clase activada' : 'Clase desactivada')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar la clase')
    } finally {
      setCambiando(null)
    }
  }

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">

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
          <input type="number" min="15" max="300" step="1" className="campo" value={form.duracion}
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
                  <input type="number" min="15" max="300" step="1" className="campo w-28" value={formEdit.duracion}
                         onChange={e => setFormEdit(f => ({ ...f, duracion: e.target.value }))} />
                </div>
                <select className="campo" value={formEdit.profesor_id || ''}
                        onChange={e => setFormEdit(f => ({ ...f, profesor_id: e.target.value }))}>
                  <option value="">Sin asignar</option>
                  {profesores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
                </select>
                <textarea className="campo resize-none" rows={2} value={formEdit.descripcion || ''}
                          onChange={e => setFormEdit(f => ({ ...f, descripcion: e.target.value }))} />
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
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Interruptor
                      activo={c.activo}
                      etiqueta={`${c.nombre} activa`}
                      disabled={cambiando === c.id}
                      alCambiar={activo => alternarActivo(c, activo)}
                    />
                  </div>
                </div>
                <button
                  onClick={() => {
                    setEditando(c.id)
                    setFormEdit({
                      nombre: c.nombre, rama: c.rama, profesor_id: c.profesor_id || '',
                      descripcion: c.descripcion || '', duracion: c.duracion
                    })
                  }}
                  aria-label="Editar clase"
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

// Un horario tiene varios días con la misma hora: "Lucha, lunes, miércoles y
// viernes de 17 a 18:30" se carga una sola vez. El precio es el de la semana
// completa, para quien reserva semanal; con plan, el lugar va incluido.
const HORARIO_VACIO = {
  clase_id: '', dias: [], hora_inicio: '', hora_fin: '',
  cupos_totales: '', precio: ''
}

function SeccionHorarios({ horarios, clases, alExito, alError, alRecargar, confirmar }) {
  const [form, setForm] = useState(HORARIO_VACIO)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState({})
  const [guardando, setGuardando] = useState(false)
  const [cambiando, setCambiando] = useState(null)

  const revisar = (datos) => {
    if (datos.dias.length === 0) return 'Elegí al menos un día'
    if (datos.hora_fin <= datos.hora_inicio) return 'La hora de fin tiene que ser posterior a la de inicio'
    return null
  }

  const crear = async (e) => {
    e.preventDefault()
    const problema = revisar(form)
    if (problema) return alError(problema)
    setGuardando(true)
    try {
      await crearHorario(form)
      setForm(f => ({ ...HORARIO_VACIO, clase_id: f.clase_id }))
      await alRecargar()
      alExito('Horario creado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos crear el horario')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = async (id) => {
    const problema = revisar(formEdit)
    if (problema) return alError(problema)
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

  // El interruptor manda solo { activo }: no hace falta abrir el editor.
  const alternarActivo = async (h, activo) => {
    if (!activo && (h.fijos > 0)) {
      const seguir = await confirmar({
        titulo: '¿Desactivar este horario?',
        mensaje: `${h.fijos} ${h.fijos === 1 ? 'socio tiene' : 'socios tienen'} lugar fijo acá. Mientras esté desactivado no lo ven ni pueden entrar por la puerta en ese horario; al reactivarlo recuperan su lugar.`,
        textoConfirmar: 'Desactivar',
        peligroso: true
      })
      if (!seguir) return
    }
    setCambiando(h.id)
    try {
      await editarHorario(h.id, { activo })
      await alRecargar()
      alExito(activo ? 'Horario activado' : 'Horario desactivado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar el horario')
    } finally {
      setCambiando(null)
    }
  }

  const borrar = async (h) => {
    const seguro = await confirmar({
      titulo: '¿Eliminar este horario?',
      mensaje: `${h.clase} · ${textoDias(h.dias)} ${rangoHorario(h.hora_inicio, h.hora_fin)}. Si tiene reservas o lugares fijos no se va a poder borrar.`,
      textoConfirmar: 'Eliminar',
      peligroso: true
    })
    if (!seguro) return
    try {
      await eliminarHorario(h.id)
      await alRecargar()
      alExito('Horario eliminado')
    } catch (err) {
      alError(err.response?.data?.error || 'No se pudo eliminar. Desactivalo en vez de borrarlo.')
    }
  }

  const activas = clases.filter(c => c.activo)

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">

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
          <label className="etiqueta-campo">Días (todos con la misma hora)</label>
          <SelectorDias dias={form.dias} alCambiar={dias => setForm(f => ({ ...f, dias }))} />
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
            <label className="etiqueta-campo">Precio por semana</label>
            <input type="number" min="0" required className="campo" value={form.precio}
                   onChange={e => setForm(f => ({ ...f, precio: e.target.value }))} />
          </div>
        </div>
        <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          El precio es para quien reserva la semana completa. Con plan mensual va incluido.
        </p>
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
          <article key={h.id} className="tarjeta p-4" style={{ opacity: h.activo && h.clase_activa ? 1 : 0.7 }}>
            {editando === h.id ? (
              <div className="flex flex-col gap-3">
                <p className="text-sm font-semibold">{h.clase}</p>
                <SelectorDias dias={formEdit.dias} alCambiar={dias => setFormEdit(f => ({ ...f, dias }))} />
                <div className="flex gap-2">
                  <input type="time" className="campo flex-1" value={formEdit.hora_inicio}
                         onChange={e => setFormEdit(f => ({ ...f, hora_inicio: e.target.value }))} />
                  <input type="time" className="campo flex-1" value={formEdit.hora_fin}
                         onChange={e => setFormEdit(f => ({ ...f, hora_fin: e.target.value }))} />
                </div>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <label className="etiqueta-campo">Cupos totales</label>
                    <input type="number" min="1" className="campo" value={formEdit.cupos_totales}
                           onChange={e => setFormEdit(f => ({ ...f, cupos_totales: e.target.value }))} />
                  </div>
                  <div className="flex-1">
                    <label className="etiqueta-campo">Precio por semana</label>
                    <input type="number" min="0" className="campo" value={formEdit.precio}
                           onChange={e => setFormEdit(f => ({ ...f, precio: e.target.value }))} />
                  </div>
                </div>
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
                    {textoDias(h.dias)} · {rangoHorario(h.hora_inicio, h.hora_fin)}
                  </p>
                  <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>
                    <IconoUsuarios size={13} />
                    {h.cupos_disponibles} de {h.cupos_totales} libres la semana que viene
                    {h.fijos > 0 && ` · ${h.fijos} fijo${h.fijos === 1 ? '' : 's'}`} · {precio(h.precio)}/semana
                  </p>
                  <div className="mt-2.5 flex flex-wrap items-center gap-2">
                    <Interruptor
                      activo={h.activo}
                      etiqueta={`${h.clase} ${textoDias(h.dias)} activo`}
                      disabled={cambiando === h.id}
                      alCambiar={activo => alternarActivo(h, activo)}
                    />
                    {!h.clase_activa && <span className="insignia insignia-alerta">Clase inactiva</span>}
                  </div>
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    aria-label="Editar horario"
                    onClick={() => {
                      setEditando(h.id)
                      setFormEdit({
                        dias: h.dias,
                        hora_inicio: h.hora_inicio.slice(0, 5),
                        hora_fin: h.hora_fin.slice(0, 5),
                        cupos_totales: h.cupos_totales,
                        precio: h.precio
                      })
                    }}
                    className="btn btn-contorno btn-chico"
                  >
                    <IconoLapiz size={15} />
                  </button>
                  <button aria-label="Eliminar horario" onClick={() => borrar(h)} className="btn btn-peligro btn-chico">
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
  const [editandoApto, setEditandoApto] = useState(null) // { id, vence }
  const [fotoDe, setFotoDe] = useState(null)
  const [creandoPuerta, setCreandoPuerta] = useState(false)

  const cerrarSesiones = async (u) => {
    const seguro = await confirmar({
      titulo: `¿Cerrar las sesiones de ${u.nombre}?`,
      mensaje: u.cuenta_puerta
        ? 'La PC de la puerta sale al instante y hay que volver a entrar con la contraseña de la cuenta. Sirve si se cambió la PC o si alguien más la conoce.'
        : 'Sale de la app en todos sus dispositivos, sin cambiar su contraseña. Sirve si perdió el teléfono.',
      textoConfirmar: 'Cerrar sesiones',
      peligroso: true
    })
    if (!seguro) return
    try {
      const r = await cerrarSesionesUsuario(u.id)
      alExito(r.mensaje)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cerrar las sesiones')
    }
  }

  const guardarApto = async (u, vence) => {
    try {
      await cambiarApto(u.id, vence)
      setEditandoApto(null)
      await alRecargar()
      alExito(vence ? `Apto de ${u.nombre} cargado` : `Apto de ${u.nombre} borrado`)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el apto médico')
    }
  }

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

  const cambiarEstado = async (u) => {
    const darDeBaja = u.activo !== false

    const seguro = await confirmar(darDeBaja
      ? {
          titulo: `¿Dar de baja a ${u.nombre}?`,
          mensaje: 'No va a poder entrar a la app. Sus reservas, pagos y rutinas quedan guardados, y lo podés reactivar cuando quieras.',
          textoConfirmar: 'Dar de baja',
          peligroso: true
        }
      : {
          titulo: `¿Reactivar a ${u.nombre}?`,
          mensaje: 'Va a poder volver a entrar con su contraseña de siempre.',
          textoConfirmar: 'Reactivar'
        })
    if (!seguro) return

    try {
      await cambiarEstadoUsuario(u.id, !darDeBaja)
      await alRecargar()
      alExito(darDeBaja ? `${u.nombre} quedó dado de baja` : `${u.nombre} quedó reactivado`)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar el estado del usuario')
    }
  }

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return usuarios.filter(u => {
      const coincide = !texto ||
        u.nombre?.toLowerCase().includes(texto) ||
        u.email?.toLowerCase().includes(texto) ||
        String(u.dni ?? '').includes(texto)
      // "sin apto" junta a los socios activos a los que hay que pedirle el certificado.
      const pasaFiltro = filtroRol === 'sin apto'
        ? u.rol === 'alumno' && u.activo !== false && ['falta', 'vencido'].includes(estadoApto(u.apto_vence).tipo)
        : filtroRol === 'todos' || u.rol === filtroRol
      return coincide && pasaFiltro
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
      alExito(`${u.nombre} ahora es ${NOMBRE_ROL[nuevoRol].toLowerCase()}`)
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
          {['todos', ...ROLES, 'sin apto'].map(r => (
            <button
              key={r}
              onClick={() => setFiltroRol(r)}
              className={`pildora ${filtroRol === r ? 'pildora-activa' : ''}`}
            >
              {NOMBRE_ROL[r]}
            </button>
          ))}
        </div>
      </div>

      {creandoPuerta ? (
        <FormCuentaPuerta
          alCancelar={() => setCreandoPuerta(false)}
          alCrear={async (datos) => {
            try {
              await crearCuentaPuerta(datos)
              setCreandoPuerta(false)
              await alRecargar()
              alExito(`Cuenta de la puerta creada. Entrá con ${datos.email} en la PC de la entrada.`)
            } catch (err) {
              alError(err.response?.data?.error || 'No pudimos crear la cuenta')
            }
          }}
        />
      ) : (
        <button onClick={() => setCreandoPuerta(true)} className="btn btn-contorno btn-chico self-start">
          Crear cuenta de puerta
        </button>
      )}

      <p className="titulo-seccion">{visibles.length} de {usuarios.length} usuarios</p>

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visibles.map(u => (
          // Hasta pantallas grandes las acciones van en una fila abajo: al costado le
          // dejaban al nombre y al email unos pocos caracteres.
          <article key={u.id} className="tarjeta flex flex-wrap items-center gap-3 p-3.5 lg:flex-nowrap">
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
              {u.cuenta_puerta
                ? <span className="insignia insignia-acento mt-1">Cuenta de la puerta</span>
                : <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>DNI {u.dni}</p>}
              {u.activo === false && (
                <span className="insignia insignia-error mt-1">Dado de baja</span>
              )}
              {u.rol === 'alumno' && (editandoApto?.id === u.id ? (
                <form
                  className="mt-1.5 flex flex-wrap items-center gap-1.5"
                  onSubmit={e => { e.preventDefault(); if (editandoApto.vence) guardarApto(u, editandoApto.vence) }}
                >
                  <input
                    type="date" required aria-label={`Vencimiento del apto de ${u.nombre}`}
                    className="campo w-auto !min-h-9 !py-1 text-xs"
                    value={editandoApto.vence}
                    onChange={e => setEditandoApto({ id: u.id, vence: e.target.value })}
                  />
                  <button type="submit" className="btn btn-primario btn-chico !text-[11px]">Guardar</button>
                  {u.apto_vence && (
                    <button type="button" onClick={() => guardarApto(u, null)} className="btn btn-fantasma btn-chico !text-[11px]">
                      Borrar
                    </button>
                  )}
                  <button type="button" onClick={() => setEditandoApto(null)} className="btn btn-fantasma btn-chico !text-[11px]">
                    Cancelar
                  </button>
                </form>
              ) : (
                <button
                  type="button"
                  onClick={() => setEditandoApto({ id: u.id, vence: u.apto_vence || '' })}
                  className={`insignia ${estadoApto(u.apto_vence).insignia} mt-1`}
                  title="Cargar o cambiar el vencimiento del apto médico"
                >
                  {estadoApto(u.apto_vence).texto}
                </button>
              ))}
            </div>
            <div className="flex w-full flex-wrap items-center justify-end gap-1.5 lg:w-auto lg:shrink-0 lg:flex-col lg:items-end">
              {u.cuenta_puerta ? (
                <button onClick={() => cerrarSesiones(u)} className="btn btn-contorno btn-chico !text-[11px]">
                  Cerrar sesión de la puerta
                </button>
              ) : (
                <select
                  className="campo w-auto !min-h-9 !py-1.5 text-xs"
                  value={u.rol}
                  onChange={e => cambiar(u, e.target.value)}
                  aria-label={`Rol de ${u.nombre}`}
                >
                  {ROLES.map(r => <option key={r} value={r}>{NOMBRE_ROL[r]}</option>)}
                </select>
              )}
              {u.rol === 'alumno' && (
                <button onClick={() => setFotoDe(u)} className="btn btn-fantasma btn-chico !text-[11px]">
                  {u.tiene_foto ? 'Ver foto' : 'Sacar foto'}
                </button>
              )}
              <button
                onClick={() => restablecer(u)}
                className="btn btn-fantasma btn-chico !text-[11px]"
              >
                <IconoLlave size={13} /> Restablecer clave
              </button>
              <button
                onClick={() => cambiarEstado(u)}
                className="btn btn-fantasma btn-chico !text-[11px]"
                style={{ color: u.activo === false ? 'var(--color-exito)' : 'var(--color-error)' }}
              >
                {u.activo === false ? 'Reactivar' : 'Dar de baja'}
              </button>
              {!u.cuenta_puerta && (
                <button onClick={() => cerrarSesiones(u)} className="btn btn-fantasma btn-chico !text-[11px]">
                  Cerrar sesiones
                </button>
              )}
            </div>
          </article>
        ))}
      </div>

      {fotoDe && (
        <FotoSocio
          socio={fotoDe} alExito={alExito} alError={alError}
          alCerrar={(cambio) => { setFotoDe(null); if (cambio) alRecargar() }}
        />
      )}

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
    // Sin cerrar al tocar afuera: la clave se ve una sola vez, y un toque de
    // más la perdía y había que restablecerla de nuevo.
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,.6)' }}
      role="dialog"
      aria-modal="true"
    >
      <div
        className="tarjeta aparecer w-full max-w-sm p-5"
        style={{ backgroundColor: 'var(--color-elevado)' }}
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

function SeccionReservas({ reservas, alExito, alError, alRecargar, confirmar: pedirConfirmacion }) {
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

  const confirmar = async (r) => {
    // Sin pago registrado desde la app, el cobro se confirma solo si la
    // persona ya pagó en el mostrador: vale una pregunta antes.
    if (!r.metodo) {
      const seguro = await pedirConfirmacion({
        titulo: `¿Confirmar el cobro a ${r.alumno}?`,
        mensaje: `No registró el pago desde la app. Confirmalo solo si ya te pagó ${precio(r.total)} en el gimnasio.`,
        textoConfirmar: 'Sí, ya pagó'
      })
      if (!seguro) return
    }

    try {
      await confirmarPagoEfectivo(r.id)
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

      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {visibles.map(r => (
          <article key={r.id} className="tarjeta p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="truncate font-semibold">{r.alumno}</p>
                <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                  {r.clase} · {diasCortos(r.dias)} {hora(r.hora_inicio)}
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

            {/* Antes el cobro solo se podía confirmar si el socio lo había
                registrado desde la app. Ahora también cuando pagó directo en
                el mostrador, y se le puede recordar el pago por WhatsApp. */}
            {r.estado === 'pendiente' && (
              <div className="mt-3 flex gap-2">
                {r.metodo !== 'mercadopago' && (
                  <button onClick={() => confirmar(r)} className="btn btn-primario btn-chico flex-1">
                    <IconoCheck size={14} /> Confirmar cobro
                  </button>
                )}
                {linkWhatsapp(r.telefono, mensajePagoPendiente(r)) && (
                  <a
                    href={linkWhatsapp(r.telefono, mensajePagoPendiente(r))}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-contorno btn-chico flex-1"
                  >
                    <IconoWhatsapp size={14} /> Recordar pago
                  </a>
                )}
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

/**
 * Alta de la cuenta fija de la PC de la entrada: no es de ninguna persona, así
 * que no pide DNI ni teléfono. Queda como recepción y solo ve la puerta.
 */
function FormCuentaPuerta({ alCrear, alCancelar }) {
  const [nombre, setNombre]     = useState('Puerta')
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [repetida, setRepetida] = useState('')
  const [enviando, setEnviando] = useState(false)
  const distintas = repetida !== '' && password !== repetida

  const enviar = async (e) => {
    e.preventDefault()
    if (distintas) return
    setEnviando(true)
    await alCrear({ nombre: nombre.trim(), email: email.trim(), password })
    setEnviando(false)
  }

  return (
    <form onSubmit={enviar} className="tarjeta aparecer flex flex-col gap-3 p-4">
      <div>
        <h2 className="titulo-seccion">Cuenta de la puerta</h2>
        <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>
          Para dejar la PC de la entrada fija en la pantalla de ingreso. Entra directo a la puerta, no ve el panel
          y la sesión dura 6 meses. Usá una contraseña difícil: esta cuenta baja la lista de socios con DNI y foto.
        </p>
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <div>
          <label htmlFor="puerta-nombre" className="etiqueta-campo">Nombre</label>
          <input id="puerta-nombre" className="campo" required value={nombre} onChange={e => setNombre(e.target.value)} />
        </div>
        <div>
          <label htmlFor="puerta-email" className="etiqueta-campo">Email para entrar</label>
          <input id="puerta-email" type="email" className="campo" required autoComplete="off"
                 placeholder="puerta@tugimnasio.com" value={email} onChange={e => setEmail(e.target.value)} />
        </div>
        <div>
          <label htmlFor="puerta-clave" className="etiqueta-campo">Contraseña (mínimo 8)</label>
          <input id="puerta-clave" type="password" className="campo" required minLength={8} autoComplete="new-password"
                 value={password} onChange={e => setPassword(e.target.value)} />
        </div>
        <div>
          <label htmlFor="puerta-clave-2" className="etiqueta-campo">Repetir contraseña</label>
          <input id="puerta-clave-2" type="password" className="campo" required autoComplete="new-password"
                 value={repetida} onChange={e => setRepetida(e.target.value)} />
          {distintas && <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>No coinciden</p>}
        </div>
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={alCancelar} className="btn btn-fantasma flex-1">Cancelar</button>
        <button type="submit" disabled={enviando || distintas} className="btn btn-primario flex-1">
          {enviando ? 'Creando…' : 'Crear cuenta'}
        </button>
      </div>
    </form>
  )
}
