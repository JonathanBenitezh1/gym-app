import { useState, useEffect } from 'react'
import {
  buscarAlumnos, obtenerRutinaDeAlumno, guardarRutina,
  obtenerPlantillas, guardarPlantilla, borrarPlantilla
} from '../services/profesorService'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import { IconoBuscar, IconoMas, IconoCruz, IconoBasura } from './Iconos'
import Progreso from './Progreso'
import { obtenerProgresoDeAlumno } from '../services/progresoService'

// Editor de rutinas: se busca al alumno por nombre o DNI. Lo usan el panel del profe y el del admin:
// la API guarda la rutina a nombre de quien la carga.

// Lo que vuelve de la base trae null donde el campo espera texto.
const aEditor = (lista) => lista.map(s => ({
  nombre: s.nombre,
  orden: s.orden,
  ejercicios: s.ejercicios?.length
    ? s.ejercicios.map(ej => ({ ...ej, series: ej.series ?? '', repeticiones: ej.repeticiones ?? '' }))
    : [{ nombre: '', series: '', repeticiones: '', orden: 1 }]
}))

const sesionVacia = (orden = 1) => ({
  nombre: '', orden,
  ejercicios: [{ nombre: '', series: '', repeticiones: '', orden: 1 }]
})

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

  const elegir = async (encontrado) => {
    setResultados(null)
    setAlumno(encontrado)
    setProgreso([])
    obtenerProgresoDeAlumno(encontrado.id).then(setProgreso).catch(() => {})
    try {
      const rutina = await obtenerRutinaDeAlumno(encontrado.id)
      if (rutina?.sesiones?.length > 0) {
        setSesiones(aEditor(rutina.sesiones))
        alExito('Ya tenía una rutina cargada, la abrimos para editar')
      } else {
        setSesiones([sesionVacia()])
      }
    } catch {
      alError('No pudimos abrir la rutina de este alumno')
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
      ejercicios: [...s.ejercicios, { nombre: '', series: '', repeticiones: '', orden: s.ejercicios.length + 1 }]
    }))

  const quitarEjercicio = (si, ei) =>
    setSesiones(prev => prev.map((s, idx) => idx !== si ? s : {
      ...s, ejercicios: s.ejercicios.filter((_, j) => j !== ei)
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
                {sesion.ejercicios.map((ej, ei) => (
                  <div key={ei} className="rounded-xl p-3" style={{ backgroundColor: 'var(--color-fondo)' }}>
                    <div className="mb-2 flex items-center gap-2">
                      <span
                        className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                        style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
                      >
                        {ei + 1}
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
                      <div className="flex-1">
                        <label className="etiqueta-campo">Series</label>
                        <input
                          type="number" min="1" className="campo" placeholder="3"
                          value={ej.series}
                          onChange={e => actualizarEjercicio(si, ei, 'series', e.target.value)}
                        />
                      </div>
                      <div className="flex-1">
                        <label className="etiqueta-campo">Repeticiones</label>
                        <input
                          className="campo" placeholder="10-12"
                          value={ej.repeticiones}
                          onChange={e => actualizarEjercicio(si, ei, 'repeticiones', e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}

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
