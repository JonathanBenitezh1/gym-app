import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { registrarUsuario } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { IconoOjo, IconoOjoTachado } from '../components/Iconos'
import logoDtc from './img/logo_png.png'

const VACIO = { nombre: '', dni: '', telefono: '', email: '', password: '', confirmar: '' }

/**
 * Definido fuera del componente a propósito: si se declara adentro,
 * React lo trata como un tipo nuevo en cada render y vuelve a montar
 * el input, con lo cual se pierde el foco a cada tecla.
 */
function CampoTexto({ id, etiqueta, ayuda, error, valor, alCambiar, ...props }) {
  return (
    <div>
      <label htmlFor={id} className="etiqueta-campo">{etiqueta}</label>
      <input
        id={id}
        value={valor}
        onChange={alCambiar}
        className={`campo ${error ? 'campo-error' : ''}`}
        {...props}
      />
      {error
        ? <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>{error}</p>
        : ayuda && <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>{ayuda}</p>
      }
    </div>
  )
}

export default function Registro() {
  const [datos, setDatos]       = useState(VACIO)
  const [errores, setErrores]   = useState({})
  const [errorGeneral, setErrorGeneral] = useState('')
  const [verClave, setVerClave] = useState(false)
  const [cargando, setCargando] = useState(false)

  const navigate = useNavigate()
  const { guardarSesion } = useAuth()

  const cambiar = (campo) => (e) => {
    setDatos(d => ({ ...d, [campo]: e.target.value }))
    // Al corregir un campo, sacamos su error para no dejarlo marcado en rojo
    setErrores(err => (err[campo] ? { ...err, [campo]: null } : err))
  }

  /** Valida todo junto para poder señalar cada campo con su propio mensaje. */
  const validar = () => {
    const e = {}
    if (datos.nombre.trim().length < 2)        e.nombre    = 'Ingresá tu nombre completo'
    if (!/^\d{7,8}$/.test(datos.dni.trim()))   e.dni       = 'El DNI debe tener 7 u 8 números, sin puntos'
    if (!/^\d{10,15}$/.test(datos.telefono.trim())) e.telefono = 'Ingresá el número con característica, sin 0 ni 15'
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(datos.email.trim())) e.email = 'Revisá el formato del email'
    if (datos.password.length < 6)             e.password  = 'Mínimo 6 caracteres'
    if (datos.password !== datos.confirmar)    e.confirmar = 'Las contraseñas no coinciden'
    return e
  }

  const enviar = async (ev) => {
    ev.preventDefault()

    const encontrados = validar()
    setErrores(encontrados)
    setErrorGeneral('')
    if (Object.keys(encontrados).length > 0) return

    setCargando(true)
    try {
      const resultado = await registrarUsuario(
        datos.nombre.trim(),
        datos.email.trim(),
        datos.password,
        datos.dni.trim(),
        datos.telefono.trim()
      )
      guardarSesion(resultado.token, resultado.usuario)
      navigate('/horarios', { replace: true })
    } catch (err) {
      setErrorGeneral(
        err.response?.data?.error ||
        (err.response ? 'No pudimos crear tu cuenta' : 'No pudimos conectar con el gimnasio. Revisá tu conexión.')
      )
    } finally {
      setCargando(false)
    }
  }

  // Props comunes de cada campo, para no repetirlas en el formulario
  const propsDe = (id) => ({
    id,
    valor: datos[id],
    alCambiar: cambiar(id),
    error: errores[id]
  })

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        <div className="mb-7 text-center">
          <img
            src={logoDtc}
            alt="DTC Fight & Fitness"
            className="mx-auto mb-4 h-24 w-auto"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.45))' }}
          />
          <h1 className="text-xl font-bold tracking-tight">Creá tu cuenta</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Es gratis y te lleva un minuto
          </p>
        </div>

        <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 p-6" noValidate>
          <CampoTexto {...propsDe('nombre')}   etiqueta="Nombre completo" type="text" placeholder="Juan Pérez" autoComplete="name" />
          <CampoTexto {...propsDe('dni')}      etiqueta="DNI" type="text" inputMode="numeric" placeholder="30123456" ayuda="Sin puntos" />
          <CampoTexto {...propsDe('telefono')} etiqueta="Teléfono" type="tel" inputMode="numeric" placeholder="3511234567" ayuda="Con característica, sin 0 ni 15" />
          <CampoTexto {...propsDe('email')}    etiqueta="Email" type="email" inputMode="email" placeholder="tu@email.com" autoComplete="email" />

          <div>
            <label htmlFor="password" className="etiqueta-campo">Contraseña</label>
            <div className="relative">
              <input
                id="password"
                type={verClave ? 'text' : 'password'}
                autoComplete="new-password"
                placeholder="Mínimo 6 caracteres"
                value={datos.password}
                onChange={cambiar('password')}
                className={`campo pr-12 ${errores.password ? 'campo-error' : ''}`}
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
            {errores.password && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>{errores.password}</p>
            )}
          </div>

          <CampoTexto
            {...propsDe('confirmar')}
            etiqueta="Repetir contraseña"
            type={verClave ? 'text' : 'password'}
            placeholder="Repetí tu contraseña"
            autoComplete="new-password"
          />

          {errorGeneral && (
            <p
              className="rounded-lg px-3 py-2 text-sm"
              style={{ backgroundColor: 'var(--color-error-bajo)', color: 'var(--color-error)' }}
              role="alert"
            >
              {errorGeneral}
            </p>
          )}

          <button type="submit" disabled={cargando} className="btn btn-primario btn-bloque mt-1">
            {cargando ? 'Creando cuenta…' : 'Crear cuenta'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm" style={{ color: 'var(--color-texto-2)' }}>
          ¿Ya tenés cuenta?{' '}
          <button
            onClick={() => navigate('/')}
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: 'var(--color-acento)' }}
          >
            Iniciá sesión
          </button>
        </p>
      </div>
    </div>
  )
}
