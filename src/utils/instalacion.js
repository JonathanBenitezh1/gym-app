/**
 * Instalar la app en la pantalla de inicio.
 *
 * Android (Chrome) avisa con `beforeinstallprompt` que la app se puede
 * instalar, y lo avisa una vez, apenas carga la página. Por eso se escucha
 * acá, al importar este archivo desde main.jsx, y no cuando se abre la
 * pantalla de clases: para entonces el aviso ya habría pasado.
 *
 * iPhone no tiene ese aviso en ningún navegador: se instala a mano, desde
 * Compartir → Agregar a inicio.
 */

let aviso = null
const oyentes = new Set()
const notificar = () => oyentes.forEach(f => f())

if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (evento) => {
    // Se guarda para mostrarlo desde el botón de la app, cuando el socio quiera.
    evento.preventDefault()
    aviso = evento
    notificar()
  })
  window.addEventListener('appinstalled', () => {
    aviso = null
    notificar()
  })
}

export const puedeInstalarse = () => aviso !== null

export function suscribir(funcion) {
  oyentes.add(funcion)
  return () => oyentes.delete(funcion)
}

/** Abre el cartel de instalación de Android. Devuelve si la instaló. */
export async function instalar() {
  if (!aviso) return false
  const evento = aviso
  // El aviso sirve una sola vez.
  aviso = null
  notificar()
  await evento.prompt()
  const { outcome } = await evento.userChoice
  return outcome === 'accepted'
}

/** Ya abierta como app instalada: sin barra del navegador. */
export function yaInstalada() {
  if (typeof window === 'undefined') return false
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

/**
 * iPhone o iPad. El iPad nuevo dice ser una Mac: se lo reconoce porque tiene
 * pantalla táctil.
 */
export function esIOS({ userAgent = '', platform = '', maxTouchPoints = 0 } = {}) {
  return /iPad|iPhone|iPod/.test(userAgent) || (platform === 'MacIntel' && maxTouchPoints > 1)
}

/**
 * El navegador de adentro de Instagram o Facebook no deja agregar a inicio:
 * primero hay que abrir la página en Safari.
 */
export const esNavegadorDeApp = (userAgent = '') => /FBAN|FBAV|Instagram|Line\//.test(userAgent)
