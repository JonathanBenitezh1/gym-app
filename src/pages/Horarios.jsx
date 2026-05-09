import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerHorarios, crearReserva,obtenerHorariosReservados } from '../services/clasesService'
import NavBar from '../components/NavBar'
import logoDtc from './img/logo_png.png'

const RAMAS = ['todos', 'Gimnasio', 'Disciplina', 'Profesional']
const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Horarios() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()
  const socketRef = useRef(null)

  const [horarios, setHorarios]       = useState([])
  const [seleccion, setSeleccion]     = useState([]) // horarios elegidos
  const [ramaFiltro, setRamaFiltro]   = useState('todos')
  const [diaFiltro, setDiaFiltro]     = useState('todos')
  const [tipo, setTipo]               = useState('semanal')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState('')
  const [verResumen, setVerResumen]   = useState(false)
  const [yaReservados, setYaReservados] = useState([])
  

useEffect(() => {
  if (!usuario) navigate('/')
  cargarHorarios()
  cargarReservados()
}, [])

useEffect(() => {
  const socket = io(import.meta.env.VITE_SOCKET_URL)

  socket.on('connect', () => {
    console.log('Socket conectado en Horarios')
  })

 socket.on('actualizacion_horarios', () => {
  console.log('Actualizacion horarios recibida')
  obtenerHorarios().then(data => setHorarios(data))
  obtenerHorariosReservados().then(data => setYaReservados(data))
})

  socket.on('reserva_cancelada', () => {
    console.log('Reserva cancelada recibida')
    obtenerHorarios().then(data => setHorarios(data))
    obtenerHorariosReservados().then(data => setYaReservados(data))
  })

  return () => {
    socket.disconnect()
  }
}, [])

