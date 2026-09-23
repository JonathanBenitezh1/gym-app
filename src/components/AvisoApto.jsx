import { useEffect, useState } from 'react'
import { obtenerPerfil } from '../services/perfilService'
import { estadoApto } from '../utils/apto'

/**
 * Cartel para el socio cuando le falta el apto médico, está vencido o vence
 * pronto. Solo avisa: no bloquea reservas.
 */
export default function AvisoApto({ className = '' }) {
  const [estado, setEstado] = useState(null)

  useEffect(() => {
    obtenerPerfil()
      .then(p => { if (p?.rol === 'alumno') setEstado(estadoApto(p.apto_vence)) })
      .catch(() => {}) // Secundario: si falla, no se muestra nada
  }, [])

  if (!estado || estado.tipo === 'vigente') return null

  const urgente = estado.tipo !== 'porVencer'
  const mensaje = {
    falta:     'Todavía no registramos tu apto médico. Traé el certificado al gimnasio.',
    vencido:   'Traé el certificado nuevo al gimnasio para renovarlo.',
    porVencer: 'Acordate de traer el certificado nuevo antes de esa fecha.'
  }[estado.tipo]

  return (
    <div
      className={`tarjeta p-3.5 ${className}`}
      style={{
        borderColor: urgente ? 'var(--color-error)' : 'var(--color-alerta)',
        backgroundColor: urgente ? 'var(--color-error-bajo)' : 'var(--color-alerta-bajo)'
      }}
    >
      <p className="text-sm font-semibold" style={{ color: urgente ? 'var(--color-error)' : 'var(--color-alerta)' }}>
        {estado.texto}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>{mensaje}</p>
    </div>
  )
}
