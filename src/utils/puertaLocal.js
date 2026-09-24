/**
 * Lo que la pantalla de la puerta guarda en la PC para seguir andando si se
 * corta internet: la última lista de socios, los ingresos por mandar y las
 * fotos que ya mostró.
 *
 * Es la PC de recepción, no un celular compartido: igual se guarda lo mínimo
 * (DNI, nombre, rol, vencimiento), y al cerrar sesión se borra la lista y las
 * fotos. Los ingresos por mandar se conservan para que no se pierdan.
 */

const CLAVE_PADRON = 'puerta.padron'
const CLAVE_PENDIENTES = 'puerta.pendientes'
const CACHE_FOTOS = 'puerta-fotos'
const ZONA = 'America/Argentina/Buenos_Aires'
const UN_DIA = 24 * 60 * 60 * 1000

const leer = (clave, porDefecto) => {
  try { return JSON.parse(localStorage.getItem(clave)) ?? porDefecto } catch { return porDefecto }
}
const escribir = (clave, valor) => {
  try { localStorage.setItem(clave, JSON.stringify(valor)) } catch { /* sin espacio: se sigue sin guardar */ }
}

// ─── Estado de la cuota (la misma cuenta que el servidor) ─────────

export const hoyEnArgentina = () =>
  new Intl.DateTimeFormat('en-CA', { timeZone: ZONA, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date())

export function estadoCuota(vence, diasGracia, hoy = hoyEnArgentina()) {
  if (!vence) return { estado: 'sin_cuota', dias_restantes: 0 }
  const atraso = (Date.parse(`${hoy}T00:00:00Z`) - Date.parse(`${vence}T00:00:00Z`)) / UN_DIA
  if (atraso <= 0) return { estado: 'al_dia', dias_restantes: 0 }
  if (atraso <= diasGracia) return { estado: 'gracia', dias_restantes: diasGracia - atraso + 1 }
  return { estado: 'vencida', dias_restantes: 0 }
}

// ─── Lista de socios ──────────────────────────────────

export const guardarPadron = (padron) => escribir(CLAVE_PADRON, padron)
export const leerPadron = () => leer(CLAVE_PADRON, null)

const PERSONAL = ['profesor', 'profesional', 'admin', 'recepcion']

/** La misma respuesta que da el servidor, armada con la lista guardada. */
export function decidirSinConexion(dni, padron) {
  const s = padron?.socios.find(x => x.dni === dni)
  if (!s) return { resultado: 'no_registrado', dni }
  let resultado
  let extra = {}
  if (!s.activo) resultado = 'baja'
  else if (PERSONAL.includes(s.rol)) resultado = 'personal'
  else {
    const e = estadoCuota(s.cuota_vence, padron.dias_gracia)
    resultado = e.estado
    extra = { dias_restantes: e.dias_restantes, cuota_vence: s.cuota_vence }
  }
  return { resultado, dni, usuario_id: s.usuario_id, nombre: s.nombre.trim(), tiene_foto: Boolean(s.foto_version), ...extra }
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
