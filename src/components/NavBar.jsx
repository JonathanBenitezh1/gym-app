import { useNavigate, useLocation } from 'react-router-dom'

const WHATSAPP_NUMERO  = '5493512345678'
const WHATSAPP_MENSAJE = 'Hola! Te contacto desde la app del gimnasio.'

export default function NavBar() {
  const navigate = useNavigate()
  const location = useLocation()

  const activo = (ruta) => location.pathname === ruta

  const botones = [
    { ruta: '/horarios', icono: '🏋️', label: 'Inicio'  },
    { ruta: '/rutinas',  icono: '💪',  label: 'Rutinas' },
    { ruta: '/reservas', icono: '💳',  label: 'Pagos'   },
    { ruta: '/perfil',   icono: '👤',  label: 'Perfil'  },
  ]

  return (
    <>
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
        target="_blank"
        rel="noopener noreferrer"
        className="fixed right-4 flex items-center justify-center w-12 h-12 rounded-full shadow-lg"
        style={{ backgroundColor: '#25D366', bottom: '80px' }}
      >
        <span className="text-2xl">📱</span>
      </a>

      <div
        className="fixed bottom-0 left-0 right-0 flex items-center justify-around px-2 py-2"
        style={{ backgroundColor: '#2c4a5a', borderTop: '1px solid #3d6070' }}
      >
        {botones.map(b => (
          <button
            key={b.ruta}
            onClick={() => navigate(b.ruta)}
            className="flex flex-col items-center gap-0.5 px-4 py-1 rounded-xl transition-all"
            style={activo(b.ruta) ? { backgroundColor: '#87CEEB20' } : {}}
          >
            <span className="text-xl">{b.icono}</span>
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