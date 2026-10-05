import { useState } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import CamposLegales from './CamposLegales'
import { LEGAL_VACIO, validarLegal, legalParaEnviar } from '../utils/legal'
import { aceptarLegal, obtenerVersionLegal } from '../services/legalService'
import logoGimnasio from '../pages/img/logo.webp'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Se interpone, como el cambio de clave obligatorio, cuando hay una versión
 * de los términos que el socio no aceptó: al prenderlos por primera vez, a
 * todos los que ya tenían cuenta, y después a todos cada vez que cambian.
 */
export default function AceptarLegal() {
  const { usuario, guardarSesion, cerrarSesion } = useAuth()
  const { error: avisarError } = useAvisos()
  const [valor, setValor] = useState(LEGAL_VACIO)
  const [errores, setErrores] = useState({})
  const [guardando, setGuardando] = useState(false)

  const enviar = async (e) => {
    e.preventDefault()
    const encontrados = validarLegal(valor)
    setErrores(encontrados)
    if (Object.keys(encontrados).length > 0) return

    setGuardando(true)
    try {
      const version = await obtenerVersionLegal()
      await aceptarLegal({ version, ...legalParaEnviar(valor) })
      guardarSesion(localStorage.getItem('token'), { ...usuario, legal_pendiente: false, legal_aceptada: version })
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos guardar tu aceptación. Revisá tu conexión.')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center">
          <img src={logoGimnasio} alt={GIMNASIO.nombre} className="mx-auto mb-4 h-20 w-auto"
               style={{ filter: 'drop-shadow(0 6px 14px rgba(0,0,0,.45))' }} />
          <h1 className="text-lg font-bold tracking-tight">Términos y privacidad</h1>
          <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Para seguir usando la app, leé y aceptá cómo cuidamos tus datos y las reglas del gimnasio.
          </p>
        </div>

        <form onSubmit={enviar} className="tarjeta flex flex-col gap-5 p-6" noValidate>
          <CamposLegales valor={valor} alCambiar={(v) => { setValor(v); setErrores({}) }} errores={errores} />
          <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque">
            {guardando ? 'Guardando…' : 'Aceptar y seguir'}
          </button>
        </form>

        <button onClick={cerrarSesion}
                className="mt-5 w-full text-center text-sm underline-offset-4 hover:underline"
                style={{ color: 'var(--color-texto-3)' }}>
          Cerrar sesión
        </button>
      </div>
    </div>
  )
}
