import { createContext, useContext, useState } from 'react'
import socket from '../services/socket'

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

  const guardarSesion = (token, usuario) => {
    // Guardamos en localStorage para que persista al recargar
    localStorage.setItem('token', token)
    localStorage.setItem('usuario', JSON.stringify(usuario))
    setUsuario(usuario)
  }

  const cerrarSesion = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('usuario')
    borrarCacheApiVieja()
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