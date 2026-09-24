import { useState, useEffect, useCallback } from 'react'
import { miTurno, marcarLlegada, marcarSalida } from '../services/presenciaService'
import { IconoCheck, IconoSalir } from './Iconos'

const hora = (valor) =>
  new Date(valor).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit', hour12: false })

/**
 * El profe marca que llegó al gimnasio. Mientras el turno esté abierto, los
 * socios lo ven en la pantalla de clases.
 *
 * El texto es corto a propósito: vive en el encabezado, que en un teléfono
 * comparte la fila con el logo y el botón de salir.
 */
export default function BotonPresencia({ alExito, alError }) {
  const [turno, setTurno]       = useState(null)
  const [cargado, setCargado]   = useState(false)
  const [enviando, setEnviando] = useState(false)

  const cargar = useCallback(async () => {
    try {
      setTurno(await miTurno())
    } catch {
      // Sin el turno cargado, el botón igual sirve para marcar la llegada.
    } finally {
      setCargado(true)
    }
  }, [])

  useEffect(() => { cargar() }, [cargar])

  const alternar = async () => {
    setEnviando(true)
    try {
      if (turno) {
        await marcarSalida()
        setTurno(null)
        alExito('Marcaste tu salida')
      } else {
        setTurno(await marcarLlegada())
        alExito('Listo, los socios ya ven que estás en el gimnasio')
      }
    } catch (err) {
      alError(err.response?.data?.error || 'No se pudo actualizar tu presencia')
      await cargar()
    } finally {
      setEnviando(false)
    }
  }

  // Mientras carga se reserva el lugar del botón, invisible. Antes no se
  // dibujaba nada y el encabezado saltaba cuando el botón aparecía.
  if (!cargado) {
    return (
      <span className="btn btn-chico btn-primario" style={{ visibility: 'hidden' }} aria-hidden="true">
        <IconoCheck size={15} /> Llegué
      </span>
    )
  }

  return (
    <button
      onClick={alternar}
      disabled={enviando}
      className={`btn btn-chico whitespace-nowrap ${turno ? 'btn-contorno' : 'btn-primario'}`}
      title={turno ? `En el gimnasio desde las ${hora(turno.inicio)}` : 'Avisar a los socios que llegaste'}
    >
      {turno ? <IconoSalir size={15} /> : <IconoCheck size={15} />}
      {turno
        ? <>Me voy<span className="hidden sm:inline"> · {hora(turno.inicio)}</span></>
        : 'Llegué'}
    </button>
  )
}
