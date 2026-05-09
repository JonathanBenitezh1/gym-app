import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUsuario } from '../services/authService'
import { useAuth } from '../context/AuthContext'

// 1. IMPORTA TU LOGO AQUÍ (Ajusta la ruta y el nombre del archivo)
import logoDtc from '../pages/img/logo_png.png' 

function Login() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { guardarSesion } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!email || !password) {
      setError('Completá todos los campos')
      return
    }

    setError('')
    setLoading(true)

    try {
      const data = await loginUsuario(email, password)
      guardarSesion(data.token, data.usuario)

      // Redirección por roles
      if (data.usuario.rol === 'admin') {
        navigate('/panel-gym')
      } else if (data.usuario.rol === 'profesor') {
        navigate('/mis-clases')
      } else {
        navigate('/horarios')
      }

    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión')
    } finally {
      setLoading(false)
    }
    // Nota: Eliminé el bloque duplicado que tenías aquí afuera para evitar errores
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#202123' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8"
        style={{ borderColor: '#121213', backgroundColor: '#31363c', borderWidth: '1px' }}
      >
        <div className="text-center mb-8">
          {/* Logo con el archivo importado */}
          <img 
            src={logoDtc} 
            alt="DTC Fight & Fitness Logo" 
            className="mx-auto h-32 w-auto mb-2" // Subí un poco el tamaño a h-32 para que se luzca el detalle
            style={{ display: 'block', filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.3))' }} 
          />
          <p className="text-sm" style={{color: '#dce2e7' }}>
            Ingresá a tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#dce2e7' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#121213', color: '#2c4a5a', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#dce2e7' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#121213', color: '#2c4a5a', backgroundColor: '#ffffff' }}
            />
          </div>

          {error && (
            <p className="text-sm text-center" style={{ color: '#e05555' }}>
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="font-semibold py-2 rounded-lg transition-all hover:opacity-90"
            style={{
              backgroundColor: loading ? '#b0d8ed' : '#161717',
              color: '#d6dde0'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#778899' }}>
          ¿No tenés cuenta?{' '}
          <span
            className="cursor-pointer hover:underline font-medium"
            style={{ color: '#dce2e7' }}
            onClick={() => navigate('/registro')}
          >
            Registrate
          </span>
        </p>
      </div>
    </div>
  )
}

export default Login