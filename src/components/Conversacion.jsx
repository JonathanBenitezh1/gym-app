import { useState, useEffect, useRef, useCallback } from 'react'
import { obtenerConversacion, enviarMensaje } from '../services/mensajesService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { useDialogo } from '../hooks/useDialogo'
import { avisarLeidos } from '../hooks/useNoLeidos'
import { useAvisos } from './Avisos'
import { IconoFlecha, IconoEnviar } from './Iconos'
import Cargando from './Cargando'
import { momento } from '../utils/formato'

/**
 * Una conversación, a pantalla completa (migración 021). La usan el socio
 * (Consultas) y el personal (bandeja de mensajes).
 *
 * `conversacionId` abre una que ya existe; sin él, el socio la empieza con
 * `profesorId` (null: el gimnasio) al mandar el primer mensaje.
 */

const MAX_TEXTO = 1000

export default function Conversacion({ conversacionId, profesorId = null, titulo, subtitulo, nota, alVolver, alCambiar }) {
  const { error: avisarError } = useAvisos()
  const [id, setId] = useState(conversacionId ?? null)
  const [datos, setDatos] = useState(null)        // { conversacion, mensajes, hay_mas }
  const [cargando, setCargando] = useState(Boolean(conversacionId))
  const [texto, setTexto] = useState('')
  const [enviando, setEnviando] = useState(false)
  const [trayendo, setTrayendo] = useState(false)
  const lista = useRef(null)
  const campo = useRef(null)
  const alFinal = useRef(true)

  const bajar = () => requestAnimationFrame(() => {
    if (lista.current) lista.current.scrollTop = lista.current.scrollHeight
  })

  const cargar = useCallback(async () => {
    if (!id) return
    try {
      const d = await obtenerConversacion(id)
      setDatos(actual => ({
        ...d,
        // Los anteriores que ya había traído no se pierden al actualizar.
        mensajes: actual ? unir(actual.mensajes, d.mensajes) : d.mensajes,
        hay_mas: actual ? actual.hay_mas : d.hay_mas
      }))
      avisarLeidos()
      if (alFinal.current) bajar()
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos abrir la conversación')
    } finally {
      setCargando(false)
    }
  }, [id, avisarError])

  useEffect(() => { cargar() }, [cargar])

  useSocketEventos({
    mensaje_nuevo: (d) => { if (d?.conversacion_id === id) cargar() }
  })

  // Foco adentro, Tab que da la vuelta y Escape que vuelve a la lista.
  const caja = useDialogo(alVolver)

  const anteriores = async () => {
    const primero = datos?.mensajes[0]
    if (!primero) return
    setTrayendo(true)
    const caja = lista.current
    const alto = caja?.scrollHeight ?? 0
    try {
      const d = await obtenerConversacion(id, primero.id)
      setDatos(actual => ({ ...actual, mensajes: unir(d.mensajes, actual.mensajes), hay_mas: d.hay_mas }))
      // Que no salte: se queda mirando el mismo mensaje.
      requestAnimationFrame(() => { if (caja) caja.scrollTop = caja.scrollHeight - alto })
    } catch {
      avisarError('No pudimos traer los mensajes anteriores')
    } finally {
      setTrayendo(false)
    }
  }

  const mandar = async (e) => {
    e?.preventDefault()
    const limpio = texto.trim()
    if (!limpio || enviando) return
    setEnviando(true)
    try {
      const nuevo = await enviarMensaje(id ? { conversacion_id: id, texto: limpio } : { profesor_id: profesorId, texto: limpio })
      setTexto('')
      if (campo.current) campo.current.style.height = 'auto'
      alFinal.current = true
      if (!id) setId(nuevo.conversacion_id)   // la primera vez: carga la conversación entera
      else {
        setDatos(actual => ({ ...actual, mensajes: unir(actual.mensajes, [nuevo]) }))
        bajar()
      }
      alCambiar?.()
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos mandar el mensaje')
    } finally {
      setEnviando(false)
    }
  }

  const conv = datos?.conversacion
  // De qué lado está quien mira: el socio escribe "de_alumno"; el personal, lo otro.
  const soyAlumno = conv ? conv.es_alumno : true
  const puedeEscribir = conv ? conv.puede_escribir : true
  // El admin leyendo la de un profe: no es de ninguno de los dos lados. Antes
  // los mensajes del profe le salían como propios, a la derecha y sin firma
  // (auditoría del 04/10/2026).
  const lectura = Boolean(conv) && !conv.es_alumno && !conv.atiende
  const primerNombre = (nombre) => String(nombre ?? '').trim().split(' ')[0]
  const mensajes = datos?.mensajes ?? []

  return (
    <div
      className="fixed inset-0 z-[60] flex flex-col"
      style={{ backgroundColor: 'var(--color-fondo)' }}
      role="dialog" aria-modal="true" aria-labelledby="titulo-conversacion"
      ref={caja} tabIndex={-1}
    >
      <header
        className="flex items-center gap-2 px-2 py-2.5"
        style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)', paddingTop: 'max(.625rem, env(safe-area-inset-top))' }}
      >
        <button onClick={alVolver} className="btn btn-fantasma btn-chico shrink-0" aria-label="Volver">
          <IconoFlecha size={18} />
        </button>
        <div className="min-w-0">
          <p id="titulo-conversacion" className="truncate text-sm font-bold">{titulo}</p>
          {subtitulo && <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>{subtitulo}</p>}
        </div>
      </header>

      <div
        ref={lista}
        className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-2 overflow-y-auto px-4 py-4"
        onScroll={(e) => {
          const c = e.currentTarget
          alFinal.current = c.scrollHeight - c.scrollTop - c.clientHeight < 80
        }}
      >
        {nota && (
          <p className="mb-2 rounded-xl px-3 py-2 text-center text-xs" style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}>
            {nota}
          </p>
        )}
        {cargando ? <Cargando /> : (
          <>
            {datos?.hay_mas && (
              <button onClick={anteriores} disabled={trayendo} className="btn btn-fantasma btn-chico self-center">
                {trayendo ? 'Trayendo…' : 'Ver mensajes anteriores'}
              </button>
            )}
            {mensajes.length === 0 && (
              <p className="m-auto max-w-xs text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
                {puedeEscribir ? 'Escribí tu consulta. Te van a responder por acá.' : 'Todavía no hay mensajes.'}
              </p>
            )}
            {mensajes.map(m => {
              const propio = !lectura && m.de_alumno === soyAlumno
              // A la derecha lo propio; leyendo la de un profe, lo del profe.
              const derecha = lectura ? !m.de_alumno : propio
              // En la del gimnasio responde más de una persona: se firma quién.
              // Leyendo la de un profe, se firma todo.
              const firma = lectura
                ? primerNombre(m.de_alumno ? conv.alumno : m.autor) || null
                : !m.de_alumno && m.autor && conv?.profesor_id === null ? primerNombre(m.autor) : null
              return (
                <div key={m.id} className={`flex max-w-[85%] flex-col ${derecha ? 'items-end self-end' : 'items-start self-start'}`}>
                  <div
                    className="whitespace-pre-line break-words rounded-2xl px-3.5 py-2 text-sm leading-snug"
                    style={propio
                      ? { backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)', borderBottomRightRadius: '.375rem' }
                      : derecha
                        ? { backgroundColor: 'var(--color-elevado)', borderBottomRightRadius: '.375rem' }
                        : { backgroundColor: 'var(--color-elevado)', borderBottomLeftRadius: '.375rem' }}
                  >
                    {m.texto}
                  </div>
                  <span className="mt-0.5 px-1 text-[10.5px]" style={{ color: 'var(--color-texto-3)' }}>
                    {firma && <>{firma} · </>}{momento(m.creado_en)}
                  </span>
                </div>
              )
            })}
          </>
        )}
      </div>

      {puedeEscribir ? (
        <form
          onSubmit={mandar}
          className="mx-auto flex w-full max-w-2xl items-end gap-2 px-3 py-2.5"
          style={{ borderTop: '1px solid var(--color-linea-sutil)', paddingBottom: 'max(.625rem, env(safe-area-inset-bottom))' }}
        >
          <textarea
            ref={campo}
            className="campo max-h-32 min-h-[2.75rem] flex-1 resize-none"
            rows={1} maxLength={MAX_TEXTO}
            placeholder="Escribí un mensaje"
            aria-label="Mensaje"
            value={texto}
            onChange={e => {
              setTexto(e.target.value)
              e.target.style.height = 'auto'
              e.target.style.height = `${e.target.scrollHeight}px`
            }}
            onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) mandar(e) }}
          />
          <button type="submit" disabled={enviando || !texto.trim()} className="btn btn-primario shrink-0" aria-label="Enviar">
            <IconoEnviar size={18} />
          </button>
        </form>
      ) : (
        <p className="px-4 py-3 text-center text-xs" style={{ borderTop: '1px solid var(--color-linea-sutil)', color: 'var(--color-texto-3)' }}>
          {soyAlumno ? 'Ya no podés escribirle a este profe.' : 'Solo lectura: la responde su profe.'}
        </p>
      )}
    </div>
  )
}

/** Junta dos tandas de mensajes sin repetir, en orden. */
function unir(a, b) {
  const porId = new Map([...a, ...b].map(m => [m.id, m]))
  return [...porId.values()].sort((x, y) => x.id - y.id)
}
