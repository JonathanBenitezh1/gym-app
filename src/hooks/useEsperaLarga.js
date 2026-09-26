import { useState, useEffect } from 'react'

/**
 * true solo si `activo` lleva más de `ms` prendido. Para las barras de carga:
 * si la respuesta llega rápido no aparecen, porque mostrarlas un instante y
 * sacarlas se ve como un parpadeo.
 */
export function useEsperaLarga(activo, ms = 300) {
  const [larga, setLarga] = useState(false)
  useEffect(() => {
    if (!activo) return
    const temporizador = setTimeout(() => setLarga(true), ms)
    return () => {
      clearTimeout(temporizador)
      setLarga(false)
    }
  }, [activo, ms])
  return activo && larga
}
