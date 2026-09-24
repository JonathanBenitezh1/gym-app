import { useEffect, useState, useCallback } from 'react'
import { obtenerMiCuota } from '../services/perfilService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { fechaCorta } from '../utils/formato'

/**
 * Cartel para el socio cuando la cuota está en gracia, vencida o nunca se
 * pagó. Al día no muestra nada. Se actualiza solo cuando el gimnasio registra
 * un pago.
 */
export default function AvisoCuota({ className = '' }) {
  const [cuota, setCuota] = useState(null)

  const cargar = useCallback(() => {
    obtenerMiCuota().then(setCuota).catch(() => {}) // Secundario: si falla, no se muestra
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ cuota_actualizada: cargar })

  if (!cuota || !['gracia', 'vencida', 'sin_cuota'].includes(cuota.estado)) return null

  const gracia = cuota.estado === 'gracia'
  const titulo = {
    gracia: `Tu cuota venció: ${cuota.dias_restantes === 1 ? 'te queda 1 día' : `te quedan ${cuota.dias_restantes} días`} para ponerte al día`,
    vencida: 'Tu cuota está vencida',
    sin_cuota: 'Todavía no registramos tu cuota'
  }[cuota.estado]
  const detalle = gracia
    ? `Venció el ${fechaCorta(cuota.cuota_vence)}. Pasado ese plazo no vas a poder ingresar hasta pagarla.`
    : 'Acercate a la administración para regularizarla.'

  return (
    <div
      className={`tarjeta p-3.5 ${className}`}
      style={{
        borderColor: gracia ? 'var(--color-alerta)' : 'var(--color-error)',
        backgroundColor: gracia ? 'var(--color-alerta-bajo)' : 'var(--color-error-bajo)'
      }}
    >
      <p className="text-sm font-semibold" style={{ color: gracia ? 'var(--color-alerta)' : 'var(--color-error)' }}>
        {titulo}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>{detalle}</p>
    </div>
  )
}
