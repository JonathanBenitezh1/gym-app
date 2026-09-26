import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { obtenerMiCuota, obtenerPerfil } from '../services/perfilService'
import { obtenerMiEspera } from '../services/clasesService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { IconoCampana } from './Iconos'
import { armarAvisos } from '../utils/avisos'

/**
 * Campanita con los avisos del socio (pedido del gimnasio, 26/09/2026). Antes
 * eran carteles en la pantalla de clases; ahora esa pantalla muestra solo el
 * profe que está en el gimnasio, y los avisos quedan acá:
 *
 * - el plan en gracia o vencido,
 * - el plan pedido que falta pagar,
 * - el apto médico que falta, venció o vence pronto,
 * - un lugar que se liberó en una clase donde estaba en lista de espera.
 *
 * El número cuenta los que todavía no vio: al abrirla quedan vistos. Un aviso
 * que cambia (otra fecha, otro plan) vuelve a contar como nuevo.
 */

const CLAVE_VISTOS = 'avisos.vistos'

const leerVistos = () => {
  try { return JSON.parse(localStorage.getItem(CLAVE_VISTOS)) ?? [] } catch { return [] }
}
const guardarVistos = (ids) => {
  try { localStorage.setItem(CLAVE_VISTOS, JSON.stringify(ids)) } catch { /* sin guardar: vuelven a contar */ }
}

const COLOR = {
  error:  { borde: 'var(--color-error)',  fondo: 'var(--color-error-bajo)',  texto: 'var(--color-error)' },
  alerta: { borde: 'var(--color-alerta)', fondo: 'var(--color-alerta-bajo)', texto: 'var(--color-alerta)' },
  exito:  { borde: 'var(--color-exito)',  fondo: 'var(--color-exito-bajo)',  texto: 'var(--color-exito)' },
  acento: { borde: 'var(--color-acento)', fondo: 'var(--color-acento-bajo)', texto: 'var(--color-acento)' }
}

export default function CampanaAvisos() {
  const navigate = useNavigate()
  const [avisos, setAvisos] = useState([])
  const [vistos, setVistos] = useState(leerVistos)
  const [abierta, setAbierta] = useState(false)
  const [arriba, setArriba] = useState(60)
  const caja = useRef(null)

  // Todo es secundario: lo que falla, no avisa.
  const cargar = useCallback(async () => {
    const [cuota, perfil, espera] = await Promise.allSettled([obtenerMiCuota(), obtenerPerfil(), obtenerMiEspera()])
    setAvisos(armarAvisos({
      cuota: cuota.status === 'fulfilled' ? cuota.value : null,
      perfil: perfil.status === 'fulfilled' ? perfil.value : null,
      espera: espera.status === 'fulfilled' ? espera.value : []
    }))
  }, [])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({
    cuota_actualizada: cargar,
    cupo_liberado: cargar,
    actualizacion_horarios: cargar
  })

  // Se cierra tocando afuera o con Escape.
  useEffect(() => {
    if (!abierta) return
    const afuera = (e) => { if (caja.current && !caja.current.contains(e.target)) setAbierta(false) }
    const escape = (e) => { if (e.key === 'Escape') setAbierta(false) }
    document.addEventListener('pointerdown', afuera)
    document.addEventListener('keydown', escape)
    return () => {
      document.removeEventListener('pointerdown', afuera)
      document.removeEventListener('keydown', escape)
    }
  }, [abierta])

  const nuevos = avisos.filter(a => !vistos.includes(a.id)).length

  const alternar = () => {
    if (!abierta) {
      // Al abrir quedan vistos. Se guardan solo los de ahora, para que la
      // lista no crezca para siempre.
      const ids = avisos.map(a => a.id)
      guardarVistos(ids)
      setVistos(ids)
      // El panel va justo debajo de la barra.
      setArriba(caja.current.getBoundingClientRect().bottom + 8)
    }
    setAbierta(a => !a)
  }

  return (
    <div ref={caja} className="relative">
      <button
        type="button"
        onClick={alternar}
        aria-expanded={abierta}
        aria-label={nuevos > 0 ? `Avisos, ${nuevos} ${nuevos === 1 ? 'nuevo' : 'nuevos'}` : 'Avisos'}
        className="btn btn-fantasma btn-chico relative"
        style={{ paddingInline: '.5rem' }}
      >
        <IconoCampana size={21} />
        {nuevos > 0 && (
          <span
            className="absolute -right-0.5 -top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold"
            style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
          >
            {nuevos}
          </span>
        )}
      </button>

      {/* Fijo a la pantalla y no a la campana: la campana no está en el borde
          (a la derecha va el saludo) y anclado a ella se salía por la izquierda. */}
      {abierta && (
        <div
          className="aparecer fixed left-4 right-4 z-50 ml-auto flex max-h-[70vh] max-w-[22rem] flex-col gap-2 overflow-y-auto rounded-2xl p-3"
          style={{
            top: arriba,
            backgroundColor: 'var(--color-elevado)', border: '1px solid var(--color-linea)', boxShadow: '0 12px 32px rgba(0,0,0,.45)'
          }}
          role="dialog"
          aria-label="Avisos"
        >
          <p className="titulo-seccion px-1">Avisos</p>
          {avisos.length === 0 ? (
            <p className="px-1 py-3 text-sm" style={{ color: 'var(--color-texto-2)' }}>No tenés avisos. Todo en orden.</p>
          ) : avisos.map(a => (
            <div
              key={a.id}
              className="rounded-xl p-3"
              style={{ border: `1px solid ${COLOR[a.tono].borde}`, backgroundColor: COLOR[a.tono].fondo }}
            >
              <p className="text-sm font-semibold" style={{ color: COLOR[a.tono].texto }}>{a.titulo}</p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>{a.texto}</p>
              {a.ir && (
                <button onClick={() => { setAbierta(false); navigate(a.ir) }} className="btn btn-contorno btn-chico mt-2">
                  Ver clases
                </button>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
