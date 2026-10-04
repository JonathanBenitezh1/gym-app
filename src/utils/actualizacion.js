/**
 * Versiones nuevas en una app que queda abierta (auditoría del 04/10/2026).
 *
 * Antes el service worker se registraba y nada más: el navegador busca una
 * versión nueva al navegar o una vez por día, y la app no navega (es una sola
 * página). La PC de la puerta y el panel, abiertos días enteros, seguían con
 * el código viejo, incluida la decisión de la puerta sin conexión.
 *
 * Ahora se busca cada hora. Cuando la versión nueva toma el control, la
 * página se recarga en un momento que no moleste:
 * - con la app en segundo plano más de un minuto (el socio no está mirando);
 * - en la puerta, cuando no hay nadie en pantalla (Puerta.jsx llama a
 *   recargarSiHayNueva).
 * Nunca en medio de algo: escribir un mensaje, cobrar, pasar un DNI.
 */

const UNA_HORA = 60 * 60 * 1000
const ESPERA_EN_SEGUNDO_PLANO = 60 * 1000

let hayNueva = false
let temporizador = null

export const hayVersionNueva = () => hayNueva

/** Recarga si hay versión nueva. Lo llama quien sabe que es un buen momento. */
export function recargarSiHayNueva() {
  if (hayNueva) window.location.reload()
}

function alCambiarVisibilidad() {
  clearTimeout(temporizador)
  if (hayNueva && document.visibilityState === 'hidden') {
    temporizador = setTimeout(recargarSiHayNueva, ESPERA_EN_SEGUNDO_PLANO)
  }
}

export function registrarServiceWorker() {
  // En desarrollo no hay service worker (vite-plugin-pwa lo arma al construir).
  if (!import.meta.env.PROD || !('serviceWorker' in navigator)) return

  navigator.serviceWorker.register('/sw.js', { scope: '/' })
    .then(registro => setInterval(() => registro.update().catch(() => {}), UNA_HORA))
    .catch(() => {})

  // La primera instalación también cambia el controlador: esa no es una
  // versión nueva y no recarga.
  let habiaUno = Boolean(navigator.serviceWorker.controller)
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!habiaUno) { habiaUno = true; return }
    hayNueva = true
    alCambiarVisibilidad()
  })
  document.addEventListener('visibilitychange', alCambiarVisibilidad)
}
