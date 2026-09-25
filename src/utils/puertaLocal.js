import { ahoraEnArgentina, decidirIngreso } from './ingreso'

/**
 * Lo que la pantalla de la puerta guarda en la PC para seguir andando si se
 * corta internet: la última lista de socios, los ingresos por mandar y las
 * fotos que ya mostró.
 *
 * Es la PC de recepción, no un celular compartido: igual se guarda lo mínimo
 * (DNI, nombre, rol, vencimiento, plan y horarios reservados), y al cerrar
 * sesión se borra la lista y las fotos. Los ingresos por mandar se conservan
 * para que no se pierdan.
 */

const CLAVE_PADRON = 'puerta.padron'
const CLAVE_PENDIENTES = 'puerta.pendientes'
const CACHE_FOTOS = 'puerta-fotos'

const leer = (clave, porDefecto) => {
  try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto } catch { return porDefecto }
}
const escribir = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin espacio: se sigue sin guardar */ }
}

// ─── Lista de socios ──────────────────────────────────

export const guardarPadron = (padron) => escribir(CLAVE_PADRON, padron)
export const leerPadron = () => leer(CLAVE_PADRON, null)

const PERSONAL = ['profesor', 'profesional', 'admin', 'recepcion']

/**
 * La misma respuesta que da el servidor, armada con la lista guardada: plan,
 * vencimiento y horarios reservados de cada socio (utils/ingreso.js).
 */
export function decidirSinConexion(dni, padron, momento = new Date()) {
  const s = padron?.socios.find(x => x.dni === dni)
  if (!s) return { resultado: 'no_registrado', dni }
  let decision
  if (!s.activo) decision = { resultado: 'baja' }
  else if (PERSONAL.includes(s.rol)) decision = { resultado: 'personal' }
  else {
    decision = decidirIngreso(
      { cuota_vence: s.cuota_vence, plan: s.plan, clases: s.clases ?? [] },
      { ahora: ahoraEnArgentina(momento), diasGracia: padron.dias_gracia, margen: padron.margen_ingreso_min ?? 30 }
    )
  }
  return { ...decision, dni, usuario_id: s.usuario_id, nombre: s.nombre.trim(), tiene_foto: Boolean(s.foto_version) }
}

export const versionFoto = (usuario_id, padron) =>
  padron?.socios.find(s => s.usuario_id === usuario_id)?.foto_version ?? null

// ─── Ingresos por mandar ──────────────────────────────

export const pendientes = () => leer(CLAVE_PENDIENTES, [])

export function encolar(ingreso) {
  const lista = pendientes()
  lista.push(ingreso)
  // Tope de seguridad: una semana de puerta sin internet.
  escribir(CLAVE_PENDIENTES, lista.slice(-5000))
}

export function quitarPendientes(ids) {
  const enviados = new Set(ids)
  escribir(CLAVE_PENDIENTES, pendientes().filter(i => !enviados.has(i.id_local)))
}

export const idLocal = () =>
  (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 12)}`)

// ─── Fotos ya mostradas ───────────────────────────────

const claveFoto = (usuario_id, version) => `/foto/${usuario_id}/${version}`

export async function fotoGuardada(usuario_id, version) {
  try {
    const cache = await caches.open(CACHE_FOTOS)
    const r = await cache.match(claveFoto(usuario_id, version))
    return r ? URL.createObjectURL(await r.blob()) : null
  } catch { return null }
}

export async function guardarFoto(usuario_id, version, blob) {
  try {
    const cache = await caches.open(CACHE_FOTOS)
    await cache.put(claveFoto(usuario_id, version), new Response(blob))
  } catch { /* sin Cache Storage se sigue sin guardar */ }
}

export async function borrarDatosDeLaPuerta() {
  try { localStorage.removeItem(CLAVE_PADRON) } catch { /* nada */ }
  try { await caches.delete(CACHE_FOTOS) } catch { /* nada */ }
}
