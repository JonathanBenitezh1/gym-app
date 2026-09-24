import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { registrarIngreso, obtenerUltimosIngresos, obtenerFotoBlob, obtenerPadron, mandarLote } from '../services/puertaService'
import {
  guardarPadron, leerPadron, decidirSinConexion, versionFoto,
  pendientes, encolar, quitarPendientes, idLocal,
  fotoGuardada, guardarFoto
} from '../utils/puertaLocal'
import { leerDni } from '../utils/dni'
import { IconoSalir, IconoAlerta } from '../components/Iconos'
import logoDtc from './img/logo_png.png'
import { GIMNASIO } from '../config/gimnasio'

// Cuánto queda el resultado en pantalla antes de volver a "esperando".
const SEGUNDOS_EN_PANTALLA = 10
// Cada cuánto se baja la lista de socios y se mandan los ingresos pendientes.
const MINUTOS_PADRON = 5
const SEGUNDOS_SINCRONIZAR = 30
// Igual que en el servidor: un segundo ingreso dentro de este lapso se marca.
const MINUTOS_REINGRESO = 120

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
  const formulario = useRef(null)
  const espera = useRef(null)
  const temporizador = useRef(null)
  const [enLinea, setEnLinea]         = useState(true)
  const [porMandar, setPorMandar]     = useState(() => pendientes().length)
  const [padronDesde, setPadronDesde] = useState(() => leerPadron()?.generado ?? null)

  useEffect(() => {
    obtenerUltimosIngresos(8).then(setUltimos).catch(() => {})
  }, [])

  // La lista de socios se mantiene al día para poder seguir sin internet.
  const actualizarPadron = useCallback(async () => {
    try {
      const padron = await obtenerPadron()
      guardarPadron(padron)
      setPadronDesde(padron.generado)
      setEnLinea(true)
    } catch (err) {
      if (!err.response) setEnLinea(false)
    }
  }, [])

  // Manda lo anotado sin conexión, de a 500.
  const sincronizar = useCallback(async () => {
    let lista = pendientes()
    while (lista.length > 0) {
      const tanda = lista.slice(0, 500)
      try {
        await mandarLote(tanda)
        quitarPendientes(tanda.map(i => i.id_local))
        setEnLinea(true)
      } catch (err) {
        if (!err.response) setEnLinea(false)
        break
      }
      lista = pendientes()
    }
    setPorMandar(pendientes().length)
  }, [])

  useEffect(() => {
    actualizarPadron()
    sincronizar()
    const padron = setInterval(actualizarPadron, MINUTOS_PADRON * 60 * 1000)
    const envio = setInterval(sincronizar, SEGUNDOS_SINCRONIZAR * 1000)
    const volvio = () => { actualizarPadron(); sincronizar() }
    window.addEventListener('online', volvio)
    return () => { clearInterval(padron); clearInterval(envio); window.removeEventListener('online', volvio) }
  }, [actualizarPadron, sincronizar])

  /** Foto guardada en la PC si la versión coincide; si no, la baja y la guarda. */
  const traerFoto = async (respuesta, conConexion) => {
    if (!respuesta.tiene_foto) return null
    const version = versionFoto(respuesta.usuario_id, leerPadron())
    if (version) {
      const guardada = await fotoGuardada(respuesta.usuario_id, version)
      if (guardada) return guardada
    }
    if (!conConexion) return null
    try {
      const blob = await obtenerFotoBlob(respuesta.usuario_id)
      if (version) guardarFoto(respuesta.usuario_id, version, blob)
      return URL.createObjectURL(blob)
    } catch {
      return null
    }
  }

  // La foto anterior se libera al cambiar de socio.
  useEffect(() => () => { if (actual?.foto) URL.revokeObjectURL(actual.foto) }, [actual])

  // El campo tiene que estar siempre listo: el lector escribe donde esté el foco.
  const enfocar = useCallback(() => campo.current?.focus(), [])
  useEffect(() => { enfocar() }, [enfocar])

  // Algunos lectores no mandan Enter al terminar. Cuando llega un código de
  // DNI completo y el lector deja de escribir, se procesa solo.
  const cambiarLectura = (valor) => {
    setLectura(valor)
    clearTimeout(espera.current)
    const separadores = (valor.match(/[@"]/g) || []).length
    if (separadores >= 4) {
      espera.current = setTimeout(() => {
        sinEnter.current = true
        formulario.current?.requestSubmit()
      }, 300)
    }
  }

  // Modo para configurar un lector nuevo: muestra lo que manda y lo que
  // entiende la app, sin registrar ingresos ni consultar al servidor.
  const [prueba, setPrueba] = useState(false)
  const [diagnostico, setDiagnostico] = useState(null)
  const sinEnter = useRef(false)

  // Lecturas que llegan mientras se atiende otra. Antes se descartaban: sin
  // internet la consulta tarda unos segundos y el siguiente DNI se perdía.
  const cola = useRef([])
  const atendiendo = useRef(false)

  const procesar = async (e) => {
    e.preventDefault()
    clearTimeout(espera.current)
    const leido = leerDni(lectura)
    setLectura('')
    const llegoSinEnter = sinEnter.current
    sinEnter.current = false
    if (prueba) {
      setDiagnostico({ crudo: lectura, leido, llegoSinEnter })
      sonar(Boolean(leido))
      return
    }
    if (!leido) {
      sonar(false)
      avisarError('No se pudo leer el DNI. Probá de nuevo o escribí el número.')
      return
    }
    cola.current.push(leido)
    if (atendiendo.current) return
    atendiendo.current = true
    setEnviando(true)
    while (cola.current.length > 0) await atender(cola.current.shift())
    atendiendo.current = false
    setEnviando(false)
    enfocar()
  }

  const atender = async (leido) => {
    try {
      let respuesta
      let sinConexion = false
      try {
        respuesta = await registrarIngreso(leido.dni)
        setEnLinea(true)
      } catch (err) {
        // Con respuesta del servidor es un error de verdad; sin respuesta, se
        // cortó internet y se decide con la lista guardada.
        if (err.response) throw err
        const padron = leerPadron()
        if (!padron) throw new Error('Sin conexión y todavía no hay una lista de socios guardada en esta PC.')
        setEnLinea(false)
        sinConexion = true
        const ahora = new Date().toISOString()
        respuesta = { ...decidirSinConexion(leido.dni, padron), id: idLocal(), created_at: ahora }
        const previo = [...pendientes().map(i => ({ ...i, created_at: i.fecha })), ...ultimos]
          .filter(i => i.dni === leido.dni && PASA.includes(i.resultado))
          .map(i => (Date.now() - Date.parse(i.created_at)) / 60000)
          .filter(min => min < MINUTOS_REINGRESO)
          .sort((a, b) => a - b)[0]
        if (previo !== undefined && PASA.includes(respuesta.resultado)) respuesta.minutos_desde_ultimo = Math.floor(previo)
        encolar({ id_local: respuesta.id, dni: leido.dni, resultado: respuesta.resultado, fecha: ahora })
        setPorMandar(pendientes().length)
      }
      const foto = await traerFoto(respuesta, !sinConexion)
      setActual({ respuesta, sexo: leido.sexo, foto, sinConexion })
      sonar(PASA.includes(respuesta.resultado))
      setUltimos(prev => [{ ...respuesta, nombre: respuesta.nombre ?? null }, ...prev].slice(0, 8))
      clearTimeout(temporizador.current)
      temporizador.current = setTimeout(() => setActual(null), SEGUNDOS_EN_PANTALLA * 1000)
    } catch (err) {
      sonar(false)
      avisarError(err.response?.data?.error || err.message || 'No se pudo consultar. Revisá la conexión.')
    }
  }

  const salir = async () => {
    const aviso = porMandar > 0
      ? `Hay ${porMandar} ingresos anotados sin conexión que todavía no se mandaron. Quedan guardados y se mandan cuando alguien vuelva a entrar en esta PC.`
      : undefined
    if (await confirmar({ titulo: '¿Cerrar sesión?', mensaje: aviso, textoConfirmar: 'Cerrar sesión' })) {
      // cerrarSesion borra la lista de socios y las fotos de esta PC.
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
          <EstadoConexion enLinea={enLinea} porMandar={porMandar} padronDesde={padronDesde} />
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setPrueba(v => !v); setDiagnostico(null); setActual(null) }}
            className={`btn btn-chico ${prueba ? 'btn-primario' : 'btn-fantasma'}`}
            aria-pressed={prueba}
          >
            {prueba ? 'Salir de la prueba' : 'Probar lector'}
          </button>
          {usuario?.rol === 'admin' && (
            <button onClick={() => navigate('/panel-gym')} className="btn btn-contorno btn-chico">Volver al panel</button>
          )}
          <button onClick={salir} className="btn btn-fantasma btn-chico" aria-label="Cerrar sesión"><IconoSalir size={18} /></button>
        </div>
      </header>

      <div className="grid flex-1 gap-4 p-4 lg:grid-cols-[1fr_300px]">
        <main className="flex flex-col gap-4">
          <form ref={formulario} onSubmit={procesar} className="tarjeta p-4">
            <label htmlFor="lectura-dni" className="etiqueta-campo">Pasá el DNI por el lector, o escribí el número y apretá Enter{enviando && ' · consultando…'}</label>
            <input
              id="lectura-dni" ref={campo} className="campo text-lg" autoComplete="off" spellCheck="false"
              placeholder="Esperando DNI…" value={lectura} onChange={e => cambiarLectura(e.target.value)}
              onBlur={() => setTimeout(() => {
                // Vuelve al campo salvo que el foco haya ido a un botón o a un diálogo.
                if (!document.activeElement || document.activeElement === document.body) enfocar()
              }, 0)}
            />
          </form>

          {prueba ? (
            <PruebaLector diagnostico={diagnostico} />
          ) : !m ? (
            <div className="tarjeta flex flex-1 flex-col items-center justify-center gap-2 p-10 text-center">
              <p className="text-2xl font-bold">Apoyá tu DNI en el lector</p>
              <p className="text-lg" style={{ color: 'var(--color-texto-2)' }}>o escribí tu número en el teclado y apretá Enter</p>
              <p className="mt-4 text-sm" style={{ color: 'var(--color-texto-3)' }}>
                Recepción: compará la cara con la foto antes de dejar pasar.
              </p>
            </div>
          ) : (
            <section
              aria-live="assertive"
              className="aparecer flex flex-1 flex-col overflow-hidden rounded-2xl"
              style={{ border: `2px solid ${c.fuerte}`, backgroundColor: c.bajo }}
            >
              <div className="flex items-center justify-between gap-3 px-5 py-3 text-lg font-bold uppercase tracking-wide" style={{ backgroundColor: c.fuerte, color: 'var(--color-fondo)' }}>
                <span>{m.franja}</span>
                {actual.sinConexion && <span className="text-xs normal-case">Sin conexión · con la última lista guardada</span>}
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

/** Pastilla del encabezado: si hay internet, y si quedó algo por mandar. */
function EstadoConexion({ enLinea, porMandar, padronDesde }) {
  // La antigüedad de la lista se recalcula sola cada medio minuto.
  const [ahora, setAhora] = useState(() => Date.now())
  useEffect(() => {
    const reloj = setInterval(() => setAhora(Date.now()), 30000)
    return () => clearInterval(reloj)
  }, [])
  const minutos = padronDesde ? Math.max(0, Math.round((ahora - Date.parse(padronDesde)) / 60000)) : null
  if (enLinea && porMandar === 0) {
    return <span className="insignia insignia-exito">En línea</span>
  }
  return (
    <span className="insignia insignia-alerta" title="La puerta sigue funcionando con la última lista de socios">
      {enLinea ? 'En línea' : 'Sin conexión'}
      {!enLinea && minutos !== null && ` · lista de hace ${minutos} min`}
      {porMandar > 0 && ` · ${porMandar} por mandar`}
    </span>
  )
}

/**
 * Lo que muestra el modo de prueba. Nada sale de la PC: sirve para configurar
 * el lector sin tener que mandarle a nadie los datos de un DNI.
 */
function PruebaLector({ diagnostico }) {
  if (!diagnostico) {
    return (
      <div className="tarjeta flex flex-1 flex-col gap-3 p-6">
        <p className="text-xl font-bold">Modo prueba del lector</p>
        <p style={{ color: 'var(--color-texto-2)' }}>
          Pasá un DNI por el lector. Acá se ve lo que manda y el DNI que entiende la app.
          No se registra ningún ingreso y no se consulta al servidor.
        </p>
      </div>
    )
  }
  const { crudo, leido, llegoSinEnter } = diagnostico
  const conComillas = crudo.includes('"') && !crudo.includes('@')
  const consejos = []
  if (!leido) {
    consejos.push('No se reconoció un DNI. Revisá que el lector esté en modo teclado USB (a veces dice HID o "keyboard") y que lea códigos PDF417.')
    if (/[^\x20-\x7EÁÉÍÓÚÑáéíóúñ@"]/.test(crudo)) consejos.push('Llegaron caracteres raros: puede ser la distribución de teclado del lector. Probá configurarlo en "Latin America" o "Spanish" con los códigos del manual.')
  }
  if (conComillas) consejos.push('El lector escribe comillas en lugar de @ por la distribución de teclado. La app lo entiende igual: no hace falta cambiarlo.')
  if (llegoSinEnter) consejos.push('El lector no mandó Enter al terminar. La app lo procesa sola, pero tarda un poco más: si el manual tiene la opción "sufijo Enter" o "CR", conviene activarla.')

  return (
    <div className="tarjeta flex flex-1 flex-col gap-4 p-6">
      <div className="flex items-center gap-3">
        <span className={`insignia ${leido ? 'insignia-exito' : 'insignia-error'}`}>{leido ? 'DNI reconocido' : 'No se reconoció'}</span>
        {leido && <span className="text-2xl font-bold tabular-nums">DNI {leido.dni}</span>}
        {leido?.sexo && <span className="text-sm" style={{ color: 'var(--color-texto-2)' }}>Sexo: {leido.sexo}</span>}
      </div>
      <div>
        <p className="etiqueta-campo">Lo que mandó el lector ({crudo.length} caracteres{llegoSinEnter ? ', sin Enter' : ', con Enter'})</p>
        <pre className="overflow-x-auto whitespace-pre-wrap break-all rounded-xl p-3 text-sm" style={{ backgroundColor: 'var(--color-elevado)' }}>{crudo || '(vacío)'}</pre>
      </div>
      {consejos.length > 0 && (
        <ul className="flex list-disc flex-col gap-1.5 pl-5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          {consejos.map(c => <li key={c}>{c}</li>)}
        </ul>
      )}
    </div>
  )
}
