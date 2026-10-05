import axios from 'axios'
import { salidaForzada } from '../utils/salida'

axios.interceptors.response.use(
  response => {
    // Términos nuevos sin aceptar, con la sesión abierta de antes: el
    // servidor lo marca en la respuesta y AuthContext interpone la pantalla.
    const legal = Number(response.headers?.['x-legal-pendiente'])
    if (legal > 0) {
      window.dispatchEvent(new CustomEvent('legal-pendiente', { detail: legal }))
    }
    return response
  },
  async error => {
    const estado = error.response?.status
    const codigo = error.response?.data?.codigo

    // 401 es token ausente, vencido o invalido: no hay sesion que sostener.
    // La lista de socios de la puerta se borra antes de salir, igual que al
    // cerrar sesion a mano.
    //
    // Solo cuenta si el pedido llevaba token. El login con una clave mala
    // tambien da 401, y antes eso recargaba la pagina: el mensaje de "email
    // o contraseña incorrectos" no se llegaba a ver.
    //
    // Desde el 27/09/2026 el servidor dice por qué (entró en otro
    // dispositivo, venció, cambió la clave): la pantalla de ingreso lo muestra.
    //
    // Y solo si el pedido era de la sesión de ahora: en un celular compartido,
    // un pedido lento del que acaba de salir volvía 401 y sacaba al que
    // recién entraba (auditoría del 04/10/2026).
    const enviado = error.config?.headers?.Authorization
    const conSesion = Boolean(enviado) && enviado === `Bearer ${localStorage.getItem('token')}`
    if (estado === 401 && conSesion) {
      salidaForzada(error.response?.data?.motivo, error.response?.data?.error)
      return Promise.reject(error)
    }

    // Todavia usa la clave temporal. No se cierra la sesion: se marca, y
    // RutaProtegida interpone la pantalla de cambio obligatorio.
    if (estado === 403 && codigo === 'DEBE_CAMBIAR_PASSWORD') {
      try {
        const guardado = JSON.parse(localStorage.getItem('usuario'))
        if (guardado) {
          guardado.debe_cambiar_password = true
          localStorage.setItem('usuario', JSON.stringify(guardado))
          window.location.reload()
        }
      } catch {
        // Si el dato guardado esta roto, el proximo 401 limpia la sesion.
      }
      return Promise.reject(error)
    }

    // Cualquier otro 403 es una accion no permitida, no una sesion vencida.
    // Antes tambien cerraba la sesion: un profesor que tocaba un horario
    // ajeno quedaba afuera de la app sin entender por que.
    return Promise.reject(error)
  }
)

export default axios