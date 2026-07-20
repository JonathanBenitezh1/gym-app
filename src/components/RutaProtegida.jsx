import { useAuth } from '../context/AuthContext'
import { Navigate } from 'react-router-dom'
import CambioObligatorio from './CambioObligatorio'

/** Pantalla de inicio de cada rol, después de iniciar sesión. */
export const INICIO_POR_ROL = {
  alumno:      '/horarios',
  profesor:    '/mis-clases',
  profesional: '/mis-clases',
  admin:       '/panel-gym'
}

export function inicioDe(rol) {
  return INICIO_POR_ROL[rol] || null
}

export default function RutaProtegida({ children, roles }) {
  const { usuario, cerrarSesion } = useAuth()

  // Sin sesión, al login
  if (!usuario) {
    return <Navigate to="/" replace />
  }

  // Contraseña restablecida por el gimnasio: nada más se puede usar hasta
  // que elija una propia.
  if (usuario.debe_cambiar_password) {
    return <CambioObligatorio />
  }

  const destino = inicioDe(usuario.rol)

  // Un rol que no conocemos no tiene a dónde ir. Antes esto provocaba
  // un ciclo de redirecciones y la app quedaba en blanco, sin explicación.
  if (!destino) {
    return (
      <div className="flex min-h-screen items-center justify-center p-6">
        <div className="tarjeta w-full max-w-sm p-6 text-center">
          <p className="font-semibold">Tu cuenta no tiene un perfil asignado</p>
          <p className="mt-2 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Pedile al administrador del gimnasio que revise tu tipo de usuario
            para poder ingresar.
          </p>
          <button
            className="btn btn-contorno btn-bloque mt-5"
            onClick={cerrarSesion}
          >
            Cerrar sesión
          </button>
        </div>
      </div>
    )
  }

  // Si la ruta pide un rol que no tiene, lo mandamos a su propia pantalla
  if (roles && !roles.includes(usuario.rol)) {
    return <Navigate to={destino} replace />
  }

  return children
}