const cargarReservados = async () => {
  try {
    const data = await obtenerHorariosReservados()
    setYaReservados(data)
  } catch {
    console.error('Error al cargar horarios reservados')
  }
}
const cargarHorarios = async () => {
  try {
    const data = await obtenerHorarios()
    setHorarios(data)
  } catch {
    setError('Error al cargar los horarios')
  }
}
  // Filtrar horarios según rama y día
  const horariosFiltrados = horarios.filter(h => {
    const porRama = ramaFiltro === 'todos' || h.rama === ramaFiltro
    const porDia  = diaFiltro  === 'todos' || h.dia_semana === diaFiltro
    return porRama && porDia
  })

  // Agregar o quitar un horario de la selección
  const toggleSeleccion = (horario) => {
    const yaEsta = seleccion.find(s => s.id === horario.id)
    if (yaEsta) {
      setSeleccion(seleccion.filter(s => s.id !== horario.id))
    } else {
      setSeleccion([...seleccion, horario])
    }
  }
  const estaReservado = (id) => yaReservados.includes(id)
  const estaSeleccionado = (id) => seleccion.some(s => s.id === id)

  // Calcular total
  const calcularTotal = () => {
    const subtotal = seleccion.reduce((acc, h) => acc + parseFloat(h.precio), 0)
    return tipo === 'quincenal' ? subtotal * 2 : subtotal
  }

  // Calcular fechas según tipo
  const calcularFechas = () => {
    const hoy = new Date()
    const inicio = hoy.toISOString().split('T')[0]
    const fin = new Date(hoy)
    fin.setDate(fin.getDate() + (tipo === 'quincenal' ? 14 : 7))
    return { fecha_inicio: inicio, fecha_fin: fin.toISOString().split('T')[0] }
  }

  const handleReservar = async () => {
  if (seleccion.length === 0) {
    setError('Seleccioná al menos una clase')
    return
  }

  setLoading(true)
  setError('')

  try {
    const { fecha_inicio, fecha_fin } = calcularFechas()
    await crearReserva({
      horarios_ids: seleccion.map(s => s.id),
      tipo,
      fecha_inicio,
      fecha_fin
    })
    setExito('¡Reserva creada! Ahora podés proceder al pago.')
    setSeleccion([])
    await cargarHorarios()
    await cargarReservados() // ← actualizamos los reservados
  } catch (err) {
    setError(err.response?.data?.error || 'Error al crear la reserva')
  } finally {
    setLoading(false)
  }
}

  const inputStyle = { borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#202123' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#25272e' }}>
        <img src={logoDtc} alt="Logo" className="h-8 w-auto" />
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#e0e9ec' }}>
            {usuario?.nombre}
          </span>
          <button
            onClick={() => navigate('/reservas')}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#144a4e', color: '#d6dde0' }}
          >
            Mis Reservas
          </button>
          <button
            onClick={() => { cerrarSesion(); navigate('/') }}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#642828', color: '#eff1f4' }}
          >
            Salir
          </button>
        </div>
      </div>

      <div className="px-4 pt-4">

        {/* Mensajes */}
        {error && <p className="text-sm mb-3 text-center" style={{ color: '#e05555' }}>{error}</p>}
        {exito && <p className="text-sm mb-3 text-center" style={{ color: '#2d8a4e' }}>{exito}</p>}

        {/* Tipo de reserva */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#2f373f' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#e6eaed' }}>
            Tipo de reserva
          </p>
          <div className="flex gap-2">
            {['semanal', 'quincenal'].map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize"
                style={tipo === t
                 ? { backgroundColor: '#1e5761', color: '#dbe4e8' }
                  : { backgroundColor: '#6a7278', color: '#e0e2e5' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#2f373f' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#e6ebee' }}>
            Filtrar por
          </p>
          <div className="flex gap-2 flex-wrap mb-2">
            {RAMAS.map(r => (
              <button
                key={r}
                onClick={() => setRamaFiltro(r)}
                className="px-3 py-1 rounded-lg text-xs capitalize"
                style={ramaFiltro === r
                  ? { backgroundColor: '#1e5761', color: '#dbe4e8' }
                  : { backgroundColor: '#6a7278', color: '#e0e2e5' }
                }
              >
                {r}
              </button>
            ))}
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setDiaFiltro('todos')}
              className="px-3 py-1 rounded-lg text-xs"
              style={diaFiltro === 'todos'
                 ? { backgroundColor: '#1e5761', color: '#dbe4e8' }
                  : { backgroundColor: '#6a7278', color: '#e0e2e5' }
              }
            >
              Todos los días
            </button>
            {DIAS.map(d => (
              <button
                key={d}
                onClick={() => setDiaFiltro(d)}
                className="px-3 py-1 rounded-lg text-xs"
                style={diaFiltro === d
                   ? { backgroundColor: '#1e5761', color: '#dbe4e8' }
                  : { backgroundColor: '#6a7278', color: '#e0e2e5' }
                }
              >
                {d}
              </button>
            ))}
          </div>
        </div>
                {/* Lista de horarios */}
              <div className="flex flex-col gap-3">
                {horariosFiltrados.length === 0
                      ? (
              <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#2f373f' }}>
                <p className="text-sm" style={{ color: '#bec0c2' }}>
                  No hay clases disponibles con ese filtro.
                </p>
              </div>
            )
            : horariosFiltrados.map(h => {
              const reservado    = estaReservado(h.id)
              const seleccionado = estaSeleccionado(h.id)
              const sinCupos     = h.cupos_disponibles === 0

              return (
                <div
                  key={h.id}
                  onClick={() => !reservado && !sinCupos && toggleSeleccion(h)}
                  className="rounded-2xl p-4 transition-all"
                  style={{
                    backgroundColor: reservado
                      ? '#e8f5e9'
                      : seleccionado
                      ? '#87CEEB'
                      : '#f0f7ff',
                    opacity: sinCupos ? 0.5 : 1,
                    cursor: reservado || sinCupos ? 'not-allowed' : 'pointer'
                  }}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span
                          className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                          style={{
                            backgroundColor: seleccionado ? '#2c4a5a' : '#87CEEB',
                            color: seleccionado ? '#87CEEB' : '#1a3a4a'
                          }}
                        >
                          {h.rama}
                        </span>
                        {sinCupos && (
                          <span className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: '#fce8e8', color: '#e05555' }}>
                            Sin cupos
                          </span>
                        )}
                        {reservado && (
                          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={{ backgroundColor: '#2d8a4e', color: '#ffffff' }}>
                            ✓ Ya reservada
                          </span>
                        )}
                      </div>
                      <p className="font-semibold text-sm"
                        style={{ color: seleccionado ? '#1a3a4a' : '#2c4a5a' }}>
                        {h.clase}
                      </p>
                      <p className="text-xs mt-0.5"
                        style={{ color: seleccionado ? '#2c4a5a' : '#778899' }}>
                        {h.dia_semana} · {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}
                      </p>
                      {h.profesor && (
                        <p className="text-xs"
                          style={{ color: seleccionado ? '#2c4a5a' : '#778899' }}>
                          Prof. {h.profesor}
                        </p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm"
                        style={{ color: seleccionado ? '#1a3a4a' : '#2c4a5a' }}>
                        ${parseFloat(h.precio).toFixed(2)}
                      </p>
                      <p className="text-xs"
                        style={{ color: seleccionado ? '#2c4a5a' : '#778899' }}>
                        {h.cupos_disponibles}/{h.cupos_totales} cupos
                      </p>
                    </div>
                  </div>
                </div>
              )
            })
          }
        </div>
      </div>

      {/* Barra inferior de resumen flotante */}
      {seleccion.length > 0 && (
        <div
          className="fixed left-0 right-0 px-4 py-4"
          style={{ backgroundColor: '#2c4a5a', bottom: '64px' }}
        >
          <div className="flex items-center justify-between mb-2">
            <div>
              <p className="text-white text-sm font-medium">
                {seleccion.length} clase{seleccion.length > 1 ? 's' : ''} seleccionada{seleccion.length > 1 ? 's' : ''}
              </p>
              <p className="text-xs" style={{ color: '#87CEEB' }}>
                {tipo} · Total: ${calcularTotal().toFixed(2)}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setSeleccion([])}
                className="text-xs px-3 py-2 rounded-lg"
                style={{ backgroundColor: '#f0f7ff', color: '#778899' }}
              >
                Limpiar
              </button>
              <button
                onClick={handleReservar}
                disabled={loading}
                className="text-sm px-4 py-2 rounded-lg font-semibold"
                style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
              >
                {loading ? 'Reservando...' : 'Reservar'}
              </button>
            </div>
          </div>
        </div>
      )}
   <NavBar />
    </div>
  )
}