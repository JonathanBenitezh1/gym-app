/**
 * Links de WhatsApp con el mensaje ya escrito.
 *
 * No hay integración con la API de WhatsApp: se abre el chat y la persona le
 * da enviar. Sin costo, sin cuenta de Meta y sin esperar aprobaciones.
 */

import { GIMNASIO } from '../config/gimnasio'
import { telefonoWhatsapp } from './telefono'
import { precio, hora } from './formato'

const NUMERO_GIMNASIO = import.meta.env.VITE_WHATSAPP || GIMNASIO.whatsapp

/** Link de wa.me con el mensaje ya escrito. null si el teléfono no sirve. */
export function linkWhatsapp(telefono, mensaje) {
  const numero = telefonoWhatsapp(telefono)
  if (!numero) return null
  return `https://wa.me/${numero}?text=${encodeURIComponent(mensaje)}`
}

/** Botón de contacto del socio al gimnasio. null si no hay número cargado. */
export function linkContactoGimnasio() {
  return linkWhatsapp(
    NUMERO_GIMNASIO,
    `Hola! Te escribo desde la app de ${GIMNASIO.nombreCorto}.`
  )
}

const primerNombre = (nombre) => String(nombre || '').trim().split(' ')[0]

/** Recordatorio para quien reservó y todavía no pagó. */
export function mensajePagoPendiente(reserva) {
  const cuando = [reserva.dia_semana, reserva.hora_inicio && hora(reserva.hora_inicio)]
    .filter(Boolean)
    .join(' ')

  return (
    `Hola ${primerNombre(reserva.alumno)}! Te escribimos de ${GIMNASIO.nombreCorto}. ` +
    `Te recordamos que tenés pendiente el pago de tu reserva de ${reserva.clase}` +
    (cuando ? ` (${cuando})` : '') +
    `, por ${precio(reserva.total)}. ` +
    `Podés abonarlo en el gimnasio. ¡Te esperamos!`
  )
}

/** Recordatorio de cuota, en gracia o vencida. */
export function mensajeCuota(socio) {
  const saludo = `Hola ${primerNombre(socio.nombre)}! Te escribimos de ${GIMNASIO.nombreCorto}. `
  if (socio.estado === 'gracia') {
    return saludo +
      `Tu cuota venció y te ${socio.dias_restantes === 1 ? 'queda 1 día' : `quedan ${socio.dias_restantes} días`} ` +
      `para ponerte al día sin que se te corte el ingreso. ¡Te esperamos!`
  }
  return saludo + 'Tu cuota está vencida. Acercate a la administración para regularizarla. ¡Te esperamos!'
}
