import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { obtenerMisRutinas } from '../services/profesorService'
import NavBar from '../components/NavBar'
import Progreso from '../components/Progreso'
import { obtenerMiProgreso, registrarProgreso, borrarProgreso } from '../services/progresoService'
import { IconoChevron, IconoRutina, IconoInfo, IconoCruz, IconoMensaje } from '../components/Iconos'
import { fechaCorta } from '../utils/formato'
import EncabezadoSocio from '../components/EncabezadoSocio'
import { recordado, recordar } from '../utils/memoria'
import Cargando from '../components/Cargando'
import { agruparEjercicios, letra, SENSACIONES, GANAS, sensacionDe } from '../utils/rutinas'
import { comentarDia, obtenerMisComentarios } from '../services/comentariosService'

/**
 * La primera sesión de cada rutina, abierta: casi siempre es lo que el socio
 * viene a mirar, y ahorra un toque.
 */
function primerasSesiones(rutinas) {
  const abiertas = {}
  for (const r of rutinas) {
    if (r.sesiones?.length) abiertas[r.id] = r.sesiones[0].id
  }
  return abiertas
}

export default function Rutinas() {
  const { usuario } = useAuth()
  const navigate = useNavigate()
  const { error: avisarError, exito, confirmar } = useAvisos()

  const [previo] = useState(() => recordado('rutinas'))
  const [rutinas, setRutinas]   = useState(previo ?? [])
  const [abierta, setAbierta]   = useState(() => primerasSesiones(previo ?? []))   // { [rutinaId]: sesionId }
  const [cargando, setCargando] = useState(!previo)

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerMisRutinas()
      setRutinas(datos)
      recordar('rutinas', datos)
      // Lo que abrió el socio se respeta; lo nuevo, con su primera sesión.
      setAbierta(actual => ({ ...primerasSesiones(datos), ...actual }))
    } catch {
      avisarError('No pudimos cargar tus rutinas')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargar() }, [cargar])

  // Sus comentarios, para mostrarle cuándo comentó cada día.
  const [comentarios, setComentarios] = useState(() => recordado('comentarios') ?? [])
  useEffect(() => {
    obtenerMisComentarios()
      .then(datos => { setComentarios(datos); recordar('comentarios', datos) })
      .catch(() => {})
  }, [])

  const [progreso, setProgreso] = useState(() => recordado('progreso') ?? [])
  useEffect(() => {
    obtenerMiProgreso()
      .then(datos => { setProgreso(datos); recordar('progreso', datos) })
      .catch(() => avisarError('No pudimos cargar tu progreso'))
  }, [avisarError])

  const guardarProgreso = async (datos) => {
    try {
      const nuevo = await registrarProgreso(datos)
      setProgreso(actual => [...actual, nuevo].sort((a, b) =>
        a.medida.localeCompare(b.medida) || a.fecha.localeCompare(b.fecha) || a.id - b.id))
      exito('Registrado')
      return true
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos guardar el registro')
      return false
    }
  }

  const quitarProgreso = async (registro) => {
    if (!await confirmar({
      titulo: '¿Borrar este registro?',
      mensaje: `${registro.medida}: ${registro.valor} ${registro.unidad}`,
      textoConfirmar: 'Borrar'
    })) return
    try {
      await borrarProgreso(registro.id)
      setProgreso(actual => actual.filter(r => r.id !== registro.id))
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos borrar el registro')
    }
  }

  // La animación de abrir va solo cuando el socio toca: la sesión que ya
  // viene abierta al entrar no se anima, si no la pantalla parpadeaba en cada visita.
  const [tocada, setTocada] = useState(false)

  // El ejercicio cuyo consejo (y, con el VPS, su video) está abierto.
  const [ficha, setFicha] = useState(null)
  const cerrarFicha = useCallback(() => setFicha(null), [])

  const alternar = (rutinaId, sesionId) => {
    setTocada(true)
    setAbierta(prev => ({
      ...prev,
      [rutinaId]: prev[rutinaId] === sesionId ? null : sesionId
    }))
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>

      <EncabezadoSocio />

      <main className="contenedor-ancho pt-5">

        <h1 className="text-lg font-bold tracking-tight">Mis rutinas</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          Los planes que te armó tu profesor
        </p>

        {cargando ? (
          <Cargando />
        ) : rutinas.length === 0 ? (
          <div className="tarjeta mt-6 p-8 text-center">
            <span
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
            >
              <IconoRutina size={22} />
            </span>
            <p className="font-semibold">Todavía no tenés rutinas</p>
            <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: 'var(--color-texto-2)' }}>
              Cuando tu profesor te cargue un plan personalizado, va a aparecer acá
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {rutinas.map(rutina => (
              <article key={rutina.id} className="tarjeta overflow-hidden">

                <div
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                  style={{ backgroundColor: 'var(--color-elevado)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      Plan de {usuario?.nombre?.split(' ')[0]}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                      Prof. {rutina.profesor}{rutina.updated_at && <> · {fechaCorta(rutina.updated_at)}</>}
                    </p>
                  </div>
                  <button
                    onClick={() => navigate(`/consultas?con=${rutina.profesor_id}`)}
                    className="btn btn-contorno btn-chico shrink-0"
                  >
                    <IconoMensaje size={15} /> Consultar
                  </button>
                </div>

                {rutina.sesiones?.length > 0 ? (
                  <div>
                    {rutina.sesiones.map(sesion => {
                      const expandida = abierta[rutina.id] === sesion.id
                      const ejercicios = sesion.ejercicios || []
                      return (
                        <div
                          key={sesion.id}
                          style={{ borderTop: '1px solid var(--color-linea-sutil)' }}
                        >
                          <button
                            onClick={() => alternar(rutina.id, sesion.id)}
                            aria-expanded={expandida}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[.03]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold uppercase tracking-wide">
                                {sesion.nombre}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                                {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                              </span>
                            </span>
                            <span
                              className="shrink-0 transition-transform"
                              style={{
                                color: 'var(--color-acento)',
                                transform: expandida ? 'rotate(180deg)' : 'none'
                              }}
                            >
                              <IconoChevron size={18} />
                            </span>
                          </button>

                          {expandida && (
                            <div className={tocada ? 'aparecer' : undefined}>
                              {ejercicios.length === 0 ? (
                                <p className="px-4 pb-4 text-sm" style={{ color: 'var(--color-texto-3)' }}>
                                  Esta sesión todavía no tiene ejercicios cargados.
                                </p>
                              ) : (
                                <ol>
                                  {agruparEjercicios(ejercicios).map(g => (
                                    <li
                                      key={g.ejercicios[0].id ?? g.numero}
                                      style={{ borderTop: '1px solid var(--color-linea-sutil)', backgroundColor: 'var(--color-fondo)' }}
                                    >
                                      {g.circuito ? (
                                        <div className="px-4 py-3">
                                          <p className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-acento)' }}>
                                            Circuito{g.series ? ` · ${g.series} ${g.series === 1 ? 'vuelta' : 'vueltas'}` : ''} · hacelos seguidos
                                          </p>
                                          <ul className="mt-2 flex flex-col gap-2.5 border-l-2 pl-3" style={{ borderColor: 'var(--color-acento)' }}>
                                            {g.ejercicios.map((ej, i) => (
                                              <FilaEjercicio key={ej.id ?? i} numero={`${g.numero}${letra(i)}`} ejercicio={ej} alVer={setFicha} />
                                            ))}
                                          </ul>
                                        </div>
                                      ) : (
                                        <ul className="px-4 py-3">
                                          <FilaEjercicio numero={g.numero} ejercicio={g.ejercicios[0]} series={g.series} alVer={setFicha} />
                                        </ul>
                                      )}
                                    </li>
                                  ))}
                                </ol>
                              )}
                              <ComentarioDia
                                rutinaId={rutina.id}
                                dia={sesion.nombre}
                                ultimo={comentarios.find(c => c.rutina_id === rutina.id && c.dia === sesion.nombre)}
                                alEnviar={(nuevo) => {
                                  const lista = [nuevo, ...comentarios]
                                  setComentarios(lista)
                                  recordar('comentarios', lista)
                                }}
                              />
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm" style={{ color: 'var(--color-texto-3)' }}>
                    Esta rutina todavía no tiene sesiones cargadas.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Mi progreso</h2>
          <p className="mb-3 mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Peso, medidas y marcas personales. Tu profe también lo ve.
          </p>
          <Progreso
            registros={progreso} alGuardar={guardarProgreso} alBorrar={quitarProgreso}
            vacio="Todavía no registraste nada. Anotá tu peso o una marca para ver cómo avanzás."
          />
        </section>
      </main>

      {ficha && <FichaEjercicio ejercicio={ficha} alCerrar={cerrarFicha} />}

      <NavBar />
    </div>
  )
}

/* ─── Un ejercicio ──────────────────────────────────────── */

// "10-12" o "15" llevan "reps"; "fallo" o "30 s" van como están.
const textoReps = (r) => (/^\d+(\s*[-–a]\s*\d+)?$/.test(String(r).trim()) ? `${r} reps` : r)

/**
 * El nombre entero, en varias líneas si hace falta, y las series y
 * repeticiones abajo. Antes iban en la misma línea y el nombre se cortaba
 * con "…" en el celular.
 */
function FilaEjercicio({ numero, ejercicio, series, alVer }) {
  const tieneFicha = Boolean(ejercicio.consejo || ejercicio.video)
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="mt-px flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold"
        style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
      >
        {numero}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block break-words text-sm font-medium leading-snug">{ejercicio.nombre}</span>
        {(series || ejercicio.repeticiones) && (
          <span className="mt-0.5 flex flex-wrap gap-x-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>
            {series && <span><b style={{ color: 'var(--color-acento)' }}>{series}</b> {series === 1 ? 'serie' : 'series'}</span>}
            {ejercicio.repeticiones && <b style={{ color: 'var(--color-acento)' }}>{textoReps(ejercicio.repeticiones)}</b>}
          </span>
        )}
      </span>
      {tieneFicha && (
        <button
          type="button" onClick={() => alVer(ejercicio)}
          className="-my-1.5 -mr-2 flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
          style={{ color: 'var(--color-acento)' }}
          aria-label={`Cómo se hace ${ejercicio.nombre}`}
        >
          <IconoInfo size={19} />
        </button>
      )}
    </li>
  )
}

/* ─── Cómo se hace ──────────────────────────────────────── */

/**
 * El consejo del dueño para el ejercicio, de la biblioteca (migración 020).
 * Con el VPS se suma su video; para verlo, la CSP de vercel.json tiene que
 * permitir esa dirección en `media-src`.
 */
function FichaEjercicio({ ejercicio, alCerrar }) {
  useEffect(() => {
    const conTecla = (e) => { if (e.key === 'Escape') alCerrar() }
    window.addEventListener('keydown', conTecla)
    return () => window.removeEventListener('keydown', conTecla)
  }, [alCerrar])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,.6)' }}
      role="dialog" aria-modal="true" aria-labelledby="titulo-ficha"
      onClick={alCerrar}
    >
      <div className="tarjeta aparecer flex w-full max-w-md flex-col gap-3 p-5" onClick={e => e.stopPropagation()}>
        <div className="flex items-start justify-between gap-3">
          <h2 id="titulo-ficha" className="break-words font-bold">{ejercicio.nombre}</h2>
          <button onClick={alCerrar} className="btn btn-fantasma btn-chico shrink-0" aria-label="Cerrar">
            <IconoCruz size={16} />
          </button>
        </div>
        {ejercicio.video && (
          <video
            src={ejercicio.video} controls playsInline loop preload="metadata"
            className="max-h-[60vh] w-full rounded-xl" style={{ backgroundColor: 'var(--color-elevado)' }}
          />
        )}
        {ejercicio.consejo && (
          <p className="whitespace-pre-line break-words text-sm leading-relaxed" style={{ color: 'var(--color-texto-2)' }}>
            {ejercicio.consejo}
          </p>
        )}
      </div>
    </div>
  )
}

/* ─── Cómo te fue ───────────────────────────────────────── */

/**
 * Al final de cada día: cómo se sintió, con qué ganas y, si quiere, algo
 * escrito. Lo ven su profe y el admin (migración 019).
 */
function ComentarioDia({ rutinaId, dia, ultimo, alEnviar }) {
  const { exito, error: avisarError } = useAvisos()
  const [abierto, setAbierto]     = useState(false)
  const [sensacion, setSensacion] = useState(null)
  const [ganas, setGanas]         = useState(null)
  const [texto, setTexto]         = useState('')
  const [enviando, setEnviando]   = useState(false)

  const cerrar = () => {
    setAbierto(false)
    setSensacion(null)
    setGanas(null)
    setTexto('')
  }

  const enviar = async (e) => {
    e.preventDefault()
    if (!sensacion || !ganas) return avisarError('Elegí cómo te sentiste y con qué ganas entrenaste')
    setEnviando(true)
    try {
      const nuevo = await comentarDia({ rutina_id: rutinaId, dia, sensacion, ganas, texto })
      alEnviar({ ...nuevo, rutina_id: rutinaId, dia, sensacion, ganas, texto })
      exito('¡Gracias! Tu profe lo va a ver')
      cerrar()
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos mandar tu comentario')
    } finally {
      setEnviando(false)
    }
  }

  if (!abierto) {
    return (
      <div
        className="flex flex-wrap items-center justify-between gap-2 px-4 py-3"
        style={{ borderTop: '1px solid var(--color-linea-sutil)' }}
      >
        <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          {ultimo
            ? `Tu último comentario: ${fechaCorta(ultimo.creado_en)} · ${sensacionDe(ultimo.sensacion)?.texto}`
            : 'Contale a tu profe cómo te fue'}
        </p>
        <button onClick={() => setAbierto(true)} className="btn btn-contorno btn-chico">
          ¿Cómo te fue hoy?
        </button>
      </div>
    )
  }

  return (
    <form
      onSubmit={enviar}
      className="aparecer flex flex-col gap-3 px-4 py-4"
      style={{ borderTop: '1px solid var(--color-linea-sutil)', backgroundColor: 'var(--color-elevado)' }}
    >
      <Opciones titulo="¿Cómo te sentiste?" opciones={SENSACIONES} valor={sensacion} alElegir={setSensacion} />
      <Opciones titulo="¿Con qué ganas entrenaste?" opciones={GANAS} valor={ganas} alElegir={setGanas} />
      <div>
        <label htmlFor={`comentario-${rutinaId}-${dia}`} className="etiqueta-campo">Contale a tu profe (opcional)</label>
        <textarea
          id={`comentario-${rutinaId}-${dia}`}
          className="campo" rows={3} maxLength={500}
          placeholder="Ej: me costó el peso muerto, dormí poco…"
          value={texto} onChange={e => setTexto(e.target.value)}
        />
      </div>
      <div className="flex gap-2">
        <button type="button" onClick={cerrar} className="btn btn-fantasma btn-chico flex-1">Cancelar</button>
        <button type="submit" disabled={enviando || !sensacion || !ganas} className="btn btn-primario btn-chico flex-1">
          {enviando ? 'Enviando…' : 'Enviar'}
        </button>
      </div>
    </form>
  )
}

function Opciones({ titulo, opciones, valor, alElegir }) {
  return (
    <fieldset>
      <legend className="etiqueta-campo">{titulo}</legend>
      <div className="flex flex-wrap gap-1.5">
        {opciones.map(o => (
          <button
            key={o.valor} type="button"
            aria-pressed={valor === o.valor}
            onClick={() => alElegir(o.valor)}
            className={`pildora ${valor === o.valor ? 'pildora-activa' : ''}`}
          >
            {o.texto}
          </button>
        ))}
      </div>
    </fieldset>
  )
}
