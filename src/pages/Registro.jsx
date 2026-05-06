import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../services/authService'
import { useAuth } from '../context/AuthContext'

function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [dni, setDni] = useState('')
  const [telefono, setTelefono] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const navigate = useNavigate()
  const { guardarSesion } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!nombre || !email || !password || !confirmar) {
      setError('Completá todos los campos')
      return
    }
    

    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres')
      return
    }

    if (password !== confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    
    if (!/^\d{10,15}$/.test(telefono)) {
  setError('El teléfono debe tener entre 10 y 15 números')
  return
}

    if (!/^\d{7,8}$/.test(dni)) {
    setError('El DNI debe tener 7 u 8 números')
    return
    }


    setError('')
    setLoading(true)

    try {
      const data = await registrarUsuario(nombre, email, password, dni)

      // Después del registro guardamos la sesión directo
      guardarSesion(data.token, data.usuario)
      navigate('/horarios')

    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrarse')
    } finally {
      setLoading(false)
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
            Creá tu cuenta
          </p>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              Nombre completo
            </label>
            <input
              type="text"
              placeholder="Juan Pérez"
              value={nombre}
              onChange={(e) => setNombre(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
            />
          </div>
          
          <div className="flex flex-col gap-1">
          <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
          DNI
          </label>
      <input
    type="text"
    placeholder="12345678"
    value={dni}
    onChange={(e) => setDni(e.target.value)}
    className="rounded-lg px-4 py-2 text-sm outline-none border"
    style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
  />
</div>

<div className="flex flex-col gap-1">
  <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
    Teléfono
  </label>
  <input
    type="tel"
    placeholder="Ej: 3512345678"
    value={telefono}
    onChange={(e) => setTelefono(e.target.value)}
    className="rounded-lg px-4 py-2 text-sm outline-none border"
    style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
  />
</div>

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
              placeholder="Mínimo 6 caracteres"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="rounded-lg px-4 py-2 text-sm outline-none border"
              style={{ borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }}
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              Confirmar contraseña
            </label>
            <input
              type="password"
              placeholder="Repetí tu contraseña"
              value={confirmar}
              onChange={(e) => setConfirmar(e.target.value)}
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
            {loading ? 'Registrando...' : 'Crear cuenta'}
          </button>
        </form>

        <p className="text-center text-sm mt-6" style={{ color: '#778899' }}>
          ¿Ya tenés cuenta?{' '}
          <span
            className="cursor-pointer hover:underline font-medium"
            style={{ color: '#87CEEB' }}
            onClick={() => navigate('/')}
          >
            Iniciá sesión
          </span>
        </p>
      </div>
    </div>
  )
}

export default Registro