import { useState, useEffect, useRef, useCallback } from 'react'
import {
  buscarAlumnos, obtenerRutinaDeAlumno, guardarRutina,
  obtenerPlantillas, guardarPlantilla, borrarPlantilla
} from '../services/profesorService'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import { IconoBuscar, IconoMas, IconoCruz, IconoBasura } from './Iconos'
import Progreso from './Progreso'
import { obtenerProgresoDeAlumno } from '../services/progresoService'
import { obtenerComentarios } from '../services/comentariosService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { letra, sensacionDe, ganasDe } from '../utils/rutinas'
import { fechaHora } from '../utils/formato'

// Editor de rutinas: se busca al alumno por nombre o DNI. Lo usan el panel del profe y el del admin:
// la API guarda la rutina a nombre de quien la carga.

const ejercicioVacio = (enCircuito = false) => ({ nombre: '', series: '', repeticiones: '', en_circuito: enCircuito })

// Lo que vuelve de la base trae null donde el campo espera texto.
const aEditor = (lista) => lista.map(s => ({
  nombre: s.nombre,
  orden: s.orden,
  ejercicios: s.ejercicios?.length
    ? s.ejercicios.map(ej => ({
        ...ej, series: ej.series ?? '', repeticiones: ej.repeticiones ?? '', en_circuito: ej.en_circuito === true
      }))
    : [ejercicioVacio()]
}))

const sesionVacia = (orden = 1) => ({ nombre: '', orden, ejercicios: [ejercicioVacio()] })

// Circuitos (migración 019): un ejercicio con `en_circuito` va seguido del de
// arriba. El grupo de un ejercicio termina en el último que va pegado a él.
const finDelGrupo = (ejercicios, ei) => {
  let j = ei
  while (ejercicios[j + 1]?.en_circuito) j++
  return j
}

/** "3" para uno suelto; "3A", "3B"… dentro de un circuito. */
function etiquetasDe(ejercicios) {
  let numero = 0
  let dentro = 0
  return ejercicios.map((ej, ei) => {
    const miembro = ej.en_circuito && ei > 0
    if (miembro) dentro++
    else { numero++; dentro = 0 }
    const encabeza = !miembro && ejercicios[ei + 1]?.en_circuito
    return { miembro, encabeza, texto: miembro || encabeza ? `${numero}${letra(dentro)}` : String(numero) }
  })
}

