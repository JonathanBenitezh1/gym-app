import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'
import {
  obtenerClases, crearClase, eliminarClase,
  crearHorario, eliminarHorario,
  obtenerUsuarios, cambiarRol,
  obtenerReservas, confirmarPagoEfectivo,
  obtenerProfesores
} from '../../services/adminService'

const RAMAS = ['gimnasio', 'disciplina', 'profesional']
const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function PanelPC() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const [seccion, setSeccion] = useState('clases')
  const [profesores, setProfesores] = useState([])

  // ─── Estados clases ───
  const [clases, setClases] = useState([])
 const [formClase, setFormClase] = useState({
  nombre: '', rama: 'gimnasio', descripcion: '', duracion: 60, profesor_id: ''
})
  

  // ─── Estados horarios ───
  const [formHorario, setFormHorario] = useState({
    clase_id: '', dia_semana: 'Lunes',
    hora_inicio: '', hora_fin: '',
    cupos_totales: '', precio: ''
  })

  // ─── Estados usuarios ───
  const [usuarios, setUsuarios] = useState([])

  // ─── Estados reservas ───
  const [reservas, setReservas] = useState([])

  const [error, setError]     = useState('')
  const [exito, setExito]     = useState('')
  const [loading, setLoading] = useState(false)

  // Redirigir si no es admin
  useEffect(() => {
    if (!usuario || usuario.rol !== 'admin') navigate('/')
  }, [usuario])

  // Cargar datos según sección activa
  useEffect(() => {
  if (seccion === 'clases')   { cargarClases(); cargarProfesores() }
  if (seccion === 'horarios') cargarClases()
  if (seccion === 'usuarios') cargarUsuarios()
  if (seccion === 'reservas') cargarReservas()
}, [seccion])

  const cargarClases   = async () => { try { setClases(await obtenerClases()) } catch(e) { setError('Error al cargar clases') } }
  const cargarUsuarios = async () => { try { setUsuarios(await obtenerUsuarios()) } catch(e) { setError('Error al cargar usuarios') } }
  const cargarReservas = async () => { try { setReservas(await obtenerReservas()) } catch(e) { setError('Error al cargar reservas') } }

  const mostrarExito = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  // ─── Acciones clases ───
  const handleCrearClase = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await crearClase(formClase)
      setFormClase({ nombre: '', rama: 'gimnasio', descripcion: '', duracion: 60 })
      await cargarClases()
      mostrarExito('Clase creada correctamente')
    } catch { setError('Error al crear la clase') }
    finally { setLoading(false) }
  }

  const handleEliminarClase = async (id) => {
    if (!confirm('¿Seguro que querés eliminar esta clase?')) return
    try {
      await eliminarClase(id)
      await cargarClases()
      mostrarExito('Clase eliminada')
    } catch { setError('Error al eliminar') }
  }

  // ─── Acciones horarios ───
  const handleCrearHorario = async (e) => {
    e.preventDefault()
    setLoading(true)
    try {
      await crearHorario(formHorario)
      setFormHorario({ clase_id: '', dia_semana: 'Lunes', hora_inicio: '', hora_fin: '', cupos_totales: '', precio: '' })
      mostrarExito('Horario creado correctamente')
    } catch { setError('Error al crear el horario') }
    finally { setLoading(false) }
  }

  // ─── Acciones usuarios ───
  const handleCambiarRol = async (id, rol) => {
    try {
      await cambiarRol(id, rol)
      await cargarUsuarios()
      mostrarExito('Rol actualizado')
    } catch { setError('Error al cambiar rol') }
  }

  // ─── Acciones reservas ───
  const handleConfirmarPago = async (id) => {
    try {
      await confirmarPagoEfectivo(id)
      await cargarReservas()
      mostrarExito('Pago confirmado')
    } catch { setError('Error al confirmar pago') }
  }
  const cargarProfesores = async () => {
  try {
    setProfesores(await obtenerProfesores())
  } catch {
    setError('Error al cargar profesores')
  }
}

  const inputStyle = {
    borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff'
  }

  const btnPrimario = {
    backgroundColor: '#87CEEB', color: '#1a3a4a'
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#778899' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#2c4a5a' }}>
        <h1 className="text-xl font-bold text-white">💪 GymApp — Panel Admin</h1>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ color: '#87CEEB' }}>
            {usuario?.nombre}
          </span>
          <button
            onClick={() => { cerrarSesion(); navigate('/') }}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
          >
            Salir
          </button>
        </div>
      </div>

      {/* Tabs de navegación */}
      <div className="flex gap-2 px-6 pt-4">
        {['clases', 'horarios', 'usuarios', 'reservas'].map(s => (
          <button
            key={s}
            onClick={() => { setSeccion(s); setError(''); setExito('') }}
            className="px-4 py-2 rounded-lg text-sm font-medium capitalize transition-opacity"
            style={seccion === s
              ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
              : { backgroundColor: '#f0f7ff', color: '#778899' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Mensajes */}
      <div className="px-6 pt-3">
        {error && <p className="text-sm mb-2" style={{ color: '#e05555' }}>{error}</p>}
        {exito && <p className="text-sm mb-2" style={{ color: '#2d8a4e' }}>{exito}</p>}
      </div>

      <div className="px-6 pb-8">

        {/* ─── SECCIÓN CLASES ─── */}
        {seccion === 'clases' && (
          <div className="flex flex-col gap-6 mt-4">

            {/* Formulario crear clase */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#f0f7ff' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2c4a5a' }}>
                Nueva clase
              </h2>
              <form onSubmit={handleCrearClase} className="flex flex-col gap-3">
                <input
                  placeholder="Nombre de la clase"
                  value={formClase.nombre}
                  onChange={e => setFormClase({...formClase, nombre: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none"
                  style={inputStyle} required
                />
                <select
                  value={formClase.rama}
                  onChange={e => setFormClase({...formClase, rama: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  {RAMAS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
                <select
                  value={formClase.profesor_id}
                  onChange={e => setFormClase({...formClase, profesor_id: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none"
                  style={inputStyle}
                >
                  <option value="">Sin profesor asignado</option>
                  {profesores.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} ({p.dni})
                    </option>
                  ))}
                </select>
                                <textarea
                  placeholder="Descripción"
                  value={formClase.descripcion}
                  onChange={e => setFormClase({...formClase, descripcion: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none resize-none"
                  style={inputStyle} rows={2}
                />
                <input
                  type="number"
                  placeholder="Duración (minutos)"
                  value={formClase.duracion}
                  onChange={e => setFormClase({...formClase, duracion: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none"
                  style={inputStyle}
                />
                <button
                  type="submit" disabled={loading}
                  className="py-2 rounded-lg font-semibold text-sm"
                  style={btnPrimario}
                >
                  {loading ? 'Creando...' : 'Crear clase'}
                </button>
              </form>
            </div>

            {/* Lista de clases */}
            <div className="rounded-2xl p-6" style={{ backgroundColor: '#f0f7ff' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: '#2c4a5a' }}>
                Clases registradas
              </h2>
              {clases.length === 0
                ? <p className="text-sm" style={{ color: '#778899' }}>No hay clases cargadas aún.</p>
                : clases.map(c => (
                  <div key={c.id}
                    className="flex items-center justify-between border-b py-3"
                    style={{ borderColor: '#87CEEB' }}
                  >
                    <div>
                      <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>{c.nombre}</p>
                      <p className="text-xs" style={{ color: '#778899' }}>
                        {c.rama} · {c.duracion} min · {c.nombre_profesor || 'Sin profesor'}
                      </p>
                    </div>
                    <button
                      onClick={() => handleEliminarClase(c.id)}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ backgroundColor: '#fce8e8', color: '#e05555' }}
                    >
                      Eliminar
                    </button>
                  </div>
                ))
              }
            </div>
          </div>
        )}

        {/* ─── SECCIÓN HORARIOS ─── */}
        {seccion === 'horarios' && (
          <div className="rounded-2xl p-6 mt-4" style={{ backgroundColor: '#f0f7ff' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2c4a5a' }}>
              Nuevo horario
            </h2>
            <form onSubmit={handleCrearHorario} className="flex flex-col gap-3">
              <select
                value={formHorario.clase_id}
                onChange={e => setFormHorario({...formHorario, clase_id: e.target.value})}
                className="border rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle} required
              >
                <option value="">Seleccioná una clase</option>
                {clases.map(c => (
                  <option key={c.id} value={c.id}>{c.nombre} ({c.rama})</option>
                ))}
              </select>
              <select
                value={formHorario.dia_semana}
                onChange={e => setFormHorario({...formHorario, dia_semana: e.target.value})}
                className="border rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle}
              >
                {DIAS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
              <div className="flex gap-3">
                <input
                  type="time"
                  value={formHorario.hora_inicio}
                  onChange={e => setFormHorario({...formHorario, hora_inicio: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none flex-1"
                  style={inputStyle} required
                />
                <input
                  type="time"
                  value={formHorario.hora_fin}
                  onChange={e => setFormHorario({...formHorario, hora_fin: e.target.value})}
                  className="border rounded-lg px-4 py-2 text-sm outline-none flex-1"
                  style={inputStyle} required
                />
              </div>
              <input
                type="number"
                placeholder="Cupos disponibles"
                value={formHorario.cupos_totales}
                onChange={e => setFormHorario({...formHorario, cupos_totales: e.target.value})}
                className="border rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle} required
              />
              <input
                type="number"
                placeholder="Precio ($)"
                value={formHorario.precio}
                onChange={e => setFormHorario({...formHorario, precio: e.target.value})}
                className="border rounded-lg px-4 py-2 text-sm outline-none"
                style={inputStyle} required
              />
              <button
                type="submit" disabled={loading}
                className="py-2 rounded-lg font-semibold text-sm"
                style={btnPrimario}
              >
                {loading ? 'Creando...' : 'Crear horario'}
              </button>
            </form>
          </div>
        )}

        {/* ─── SECCIÓN USUARIOS ─── */}
        {seccion === 'usuarios' && (
          <div className="rounded-2xl p-6 mt-4" style={{ backgroundColor: '#f0f7ff' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2c4a5a' }}>
              Usuarios registrados
            </h2>
            {usuarios.map(u => (
              <div key={u.id}
                className="flex items-center justify-between border-b py-3"
                style={{ borderColor: '#87CEEB' }}
              >
                <div>
                  <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>{u.nombre}</p>
                  <p className="text-xs" style={{ color: '#778899' }}>
                    DNI: {u.dni} · {u.email}
                  </p>
                </div>
                <select
                  value={u.rol}
                  onChange={e => handleCambiarRol(u.id, e.target.value)}
                  className="border rounded-lg px-2 py-1 text-xs outline-none"
                  style={inputStyle}
                >
                  <option value="alumno">Alumno</option>
                  <option value="profesor">Profesor</option>
                  <option value="profesional">Profesional</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
            ))}
          </div>
        )}

        {/* ─── SECCIÓN RESERVAS ─── */}
        {seccion === 'reservas' && (
          <div className="rounded-2xl p-6 mt-4" style={{ backgroundColor: '#f0f7ff' }}>
            <h2 className="text-lg font-bold mb-4" style={{ color: '#2c4a5a' }}>
              Reservas y pagos
            </h2>
            {reservas.length === 0
              ? <p className="text-sm" style={{ color: '#778899' }}>No hay reservas aún.</p>
              : reservas.map(r => (
                <div key={r.id}
                  className="flex items-center justify-between border-b py-3"
                  style={{ borderColor: '#87CEEB' }}
                >
                  <div>
                    <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>
                      {r.alumno} — {r.clase}
                    </p>
                    <p className="text-xs" style={{ color: '#778899' }}>
                      DNI: {r.dni} · {r.dia_semana} {r.hora_inicio} · ${r.total}
                    </p>
                    <p className="text-xs" style={{ color: '#778899' }}>
                      Pago: {r.metodo || 'sin método'} · Estado: {r.estado_pago || r.estado}
                    </p>
                  </div>
                  {r.estado !== 'pagado' && r.metodo === 'efectivo' && (
                    <button
                      onClick={() => handleConfirmarPago(r.id)}
                      className="text-xs px-3 py-1 rounded-lg"
                      style={{ backgroundColor: '#e8f5e9', color: '#2d8a4e' }}
                    >
                      Confirmar pago
                    </button>
                  )}
                </div>
              ))
            }
          </div>
        )}

      </div>
    </div>
  )
}