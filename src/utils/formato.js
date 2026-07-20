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
