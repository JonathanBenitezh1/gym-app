import { createContext, useContext, useState } from 'react'
import socket from '../services/socket'
import { borrarDatosDeLaPuerta } from '../utils/puertaLocal'

// La versión anterior de la app instalable guardaba las respuestas de la API
// en esta caché, y lo guardado queda en el teléfono aunque la versión nueva ya
// no la use. Se borra al abrir la app y también al cerrar sesión.
const CACHE_API_VIEJA = 'api-cache'

function borrarCacheApiVieja() {
  if (typeof caches === 'undefined') return
  caches.delete(CACHE_API_VIEJA).catch(() => {})
}

borrarCacheApiVieja()

// Creamos el contexto
const AuthContext = createContext()

// Este componente envuelve toda la app y provee el estado de auth
export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(
    // Si ya había un usuario guardado en localStorage, lo recuperamos
    JSON.parse(localStorage.getItem('usuario')) || null
  )

  const guardarSesion = (token, nuevo) => {
    const tokenCambio = localStorage.getItem('token') !== token
    // Guardamos en localStorage para que persista al recargar
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(nuevo))
    // Al cambiar la contraseña el servidor corta el tiempo real de ese
    // usuario y el token viejo deja de valer: la conexión se rehace con el
    // nuevo, que el socket lee de localStorage.
    if (tokenCambio && usuario) {
      socket.disconnect()
      socket.connect()
    }
    setUsuario(nuevo)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    borrarCacheApiVieja()
    // La lista de socios y las fotos de la puerta se borran salga desde donde
    // salga: antes solo desde el botón de la puerta, y un admin que la usaba
    // y cerraba sesión desde el panel dejaba DNI, nombres y fotos guardados.
    borrarDatosDeLaPuerta()
    // Cortamos la conexión de tiempo real: al salir ya no hace falta,
    // y así no queda abierta contra el servidor.
    socket.disconnect()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, guardarSesion, cerrarSesion }}>
      {children}
    </AuthContext.Provider>
  )
}

// Hook para usar el contexto fácilmente desde cualquier componente
export function useAuth() {
  return useContext(AuthContext)
}