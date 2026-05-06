import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'

export default function RutaProtegida({ children, roles }) {
  const { usuario } = useAuth()

  // Si no está logueado lo mandamos al login
  if (!usuario) {
    return <Navigate to="/" replace />
  }

  // Si la ruta requiere un rol específico y el usuario no lo tiene
  // lo redirigimos según su rol
  if (roles && !roles.includes(usuario.rol)) {
    if (usuario.rol === 'admin') return <Navigate to="/panel-gym" replace />
    if (usuario.rol === 'profesor') return <Navigate to="/mis-clases" replace />
    return <Navigate to="/horarios" replace />
  }

  return children
}