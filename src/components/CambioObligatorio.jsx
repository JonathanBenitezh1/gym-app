import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import { cambiarPassword } from '../services/perfilService'
import { IconoOjo, IconoOjoTachado, IconoAlerta } from './Iconos'
import logoDtc from '../pages/img/logo_png.png'

/**
 * Pantalla que aparece cuando el administrador restableció la contraseña.
 *
 * Bloquea el resto de la app hasta que la persona elige una propia: si no,
 * la temporal —que el administrador conoce y pudo haber dictado en voz alta
 * o mandado por mensaje— quedaría activa por tiempo indefinido.
 */
export default function CambioObligatorio() {
  const { usuario, guardarSesion, cerrarSesion } = useAuth()
  const { exito, error: avisarError } = useAvisos()

  const [form, setForm] = useState({ actual: '', nueva: '', repetir: '' })
  const [ver, setVer] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()

    if (form.nueva.length < 6)        return avisarError('La nueva contraseña debe tener al menos 6 caracteres')
    if (form.nueva !== form.repetir)  return avisarError('Las contraseñas nuevas no coinciden')
    if (form.nueva === form.actual)   return avisarError('Elegí una contraseña distinta de la temporal')

    setGuardando(true)
    try {
      await cambiarPassword({ password_actual: form.actual, password_nueva: form.nueva })
      // Limpiamos la marca en la sesión guardada para que la app siga normal
      guardarSesion(localStorage.getItem('token'), { ...usuario, debe_cambiar_password: false })
      exito('¡Listo! Tu contraseña quedó actualizada')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">

        <div className="mb-6 text-center">
          <img
            src={logoDtc}
            alt="DTC Fight & Fitness"
            className="mx-auto mb-4 h-20 w-auto"
            style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.45))' }}
          />
          <h1 className="text-lg font-bold tracking-tight">Elegí una contraseña nueva</h1>
        </div>

        <div
          className="mb-4 flex items-start gap-2.5 rounded-xl px-4 py-3"
          style={{ backgroundColor: 'var(--color-alerta-bajo)', color: 'var(--color-alerta)' }}
        >
          <IconoAlerta size={17} />
          <p className="text-sm leading-snug">
            El gimnasio te generó una contraseña temporal. Por seguridad,
            elegí una propia antes de continuar.
          </p>
        </div>

        <form onSubmit={enviar} className="tarjeta flex flex-col gap-4 p-6" noValidate>
          <div>
            <label htmlFor="actual" className="etiqueta-campo">Contraseña temporal</label>
            <div className="relative">
              <input
                id="actual"
                type={ver ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="La que te dieron en el gimnasio"
                value={form.actual}
                onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
                className="campo pr-12"
              />
              <button
                type="button"
                onClick={() => setVer(v => !v)}
                aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
                className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 hover:bg-white/5"
                style={{ color: 'var(--color-texto-3)' }}
              >
                {ver ? <IconoOjoTachado size={19} /> : <IconoOjo size={19} />}
              </button>
            </div>
          </div>

          <div>
            <label htmlFor="nueva" className="etiqueta-campo">Tu nueva contraseña</label>
            <input
              id="nueva"
              type={ver ? 'text' : 'password'}
              autoComplete="new-password"
              placeholder="Mínimo 6 caracteres"
              value={form.nueva}
              onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))}
              className="campo"
            />
          </div>

          <div>
            <label htmlFor="repetir" className="etiqueta-campo">Repetila</label>
            <input
              id="repetir"
              type={ver ? 'text' : 'password'}
              autoComplete="new-password"
              value={form.repetir}
              onChange={e => setForm(f => ({ ...f, repetir: e.target.value }))}
              className="campo"
            />
          </div>

          <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque mt-1">
            {guardando ? 'Guardando…' : 'Guardar y continuar'}
          </button>
        </form>

        <button
          onClick={cerrarSesion}
          className="mt-5 w-full text-center text-sm underline-offset-4 hover:underline"
          style={{ color: 'var(--color-texto-3)' }}
        >
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
