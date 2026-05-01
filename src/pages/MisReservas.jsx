import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerMisReservas, cancelarReserva } from '../services/clasesService'

export default function MisReservas() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [reservas, setReservas] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')
  const [exito, setExito]       = useState('')

  useEffect(() => {
    if (!usuario) navigate('/')
    cargarReservas()
  }, [])

  const cargarReservas = async () => {
    try {
      const data = await obtenerMisReservas()
      setReservas(data)
    } catch {
      setError('Error al cargar las reservas')
    } finally {
      setLoading(false)
    }
  }

  const handleCancelar = async (id) => {
    if (!confirm('¿Seguro que querés cancelar esta reserva?')) return
    try {
      await cancelarReserva(id)
      setExito('Reserva cancelada correctamente')
      setTimeout(() => setExito(''), 3000)
      await cargarReservas()
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cancelar')
    }
  }

  // Agrupamos las reservas por estado para mostrarlas ordenadas
  const pendientes = reservas.filter(r => r.estado === 'pendiente')
  const pagadas    = reservas.filter(r => r.estado === 'pagado')
  const canceladas = reservas.filter(r => r.estado === 'cancelado')

  const colorEstado = (estado) => {
    if (estado === 'pagado')    return { backgroundColor: '#e8f5e9', color: '#2d8a4e' }
    if (estado === 'cancelado') return { backgroundColor: '#fce8e8', color: '#e05555' }
    return { backgroundColor: '#fff8e1', color: '#b8860b' }
  }

  const CardReserva = ({ r }) => (
    <div
      className="rounded-2xl p-4 mb-3"
      style={{ backgroundColor: '#f0f7ff' }}
    >
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>
            {r.clase}
          </p>
          <p className="text-xs mt-0.5" style={{ color: '#778899' }}>
            {r.dia_semana} · {r.hora_inicio?.slice(0,5)} - {r.hora_fin?.slice(0,5)}
          </p>
          <p className="text-xs" style={{ color: '#778899' }}>
            {r.rama} · {r.tipo}
          </p>
          <p className="text-xs" style={{ color: '#778899' }}>
            {r.fecha_inicio} → {r.fecha_fin}
          </p>
        </div>
        <div className="text-right">
          <p className="font-bold text-sm" style={{ color: '#2c4a5a' }}>
            ${parseFloat(r.total).toFixed(2)}
          </p>
          <span
            className="text-xs px-2 py-0.5 rounded-full"
            style={colorEstado(r.estado)}
          >
            {r.estado}
          </span>
        </div>
      </div>

      {/* Método de pago */}
      {r.metodo && (
        <p className="text-xs mb-2" style={{ color: '#778899' }}>
          Pago: {r.metodo}
        </p>
      )}

      {/* Botón cancelar solo si está pendiente */}
      {r.estado === 'pendiente' && (
        <div className="flex gap-2 mt-2">
          <button
            onClick={() => navigate('/pagar', { state: { reserva: r } })}
            className="flex-1 py-2 rounded-lg text-xs font-semibold"
            style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
          >
            Pagar ahora
          </button>
          <button
            onClick={() => handleCancelar(r.id)}
            className="px-4 py-2 rounded-lg text-xs"
            style={{ backgroundColor: '#fce8e8', color: '#e05555' }}
          >
            Cancelar
          </button>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#778899' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#2c4a5a' }}>
        <h1 className="text-lg font-bold text-white">💪 Mis reservas</h1>
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/horarios')}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
          >
            Ver clases
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

      <div className="px-4 pt-4 pb-8">

        {/* Mensajes */}
        {error && <p className="text-sm mb-3 text-center" style={{ color: '#e05555' }}>{error}</p>}
        {exito && <p className="text-sm mb-3 text-center" style={{ color: '#2d8a4e' }}>{exito}</p>}

        {loading ? (
          <p className="text-center text-sm mt-8" style={{ color: '#f0f7ff' }}>
            Cargando reservas...
          </p>
        ) : reservas.length === 0 ? (
          <div className="rounded-2xl p-8 text-center mt-4" style={{ backgroundColor: '#f0f7ff' }}>
            <p className="text-sm font-medium mb-1" style={{ color: '#2c4a5a' }}>
              No tenés reservas todavía
            </p>
            <p className="text-xs mb-4" style={{ color: '#778899' }}>
              Explorá las clases disponibles y armá tu horario
            </p>
            <button
              onClick={() => navigate('/horarios')}
              className="px-6 py-2 rounded-lg text-sm font-semibold"
              style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
            >
              Ver clases
            </button>
          </div>
        ) : (
          <>
            {/* Pendientes de pago */}
            {pendientes.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: '#f0f7ff' }}>
                  PENDIENTES DE PAGO ({pendientes.length})
                </p>
                {pendientes.map(r => <CardReserva key={r.id} r={r} />)}
              </div>
            )}

            {/* Pagadas */}
            {pagadas.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: '#f0f7ff' }}>
                  CONFIRMADAS ({pagadas.length})
                </p>
                {pagadas.map(r => <CardReserva key={r.id} r={r} />)}
              </div>
            )}

            {/* Canceladas */}
            {canceladas.length > 0 && (
              <div className="mb-4">
                <p className="text-xs font-semibold mb-2 px-1" style={{ color: '#f0f7ff' }}>
                  CANCELADAS ({canceladas.length})
                </p>
                {canceladas.map(r => <CardReserva key={r.id} r={r} />)}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}