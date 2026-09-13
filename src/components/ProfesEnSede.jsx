import { useState, useEffect, useCallback } from 'react'
import { profesEnSede } from '../services/presenciaService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { IconoUsuarios } from './Iconos'

/** "18:05" a partir de la hora de llegada, en la hora del teléfono. */
const desde = (valor) =>
  new Date(valor).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

/**
 * Quién está en el gimnasio ahora. Lo marca el propio profe al llegar, y le
 * sirve al socio para saber, antes de salir de su casa, si hay alguien.
 *
 * Aparece solo cuando hay al menos uno. Mientras los profes no se acostumbren
 * a marcar la llegada, un cartel de "no hay nadie" diría algo falso.
 */
export default function ProfesEnSede({ className = '' }) {
  const [profes, setProfes] = useState([])

  const cargar = useCallback(async () => {
    try {
      setProfes(await profesEnSede())
    } catch {
      // Es información de apoyo: si falla, la pantalla sigue andando.
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  useSocketEventos({ profes_en_sede: cargar })

  if (profes.length === 0) return null

  return (
    <section
      className={`tarjeta flex items-center gap-3 p-3.5 ${className}`}
      style={{ borderColor: 'var(--color-exito)' }}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
        style={{ backgroundColor: 'var(--color-exito-bajo)', color: 'var(--color-exito)' }}
      >
        <IconoUsuarios size={18} />
      </span>

      <div className="min-w-0">
        <p className="text-sm font-semibold">
          {profes.length === 1 ? 'Hay un profe en el gimnasio' : `Hay ${profes.length} profes en el gimnasio`}
        </p>
        <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
          {profes.map(p => `${p.nombre} (desde ${desde(p.inicio)})`).join(' · ')}
        </p>
      </div>
    </section>
  )
}
