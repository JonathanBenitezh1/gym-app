import { useState } from 'react'
import { useNavigate } from 'react-router-dom'

function Registro() {
  const [nombre, setNombre] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmar, setConfirmar] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  // useNavigate nos permite cambiar de pantalla por código
  // Por ejemplo: navigate('/horarios') lleva al usuario a esa ruta
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validaciones
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

    setError('')
    setLoading(true)

    // Por ahora simulamos el registro
    // Acá después va la llamada al backend
    console.log('Registrando usuario:', { nombre, email, password })

    await new Promise(resolve => setTimeout(resolve, 1000))

    setLoading(false)

    // Después del registro exitoso redirigimos al login
    alert('¡Registro exitoso! Ahora podés iniciar sesión.')
    navigate('/')
  }

  return (
    <div
      className="min-h-screen flex items-center justify-center px-4"
      style={{ backgroundColor: '#02020eef' }}
    >
      <div
        className="w-full max-w-sm rounded-2xl shadow-lg p-8"
        style={{ backgroundColor: '#f0f7ff' }}
      >

        {/* Título */}
        <div className="text-center mb-8">
          <h1
            className="text-3xl font-bold"
            style={{ color: '#2c4a5a' }}
          >
            💪Destribat Training Center
          </h1>
          <p className="mt-1 text-sm" style={{ color: '#778899' }}>
            Creá tu cuenta
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="flex flex-col gap-4">

          {/* Nombre */}
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

          {/* Email */}
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

          {/* Contraseña */}
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

          {/* Confirmar contraseña */}
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

          {/* Error */}
          {error && (
            <p className="text-sm text-center" style={{ color: '#e05555' }}>
              {error}
            </p>
          )}

          {/* Botón */}
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

        {/* Volver al login */}
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