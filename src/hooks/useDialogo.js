import { useEffect, useRef } from 'react'

const ENFOCABLES = 'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'

/**
 * Lo que tiene que hacer una ventana encima de la pantalla (aria-modal) para
 * el teclado y el lector de pantalla (auditoría del 04/10/2026):
 * - al abrirse, el foco entra (al primer botón: en el celular, enfocar el
 *   campo de texto abriría el teclado sin que lo pidan);
 * - Tab y Shift+Tab dan la vuelta adentro, sin llegar a lo de atrás;
 * - Escape la cierra;
 * - al cerrarse, el foco vuelve a lo que la abrió.
 *
 * Devuelve la ref para el contenedor, que lleva tabIndex={-1}.
 */
export function useDialogo(alCerrar) {
  const caja = useRef(null)
  const cerrar = useRef(alCerrar)
  useEffect(() => { cerrar.current = alCerrar })

  useEffect(() => {
    const anterior = document.activeElement
    const contenedor = caja.current
    const enfocables = () => [...(contenedor?.querySelectorAll(ENFOCABLES) ?? [])]
      .filter(e => e.offsetParent !== null)
    ;(enfocables()[0] ?? contenedor)?.focus()

    const tecla = (e) => {
      if (e.key === 'Escape') {
        e.stopPropagation()
        cerrar.current?.()
        return
      }
      if (e.key !== 'Tab') return
      const lista = enfocables()
      if (lista.length === 0) return
      const primero = lista[0]
      const ultimo = lista.at(-1)
      if (e.shiftKey && (document.activeElement === primero || !contenedor.contains(document.activeElement))) {
        e.preventDefault()
        ultimo.focus()
      } else if (!e.shiftKey && (document.activeElement === ultimo || !contenedor.contains(document.activeElement))) {
        e.preventDefault()
        primero.focus()
      }
    }
    document.addEventListener('keydown', tecla)
    return () => {
      document.removeEventListener('keydown', tecla)
      if (anterior instanceof HTMLElement && document.contains(anterior)) anterior.focus()
    }
  }, [])

  return caja
}
