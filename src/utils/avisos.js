import { estadoApto } from './apto'
import { fechaCorta, textoDias, rangoHorario } from './formato'

/**
 * Los avisos de la campanita del socio (components/CampanaAvisos.jsx), armados
 * con su cuota, su perfil y su lista de espera. Sin React: se puede probar con
 * Node.
 */

/** Los avisos de hoy, con un id que cambia cuando cambia el aviso. */
export function armarAvisos({ cuota, perfil, espera = [] }) {
  const avisos = []

  if (cuota?.plan && cuota.estado === 'gracia') {
    const quedan = cuota.dias_restantes === 1 ? 'te queda 1 día' : `te quedan ${cuota.dias_restantes} días`
    avisos.push({
      id: `plan-gracia-${cuota.cuota_vence}`, tono: 'alerta',
      titulo: `Tu plan venció: ${quedan} para ponerte al día`,
      texto: `Venció el ${fechaCorta(cuota.cuota_vence)}. Pasado ese plazo no vas a poder ingresar y se liberan tus lugares fijos.`
    })
  }
  if (cuota?.plan && cuota.estado === 'vencida') {
    avisos.push({
      id: `plan-vencido-${cuota.cuota_vence}`, tono: 'error',
      titulo: `Tu plan ${cuota.plan} está vencido`,
      texto: 'Tus lugares fijos se liberaron. Pagalo en el gimnasio para volver a elegir tus horarios.'
    })
  }
  if (cuota?.plan_pedido) {
    avisos.push({
      id: `pedido-${cuota.plan_pedido_id}`, tono: 'acento',
      titulo: `Pediste el plan ${cuota.plan_pedido}`,
      texto: 'Pagalo en el gimnasio y queda activo.'
    })
  }

  if (perfil?.rol === 'alumno') {
    const apto = estadoApto(perfil.apto_vence)
    if (apto.tipo !== 'vigente') {
      avisos.push({
        id: `apto-${apto.tipo}-${perfil.apto_vence ?? 'nunca'}`,
        tono: apto.tipo === 'porVencer' ? 'alerta' : 'error',
        titulo: apto.texto,
        texto: {
          falta:     'Todavía no registramos tu apto médico. Traé el certificado al gimnasio.',
          vencido:   'Traé el certificado nuevo al gimnasio para renovarlo.',
          porVencer: 'Acordate de traer el certificado nuevo antes de esa fecha.'
        }[apto.tipo]
      })
    }
  }

  for (const e of espera) {
    if (e.cupos_disponibles > 0) {
      avisos.push({
        id: `lugar-${e.horario_id}`, tono: 'exito',
        titulo: '¡Se liberó un lugar!',
        texto: `${e.clase}, ${textoDias(e.dias).toLowerCase()} ${rangoHorario(e.hora_inicio, e.hora_fin)}. Es del primero que lo toma.`,
        ir: '/horarios'
      })
    }
  }

  return avisos
}
