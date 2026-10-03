import { useState, useEffect, useCallback } from 'react'
import { obtenerNoLeidos } from '../services/mensajesService'
import { useSocketEventos } from './useSocketEventos'
import { recordado, recordar } from '../utils/memoria'

/**
 * Mensajes sin leer, para el numerito (migración 021). Se actualiza con cada
 * mensaje nuevo y al volver a la app. `atiende`: si responde mensajes (la
 * cuenta de la puerta, no).
 */
export function useNoLeidos() {
  const [estado, setEstado] = useState(() => recordado('mensajes.noLeidos') ?? { no_leidos: 0, atiende: false })

  const actualizar = useCallback(() => {
    if (!localStorage.getItem('token')) return
    obtenerNoLeidos()
      .then(d => { setEstado(d); recordar('mensajes.noLeidos', d) })
      .catch(() => {})
  }, [])

  useEffect(() => {
    actualizar()
    const alVolver = () => { if (document.visibilityState === 'visible') actualizar() }
    document.addEventListener('visibilitychange', alVolver)
    window.addEventListener('mensajes-leidos', actualizar)
    return () => {
      document.removeEventListener('visibilitychange', alVolver)
      window.removeEventListener('mensajes-leidos', actualizar)
    }
  }, [actualizar])

  useSocketEventos({ mensaje_nuevo: actualizar })

  return estado
}

/** Lo llama una conversación al abrirse: los numeritos se actualizan solos. */
export const avisarLeidos = () => window.dispatchEvent(new Event('mensajes-leidos'))
