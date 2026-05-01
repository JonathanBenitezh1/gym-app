import { createContext, useContext, useState } from 'react'

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