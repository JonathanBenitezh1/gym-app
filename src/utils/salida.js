import { borrarDatosDeLaPuerta } from './puertaLocal'
import { cortarAvisos } from './avisosCelular'

/**
 * Cuando la sesión se cierra sin que la persona toque "Salir" (27/09/2026):
 * entró en otro dispositivo, venció por no usar la app, cambió la clave, el
 * gimnasio la cerró o le dieron de baja. El servidor lo dice de dos formas:
 * un 401 con el motivo (axiosConfig.js) o, con la app abierta, el aviso
 * `sesion_cerrada` del tiempo real (services/socket.js).
 *
 * Se guarda el motivo para que la pantalla de ingreso lo muestre, se limpia
 * el teléfono y se vuelve al ingreso.
 */

const API = import.meta.env.VITE_API_URL + '/api'
const CLAVE = 'motivo-salida'

// Los mismos textos que el servidor (utils/sesiones.js), para cuando el
// motivo llega sin el mensaje (el tiempo real solo manda el motivo al conectar).
const TEXTOS = {
  otro_dispositivo: 'Tu cuenta se abrió en otro dispositivo. Por seguridad cerramos esta sesión.',
  clave:            'La contraseña cambió. Iniciá sesión con la nueva.',
  admin:            'El gimnasio cerró tu sesión. Iniciá sesión de nuevo.',
  baja:             'Tu usuario está dado de baja. Consultá en el gimnasio.',
  vencida:          'Tu sesión venció por no usar la app. Iniciá sesión de nuevo.',
  actualizacion:    'Actualizamos la seguridad de la app. Iniciá sesión de nuevo.'
}

let saliendo = false

export function salidaForzada(motivo, mensaje) {
  // Varios pedidos a la vez pueden dar 401: se sale una sola vez.
  if (saliendo || !localStorage.getItem('token')) return
  saliendo = true
  try {
    sessionStorage.setItem(CLAVE, mensaje || TEXTOS[motivo] || 'Tu sesión se cerró. Iniciá sesión de nuevo.')
  } catch { /* sin mensaje: igual vuelve al ingreso */ }
  // Antes de borrar el token: lo usa para avisarle al servidor.
  cortarAvisos()
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  borrarDatosDeLaPuerta().finally(() => { window.location.href = '/' })
}

/** El motivo de la última salida forzada, para la pantalla de ingreso. */
export function verMotivoSalida() {
  try { return sessionStorage.getItem(CLAVE) } catch { return null }
}

/** Ya se mostró: al recargar el ingreso no vuelve a aparecer. */
export function olvidarMotivoSalida() {
  try { sessionStorage.removeItem(CLAVE) } catch { /* nada */ }
}

/**
 * "Salir": la sesión se cierra también en el servidor, así el token deja de
 * valer aunque alguien lo haya copiado. No se espera la respuesta: con o sin
 * conexión, la persona sale. Va con fetch y no con axios, para no pasar por el
 * interceptor del 401.
 */
export function cerrarSesionEnServidor() {
  const token = localStorage.getItem('token')
  if (!token) return
  fetch(`${API}/auth/logout`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}` },
    keepalive: true
  }).catch(() => {})
}
