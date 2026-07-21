import { useEffect, useRef } from 'react'
import socket from '../services/socket'

/**
 * Suscribe una pantalla a eventos de tiempo real sobre la conexión compartida.
 *
 * Uso:
 *   useSocketEventos({
 *     pago_confirmado: () => cargar(),
 *     reserva_cancelada: () => cargar()
 *   })
 *
 * - Asegura que la conexión esté activa (la abre si hace falta).
 * - Al desmontarse la pantalla, quita SOLO sus propios oyentes; nunca cierra
 *   la conexión, así no se corta el tiempo real del resto de la app.
 * - Los cuerpos de los manejadores se leen siempre actualizados (vía ref), así
 *   que no hace falta que sean estables para evitar re-suscripciones.
 */
export function useSocketEventos(manejadores) {
  const ref = useRef(manejadores)

  // Mantenemos las funciones actualizadas sin re-suscribir al socket.
  useEffect(() => {
    ref.current = manejadores
  })

  useEffect(() => {
    if (!socket.connected) socket.connect()

    // Los nombres de evento son fijos por pantalla; los capturamos al montar.
    const nombres = Object.keys(ref.current)
    const envoltorios = {}

    for (const nombre of nombres) {
      envoltorios[nombre] = (...args) => ref.current[nombre]?.(...args)
      socket.on(nombre, envoltorios[nombre])
    }

    return () => {
      for (const nombre of nombres) socket.off(nombre, envoltorios[nombre])
    }
  }, [])
}
