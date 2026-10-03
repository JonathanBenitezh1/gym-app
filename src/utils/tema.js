import { useSyncExternalStore } from 'react'

/**
 * Modo claro u oscuro (03/10/2026). El oscuro es el de siempre y el que viene
 * de fábrica. Se guarda en este dispositivo (no en la cuenta): en un teléfono
 * compartido cada uno lo cambia. public/tema.js lo aplica antes de que cargue
 * la app, con la misma clave.
 */

const CLAVE = 'tema'
const EVENTO = 'tema-cambiado'

export function temaActual() {
  return document.documentElement.dataset.tema === 'claro' ? 'claro' : 'oscuro'
}

export function cambiarTema(tema) {
  const raiz = document.documentElement
  if (tema === 'claro') raiz.dataset.tema = 'claro'
  else delete raiz.dataset.tema
  try {
    if (tema === 'claro') localStorage.setItem(CLAVE, 'claro')
    else localStorage.removeItem(CLAVE)
  } catch { /* sin almacenamiento: vale hasta cerrar la app */ }
  window.dispatchEvent(new Event(EVENTO))
}

const suscribir = (avisar) => {
  window.addEventListener(EVENTO, avisar)
  return () => window.removeEventListener(EVENTO, avisar)
}

/** El tema de ahora, y la pantalla se redibuja cuando cambia. */
export const useTema = () => useSyncExternalStore(suscribir, temaActual)
