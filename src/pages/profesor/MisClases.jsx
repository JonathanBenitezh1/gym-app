import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import { useAvisos } from '../../components/Avisos'
import {
  obtenerMisHorarios, modificarHorario,
  obtenerAlumnosDeHorario, marcarAsistencia
} from '../../services/profesorService'
import { SkeletonLista } from '../../components/Skeleton'
import BotonPresencia from '../../components/BotonPresencia'
import SeccionRutinas from '../../components/SeccionRutinas'
import {
  IconoReloj, IconoUsuarios, IconoCheck, IconoBuscar,
  IconoMas, IconoCruz, IconoSalir, IconoLapiz
} from '../../components/Iconos'
import { rangoHorario, hoyISO, fechaCorta } from '../../utils/formato'
import logoDtc from '../img/logo_png.png'
import { GIMNASIO } from '../../config/gimnasio'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

// Los disponibles ya no se editan: se cuentan con las reservas de cada semana.
// Se sigue mandando el que vino, acotado al total, solo para que el backend
// anterior no lo pise con null mientras se publica el cambio.
const conDisponiblesViejos = (form) =>
  ({ ...form, cupos_disponibles: Math.min(Number(form.cupos_disponibles), Number(form.cupos_totales)) })
const SOLAPAS = [
  { id: 'horarios',   texto: 'Mis horarios' },
  { id: 'rutinas',    texto: 'Rutinas' },
  { id: 'asistencia', texto: 'Asistencia' }
]

export default function MisClases() {
  const { usuario, cerrarSesion } = useAuth()
  const { exito, error: avisarError, confirmar } = useAvisos()
  const navigate = useNavigate()

  const [solapa, setSolapa]     = useState('horarios')
  const [horarios, setHorarios] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargarHorarios = useCallback(async () => {
    try {
      setHorarios(await obtenerMisHorarios())
    } catch {
      avisarError('No pudimos cargar tus horarios')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargarHorarios() }, [cargarHorarios])

  const salir = async () => {
    if (await confirmar({ titulo: '¿Cerrar sesión?', textoConfirmar: 'Cerrar sesión' })) {
      cerrarSesion()
      navigate('/')
    }
  }

  return (
    <div className="min-h-screen pb-12">

      <header
        className="sticky top-0 z-20"
        style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}
      >
        <div className="contenedor-ancho flex items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoDtc} alt={GIMNASIO.nombre} className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-sm font-bold leading-tight">Panel del profesor</p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>{usuario?.nombre}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <BotonPresencia alExito={exito} alError={avisarError} />
            <button onClick={salir} className="btn btn-fantasma btn-chico" aria-label="Cerrar sesión">
              <IconoSalir size={18} />
            </button>
          </div>
        </div>

        <div className="contenedor-ancho fila-scroll pb-2.5">
          {SOLAPAS.map(s => (
            <button
              key={s.id}
              onClick={() => setSolapa(s.id)}
              className={`pildora ${solapa === s.id ? 'pildora-activa' : ''}`}
            >
              {s.texto}
            </button>
          ))}
        </div>
      </header>

      <main className="contenedor-ancho pt-5">
        {solapa === 'horarios' && (
          <SeccionHorarios
            horarios={horarios}
            cargando={cargando}
            alRecargar={cargarHorarios}
            alExito={exito}
            alError={avisarError}
          />
        )}
        {solapa === 'rutinas' && (
          <SeccionRutinas alExito={exito} alError={avisarError} />
        )}
        {solapa === 'asistencia' && (
          <SeccionAsistencia horarios={horarios} alError={avisarError} />
        )}
      </main>
    </div>
  )
}

/* ═══ HORARIOS ═══════════════════════════════════════════ */

