import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState } from 'react'
import { obtenerMisReservas } from '../services/clasesService'
import { io } from 'socket.io-client'

const WHATSAPP_NUMERO  = '5493512345678'
const WHATSAPP_MENSAJE = 'Hola! Te contacto desde la app del gimnasio.'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()
  const [pendientes, setPendientes] = useState(0)
  const [notificacion, setNotificacion] = useState('')

  const activo = (ruta) => location.pathname === ruta

  useEffect(() => {
    cargarPendientes()

    const socket = io(import.meta.env.VITE_SOCKET_URL)

    socket.on('pago_confirmado', () => {
      cargarPendientes()
      mostrarNotificacion('✅ Tu pago fue confirmado por el gimnasio')
    })

    socket.on('reserva_cancelada', () => {
      cargarPendientes()
      mostrarNotificacion('❌ Una de tus reservas fue cancelada')
    })

    socket.on('actualizacion_horarios', () => {
      cargarPendientes()
    })

    return () => socket.disconnect()
  }, [])

  const cargarPendientes = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) return
      const reservas = await obtenerMisReservas()
      const sinPagar = reservas.filter(r => r.estado === 'pendiente' && !r.metodo)
      setPendientes(sinPagar.length)
    } catch {
      // silencioso
    }
  }

  const mostrarNotificacion = (mensaje) => {
    setNotificacion(mensaje)
    setTimeout(() => setNotificacion(''), 4000)
  }

  const botones = [
    { ruta: '/horarios', icono: '🏋️', label: 'Inicio'  },
    { ruta: '/rutinas',  icono: '💪',  label: 'Rutinas' },
    { ruta: '/reservas', icono: '💳',  label: 'Pagos'   },
    { ruta: '/perfil',   icono: '👤',  label: 'Perfil'  },
  ]

  return (
    <>
      {/* Notificación flotante */}
      {notificacion && (
        <div
          className="fixed top-4 left-4 right-4 z-50 px-4 py-3 rounded-2xl shadow-lg text-sm font-medium text-center transition-all"
          style={{ backgroundColor: '#2c4a5a', color: '#ffffff' }}
        >
          {notificacion}
        </div>
      )}

      
        <a href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
        style={{ backgroundColor: '#227942', bottom: '80px' }}
      >
        <span className="text-2xl">📱</span>
      </a>

      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2"
        style={{ backgroundColor: '#25272e', borderTop: '1px solid #131516' }}
      >
        {botones.map(b => (
          <button
            key={b.ruta}
            onClick={() => navigate(b.ruta)}
            className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all relative"
            style={activo(b.ruta) ? { backgroundColor: '#87CEEB20' } : {}}
          >
            <span className="text-xl">{b.icono}</span>

            {/* Badge de pendientes solo en el botón Pagos */}
            {b.ruta === '/reservas' && pendientes > 0 && (
              <div
                className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: '#e05555', color: '#ffffff' }}
              >
                {pendientes}
              </div>
            )}

            <span
              className="text-xs font-medium"
              style={{ color: activo(b.ruta) ? '#87CEEB' : '#8ba8b8' }}
            >
              {b.label}
            </span>
          </button>
        ))}
      </div>
    </>
  )
}