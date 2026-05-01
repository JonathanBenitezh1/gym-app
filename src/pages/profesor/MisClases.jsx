import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  obtenerMisHorarios, modificarHorario,
  buscarAlumnoPorDni, obtenerRutinaDeAlumno, guardarRutina
} from '../../services/profesorService'

const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

const sesionVacia = () => ({
  nombre: '', orden: 1,
  ejercicios: [{ nombre: '', series: '', repeticiones: '', orden: 1 }]
})

export default function MisClases() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [seccion, setSeccion]         = useState('horarios')
  const [horarios, setHorarios]       = useState([])
  const [editando, setEditando]       = useState(null)
  const [formHorario, setFormHorario] = useState({})

  // Estados rutinas
  const [dni, setDni]         = useState('')
  const [alumno, setAlumno]   = useState(null)
  const [sesiones, setSesiones] = useState([sesionVacia()])

  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [exito, setExito]     = useState('')

  useEffect(() => {
    if (!usuario || (usuario.rol !== 'profesor' && usuario.rol !== 'admin')) navigate('/')
    cargarHorarios()
  }, [])

  const cargarHorarios = async () => {
    try { setHorarios(await obtenerMisHorarios()) }
    catch { setError('Error al cargar los horarios') }
  }

  const mostrarExito = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  // ─── HORARIOS ───────────────────────────────────────

  const handleEditar = (h) => {
    setEditando(h.id)
    setFormHorario({
      dia_semana: h.dia_semana,
      hora_inicio: h.hora_inicio.slice(0, 5),
      hora_fin: h.hora_fin.slice(0, 5),
      cupos_totales: h.cupos_totales,
      cupos_disponibles: h.cupos_disponibles,
      activo: h.activo
    })
  }

  const handleGuardarHorario = async (id) => {
    setLoading(true)
    try {
      await modificarHorario(id, formHorario)
      setEditando(null)
      await cargarHorarios()
      mostrarExito('Horario actualizado correctamente')
    } catch { setError('Error al guardar el horario') }
    finally { setLoading(false) }
  }

  // ─── RUTINAS ────────────────────────────────────────

  const handleBuscarAlumno = async () => {
    if (!dni) return
    setError('')
    setAlumno(null)
    setSesiones([sesionVacia()])
    try {
      const data = await buscarAlumnoPorDni(dni)
      setAlumno(data)
      // Cargamos rutina existente si tiene
      const rutina = await obtenerRutinaDeAlumno(data.id)
      if (rutina && rutina.sesiones?.length > 0) {
        setSesiones(rutina.sesiones.map(s => ({
          nombre: s.nombre,
          orden: s.orden,
          ejercicios: s.ejercicios?.length > 0
            ? s.ejercicios
            : [{ nombre: '', series: '', repeticiones: '', orden: 1 }]
        })))
      }
    } catch { setError('No se encontró ningún alumno con ese DNI') }
  }

  // ─── Manejo de sesiones ─────────────────────────────

  const agregarSesion = () => {
    setSesiones([...sesiones, { nombre: '', orden: sesiones.length + 1, ejercicios: [{ nombre: '', series: '', repeticiones: '', orden: 1 }] }])
  }

  const eliminarSesion = (si) => {
    setSesiones(sesiones.filter((_, i) => i !== si))
  }

  const actualizarSesion = (si, campo, valor) => {
    const nuevas = [...sesiones]
    nuevas[si][campo] = valor
    setSesiones(nuevas)
  }

  // ─── Manejo de ejercicios ───────────────────────────

  const agregarEjercicio = (si) => {
    const nuevas = [...sesiones]
    nuevas[si].ejercicios.push({
      nombre: '', series: '', repeticiones: '',
      orden: nuevas[si].ejercicios.length + 1
    })
    setSesiones(nuevas)
  }

  const eliminarEjercicio = (si, ei) => {
    const nuevas = [...sesiones]
    nuevas[si].ejercicios = nuevas[si].ejercicios.filter((_, i) => i !== ei)
    setSesiones(nuevas)
  }

  const actualizarEjercicio = (si, ei, campo, valor) => {
    const nuevas = [...sesiones]
    nuevas[si].ejercicios[ei][campo] = valor
    setSesiones(nuevas)
  }

  const handleGuardarRutina = async () => {
    if (!alumno) return
    if (sesiones.some(s => !s.nombre)) {
      setError('Completá el nombre de todas las sesiones')
      return
    }
    setLoading(true)
    setError('')
    try {
      await guardarRutina({ alumno_id: alumno.id, sesiones })
      mostrarExito('Rutina guardada correctamente')
    } catch { setError('Error al guardar la rutina') }
    finally { setLoading(false) }
  }

  const inputStyle = { borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#778899' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#2c4a5a' }}>
        <h1 className="text-lg font-bold text-white">💪 Panel Profesor</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#87CEEB' }}>{usuario?.nombre}</span>
          <button onClick={() => { cerrarSesion(); navigate('/') }}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#f0f7ff', color: '#778899' }}>
            Salir
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 px-4 pt-4">
        {['horarios', 'rutinas'].map(s => (
          <button key={s} onClick={() => { setSeccion(s); setError(''); setExito('') }}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize"
            style={seccion === s
              ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
              : { backgroundColor: '#f0f7ff', color: '#778899' }
            }>
            {s}
          </button>
        ))}
      </div>

      <div className="px-4 pt-4 pb-8">

        {error && <p className="text-sm mb-3" style={{ color: '#e05555' }}>{error}</p>}
        {exito && <p className="text-sm mb-3" style={{ color: '#2d8a4e' }}>{exito}</p>}

        {/* ─── HORARIOS ─── */}
        {seccion === 'horarios' && (
          <div className="flex flex-col gap-3">
            {horarios.length === 0
              ? <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#f0f7ff' }}>
                  <p className="text-sm" style={{ color: '#778899' }}>No tenés horarios asignados.</p>
                </div>
              : horarios.map(h => (
                <div key={h.id} className="rounded-2xl p-4" style={{ backgroundColor: '#f0f7ff' }}>
                  {editando === h.id ? (
                    <div className="flex flex-col gap-3">
                      <p className="font-semibold text-sm mb-1" style={{ color: '#2c4a5a' }}>
                        Editando: {h.clase}
                      </p>
                      <select value={formHorario.dia_semana}
                        onChange={e => setFormHorario({...formHorario, dia_semana: e.target.value})}
                        className="border rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}>
                        {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
                      </select>
                      <div className="flex gap-2">
                        <input type="time" value={formHorario.hora_inicio}
                          onChange={e => setFormHorario({...formHorario, hora_inicio: e.target.value})}
                          className="border rounded-lg px-3 py-2 text-sm outline-none flex-1" style={inputStyle}/>
                        <input type="time" value={formHorario.hora_fin}
                          onChange={e => setFormHorario({...formHorario, hora_fin: e.target.value})}
                          className="border rounded-lg px-3 py-2 text-sm outline-none flex-1" style={inputStyle}/>
                      </div>
                      <input type="number" placeholder="Cupos totales" value={formHorario.cupos_totales}
                        onChange={e => setFormHorario({...formHorario, cupos_totales: e.target.value})}
                        className="border rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}/>
                      <input type="number" placeholder="Cupos disponibles" value={formHorario.cupos_disponibles}
                        onChange={e => setFormHorario({...formHorario, cupos_disponibles: e.target.value})}
                        className="border rounded-lg px-3 py-2 text-sm outline-none" style={inputStyle}/>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" checked={formHorario.activo}
                          onChange={e => setFormHorario({...formHorario, activo: e.target.checked})}/>
                        <label className="text-sm" style={{ color: '#2c4a5a' }}>Activo</label>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleGuardarHorario(h.id)} disabled={loading}
                          className="flex-1 py-2 rounded-lg text-sm font-semibold"
                          style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}>
                          {loading ? 'Guardando...' : 'Guardar'}
                        </button>
                        <button onClick={() => setEditando(null)}
                          className="px-4 py-2 rounded-lg text-sm"
                          style={{ backgroundColor: '#e8f0f7', color: '#778899' }}>
                          Cancelar
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>{h.clase}</p>
                        <p className="text-xs mt-0.5" style={{ color: '#778899' }}>
                          {h.dia_semana} · {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}
                        </p>
                        <p className="text-xs" style={{ color: '#778899' }}>
                          Cupos: {h.cupos_disponibles}/{h.cupos_totales}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full mt-1 inline-block"
                          style={h.activo
                            ? { backgroundColor: '#e8f5e9', color: '#2d8a4e' }
                            : { backgroundColor: '#fce8e8', color: '#e05555' }}>
                          {h.activo ? 'Activo' : 'Inactivo'}
                        </span>
                      </div>
                      <button onClick={() => handleEditar(h)}
                        className="text-xs px-3 py-1 rounded-lg"
                        style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}>
                        Editar
                      </button>
                    </div>
                  )}
                </div>
              ))
            }
          </div>
        )}

        {/* ─── RUTINAS ─── */}
        {seccion === 'rutinas' && (
          <div className="flex flex-col gap-4">

            {/* Buscar alumno */}
            <div className="rounded-2xl p-5" style={{ backgroundColor: '#f0f7ff' }}>
              <p className="text-sm font-semibold mb-3" style={{ color: '#2c4a5a' }}>
                Buscar alumno por DNI
              </p>
              <div className="flex gap-2">
                <input type="text" placeholder="Ingresá el DNI"
                  value={dni} onChange={e => setDni(e.target.value)}
                  className="flex-1 border rounded-lg px-4 py-2 text-sm outline-none"
                  style={inputStyle}/>
                <button onClick={handleBuscarAlumno}
                  className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}>
                  Buscar
                </button>
              </div>

              {alumno && (
                <div className="mt-3 p-3 rounded-xl" style={{ backgroundColor: '#e8f4fb' }}>
                  <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>{alumno.nombre}</p>
                  <p className="text-xs" style={{ color: '#778899' }}>DNI: {alumno.dni} · {alumno.email}</p>
                </div>
              )}
            </div>

            {/* Constructor de rutina */}
            {alumno && (
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <p className="text-sm font-semibold" style={{ color: '#f0f7ff' }}>
                    Rutina de {alumno.nombre}
                  </p>
                  <button onClick={agregarSesion}
                    className="text-xs px-3 py-1 rounded-lg font-semibold"
                    style={{ backgroundColor: '#f0f7ff', color: '#2c4a5a' }}>
                    + Sesión
                  </button>
                </div>

                {sesiones.map((sesion, si) => (
                  <div key={si} className="rounded-2xl overflow-hidden"
                    style={{ backgroundColor: '#f0f7ff' }}>

                    {/* Header sesión */}
                    <div className="px-4 py-3 flex items-center gap-2"
                      style={{ backgroundColor: '#2c4a5a' }}>
                      <input
                        placeholder="Nombre de la sesión (ej: ESPALDA - BÍCEPS)"
                        value={sesion.nombre}
                        onChange={e => actualizarSesion(si, 'nombre', e.target.value)}
                        className="flex-1 rounded-lg px-3 py-1.5 text-sm outline-none font-semibold uppercase"
                        style={{ backgroundColor: '#3d6070', color: '#ffffff', border: 'none' }}
                      />
                      {sesiones.length > 1 && (
                        <button onClick={() => eliminarSesion(si)}
                          className="text-xs px-2 py-1 rounded-lg"
                          style={{ backgroundColor: '#e05555', color: '#ffffff' }}>
                          ✕
                        </button>
                      )}
                    </div>

                    {/* Ejercicios */}
                    <div className="px-4 py-3 flex flex-col gap-3">
                      {sesion.ejercicios.map((ej, ei) => (
                        <div key={ei} className="rounded-xl p-3"
                          style={{ backgroundColor: '#e8f4fb' }}>
                          <div className="flex items-center gap-2 mb-2">
                            <input
                              placeholder="Nombre del ejercicio"
                              value={ej.nombre}
                              onChange={e => actualizarEjercicio(si, ei, 'nombre', e.target.value)}
                              className="flex-1 border rounded-lg px-3 py-1.5 text-sm outline-none font-medium"
                              style={inputStyle}
                            />
                            {sesion.ejercicios.length > 1 && (
                              <button onClick={() => eliminarEjercicio(si, ei)}
                                className="text-xs px-2 py-1 rounded-lg"
                                style={{ backgroundColor: '#fce8e8', color: '#e05555' }}>
                                ✕
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2">
                            <div className="flex-1">
                              <p className="text-xs mb-1" style={{ color: '#778899' }}>Series</p>
                              <input
                                type="number"
                                placeholder="3"
                                value={ej.series}
                                onChange={e => actualizarEjercicio(si, ei, 'series', e.target.value)}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm outline-none"
                                style={inputStyle}
                              />
                            </div>
                            <div className="flex-1">
                              <p className="text-xs mb-1" style={{ color: '#778899' }}>Repeticiones</p>
                              <input
                                placeholder="10-12"
                                value={ej.repeticiones}
                                onChange={e => actualizarEjercicio(si, ei, 'repeticiones', e.target.value)}
                                className="w-full border rounded-lg px-3 py-1.5 text-sm outline-none"
                                style={inputStyle}
                              />
                            </div>
                          </div>
                        </div>
                      ))}

                      <button onClick={() => agregarEjercicio(si)}
                        className="w-full py-2 rounded-lg text-xs font-medium"
                        style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}>
                        + Agregar ejercicio
                      </button>
                    </div>
                  </div>
                ))}

                {/* Guardar rutina */}
                <button onClick={handleGuardarRutina} disabled={loading}
                  className="w-full py-3 rounded-2xl font-bold text-sm"
                  style={{ backgroundColor: loading ? '#b0d8ed' : '#87CEEB', color: '#1a3a4a' }}>
                  {loading ? 'Guardando...' : '💾 Guardar rutina'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}