import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUsuario } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { inicioDe } from '../components/RutaProtegida'
import { IconoOjo, IconoOjoTachado } from '../components/Iconos'
import logoDtc from './img/logo_png.png'

export default function Login() {
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [error, setError]       = useState('')
  const [cargando, setCargando] = useState(false)

  const navigate = useNavigate()
  const { guardarSesion } = useAuth()

  const enviar = async (e) => {
    e.preventDefault()

    if (!email.trim() || !password) {
      setError('Completá tu email y tu contraseña')
      return
    }

    setError('')
    setCargando(true)

    try {
      const datos = await loginUsuario(email.trim(), password)
      guardarSesion(datos.token, datos.usuario)
      navigate(inicioDe(datos.usuario.rol) || '/horarios', { replace: true })
    } catch (err) {
      setError(
        err.response?.data?.error ||
        (err.response ? 'No pudimos iniciar sesión' : 'No pudimos conectar con el gimnasio. Revisá tu conexión.')
      )
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        <div className="mb-8 text-center">
          <img
            src={logoDtc}
            alt="DTC Fight & Fitness"
            className="mx-auto mb-4 h-28 w-auto"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.45))' }}
          />
          <h1 className="text-xl font-bold tracking-tight">Bienvenido de nuevo</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Ingresá para reservar tus clases
          </p>
        </div>

        <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 p-6" noValidate>
          <div>
            <label htmlFor="email" className="etiqueta-campo">Email</label>
            <input
              id="email"
              type="email"
              inputMode="email"
              autoComplete="email"
              placeholder="tu@email.com"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className={`campo ${error ? 'campo-error' : ''}`}
            />
          </div>

          <div>
            <label htmlFor="password" className="etiqueta-campo">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={verClave ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="Tu contraseña"
                value={password}
                onChange={e => setPassword(e.target.value)}
                className={`campo pr-12 ${error ? 'campo-error' : ''}`}
              />
              <button
                type="button"
                onClick={() => setVerClave(v => !v)}
                aria-label={verClave ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 transition-colors hover:bg-white/5"
                style={{ color: 'var(--color-texto-3)' }}
              >
                {verClave ? <IconoOjoTachado size={19} /> : <IconoOjo size={19} />}
              </button>
            </div>
          </div>

          {error && (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-error-bajo)', color: 'var(--color-error)' }}
              role="alert"
            >
              {error}
            </p>
          )}

          <button type="submit" disabled={cargando} className="btn btn-primario btn-bloque mt-1">
            {cargando ? 'Ingresando…' : 'Ingresar'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-texto-2)' }}>
          ¿No tenés cuenta?{' '}
          <button
            onClick={() => navigate('/registro')}
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: 'var(--color-acento)' }}
          >
            Registrate
          </button>
        </p>
      </div>
    </div>
  )
}
