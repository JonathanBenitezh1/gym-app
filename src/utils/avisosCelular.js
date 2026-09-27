import { obtenerClavePublica, guardarSuscripcion, borrarSuscripcion } from '../services/avisosService'
import { esIOS, yaInstalada } from './instalacion'

/**
 * Avisos al celular (push), del lado de la app. Plan de mejoras 2.1.
 *
 * El navegador guarda una suscripción por celular; la app se la pasa al
 * servidor, que la usa para mandar los avisos. Los avisos son de quien los
 * activó: si en ese celular entra otra persona, se cortan (se guarda de quién
 * son en localStorage). Al cerrar sesión, también.
 *
 * Estados:
 * - instalar:     iPhone sin la app instalada (Safari solo los permite así).
 * - no_soportado: navegador sin avisos, o sin service worker (en desarrollo).
 * - bloqueado:    el socio los negó; se habilitan desde los ajustes.
 * - activos / apagados.
 */

const API = import.meta.env.VITE_API_URL + '/api'
const CLAVE_DUENIO = 'avisos.usuario'

/** Errores con un mensaje para mostrarle al socio, a diferencia de los del navegador. */
export class ErrorAvisos extends Error {}

const leerDuenio = () => { try { return localStorage.getItem(CLAVE_DUENIO) } catch { return null } }
const guardarDuenio = (id) => { try { localStorage.setItem(CLAVE_DUENIO, String(id)) } catch { /* se cortan al volver */ } }
const olvidarDuenio = () => { try { localStorage.removeItem(CLAVE_DUENIO) } catch { /* nada */ } }

export const soportaAvisos = () =>
  'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window

async function registro() {
  if (!('serviceWorker' in navigator)) return null
  return (await navigator.serviceWorker.getRegistration()) ?? null
}

async function suscripcionActual() {
  const reg = await registro()
  return reg ? reg.pushManager.getSubscription() : null
}

/** La clave en base64url, como bytes: así la pide el navegador. */
function aBytes(base64url) {
  const b64 = base64url.replace(/-/g, '+').replace(/_/g, '/') + '='.repeat((4 - base64url.length % 4) % 4)
  return Uint8Array.from(atob(b64), c => c.charCodeAt(0))
}

/** Si el servidor cambió sus claves, la suscripción vieja ya no sirve. */
function mismaClave(suscripcion, clave) {
  const actual = suscripcion.options?.applicationServerKey
  if (!actual) return true
  const a = new Uint8Array(actual)
  const b = aBytes(clave)
  return a.length === b.length && a.every((x, i) => x === b[i])
}

export async function estadoAvisos(usuarioId) {
  if (!soportaAvisos()) return esIOS(navigator) && !yaInstalada() ? 'instalar' : 'no_soportado'
  if (Notification.permission === 'denied') return 'bloqueado'
  const reg = await registro()
  if (!reg) return 'no_soportado'
  const sub = await reg.pushManager.getSubscription()
  const propios = sub && Notification.permission === 'granted' && leerDuenio() === String(usuarioId)
  return propios ? 'activos' : 'apagados'
}

/** Pide el permiso y registra el celular. Tiene que llamarse desde un toque. */
export async function activarAvisos(usuarioId) {
  // El permiso primero, sin esperar nada antes: iPhone solo muestra el cartel
  // si viene directo de un toque.
  const permiso = await Notification.requestPermission()
  if (permiso !== 'granted') return permiso === 'denied' ? 'bloqueado' : 'apagados'

  const clave = await obtenerClavePublica()
  if (!clave) throw new ErrorAvisos('Los avisos al celular todavía no están disponibles')
  const reg = await registro()
  if (!reg) throw new ErrorAvisos('Cerrá la app, volvé a abrirla e intentá de nuevo')

  let sub = await reg.pushManager.getSubscription()
  if (sub && !mismaClave(sub, clave)) {
    await sub.unsubscribe()
    sub = null
  }
  sub ??= await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: aBytes(clave) })
  await guardarSuscripcion(sub.toJSON())
  guardarDuenio(usuarioId)
  return 'activos'
}

export async function desactivarAvisos() {
  olvidarDuenio()
  const sub = await suscripcionActual()
  if (!sub) return
  await borrarSuscripcion(sub.endpoint).catch(() => {})
  await sub.unsubscribe()
}

let sincronizado = false

/**
 * Al abrir la app, una vez: si los avisos son de este socio, se le recuerdan
 * al servidor (que borra los que el servicio da por muertos); si son de otra
 * persona, se cortan.
 */
export async function sincronizarAvisos(usuarioId) {
  if (sincronizado || !soportaAvisos() || Notification.permission !== 'granted') return
  sincronizado = true
  try {
    const sub = await suscripcionActual()
    if (!sub) return
    const clave = await obtenerClavePublica()
    if (leerDuenio() !== String(usuarioId) || !clave || !mismaClave(sub, clave)) {
      olvidarDuenio()
      await sub.unsubscribe()
      return
    }
    await guardarSuscripcion(sub.toJSON())
  } catch {
    // Sin avisos no se rompe nada: la campanita sigue andando.
  }
}

/**
 * Al cerrar sesión. No espera: toma el token antes de que se borre, y va con
 * fetch y no con axios, para no pasar por el interceptor que cierra la sesión
 * ante un 401.
 */
export function cortarAvisos() {
  const token = localStorage.getItem('token')
  olvidarDuenio()
  sincronizado = false
  if (!('serviceWorker' in navigator)) return
  suscripcionActual().then(async (sub) => {
    if (!sub) return
    if (token) {
      await fetch(`${API}/avisos/suscripcion`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ endpoint: sub.endpoint })
      }).catch(() => {})
    }
    await sub.unsubscribe()
  }).catch(() => {})
}
