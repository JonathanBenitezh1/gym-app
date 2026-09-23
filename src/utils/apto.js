import { fechaCorta, hoyISO } from './formato'

// Cuántos días antes del vencimiento se empieza a avisar.
export const DIAS_AVISO_APTO = 15

/**
 * Estado del apto médico a partir de su vencimiento ("AAAA-MM-DD" o null).
 * Las fechas se comparan como texto: el formato ISO ordena igual que el
 * calendario, y así no se mezclan zonas horarias.
 */
export function estadoApto(vence) {
  if (!vence) {
    return { tipo: 'falta', texto: 'Sin apto médico', insignia: 'insignia-error' }
  }
  const hoy = hoyISO()
  if (vence < hoy) {
    return { tipo: 'vencido', texto: `Apto vencido el ${fechaCorta(vence)}`, insignia: 'insignia-error' }
  }
  const limite = new Date()
  limite.setDate(limite.getDate() + DIAS_AVISO_APTO)
  const iso = `${limite.getFullYear()}-${String(limite.getMonth() + 1).padStart(2, '0')}-${String(limite.getDate()).padStart(2, '0')}`
  if (vence <= iso) {
    return { tipo: 'porVencer', texto: `Apto vence el ${fechaCorta(vence)}`, insignia: 'insignia-alerta' }
  }
  return { tipo: 'vigente', texto: `Apto hasta ${fechaCorta(vence)}`, insignia: 'insignia-exito' }
}
