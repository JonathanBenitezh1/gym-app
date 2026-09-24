import axios from 'axios'
import { borrarDatosDeLaPuerta } from '../utils/puertaLocal'

axios.interceptors.response.use(
  response => response,
  async error => {
    const estado = error.response?.status
    const codigo = error.response?.data?.codigo

    // 401 es token ausente, vencido o invalido: no hay sesion que sostener.
    // La lista de socios de la puerta se borra antes de salir, igual que al
    // cerrar sesion a mano.
    if (estado === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      await borrarDatosDeLaPuerta()
      window.location.href = '/'
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