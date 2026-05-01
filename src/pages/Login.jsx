import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUsuario } from '../services/authService'
import { useAuth } from '../context/AuthContext'

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
      // Llamada real al backend
      const data = await loginUsuario(email, password)

      // Guardamos el token y los datos del usuario
      guardarSesion(data.token, data.usuario)

      // Redirigimos según el rol
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
      if (data.usuario.rol === 'profesor') {
      navigate('/mis-clases')
    }
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#778899' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8"
        style={{ backgroundColor: '#f0f7ff' }}
      >
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold" style={{ color: '#2c4a5a' }}>
            💪 GymApp
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#778899' }}>
            Ingresá a tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              Email
            </label>
            <input
              type="email"
              placeholder="tu@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
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
            className="font-semibold py-2 rounded-lg transition-opacity"
            style={{
              backgroundColor: loading ? '#b0d8ed' : '#87CEEB',
              color: '#1a3a4a'
            }}
          >
            {loading ? 'Ingresando...' : 'Ingresar'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#778899' }}>
          ¿No tenés cuenta?{' '}
          <span
            className="cursor-pointer hover:underline font-medium"
            style={{ color: '#87CEEB' }}
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