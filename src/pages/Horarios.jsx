import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerHorarios, crearReserva } from '../services/clasesService'

const RAMAS = ['todos', 'gimnasio', 'disciplina', 'profesional']
const DIAS  = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Horarios() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [horarios, setHorarios]       = useState([])
  const [seleccion, setSeleccion]     = useState([]) // horarios elegidos
  const [ramaFiltro, setRamaFiltro]   = useState('todos')
  const [diaFiltro, setDiaFiltro]     = useState('todos')
  const [tipo, setTipo]               = useState('semanal')
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')
  const [exito, setExito]             = useState('')
  const [verResumen, setVerResumen]   = useState(false)

  useEffect(() => {
    if (!usuario) navigate('/')
    cargarHorarios()
  }, [])

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
      setVerResumen(false)
      await cargarHorarios()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al crear la reserva')
    } finally {
      setLoading(false)
    }
  }

  const inputStyle = { borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }

  return (
    <div className="min-h-screen pb-32" style={{ backgroundColor: '#778899' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#2c4a5a' }}>
        <h1 className="text-lg font-bold text-white">💪 GymApp</h1>
        <div className="flex items-center gap-3">
          <span className="text-sm" style={{ color: '#87CEEB' }}>
            {usuario?.nombre}
          </span>
          <button
            onClick={() => navigate('/reservas')}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
          >
            Mis reservas
          </button>
          <button
            onClick={() => { cerrarSesion(); navigate('/') }}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#f0f7ff', color: '#778899' }}
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
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#f0f7ff' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#2c4a5a' }}>
            Tipo de reserva
          </p>
          <div className="flex gap-2">
            {['semanal', 'quincenal'].map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="flex-1 py-2 rounded-lg text-sm font-medium capitalize"
                style={tipo === t
                  ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
                  : { backgroundColor: '#e8f0f7', color: '#778899' }
                }
              >
                {t}
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="rounded-2xl p-4 mb-4" style={{ backgroundColor: '#f0f7ff' }}>
          <p className="text-sm font-medium mb-2" style={{ color: '#2c4a5a' }}>
            Filtrar por
          </p>
          <div className="flex gap-2 flex-wrap mb-2">
            {RAMAS.map(r => (
              <button
                key={r}
                onClick={() => setRamaFiltro(r)}
                className="px-3 py-1 rounded-lg text-xs capitalize"
                style={ramaFiltro === r
                  ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
                  : { backgroundColor: '#e8f0f7', color: '#778899' }
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
                ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
                : { backgroundColor: '#e8f0f7', color: '#778899' }
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
                  ? { backgroundColor: '#87CEEB', color: '#1a3a4a' }
                  : { backgroundColor: '#e8f0f7', color: '#778899' }
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
              <div className="rounded-2xl p-6 text-center" style={{ backgroundColor: '#f0f7ff' }}>
                <p className="text-sm" style={{ color: '#778899' }}>
                  No hay clases disponibles con ese filtro.
                </p>
              </div>
            )
            : horariosFiltrados.map(h => (
              <div
                key={h.id}
                onClick={() => h.cupos_disponibles > 0 && toggleSeleccion(h)}
                className="rounded-2xl p-4 cursor-pointer transition-all"
                style={{
                  backgroundColor: estaSeleccionado(h.id) ? '#87CEEB' : '#f0f7ff',
                  opacity: h.cupos_disponibles === 0 ? 0.5 : 1,
                  cursor: h.cupos_disponibles === 0 ? 'not-allowed' : 'pointer'
                }}
              >
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span
                        className="text-xs px-2 py-0.5 rounded-full font-medium capitalize"
                        style={{
                          backgroundColor: estaSeleccionado(h.id) ? '#2c4a5a' : '#87CEEB',
                          color: estaSeleccionado(h.id) ? '#87CEEB' : '#1a3a4a'
                        }}
                      >
                        {h.rama}
                      </span>
                      {h.cupos_disponibles === 0 && (
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={{ backgroundColor: '#fce8e8', color: '#e05555' }}>
                          Sin cupos
                        </span>
                      )}
                    </div>
                    <p className="font-semibold text-sm" style={{ color: estaSeleccionado(h.id) ? '#1a3a4a' : '#2c4a5a' }}>
                      {h.clase}
                    </p>
                    <p className="text-xs mt-0.5" style={{ color: estaSeleccionado(h.id) ? '#2c4a5a' : '#778899' }}>
                      {h.dia_semana} · {h.hora_inicio.slice(0,5)} - {h.hora_fin.slice(0,5)}
                    </p>
                    {h.profesor && (
                      <p className="text-xs" style={{ color: estaSeleccionado(h.id) ? '#2c4a5a' : '#778899' }}>
                        Prof. {h.profesor}
                      </p>
                    )}
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-sm" style={{ color: estaSeleccionado(h.id) ? '#1a3a4a' : '#2c4a5a' }}>
                      ${parseFloat(h.precio).toFixed(2)}
                    </p>
                    <p className="text-xs" style={{ color: estaSeleccionado(h.id) ? '#2c4a5a' : '#778899' }}>
                      {h.cupos_disponibles}/{h.cupos_totales} cupos
                    </p>
                  </div>
                </div>
              </div>
            ))
          }
        </div>
      </div>

      {/* Barra inferior de resumen flotante */}
      {seleccion.length > 0 && (
        <div
          className="fixed bottom-0 left-0 right-0 px-4 py-4"
          style={{ backgroundColor: '#2c4a5a' }}
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

    </div>
  )
}