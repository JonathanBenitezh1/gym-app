/**
 * El período que reserva la pantalla de clases: desde el próximo lunes, una
 * semana. `fecha_fin` es el lunes siguiente y no cuenta: la semanal de un
 * lunes va de ese lunes al domingo. (La quincenal salió el 25/09/2026: lo
 * mensual es un plan con lugar fijo.)
 *
 * Es la misma cuenta que hace el servidor (utils/cupos.js) y se hace con el
 * día de Argentina, no con el del teléfono. Sin dependencias, para poder
 * probarla con Node.
 */

const UN_DIA = 24 * 60 * 60 * 1000
const DIAS = { semanal: 7 }

const hoyEnArgentina = () =>
  new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Argentina/Buenos_Aires', year: 'numeric', month: '2-digit', day: '2-digit'
  }).format(new Date())

const sumarDias = (texto, dias) =>
  new Date(Date.parse(`${texto}T00:00:00Z`) + dias * UN_DIA).toISOString().slice(0, 10)

export function periodoDeReserva(tipo = 'semanal', hoy = hoyEnArgentina()) {
  const diaSemana = new Date(`${hoy}T00:00:00Z`).getUTCDay() // 0 = domingo
  const fecha_inicio = sumarDias(hoy, diaSemana === 0 ? 1 : 8 - diaSemana)
  return { fecha_inicio, fecha_fin: sumarDias(fecha_inicio, DIAS[tipo] ?? 7) }
}

/** "del lunes 28/09 al domingo 04/10" */
export function textoPeriodo({ fecha_inicio, fecha_fin }) {
  const corto = (texto) => `${texto.slice(8, 10)}/${texto.slice(5, 7)}`
  return `del lunes ${corto(fecha_inicio)} al domingo ${corto(sumarDias(fecha_fin, -1))}`
}
