import { recordado, recordar } from './memoria'
import { obtenerMisReservas } from '../services/clasesService'
import { obtenerPerfil, obtenerHistorialPagos, obtenerMiCuota, obtenerMisPagosCuota } from '../services/perfilService'
import { obtenerMisRutinas } from '../services/profesorService'
import { obtenerMiProgreso } from '../services/progresoService'
import {
  obtenerCuotas, obtenerPlanesAdmin, obtenerRiesgo, obtenerCaja, obtenerEstadisticas, obtenerActividad
} from '../services/adminService'
import { hoyISO } from './formato'

/**
 * Precarga de las pantallas del socio y del panel (27/09/2026).
 *
 * Cada pantalla muestra al instante lo último que tuvo (utils/memoria.js),
 * pero la primera vez que se abre en la sesión no tiene nada y parpadea: vacía,
 * barras, datos. Con esto, apenas termina de cargar Clases se piden por
 * detrás los datos de Pagos, Rutinas y Perfil, con la misma forma que guarda
 * cada pantalla. Cuando el socio las abre, ya están.
 *
 * Una vez por usuario y apertura de la app. Lo que falla no avisa: la
 * pantalla lo vuelve a pedir al abrirse, como siempre.
 */

let hechaPara = null

export function precargarSocio(usuarioId) {
  if (!usuarioId || hechaPara === usuarioId) return
  hechaPara = usuarioId

  const pedir = async () => {
    const [reservas, perfil, pagos, cuota, pagosCuota, rutinas, progreso] = (await Promise.allSettled([
      obtenerMisReservas(), obtenerPerfil(), obtenerHistorialPagos(),
      obtenerMiCuota(), obtenerMisPagosCuota(), obtenerMisRutinas(), obtenerMiProgreso()
    ])).map(r => (r.status === 'fulfilled' ? r.value : undefined))

    // Otra persona entró en el medio: lo pedido no es de ella.
    if (hechaPara !== usuarioId) return

    // Lo que una pantalla ya guardó es más nuevo: no se pisa.
    if (reservas && !recordado('reservas')) recordar('reservas', reservas)
    if (perfil && !recordado('perfil')) {
      recordar('perfil', {
        perfil,
        reservas: reservas ?? [],
        pagos: pagos ?? [],
        cuota: cuota && cuota.estado !== 'personal' ? cuota : null,
        pagosCuota: pagosCuota ?? []
      })
    }
    if (rutinas && !recordado('rutinas')) recordar('rutinas', rutinas)
    if (progreso && !recordado('progreso')) recordar('progreso', progreso)
  }

  // Cuando el teléfono está libre: no compite con la pantalla que se está mirando.
  const cuandoPueda = window.requestIdleCallback ?? ((f) => setTimeout(f, 800))
  cuandoPueda(() => { pedir() })
}

/**
 * Lo mismo para el panel del admin: con el tablero en pantalla se traen
 * Cuotas, En riesgo, Caja de hoy, Estadísticas, Planes y Actividad, con las
 * claves que usa cada sección.
 */
let hechaAdminPara = null

export function precargarAdmin(usuarioId) {
  if (!usuarioId || hechaAdminPara === usuarioId) return
  hechaAdminPara = usuarioId

  const pedir = async () => {
    const hoy = hoyISO()
    const [cuotas, planes, riesgo, caja, estadisticas, actividad] = (await Promise.allSettled([
      obtenerCuotas(), obtenerPlanesAdmin(), obtenerRiesgo(10), obtenerCaja(hoy), obtenerEstadisticas(),
      obtenerActividad(150)
    ])).map(r => (r.status === 'fulfilled' ? r.value : undefined))

    if (hechaAdminPara !== usuarioId) return

    if (cuotas && planes && !recordado('panel.cuotas')) recordar('panel.cuotas', { cuotas, planes })
    if (planes && !recordado('panel.planes')) recordar('panel.planes', planes)
    if (riesgo && !recordado('panel.riesgo.10')) recordar('panel.riesgo.10', riesgo)
    if (caja && !recordado(`panel.caja.${hoy}`)) recordar(`panel.caja.${hoy}`, caja)
    if (estadisticas && !recordado('panel.estadisticas')) recordar('panel.estadisticas', estadisticas)
    if (actividad && !recordado('panel.actividad')) recordar('panel.actividad', actividad)
  }

  const cuandoPueda = window.requestIdleCallback ?? ((f) => setTimeout(f, 800))
  cuandoPueda(() => { pedir() })
}

/** Al salir o entrar con otra cuenta. */
export function olvidarPrecarga() {
  hechaPara = null
  hechaAdminPara = null
}
