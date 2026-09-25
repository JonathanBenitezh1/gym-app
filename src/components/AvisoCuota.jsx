import { useEffect, useState, useCallback } from 'react'
import { obtenerMiCuota } from '../services/perfilService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { fechaCorta } from '../utils/formato'

/**
 * Cartel para el socio cuando su plan mensual está en gracia o venció. Al día
 * o sin plan no muestra nada: sin plan, la pantalla de clases ya ofrece los
 * planes. Se actualiza solo cuando el gimnasio registra un pago.
 */
export default function AvisoCuota({ className = '' }) {
  const [cuota, setCuota] = useState(null)

  const cargar = useCallback(() => {
    obtenerMiCuota().then(setCuota).catch(() => {}) // Secundario: si falla, no se muestra
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ cuota_actualizada: cargar })

  if (!cuota?.plan || !['gracia', 'vencida'].includes(cuota.estado)) return null

  const gracia = cuota.estado === 'gracia'
  const titulo = gracia
    ? `Tu plan venció: ${cuota.dias_restantes === 1 ? 'te queda 1 día' : `te quedan ${cuota.dias_restantes} días`} para ponerte al día`
    : `Tu plan ${cuota.plan} está vencido`
  const detalle = gracia
    ? `Venció el ${fechaCorta(cuota.cuota_vence)}. Pasado ese plazo no vas a poder ingresar y se liberan tus lugares fijos.`
    : 'Tus lugares fijos se liberaron. Pagalo en el gimnasio para volver a elegir tus horarios.'

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
