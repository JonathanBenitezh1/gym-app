import { recordado, recordar } from './memoria'
import { obtenerMisReservas } from '../services/clasesService'
import { obtenerPerfil, obtenerHistorialPagos, obtenerMiCuota, obtenerMisPagosCuota } from '../services/perfilService'
import { obtenerMisRutinas } from '../services/profesorService'
import { obtenerMiProgreso } from '../services/progresoService'

/**
 * Precarga de las pantallas del socio (27/09/2026).
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

/** Al salir o entrar con otra cuenta. */
export function olvidarPrecarga() {
  hechaPara = null
}
