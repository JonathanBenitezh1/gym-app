import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { registrarIngreso, obtenerUltimosIngresos, obtenerFotoUrl } from '../services/puertaService'
import { leerDni } from '../utils/dni'
import { IconoSalir, IconoAlerta } from '../components/Iconos'
import logoDtc from './img/logo_png.png'
import { GIMNASIO } from '../config/gimnasio'

// Cuánto queda el resultado en pantalla antes de volver a "esperando".
const SEGUNDOS_EN_PANTALLA = 10

const COLOR = {
  verde:    { fuerte: 'var(--color-exito)',  bajo: 'var(--color-exito-bajo)' },
  amarillo: { fuerte: 'var(--color-alerta)', bajo: 'var(--color-alerta-bajo)' },
  rojo:     { fuerte: 'var(--color-error)',  bajo: 'var(--color-error-bajo)' }
}

const primerNombre = (nombre = '') => {
  const n = nombre.trim().split(' ')[0] || ''
  return n.charAt(0).toUpperCase() + n.slice(1)
}

/** Lo que dice la pantalla para cada resultado. `sexo` sale del DNI escaneado. */
function mensajeDe(r, sexo) {
  const nombre = primerNombre(r.nombre)
  const saludo = sexo === 'F' ? `¡Bienvenida, ${nombre}!` : sexo === 'M' ? `¡Bienvenido, ${nombre}!` : `¡Hola, ${nombre}!`
  switch (r.resultado) {
    case 'al_dia':
      return { color: 'verde', franja: 'Cuota al día', titulo: saludo, texto: 'Que tengas un buen entrenamiento.' }
    case 'gracia':
      return {
        color: 'amarillo', franja: 'Período de gracia', titulo: saludo,
        texto: 'Que tengas un buen entrenamiento. Recordá ponerte al día con tu cuota.',
        chip: r.dias_restantes === 1 ? 'Te queda 1 día' : `Te quedan ${r.dias_restantes} días`
      }
    case 'personal':
      return { color: 'verde', franja: 'Personal del gimnasio', titulo: saludo, texto: 'Que tengas un buen día.' }
    case 'vencida':
      return { color: 'rojo', franja: 'Cuota vencida', titulo: r.nombre, texto: 'Tu cuota está vencida. Acercate a la administración para regularizarla.' }
    case 'sin_cuota':
      return { color: 'rojo', franja: 'Sin cuota', titulo: r.nombre, texto: 'No tenés una cuota registrada. Acercate a la administración.' }
    case 'baja':
      return { color: 'rojo', franja: 'Dado de baja', titulo: r.nombre, texto: 'Tu usuario está dado de baja. Acercate a la administración.' }
    default:
      return { color: 'rojo', franja: 'DNI no registrado', titulo: `DNI ${r.dni}`, texto: 'Este DNI no está registrado. Acercate a la administración.' }
  }
}

const PASA = ['al_dia', 'gracia', 'personal']

/**
 * Tono corto para que el empleado sepa el resultado sin mirar: dos notas
 * subiendo si pasa, una grave si no. El navegador habilita el audio después
 * de la primera tecla, que es justamente la lectura del DNI.
 */
let audio = null
function sonar(pasa) {
  try {
    audio ??= new AudioContext()
    const notas = pasa ? [660, 880] : [220]
    notas.forEach((frecuencia, i) => {
      const osc = audio.createOscillator()
      const vol = audio.createGain()
      const inicio = audio.currentTime + i * 0.13
      osc.frequency.value = frecuencia
      osc.type = pasa ? 'sine' : 'square'
      vol.gain.setValueAtTime(0.18, inicio)
      vol.gain.exponentialRampToValueAtTime(0.001, inicio + (pasa ? 0.12 : 0.45))
      osc.connect(vol).connect(audio.destination)
      osc.start(inicio)
      osc.stop(inicio + 0.5)
    })
  } catch {
    // Sin audio la pantalla igual funciona
  }
}

const hora = (fecha) => new Date(fecha).toLocaleTimeString('es-AR', { hour: '2-digit', minute: '2-digit' })

