import { useNavigate, useLocation } from 'react-router-dom'
import { useEffect, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { obtenerMisReservas } from '../services/clasesService'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import {
  IconoPesa, IconoRutina, IconoPago, IconoPerfil, IconoSalir, IconoWhatsapp
} from './Iconos'

// Número de contacto del gimnasio. Se puede cambiar sin tocar el código
// definiendo VITE_WHATSAPP en el archivo de entorno.
const WHATSAPP_NUMERO  = import.meta.env.VITE_WHATSAPP || '5493512345678'
const WHATSAPP_MENSAJE = 'Hola! Te contacto desde la app del gimnasio.'

const BOTONES = [
  { ruta: '/horarios', Icono: IconoPesa,   texto: 'Clases'  },
  { ruta: '/rutinas',  Icono: IconoRutina, texto: 'Rutinas' },
  { ruta: '/reservas', Icono: IconoPago,   texto: 'Pagos'   },
  { ruta: '/perfil',   Icono: IconoPerfil, texto: 'Perfil'  }
]

/**
 * Barra inferior de navegación + botón de contacto.
 *
 * `hayBarraAccion` avisa que la pantalla tiene una barra de acción flotante
 * encima (por ejemplo el resumen de reserva). Cuando eso pasa, el botón de
 * WhatsApp sube para no quedar encima del botón principal: antes se
 * superponían y el de WhatsApp se comía el toque, dejando al alumno sin
 * poder reservar.
 */
export default function NavBar({ hayBarraAccion = false }) {
  const navigate = useNavigate()
  const location = useLocation()
  const { cerrarSesion } = useAuth()
  const { confirmar, exito, info } = useAvisos()
  const [pendientes, setPendientes] = useState(0)

  const esActiva = (ruta) => location.pathname === ruta

  const cargarPendientes = useCallback(async () => {
    try {
      if (!localStorage.getItem('token')) return
      const reservas = await obtenerMisReservas()
      setPendientes(reservas.filter(r => r.estado === 'pendiente' && !r.metodo).length)
    } catch {
      // Silencioso: es un contador secundario, no vale interrumpir al usuario
    }
  }, [])

  useEffect(() => {
    cargarPendientes()

    const socket = io(import.meta.env.VITE_SOCKET_URL)

    socket.on('pago_confirmado', () => {
      cargarPendientes()
      exito('Tu pago fue confirmado por el gimnasio')
    })
    socket.on('reserva_cancelada', () => {
      cargarPendientes()
      info('Una de tus reservas fue cancelada')
    })
    socket.on('actualizacion_horarios', cargarPendientes)

    return () => socket.disconnect()
  }, [cargarPendientes, exito, info])

  const salir = async () => {
    const confirmado = await confirmar({
      titulo: '¿Cerrar sesión?',
      mensaje: 'Vas a tener que ingresar tus datos de nuevo para volver a entrar.',
      textoConfirmar: 'Cerrar sesión'
    })
    if (confirmado) {
      cerrarSesion()
      navigate('/')
    }
  }

  return (
    <>
      {/* Contacto por WhatsApp. z-30 lo deja por DEBAJO de las barras de
          acción (z-40), que es lo que evita el bloqueo de toques. */}
      <a
        href={`https://wa.me/${WHATSAPP_NUMERO}?text=${encodeURIComponent(WHATSAPP_MENSAJE)}`}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Contactar al gimnasio por WhatsApp"
        className="fixed right-4 z-30 flex h-12 w-12 items-center justify-center rounded-full shadow-lg transition-transform active:scale-95"
        style={{
          backgroundColor: '#25a35a',
          color: '#ffffff',
          bottom: hayBarraAccion
            ? 'calc(var(--alto-nav) + 5.5rem)'
            : 'calc(var(--alto-nav) + 0.75rem)'
        }}
      >
        <IconoWhatsapp size={24} />
      </a>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40"
        style={{
          backgroundColor: 'var(--color-superficie)',
          borderTop: '1px solid var(--color-linea-sutil)',
          paddingBottom: 'env(safe-area-inset-bottom)'
        }}
      >
        <div className="mx-auto flex max-w-md items-stretch justify-around px-1 py-1.5">
          {BOTONES.map(({ ruta, Icono, texto }) => {
            const activa = esActiva(ruta)
            return (
              <button
                key={ruta}
                onClick={() => navigate(ruta)}
                aria-current={activa ? 'page' : undefined}
                className="relative flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
                style={{ color: activa ? 'var(--color-acento)' : 'var(--color-texto-3)' }}
              >
                <span className="relative">
                  <Icono size={21} />
                  {ruta === '/reservas' && pendientes > 0 && (
                    <span
                      className="absolute -right-2 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full px-1 text-[10px] font-bold"
                      style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
                    >
                      {pendientes}
                    </span>
                  )}
                </span>
                <span className="text-[10.5px] font-semibold leading-none">{texto}</span>
                {activa && (
                  <span
                    className="absolute -top-px h-0.5 w-7 rounded-full"
                    style={{ backgroundColor: 'var(--color-acento)' }}
                  />
                )}
              </button>
            )
          })}

          <button
            onClick={salir}
            className="flex flex-1 flex-col items-center gap-1 rounded-xl px-1 py-1.5 transition-colors"
            style={{ color: 'var(--color-texto-3)' }}
          >
            <IconoSalir size={21} />
            <span className="text-[10.5px] font-semibold leading-none">Salir</span>
          </button>
        </div>
      </nav>
    </>
  )
}
