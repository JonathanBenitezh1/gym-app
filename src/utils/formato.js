/**
 * Formateo de fechas, horas y precios.
 *
 * Las fechas llegan del backend en formato ISO ("2026-07-20T03:00:00.000Z").
 * Mostrarlas así era ilegible; acá se convierten al formato argentino.
 */

const MESES = [
  'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
  'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'
]

/**
 * Convierte una fecha del backend a Date, sin que el huso horario
 * la corra un día. Las fechas de reserva son días calendario, no
 * instantes: "2026-07-20" tiene que mostrarse como 20, no como 19.
 */
function aFechaLocal(valor) {
  if (!valor) return null
  const texto = String(valor)
  const soloFecha = texto.slice(0, 10)
  const [anio, mes, dia] = soloFecha.split('-').map(Number)
  if (!anio || !mes || !dia) return null
  return new Date(anio, mes - 1, dia)
}

/** "2026-07-20T03:00:00.000Z" → "20/07/2026" */
export function fechaCorta(valor) {
  const f = aFechaLocal(valor)
  if (!f) return ''
  const dd = String(f.getDate()).padStart(2, '0')
  const mm = String(f.getMonth() + 1).padStart(2, '0')
  return `${dd}/${mm}/${f.getFullYear()}`
}

/** "2026-07-20" → "20 de julio" */
export function fechaLarga(valor) {
  const f = aFechaLocal(valor)
  if (!f) return ''
  return `${f.getDate()} de ${MESES[f.getMonth()]}`
}

/** Rango de una reserva: "20/07 → 27/07" */
export function rangoFechas(desde, hasta) {
  const a = aFechaLocal(desde)
  const b = aFechaLocal(hasta)
  if (!a || !b) return ''
  const corto = (f) => `${String(f.getDate()).padStart(2, '0')}/${String(f.getMonth() + 1).padStart(2, '0')}`
  return `${corto(a)} → ${corto(b)}`
}

/** "10:00:00" → "10:00" */
export function hora(valor) {
  if (!valor) return ''
  return String(valor).slice(0, 5)
}

const NOMBRES_DIA = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo']

/** Para elegir días: 1 = lunes … 7 = domingo, igual que el backend. */
export const DIAS_SEMANA = NOMBRES_DIA.map((nombre, i) => ({ numero: i + 1, nombre, corto: nombre.slice(0, 3) }))

/** [1, 3, 5] → "Lunes, miércoles y viernes" */
export function textoDias(dias = []) {
  const nombres = [...dias].sort((a, b) => a - b).map(d => NOMBRES_DIA[d - 1]).filter(Boolean)
    .map((n, i) => i === 0 ? n : n.toLowerCase())
  return nombres.length <= 1
    ? (nombres[0] ?? '')
    : `${nombres.slice(0, -1).join(', ')} y ${nombres.at(-1)}`
}

/** [1, 3, 5] → "Lun · Mié · Vie" */
export function diasCortos(dias = []) {
  return [...dias].sort((a, b) => a - b).map(d => NOMBRES_DIA[d - 1]?.slice(0, 3)).filter(Boolean).join(' · ')
}

/** Rango horario: "10:00 - 11:30" */
export function rangoHorario(inicio, fin) {
  if (!inicio || !fin) return ''
  return `${hora(inicio)} - ${hora(fin)}`
}

/** 3000 → "$3.000" (sin decimales, que es como se manejan los precios acá) */
export function precio(valor) {
  const numero = Number(valor ?? 0)
  return '$' + numero.toLocaleString('es-AR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  })
}

/**
 * Monto escrito a mano → número, o NaN si no se entiende.
 *
 * Acepta como se escribe acá ("15.000", "15.000,50", "15000,5") y también el
 * punto decimal con que la API devuelve los precios ("15000.5"). Antes todos
 * los puntos se tomaban como de miles: un precio de 12500.5 guardado sin
 * tocar volvía como 125005.
 *
 * El punto es decimal solo si es el único y lo siguen uno o dos dígitos: con
 * tres ("15.000") es de miles.
 */
export function leerMonto(texto) {
  const limpio = String(texto ?? '').replace(/[\s$]/g, '')
  if (/^\d+\.\d{1,2}$/.test(limpio)) return Number(limpio)
  const normal = limpio.replace(/\./g, '').replace(',', '.')
  return /^\d+(\.\d+)?$/.test(normal) ? Number(normal) : NaN
}

/** Fecha de un pago o registro, con hora: "20/07/2026, 14:30" */
export function fechaHora(valor) {
  if (!valor) return ''
  const f = new Date(valor)
  if (isNaN(f)) return ''
  return f.toLocaleString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

/** Devuelve la fecha de hoy en formato "AAAA-MM-DD", en hora local */
export function hoyISO() {
  const f = new Date()
  const mm = String(f.getMonth() + 1).padStart(2, '0')
  const dd = String(f.getDate()).padStart(2, '0')
  return `${f.getFullYear()}-${mm}-${dd}`
}