export default function Puerta() {
  const { usuario, cerrarSesion } = useAuth()
  const { error: avisarError, confirmar } = useAvisos()
  const navigate = useNavigate()

  const [lectura, setLectura]   = useState('')
  const [actual, setActual]     = useState(null) // { respuesta, sexo, foto }
  const [ultimos, setUltimos]   = useState([])
  const [enviando, setEnviando] = useState(false)
  const campo = useRef(null)
  const temporizador = useRef(null)

  useEffect(() => {
    obtenerUltimosIngresos(8).then(setUltimos).catch(() => {})
  }, [])

  // La foto anterior se libera al cambiar de socio.
  useEffect(() => () => { if (actual?.foto) URL.revokeObjectURL(actual.foto) }, [actual])

  // El campo tiene que estar siempre listo: el lector escribe donde esté el foco.
  const enfocar = useCallback(() => campo.current?.focus(), [])
  useEffect(() => { enfocar() }, [enfocar])

  const procesar = async (e) => {
    e.preventDefault()
    const leido = leerDni(lectura)
    setLectura('')
    if (!leido) {
      sonar(false)
      avisarError('No se pudo leer el DNI. Probá de nuevo o escribí el número.')
      return
    }
    if (enviando) return
    setEnviando(true)
    try {
      const respuesta = await registrarIngreso(leido.dni)
      let foto = null
      if (respuesta.tiene_foto) foto = await obtenerFotoUrl(respuesta.usuario_id).catch(() => null)
      setActual({ respuesta, sexo: leido.sexo, foto })
      sonar(PASA.includes(respuesta.resultado))
      setUltimos(prev => [{ ...respuesta, nombre: respuesta.nombre ?? null }, ...prev].slice(0, 8))
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setActual(null), SEGUNDOS_EN_PANTALLA * 1000)
    } catch (err) {
      sonar(false)
      avisarError(err.response?.data?.error || 'No se pudo consultar. Revisá la conexión.')
    } finally {
      setEnviando(false)
      enfocar()
    }
  }

  const salir = async () => {
    if (await confirmar({ titulo: '¿Cerrar sesión?', textoConfirmar: 'Cerrar sesión' })) {
      cerrarSesion()
      navigate('/')
    } else {
      enfocar()
    }
  }

  const m = actual && mensajeDe(actual.respuesta, actual.sexo)
  const c = m && COLOR[m.color]

  return (
    <div className="flex min-h-screen flex-col" onClick={enfocar}>
      <header
        className="flex items-center justify-between gap-3 px-4 py-3"
        style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}
      >
        <div className="flex items-center gap-3">
          <img src={logoDtc} alt={GIMNASIO.nombre} className="h-9 w-auto" />
          <div>
            <p className="text-sm font-bold leading-tight">Ingreso</p>
            <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>{usuario?.nombre}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {usuario?.rol === 'admin' && (
            <button onClick={() => navigate('/panel-gym')} className="btn btn-contorno btn-chico">Volver al panel</button>
          )}
          <button onClick={salir} className="btn btn-fantasma btn-chico" aria-label="Cerrar sesión"><IconoSalir size={18} /></button>
        </div>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
        <main className="flex flex-col gap-4">
          <form onSubmit={procesar} className="tarjeta p-4">
            <label htmlFor="lectura-dni" className="etiqueta-campo">Pasá el DNI por el lector o escribí el número</label>
            <input
              id="lectura-dni" ref={campo} className="campo text-lg" autoComplete="off" spellCheck="false"
              placeholder="Esperando DNI…" value={lectura} onChange={e => setLectura(e.target.value)}
              onBlur={() => setTimeout(() => {
                // Vuelve al campo salvo que el foco haya ido a un botón o a un diálogo.
                if (!document.activeElement || document.activeElement === document.body) enfocar()
              }, 0)}
            />
          </form>

          {!m ? (
            <div className="tarjeta flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <p className="text-2xl font-bold">Esperando DNI</p>
              <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>
                Acá aparecen la foto, el nombre y el estado de la cuota. Compará la cara con la foto antes de dejar pasar.
              </p>
            </div>
          ) : (
            <section
              aria-live="assertive"
              className="aparecer flex flex-1 flex-col overflow-hidden rounded-2xl"
              style={{ border: `2px solid ${c.fuerte}`, backgroundColor: c.bajo }}
            >
              <div className="px-5 py-3 text-lg font-bold uppercase tracking-wide" style={{ backgroundColor: c.fuerte, color: 'var(--color-fondo)' }}>
                {m.franja}
              </div>
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-6 text-center">
                {actual.respuesta.usuario_id && (
                  actual.foto ? (
                    <img src={actual.foto} alt={`Foto de ${actual.respuesta.nombre}`}
                         className="h-56 w-56 rounded-2xl object-cover" style={{ border: `3px solid ${c.fuerte}` }} />
                  ) : (
                    <div className="flex h-56 w-56 flex-col items-center justify-center gap-2 rounded-2xl text-center"
                         style={{ border: `3px dashed ${c.fuerte}`, color: 'var(--color-texto-2)' }}>
                      <IconoAlerta size={28} />
                      <p className="px-4 text-sm font-semibold">Sin foto cargada</p>
                      <p className="px-4 text-xs">Pedile el DNI y sacale la foto en el mostrador</p>
                    </div>
                  )
                )}
                <p className="text-3xl font-bold">{m.titulo}</p>
                <p className="max-w-xl text-lg" style={{ color: 'var(--color-texto)' }}>{m.texto}</p>
                {m.chip && (
                  <span className="rounded-full px-4 py-1.5 text-base font-bold" style={{ backgroundColor: c.fuerte, color: 'var(--color-fondo)' }}>
                    {m.chip}
                  </span>
                )}
                {actual.respuesta.minutos_desde_ultimo !== undefined && (
                  <p className="flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold"
                     style={{ backgroundColor: 'var(--color-error-bajo)', color: 'var(--color-error)' }}>
                    <IconoAlerta size={16} />
                    Ya ingresó hace {actual.respuesta.minutos_desde_ultimo === 0 ? 'menos de un minuto' : `${actual.respuesta.minutos_desde_ultimo} min`}. Revisá que sea la misma persona.
                  </p>
                )}
              </div>
            </section>
          )}
        </main>

        <aside className="tarjeta h-fit p-4">
          <h2 className="titulo-seccion mb-2">Últimos ingresos</h2>
          {ultimos.length === 0 ? (
            <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>Todavía no hay ingresos.</p>
          ) : (
            <ul className="flex flex-col">
              {ultimos.map(i => {
                const pasa = PASA.includes(i.resultado)
                return (
                  <li key={i.id} className="flex items-center justify-between gap-2 py-2 text-sm"
                      style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="h-2 w-2 shrink-0 rounded-full"
                            style={{ backgroundColor: i.resultado === 'gracia' ? 'var(--color-alerta)' : pasa ? 'var(--color-exito)' : 'var(--color-error)' }} />
                      <span className="truncate">{i.nombre || `DNI ${i.dni}`}</span>
                    </span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--color-texto-3)' }}>{hora(i.created_at)}</span>
                  </li>
                )
              })}
            </ul>
          )}
        </aside>
      </div>
    </div>
  )
}