function SeccionHorarios({ horarios, cargando, alRecargar, alExito, alError }) {
  const [editando, setEditando] = useState(null)
  const [form, setForm]         = useState({})
  const [guardando, setGuardando] = useState(false)

  const empezar = (h) => {
    setEditando(h.id)
    setForm({
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin: h.hora_fin.slice(0, 5),
      cupos_totales: h.cupos_totales,
      cupos_disponibles: h.cupos_disponibles,
      activo: h.activo
    })
  }

  const guardar = async (id) => {
    setGuardando(true)
    try {
      await modificarHorario(id, conDisponiblesViejos(form))
      setEditando(null)
      await alRecargar()
      alExito('Horario actualizado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el horario')
    } finally {
      setGuardando(false)
    }
  }

  if (cargando) return <SkeletonLista filas={3} />

  if (horarios.length === 0) {
    return (
      <div className="tarjeta p-8 text-center">
        <p className="font-semibold">No tenés horarios asignados</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          El administrador del gimnasio tiene que asignarte clases
        </p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
      {horarios.map(h => (
        <article key={h.id} className="tarjeta p-4">
          {editando === h.id ? (
            <div className="flex flex-col gap-3">
              <p className="text-sm font-semibold">{h.clase}</p>

              <div>
                <label className="etiqueta-campo">Día</label>
                <select
                  className="campo"
                  value={form.dia_semana}
                  onChange={e => setForm(f => ({ ...f, dia_semana: e.target.value }))}
                >
                  {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="etiqueta-campo">Desde</label>
                  <input type="time" className="campo" value={form.hora_inicio}
                         onChange={e => setForm(f => ({ ...f, hora_inicio: e.target.value }))} />
                </div>
                <div className="flex-1">
                  <label className="etiqueta-campo">Hasta</label>
                  <input type="time" className="campo" value={form.hora_fin}
                         onChange={e => setForm(f => ({ ...f, hora_fin: e.target.value }))} />
                </div>
              </div>

              <div className="flex gap-2">
                <div className="flex-1">
                  <label className="etiqueta-campo">Cupos totales</label>
                  <input type="number" min="1" className="campo" value={form.cupos_totales}
                         onChange={e => setForm(f => ({ ...f, cupos_totales: e.target.value }))} />
                </div>
              </div>

              <label className="flex cursor-pointer items-center gap-2.5 text-sm">
                <input type="checkbox" checked={Boolean(form.activo)} className="h-4 w-4 accent-sky-300"
                       onChange={e => setForm(f => ({ ...f, activo: e.target.checked }))} />
                Clase activa
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
                  {h.cupos_disponibles} libres de {h.cupos_totales} la semana que viene
                </p>
                <span className={`insignia mt-2 ${h.activo ? 'insignia-exito' : 'insignia-error'}`}>
                  {h.activo ? 'Activa' : 'Inactiva'}
                </span>
              </div>
              <button onClick={() => empezar(h)} className="btn btn-contorno btn-chico shrink-0">
                <IconoLapiz size={15} /> Editar
              </button>
            </div>
          )}
        </article>
      ))}
    </div>
  )
}

/* ═══ ASISTENCIA ═════════════════════════════════════════ */

function SeccionAsistencia({ horarios, alError }) {
  const [horarioId, setHorarioId] = useState('')
  const [fecha, setFecha]         = useState(hoyISO())
  const [alumnos, setAlumnos]     = useState([])
  const [cargando, setCargando]   = useState(false)

  const cargar = useCallback(async (id, dia) => {
    if (!id) return
    setCargando(true)
    try {
      setAlumnos(await obtenerAlumnosDeHorario(id, dia))
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cargar los alumnos')
      setAlumnos([])
    } finally {
      setCargando(false)
    }
  }, [alError])

  useEffect(() => { cargar(horarioId, fecha) }, [horarioId, fecha, cargar])

  const alternar = async (alumno) => {
    // Actualización optimista: la marca se ve al instante y, si falla,
    // se revierte al recargar. Tomar asistencia tiene que ser ágil.
    setAlumnos(prev => prev.map(a => a.id === alumno.id ? { ...a, asistio: !a.asistio } : a))
    try {
      await marcarAsistencia({
        horario_id: horarioId,
        usuario_id: alumno.id,
        fecha,
        asistio: !alumno.asistio
      })
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos registrar la asistencia')
      cargar(horarioId, fecha)
    }
  }

  const presentes = alumnos.filter(a => a.asistio).length

  return (
    <div className="flex flex-col gap-4">
      <div className="tarjeta flex flex-col gap-3 p-4">
        <div>
          <label htmlFor="hor" className="etiqueta-campo">Clase</label>
          <select id="hor" className="campo" value={horarioId} onChange={e => setHorarioId(e.target.value)}>
            <option value="">Elegí una clase</option>
            {horarios.map(h => (
              <option key={h.id} value={h.id}>
                {h.clase} — {h.dia_semana} {h.hora_inicio.slice(0, 5)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="fec" className="etiqueta-campo">Fecha</label>
          <input id="fec" type="date" className="campo" value={fecha} onChange={e => setFecha(e.target.value)} />
        </div>
      </div>

      {horarioId && (
        <div className="tarjeta p-4">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="titulo-seccion">Alumnos · {fechaCorta(fecha)}</h2>
            <span className="insignia insignia-acento">
              {presentes}/{alumnos.length} presentes
            </span>
          </div>

          {cargando ? (
            <SkeletonLista filas={3} />
          ) : alumnos.length === 0 ? (
            <p className="py-3 text-sm" style={{ color: 'var(--color-texto-3)' }}>
              No hay alumnos con reserva en esta clase.
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {alumnos.map(a => (
                <li key={a.id}>
                  <button
                    onClick={() => alternar(a)}
                    aria-pressed={a.asistio}
                    className="tarjeta tarjeta-interactiva flex w-full items-center justify-between gap-3 p-3 text-left"
                    style={{
                      backgroundColor: a.asistio ? 'var(--color-exito-bajo)' : 'var(--color-elevado)',
                      borderColor: a.asistio ? 'var(--color-exito)' : 'transparent'
                    }}
                  >
                    <span className="min-w-0">
                      <span className="block truncate text-sm font-medium">{a.nombre}</span>
                      <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>DNI {a.dni}</span>
                    </span>
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
                      style={{
                        backgroundColor: a.asistio ? 'var(--color-exito)' : 'transparent',
                        border: a.asistio ? 'none' : '2px solid var(--color-linea)',
                        color: '#0d1b22'
                      }}
                    >
                      {a.asistio && <IconoCheck size={15} />}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
