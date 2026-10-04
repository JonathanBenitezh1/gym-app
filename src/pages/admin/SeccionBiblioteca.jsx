import { useState, useEffect, useCallback, useRef, useId } from 'react'
import {
  obtenerBiblioteca, obtenerPendientes, crearEjercicio, editarEjercicio, borrarEjercicio
} from '../../services/bibliotecaService'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoLapiz, IconoBasura, IconoBuscar, IconoMas } from '../../components/Iconos'
import { recordado, recordar } from '../../utils/memoria'

/**
 * Biblioteca de ejercicios (migración 020, 03/10/2026). El dueño carga cada
 * ejercicio una vez con un consejo corto, y el socio lo ve en su rutina en
 * todo ejercicio que se llame igual. Los profes ven los nombres como
 * sugerencia al armar rutinas. El video de cada uno llega con el VPS.
 */

const FICHA_VACIA = { nombre: '', consejo: '' }
const MAX_CONSEJO = 200

// Igual que el servidor (utils/ejercicios.js): sin mayúsculas, tildes ni espacios de más.
const clave = (texto) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/\s+/g, ' ').trim()

export default function SeccionBiblioteca({ alExito, alError, confirmar }) {
  const [fichas, setFichas] = useState(() => recordado('panel.biblioteca') ?? [])
  const [cargando, setCargando] = useState(() => !recordado('panel.biblioteca'))
  const [pendientes, setPendientes] = useState([])
  const [form, setForm] = useState(FICHA_VACIA)
  const [editando, setEditando] = useState(null)
  const [formEdit, setFormEdit] = useState(FICHA_VACIA)
  const [guardando, setGuardando] = useState(false)
  const [filtro, setFiltro] = useState('')
  const campoConsejo = useRef(null)

  const cargar = useCallback(async () => {
    try {
      const [lista, sinFicha] = await Promise.all([obtenerBiblioteca(), obtenerPendientes()])
      setFichas(lista)
      recordar('panel.biblioteca', lista)
      setPendientes(sinFicha)
    } catch {
      alError('No pudimos cargar la biblioteca')
    } finally {
      setCargando(false)
    }
  }, [alError])

  useEffect(() => { cargar() }, [cargar])

  const crear = async (e) => {
    e.preventDefault()
    setGuardando(true)
    try {
      await crearEjercicio(form)
      setForm(FICHA_VACIA)
      await cargar()
      alExito('Ejercicio agregado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el ejercicio')
    } finally {
      setGuardando(false)
    }
  }

  const guardar = async (ficha) => {
    setGuardando(true)
    try {
      await editarEjercicio(ficha.id, formEdit)
      setEditando(null)
      await cargar()
      alExito('Ejercicio actualizado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar el ejercicio')
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async (ficha) => {
    const seguro = await confirmar({
      titulo: `¿Borrar ${ficha.nombre} de la biblioteca?`,
      mensaje: 'Las rutinas no cambian: el ejercicio sigue ahí, sin el consejo.',
      textoConfirmar: 'Borrar',
      peligroso: true
    })
    if (!seguro) return
    try {
      await borrarEjercicio(ficha.id)
      await cargar()
      alExito('Ejercicio borrado')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos borrar el ejercicio')
    }
  }

  // Tocar uno de los usados en rutinas lo pasa al formulario, listo para el consejo.
  const usarPendiente = (nombre) => {
    setForm({ nombre, consejo: '' })
    campoConsejo.current?.focus()
  }

  const buscado = clave(filtro)
  const visibles = buscado ? fichas.filter(f => clave(f.nombre).includes(buscado)) : fichas

  return (
    <div className="grid grid-cols-1 gap-4 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">

      <div className="flex h-fit flex-col gap-4">
        <form onSubmit={crear} className="tarjeta flex flex-col gap-3 p-4">
          <h2 className="titulo-seccion">Nuevo ejercicio</h2>
          <CamposFicha datos={form} alCambiar={setForm} refConsejo={campoConsejo} />
          <button type="submit" disabled={guardando} className="btn btn-primario btn-bloque">
            {guardando ? 'Guardando…' : 'Agregar a la biblioteca'}
          </button>
          <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
            El socio ve el consejo en su rutina, en todo ejercicio que se llame igual (sin contar mayúsculas ni tildes).
            El video de cada uno se suma cuando esté el servidor nuevo.
          </p>
        </form>

        {pendientes.length > 0 && (
          <section className="tarjeta flex flex-col gap-2.5 p-4">
            <h2 className="titulo-seccion">Ya usados en rutinas, sin ficha</h2>
            <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
              Tocá uno para cargarle el consejo.
            </p>
            <div className="flex flex-wrap gap-1.5">
              {pendientes.map(p => (
                <button
                  key={p.nombre} type="button"
                  onClick={() => usarPendiente(p.nombre)}
                  className="pildora inline-flex items-center gap-1"
                >
                  <IconoMas size={12} /> {p.nombre}
                </button>
              ))}
            </div>
          </section>
        )}
      </div>

      <div className="flex flex-col gap-2.5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="titulo-seccion">Biblioteca ({fichas.length})</h2>
          {fichas.length > 5 && (
            <label className="relative w-full sm:w-56">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
                <IconoBuscar size={15} />
              </span>
              <input
                className="campo pl-9" placeholder="Buscar ejercicio" aria-label="Buscar ejercicio"
                value={filtro} onChange={e => setFiltro(e.target.value)}
              />
            </label>
          )}
        </div>

        {cargando ? <SkeletonLista filas={4} /> : fichas.length === 0 ? (
          <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
            Todavía no hay ejercicios. Cargá los que más se usan, con un consejo de uno o dos renglones.
          </div>
        ) : visibles.length === 0 ? (
          <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
            Ningún ejercicio se llama así.
          </div>
        ) : visibles.map(f => (
          <article key={f.id} className="tarjeta p-4">
            {editando === f.id ? (
              <div className="flex flex-col gap-3">
                <CamposFicha datos={formEdit} alCambiar={setFormEdit} />
                <div className="flex gap-2">
                  <button onClick={() => guardar(f)} disabled={guardando} className="btn btn-primario flex-1">
                    {guardando ? 'Guardando…' : 'Guardar'}
                  </button>
                  <button onClick={() => setEditando(null)} className="btn btn-contorno">Cancelar</button>
                </div>
              </div>
            ) : (
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="break-words font-semibold">{f.nombre}</p>
                  {f.consejo ? (
                    <p className="mt-1 whitespace-pre-line break-words text-sm" style={{ color: 'var(--color-texto-2)' }}>{f.consejo}</p>
                  ) : (
                    <p className="mt-1 text-xs" style={{ color: 'var(--color-alerta)' }}>Sin consejo: el socio no ve nada todavía</p>
                  )}
                </div>
                <div className="flex shrink-0 gap-1.5">
                  <button
                    aria-label={`Editar ${f.nombre}`}
                    onClick={() => { setEditando(f.id); setFormEdit({ nombre: f.nombre, consejo: f.consejo || '' }) }}
                    className="btn btn-contorno btn-chico btn-icono"
                  >
                    <IconoLapiz size={15} />
                  </button>
                  <button aria-label={`Borrar ${f.nombre}`} onClick={() => borrar(f)} className="btn btn-peligro btn-chico btn-icono">
                    <IconoBasura size={15} />
                  </button>
                </div>
              </div>
            )}
          </article>
        ))}
      </div>
    </div>
  )
}

// Cada formulario (el nuevo y el de editar) con sus propios ids: sin
// htmlFor, el lector de pantalla no leía "Nombre" ni "Consejo".
function CamposFicha({ datos, alCambiar, refConsejo }) {
  const id = useId()
  return (
    <>
      <div>
        <label htmlFor={`${id}-nombre`} className="etiqueta-campo">Nombre</label>
        <input id={`${id}-nombre`} className="campo" required minLength={2} maxLength={100} placeholder="Press banca, Sentadilla…"
               value={datos.nombre} onChange={e => alCambiar(d => ({ ...d, nombre: e.target.value }))} />
      </div>
      <div>
        <div className="flex items-baseline justify-between gap-2">
          <label htmlFor={`${id}-consejo`} className="etiqueta-campo">Consejo</label>
          <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>{datos.consejo.length}/{MAX_CONSEJO}</span>
        </div>
        <textarea
          id={`${id}-consejo`}
          ref={refConsejo}
          className="campo resize-none" rows={3} maxLength={MAX_CONSEJO}
          placeholder="Ej: espalda derecha, bajá controlado y estirá bien los brazos"
          value={datos.consejo} onChange={e => alCambiar(d => ({ ...d, consejo: e.target.value }))}
        />
      </div>
    </>
  )
}
