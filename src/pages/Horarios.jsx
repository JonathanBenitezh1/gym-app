import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { obtenerHorarios, crearReserva, obtenerHorariosReservados } from '../services/clasesService'
import NavBar from '../components/NavBar'
import { SkeletonListaHorarios } from '../components/Skeleton'
import { IconoReloj, IconoCheck, IconoUsuarios } from '../components/Iconos'
import { precio, rangoHorario } from '../utils/formato'
import logoDtc from './img/logo_png.png'

const RAMAS = [
  { valor: 'todos',       texto: 'Todas' },
  { valor: 'gimnasio',    texto: 'Gimnasio' },
  { valor: 'disciplina',  texto: 'Disciplinas' },
  { valor: 'profesional', texto: 'Profesionales' }
]
const DIAS = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

export default function Horarios() {
  const { usuario } = useAuth()
  const { exito, error: avisarError, confirmar } = useAvisos()
  const navigate = useNavigate()

  const [horarios, setHorarios]     = useState([])
  const [reservados, setReservados] = useState([])
  const [seleccion, setSeleccion]   = useState([])
  const [rama, setRama]             = useState('todos')
  const [dia, setDia]               = useState('todos')
  const [tipo, setTipo]             = useState('semanal')
  const [cargando, setCargando]     = useState(true)
  const [reservando, setReservando] = useState(false)

  const cargarTodo = useCallback(async () => {
    try {
      const [listaHorarios, listaReservados] = await Promise.all([
        obtenerHorarios(),
        obtenerHorariosReservados()
      ])
      setHorarios(listaHorarios)
      setReservados(listaReservados)
    } catch {
      avisarError('No pudimos cargar los horarios. Revisá tu conexión.')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  useSocketEventos({
    actualizacion_horarios: () => cargarTodo(),
    reserva_cancelada: () => cargarTodo()
  })

  const visibles = useMemo(() => horarios.filter(h =>
    (rama === 'todos' || h.rama === rama) &&
    (dia  === 'todos' || h.dia_semana === dia)
  ), [horarios, rama, dia])

  // Agrupamos por día para que la lista se lea como una agenda
  const porDia = useMemo(() => {
    const grupos = new Map()
    for (const h of visibles) {
      if (!grupos.has(h.dia_semana)) grupos.set(h.dia_semana, [])
      grupos.get(h.dia_semana).push(h)
    }
    return [...grupos.entries()].sort(
      (a, b) => DIAS.indexOf(a[0]) - DIAS.indexOf(b[0])
    )
  }, [visibles])

  const estaReservado    = (id) => reservados.includes(id)
  const estaSeleccionado = (id) => seleccion.some(s => s.id === id)

  const alternar = (horario) => {
    setSeleccion(actual => actual.some(s => s.id === horario.id)
      ? actual.filter(s => s.id !== horario.id)
      : [...actual, horario]
    )
  }

  const total = useMemo(() => {
    const suma = seleccion.reduce((acc, h) => acc + Number(h.precio), 0)
    return tipo === 'quincenal' ? suma * 2 : suma
  }, [seleccion, tipo])

  /** Calcula el período desde el próximo lunes. */
  const calcularFechas = () => {
    const hoy = new Date()
    const diaSemana = hoy.getDay() // 0 = domingo
    const faltan = diaSemana === 0 ? 1 : 8 - diaSemana
    const inicio = new Date(hoy)
    inicio.setDate(hoy.getDate() + faltan)
    const fin = new Date(inicio)
    fin.setDate(inicio.getDate() + (tipo === 'quincenal' ? 14 : 7))
    const iso = (f) => `${f.getFullYear()}-${String(f.getMonth() + 1).padStart(2, '0')}-${String(f.getDate()).padStart(2, '0')}`
    return { fecha_inicio: iso(inicio), fecha_fin: iso(fin) }
  }

  const reservar = async () => {
    if (seleccion.length === 0) return

    const confirmado = await confirmar({
      titulo: `Confirmar ${seleccion.length === 1 ? 'la reserva' : 'las reservas'}`,
      mensaje: `Vas a reservar ${seleccion.length} ${seleccion.length === 1 ? 'clase' : 'clases'} en modalidad ${tipo}, por un total de ${precio(total)}. Después vas a poder elegir cómo pagar.`,
      textoConfirmar: 'Reservar'
    })
    if (!confirmado) return

    setReservando(true)
    try {
      const { fecha_inicio, fecha_fin } = calcularFechas()
      await crearReserva({
        horarios_ids: seleccion.map(s => s.id),
        tipo, fecha_inicio, fecha_fin
      })
      setSeleccion([])
      await cargarTodo()
      exito('¡Listo! Ya podés pasar a pagar tus reservas.')
      navigate('/reservas')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos crear la reserva')
    } finally {
      setReservando(false)
    }
  }

  const hayBarra = seleccion.length > 0

  return (
    <div className="min-h-screen" style={{ paddingBottom: hayBarra ? '11rem' : 'calc(var(--alto-nav) + 1.5rem)' }}>

      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-superficie)',
          borderBottom: '1px solid var(--color-linea-sutil)'
        }}
      >
        <div className="contenedor-ancho flex items-center justify-between py-3">
          <img src={logoDtc} alt="DTC Fight & Fitness" className="h-9 w-auto" />
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Hola,</p>
            <p className="text-sm font-semibold leading-tight">{usuario?.nombre}</p>
          </div>
        </div>
      </header>

      <main className="contenedor-ancho pt-5">

        <h1 className="text-lg font-bold tracking-tight">Reservá tus clases</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          Elegí una o varias y confirmá todo junto
        </p>

        {/* Modalidad */}
        <div className="mt-5">
          <p className="titulo-seccion mb-2">Modalidad</p>
          <div
            className="flex gap-1 rounded-xl p-1"
            style={{ backgroundColor: 'var(--color-superficie)' }}
          >
            {['semanal', 'quincenal'].map(t => (
              <button
                key={t}
                onClick={() => setTipo(t)}
                className="flex-1 rounded-lg py-2.5 text-sm font-semibold capitalize transition-colors"
                style={tipo === t
                  ? { backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }
                  : { color: 'var(--color-texto-2)' }}
              >
                {t}
                <span className="ml-1 text-[11px] font-normal opacity-70">
                  {t === 'semanal' ? '1 sem.' : '2 sem.'}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Filtros */}
        <div className="mt-5 flex flex-col gap-2">
          <div className="fila-scroll">
            {RAMAS.map(r => (
              <button
                key={r.valor}
                onClick={() => setRama(r.valor)}
                className={`pildora ${rama === r.valor ? 'pildora-activa' : ''}`}
              >
                {r.texto}
              </button>
            ))}
          </div>
          <div className="fila-scroll">
            <button
              onClick={() => setDia('todos')}
              className={`pildora ${dia === 'todos' ? 'pildora-activa' : ''}`}
            >
              Todos los días
            </button>
            {DIAS.map(d => (
              <button
                key={d}
                onClick={() => setDia(d)}
                className={`pildora ${dia === d ? 'pildora-activa' : ''}`}
              >
                {d.slice(0, 3)}
              </button>
            ))}
          </div>
        </div>

        {/* Listado */}
        <div className="mt-6">
          {cargando ? (
            <SkeletonListaHorarios />
          ) : porDia.length === 0 ? (
            <div className="tarjeta p-8 text-center">
              <p className="font-medium">No hay clases con ese filtro</p>
              <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
                Probá con otro día o disciplina
              </p>
              <button
                onClick={() => { setRama('todos'); setDia('todos') }}
                className="btn btn-contorno btn-chico mt-4"
              >
                Ver todas
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {porDia.map(([nombreDia, clases]) => (
                <section key={nombreDia}>
                  <h2 className="titulo-seccion mb-2">{nombreDia}</h2>
                  <div className="grid gap-2.5 sm:grid-cols-2">
                    {clases.map(h => (
                      <TarjetaHorario
                        key={h.id}
                        horario={h}
                        reservado={estaReservado(h.id)}
                        seleccionado={estaSeleccionado(h.id)}
                        alElegir={() => alternar(h)}
                      />
                    ))}
                  </div>
                </section>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* Barra de acción. z-40 la deja por encima del botón de WhatsApp (z-30):
          antes se superponían y el toque no llegaba al botón de reservar. */}
      {hayBarra && (
        <div
          className="aparecer fixed left-0 right-0 z-40"
          style={{
            bottom: 'var(--alto-nav)',
            backgroundColor: 'var(--color-elevado)',
            borderTop: '1px solid var(--color-linea)'
          }}
        >
          <div className="contenedor-ancho flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-sm font-semibold">
                {seleccion.length} {seleccion.length === 1 ? 'clase' : 'clases'}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                {tipo} · <span style={{ color: 'var(--color-acento)' }}>{precio(total)}</span>
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setSeleccion([])} className="btn btn-fantasma btn-chico">
                Limpiar
              </button>
              <button onClick={reservar} disabled={reservando} className="btn btn-primario">
                {reservando ? 'Reservando…' : 'Reservar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar hayBarraAccion={hayBarra} />
    </div>
  )
}

/* ─── Tarjeta de un horario ────────────────────────────── */

function TarjetaHorario({ horario, reservado, seleccionado, alElegir }) {
  const sinCupos = horario.cupos_disponibles === 0
  const bloqueada = reservado || sinCupos
  const pocosCupos = !sinCupos && horario.cupos_disponibles <= 3

  return (
    <button
      type="button"
      onClick={() => !bloqueada && alElegir()}
      disabled={bloqueada}
      aria-pressed={seleccionado}
      className="tarjeta tarjeta-interactiva w-full p-3.5 text-left disabled:cursor-not-allowed"
      style={{
        borderColor: seleccionado ? 'var(--color-acento)' : undefined,
        backgroundColor: seleccionado ? 'var(--color-acento-bajo)' : undefined,
        opacity: bloqueada ? 0.55 : 1
      }}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
            <span className="insignia insignia-neutra capitalize">{horario.rama}</span>
            {reservado && (
              <span className="insignia insignia-exito">
                <IconoCheck size={11} /> Ya reservada
              </span>
            )}
            {sinCupos && !reservado && (
              <span className="insignia insignia-error">Sin cupos</span>
            )}
            {pocosCupos && !reservado && (
              <span className="insignia insignia-alerta">
                Quedan {horario.cupos_disponibles}
              </span>
            )}
          </div>

          <p className="truncate font-semibold">{horario.clase}</p>

          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
            <IconoReloj size={13} />
            {rangoHorario(horario.hora_inicio, horario.hora_fin)}
          </p>

          {horario.profesor && (
            <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>
              Prof. {horario.profesor}
            </p>
          )}
        </div>

        <div className="shrink-0 text-right">
          <p className="font-bold" style={{ color: seleccionado ? 'var(--color-acento)' : 'var(--color-texto)' }}>
            {precio(horario.precio)}
          </p>
          <p className="mt-1 flex items-center justify-end gap-1 text-[11px]" style={{ color: 'var(--color-texto-3)' }}>
            <IconoUsuarios size={12} />
            {horario.cupos_disponibles}/{horario.cupos_totales}
          </p>
          {seleccionado && (
            <span
              className="mt-2 inline-flex h-5 w-5 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }}
            >
              <IconoCheck size={13} />
            </span>
          )}
        </div>
      </div>
    </button>
  )
}