export default function SeccionRutinas({ alExito, alError }) {
  const [dni, setDni]         = useState('')
  const [alumno, setAlumno]   = useState(null)
  const [sesiones, setSesiones] = useState([sesionVacia()])
  const [buscando, setBuscando] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const [resultados, setResultados] = useState(null)

  const { usuario } = useAuth()
  const { confirmar } = useAvisos()
  const [plantillas, setPlantillas]   = useState([])
  const [plantillaId, setPlantillaId] = useState('')
  const [nombrePlantilla, setNombrePlantilla] = useState(null) // null = campo cerrado

  useEffect(() => {
    obtenerPlantillas().then(setPlantillas).catch(() => {})
  }, [])

  // Comentarios de los socios (migración 019): los últimos arriba, y los del
  // alumno abierto junto a su rutina. El profe ve los de sus rutinas; el admin, todos.
  const [recientes, setRecientes] = useState([])
  const [delAlumno, setDelAlumno] = useState([])
  const cargarRecientes = useCallback(() => {
    obtenerComentarios({ limite: 8 }).then(setRecientes).catch(() => {})
  }, [])
  useEffect(() => { cargarRecientes() }, [cargarRecientes])
  useSocketEventos({ comentario_rutina: cargarRecientes })

  const plantillaElegida = plantillas.find(p => String(p.id) === plantillaId)
  const puedeBorrar = plantillaElegida &&
    (plantillaElegida.creador_id === usuario?.id || usuario?.rol === 'admin')
  const editorConDatos = sesiones.some(s => s.nombre.trim() || s.ejercicios.some(e => e.nombre.trim()))

  const usarPlantilla = async () => {
    if (!plantillaElegida) return
    if (editorConDatos && !await confirmar({
      titulo: '¿Reemplazar lo que hay en el editor?',
      mensaje: `Se carga "${plantillaElegida.nombre}" en lugar de las sesiones actuales. No se guarda nada hasta que toques Guardar.`,
      textoConfirmar: 'Usar plantilla'
    })) return
    setSesiones(aEditor(plantillaElegida.sesiones))
    alExito(`Plantilla cargada. Ajustala para ${alumno.nombre.split(' ')[0]} y guardá.`)
  }

  const guardarComoPlantilla = async (e) => {
    e.preventDefault()
    const nombre = nombrePlantilla.trim()
    if (!nombre) return alError('Poné un nombre a la plantilla')
    const existe = plantillas.some(p => p.nombre.toLowerCase() === nombre.toLowerCase())
    if (existe && !await confirmar({
      titulo: 'Ya hay una plantilla con ese nombre',
      mensaje: 'Se reemplaza por lo que hay ahora en el editor.',
      textoConfirmar: 'Reemplazar'
    })) return
    try {
      const { mensaje } = await guardarPlantilla({ nombre, sesiones })
      setPlantillas(await obtenerPlantillas())
      setNombrePlantilla(null)
      alExito(mensaje)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar la plantilla')
    }
  }

  const quitarPlantilla = async () => {
    if (!await confirmar({
      titulo: `¿Borrar la plantilla "${plantillaElegida.nombre}"?`,
      mensaje: 'Las rutinas que ya se armaron con ella no cambian.',
      textoConfirmar: 'Borrar'
    })) return
    try {
      await borrarPlantilla(plantillaElegida.id)
      setPlantillas(actual => actual.filter(p => p.id !== plantillaElegida.id))
      setPlantillaId('')
      alExito('Plantilla borrada')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos borrar la plantilla')
    }
  }

  const buscar = async (e) => {
    e?.preventDefault()
    if (dni.trim().length < 2) return alError('Escribí al menos 2 letras o números')
    setBuscando(true)
    setAlumno(null)
    abierto.current = null
    try {
      const lista = await buscarAlumnos(dni.trim())
      // Con un solo resultado se abre directo, sin paso extra.
      if (lista.length === 1) return await elegir(lista[0])
      setResultados(lista)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos buscar')
    } finally {
      setBuscando(false)
    }
  }

  const [progreso, setProgreso] = useState([])

  // El alumno que está abierto ahora. Si la rutina de uno anterior llega
  // tarde (el servidor despertando), se descarta: antes caía en el editor
  // del alumno nuevo y al guardar se le pisaba la rutina con la de otro.
  const abierto = useRef(null)

  const elegir = async (encontrado) => {
    abierto.current = encontrado.id
    const sigueAbierto = () => abierto.current === encontrado.id
    setResultados(null)
    setAlumno(encontrado)
    setProgreso([])
    setDelAlumno([])
    obtenerComentarios({ alumno_id: encontrado.id, limite: 20 })
      .then(c => { if (sigueAbierto()) setDelAlumno(c) })
      .catch(() => {})
    // El editor arranca vacío mientras carga: si la carga falla, no queda la
    // rutina del alumno anterior a nombre de este.
    setSesiones([sesionVacia()])
    obtenerProgresoDeAlumno(encontrado.id)
      .then(p => { if (sigueAbierto()) setProgreso(p) })
      .catch(() => {})
    try {
      const rutina = await obtenerRutinaDeAlumno(encontrado.id)
      if (!sigueAbierto()) return
      if (rutina?.sesiones?.length > 0) {
        setSesiones(aEditor(rutina.sesiones))
        alExito('Ya tenía una rutina cargada, la abrimos para editar')
      }
    } catch {
      if (sigueAbierto()) alError('No pudimos abrir la rutina de este alumno')
    }
  }

  const actualizarSesion = (i, campo, valor) => {
    setSesiones(prev => prev.map((s, idx) => idx === i ? { ...s, [campo]: valor } : s))
  }

  const actualizarEjercicio = (si, ei, campo, valor) => {
    setSesiones(prev => prev.map((s, idx) => idx !== si ? s : {
      ...s,
      ejercicios: s.ejercicios.map((ej, j) => j === ei ? { ...ej, [campo]: valor } : ej)
    }))
  }

  const agregarSesion = () =>
    setSesiones(prev => [...prev, sesionVacia(prev.length + 1)])

  const quitarSesion = (i) =>
    setSesiones(prev => prev.filter((_, idx) => idx !== i))

  const agregarEjercicio = (si) =>
    setSesiones(prev => prev.map((s, idx) => idx !== si ? s : {
      ...s,
      ejercicios: [...s.ejercicios, ejercicioVacio()]
    }))

  // El "+" de entre medio: suma un ejercicio al circuito, detrás del último del grupo.
  const agregarAlCircuito = (si, ei) =>
    setSesiones(prev => prev.map((s, idx) => {
      if (idx !== si) return s
      const ejercicios = [...s.ejercicios]
      ejercicios.splice(finDelGrupo(ejercicios, ei) + 1, 0, ejercicioVacio(true))
      return { ...s, ejercicios }
    }))

  // Sale del circuito y queda suelto, con sus propias series.
  const separarDelCircuito = (si, ei) => actualizarEjercicio(si, ei, 'en_circuito', false)

  const quitarEjercicio = (si, ei) =>
    setSesiones(prev => prev.map((s, idx) => {
      if (idx !== si) return s
      const quitado = s.ejercicios[ei]
      const ejercicios = s.ejercicios.filter((_, j) => j !== ei)
      // Si se va el primero de un circuito, el que seguía lo encabeza con sus series.
      if (!quitado.en_circuito && ejercicios[ei]?.en_circuito) {
        ejercicios[ei] = { ...ejercicios[ei], en_circuito: false, series: quitado.series }
      }
      return { ...s, ejercicios }
    }))

  const guardar = async () => {
    if (sesiones.some(s => !s.nombre.trim())) {
      return alError('Poné un nombre a cada sesión (por ejemplo: Espalda y bíceps)')
    }
    setGuardando(true)
    try {
      await guardarRutina({ alumno_id: alumno.id, sesiones })
      alExito(`Rutina de ${alumno.nombre} guardada`)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar la rutina')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-4">

      {!alumno && recientes.length > 0 && (
        <section className="tarjeta flex flex-col gap-2 p-4">
          <h2 className="titulo-seccion">Comentarios recientes de los socios</h2>
          <ListaComentarios
            comentarios={recientes}
            conAlumno
            alAbrir={(c) => elegir({ id: c.alumno_id, nombre: c.alumno, dni: c.dni, email: c.email })}
          />
        </section>
      )}

      <form onSubmit={buscar} className="tarjeta p-4">
        <label htmlFor="dni" className="etiqueta-campo">Buscar alumno por nombre o DNI</label>
        <div className="flex gap-2">
          <input
            id="dni" className="campo flex-1" autoComplete="off"
            placeholder="Ej: Martina o 30123456" value={dni}
            onChange={e => setDni(e.target.value)}
          />
          <button type="submit" disabled={buscando} className="btn btn-primario">
            <IconoBuscar size={17} />
            <span className="hidden sm:inline">{buscando ? 'Buscando…' : 'Buscar'}</span>
          </button>
        </div>

        {resultados && (
          resultados.length === 0 ? (
            <p className="mt-3 text-sm" style={{ color: 'var(--color-texto-2)' }}>
              No encontramos alumnos con ese nombre o DNI.
            </p>
          ) : (
            <ul className="aparecer mt-3 flex flex-col gap-1.5">
              {resultados.map(r => (
                <li key={r.id}>
                  <button
                    type="button" onClick={() => elegir(r)}
                    className="flex w-full items-center justify-between gap-3 rounded-xl p-3 text-left"
                    style={{ backgroundColor: 'var(--color-elevado)' }}
                  >
                    <span className="truncate text-sm font-semibold">{r.nombre}</span>
                    <span className="shrink-0 text-xs" style={{ color: 'var(--color-texto-3)' }}>DNI {r.dni}</span>
                  </button>
                </li>
              ))}
            </ul>
          )
        )}

        {alumno && (
          <div
            className="aparecer mt-3 flex items-center gap-3 rounded-xl p-3"
            style={{ backgroundColor: 'var(--color-acento-bajo)' }}
          >
            <span
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
              style={{ backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }}
            >
              {alumno.nombre.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold">{alumno.nombre}</p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                DNI {alumno.dni} · {alumno.email}
              </p>
            </div>
          </div>
        )}
      </form>

      {alumno && (
        <>
          {delAlumno.length > 0 && (
            <section className="tarjeta flex flex-col gap-2 p-4">
              <h2 className="titulo-seccion">Cómo le fue a {alumno.nombre.split(' ')[0]}</h2>
              <ListaComentarios comentarios={delAlumno} />
            </section>
          )}

          {progreso.length > 0 && (
            <section className="flex flex-col gap-2">
              <h2 className="titulo-seccion">Progreso de {alumno.nombre.split(' ')[0]}</h2>
              <Progreso registros={progreso} />
            </section>
          )}

          <section className="tarjeta flex flex-col gap-2.5 p-4">
            <h2 className="titulo-seccion">Plantillas</h2>
            {plantillas.length > 0 ? (
              <div className="flex gap-2">
                <select
                  aria-label="Elegir plantilla"
                  className="campo min-w-0 flex-1" value={plantillaId}
                  onChange={e => setPlantillaId(e.target.value)}
                >
                  <option value="">Elegí una plantilla…</option>
                  {plantillas.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.nombre} · {p.sesiones.length} {p.sesiones.length === 1 ? 'día' : 'días'}
                    </option>
                  ))}
                </select>
                <button onClick={usarPlantilla} disabled={!plantillaElegida} className="btn btn-contorno btn-chico shrink-0">
                  Usar
                </button>
                {puedeBorrar && (
                  <button onClick={quitarPlantilla} className="btn btn-peligro btn-chico shrink-0" aria-label="Borrar plantilla">
                    <IconoBasura size={15} />
                  </button>
                )}
              </div>
            ) : (
              <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                Todavía no hay plantillas. Armá una rutina y guardala como plantilla para reusarla con otros socios.
              </p>
            )}

            {nombrePlantilla === null ? (
              <button onClick={() => setNombrePlantilla('')} className="btn btn-fantasma btn-chico self-start">
                <IconoMas size={15} /> Guardar el editor como plantilla
              </button>
            ) : (
              <form onSubmit={guardarComoPlantilla} className="flex gap-2">
                <input
                  autoFocus aria-label="Nombre de la plantilla"
                  className="campo min-w-0 flex-1" maxLength={80}
                  placeholder="Ej: Principiante 3 días"
                  value={nombrePlantilla}
                  onChange={e => setNombrePlantilla(e.target.value)}
                />
                <button type="submit" className="btn btn-primario btn-chico shrink-0">Guardar</button>
                <button type="button" onClick={() => setNombrePlantilla(null)} className="btn btn-fantasma btn-chico shrink-0" aria-label="Cancelar">
                  <IconoCruz size={15} />
                </button>
              </form>
            )}
          </section>

          <div className="flex items-center justify-between">
            <h2 className="titulo-seccion">Sesiones del plan</h2>
            <button onClick={agregarSesion} className="btn btn-contorno btn-chico">
              <IconoMas size={15} /> Sesión
            </button>
          </div>

          {sesiones.map((sesion, si) => (
            <article key={si} className="tarjeta overflow-hidden">
              <div
                className="flex items-center gap-2 px-3 py-2.5"
                style={{ backgroundColor: 'var(--color-elevado)' }}
              >
                <input
                  className="campo flex-1 font-semibold uppercase"
                  placeholder="Ej: Espalda y bíceps"
                  value={sesion.nombre}
                  onChange={e => actualizarSesion(si, 'nombre', e.target.value)}
                />
                {sesiones.length > 1 && (
                  <button
                    onClick={() => quitarSesion(si)}
                    className="btn btn-peligro btn-chico shrink-0"
                    aria-label="Quitar sesión"
                  >
                    <IconoCruz size={15} />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-2.5 p-3">
                {(() => {
                  const etiquetas = etiquetasDe(sesion.ejercicios)
                  return sesion.ejercicios.map((ej, ei) => {
                    const { miembro, encabeza, texto } = etiquetas[ei]
                    const cierraGrupo = !sesion.ejercicios[ei + 1]?.en_circuito
                    return (
                      <div key={ei} className="flex flex-col gap-1.5">
                        <div
                          className={`rounded-xl p-3 ${miembro ? 'ml-6' : ''}`}
                          style={{
                            backgroundColor: 'var(--color-fondo)',
                            borderLeft: miembro || encabeza ? '3px solid var(--color-acento)' : undefined
                          }}
                        >
                          {(miembro || encabeza) && (
                            <p className="mb-1.5 text-[11px] font-semibold uppercase tracking-wide" style={{ color: 'var(--color-acento)' }}>
                              {miembro ? 'En circuito con el de arriba' : 'Circuito: se hacen seguidos'}
                            </p>
                          )}
                          <div className="mb-2 flex items-center gap-2">
                            <span
                              className="flex h-6 min-w-6 shrink-0 items-center justify-center rounded-md px-1 text-[11px] font-bold"
                              style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
                            >
                              {texto}
                            </span>
                            <input
                              className="campo flex-1"
                              placeholder="Nombre del ejercicio"
                              value={ej.nombre}
                              onChange={e => actualizarEjercicio(si, ei, 'nombre', e.target.value)}
                            />
                            {sesion.ejercicios.length > 1 && (
                              <button
                                onClick={() => quitarEjercicio(si, ei)}
                                className="btn btn-fantasma btn-chico shrink-0"
                                aria-label="Quitar ejercicio"
                              >
                                <IconoCruz size={14} />
                              </button>
                            )}
                          </div>
                          <div className="flex gap-2 pl-8">
                            {miembro ? (
                              <div className="flex-1">
                                <p className="etiqueta-campo">Series</p>
                                <p className="py-2 text-xs" style={{ color: 'var(--color-texto-3)' }}>Las del circuito</p>
                              </div>
                            ) : (
                              <div className="flex-1">
                                <label className="etiqueta-campo">{encabeza ? 'Vueltas del circuito' : 'Series'}</label>
                                <input
                                  type="number" min="1" className="campo" placeholder="3"
                                  value={ej.series}
                                  onChange={e => actualizarEjercicio(si, ei, 'series', e.target.value)}
                                />
                              </div>
                            )}
                            <div className="flex-1">
                              <label className="etiqueta-campo">Repeticiones</label>
                              <input
                                className="campo" placeholder="10-12"
                                value={ej.repeticiones}
                                onChange={e => actualizarEjercicio(si, ei, 'repeticiones', e.target.value)}
                              />
                            </div>
                          </div>
                          {miembro && (
                            <button onClick={() => separarDelCircuito(si, ei)} className="btn btn-fantasma btn-chico mt-1.5">
                              Sacar del circuito
                            </button>
                          )}
                        </div>
                        {cierraGrupo && (
                          <button
                            onClick={() => agregarAlCircuito(si, ei)}
                            className={`btn btn-fantasma btn-chico self-start ${miembro ? 'ml-6' : ''}`}
                            style={{ color: 'var(--color-acento)' }}
                          >
                            <IconoMas size={14} /> {miembro || encabeza ? 'Sumar al circuito' : 'Armar circuito con este'}
                          </button>
                        )}
                      </div>
                    )
                  })
                })()}

                <button onClick={() => agregarEjercicio(si)} className="btn btn-contorno btn-chico btn-bloque">
                  <IconoMas size={15} /> Agregar ejercicio
                </button>
              </div>
            </article>
          ))}

          <button onClick={guardar} disabled={guardando} className="btn btn-primario btn-bloque">
            {guardando ? 'Guardando…' : `Guardar rutina de ${alumno.nombre.split(' ')[0]}`}
          </button>
        </>
      )}
    </div>
  )
}

/** Comentarios de los socios: cómo se sintieron, con qué ganas y lo que escribieron. */
function ListaComentarios({ comentarios, conAlumno = false, alAbrir }) {
  return (
    <ul className="flex flex-col gap-2">
      {comentarios.map(c => {
        const sensacion = sensacionDe(c.sensacion)
        const ganas = ganasDe(c.ganas)
        const contenido = (
          <>
            <span className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1">
              <span className="min-w-0 text-sm font-semibold">
                {conAlumno && <>{c.alumno} · </>}{c.dia}
              </span>
              <span className="shrink-0 text-[11px]" style={{ color: 'var(--color-texto-3)' }}>{fechaHora(c.creado_en)}</span>
            </span>
            <span className="mt-1.5 flex flex-wrap gap-1.5">
              <span className={`insignia ${sensacion?.insignia}`}>Se sintió {sensacion?.texto.toLowerCase()}</span>
              <span className={`insignia ${ganas?.insignia}`}>Ganas {ganas?.texto.toLowerCase()}</span>
            </span>
            {c.texto && (
              <span className="mt-1.5 block whitespace-pre-line break-words text-sm" style={{ color: 'var(--color-texto-2)' }}>
                {c.texto}
              </span>
            )}
          </>
        )
        return (
          <li key={c.id}>
            {alAbrir ? (
              <button
                type="button" onClick={() => alAbrir(c)}
                className="block w-full rounded-xl p-3 text-left transition-colors hover:brightness-110"
                style={{ backgroundColor: 'var(--color-elevado)' }}
              >
                {contenido}
              </button>
            ) : (
              <div className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-elevado)' }}>{contenido}</div>
            )}
          </li>
        )
      })}
    </ul>
  )
}
