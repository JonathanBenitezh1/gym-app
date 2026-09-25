import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { useSocketEventos } from '../hooks/useSocketEventos'
import {
  obtenerHorarios, crearReserva, obtenerHorariosReservados,
  obtenerMiEspera, anotarEnEspera, salirDeEspera,
  obtenerPlanes, pedirPlan, cancelarPedidoPlan,
  obtenerMisFijos, tomarFijos, dejarFijo
} from '../services/clasesService'
import { obtenerMiCuota } from '../services/perfilService'
import NavBar from '../components/NavBar'
import ProfesEnSede from '../components/ProfesEnSede'
import AvisoApto from '../components/AvisoApto'
import AvisoCuota from '../components/AvisoCuota'
import { SkeletonListaHorarios } from '../components/Skeleton'
import { IconoReloj, IconoCheck, IconoUsuarios, IconoCalendario, IconoFlecha } from '../components/Iconos'
import { precio, rangoHorario, textoDias, fechaCorta } from '../utils/formato'
import { periodoDeReserva, textoPeriodo } from '../utils/periodo'
import logoDtc from './img/logo_png.png'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Pantalla de clases del socio (pedido del gimnasio, 25/09/2026).
 *
 * - Sin plan: elige entre semanal (paga una semana de un horario completo,
 *   "Lucha lunes, miércoles y viernes") y mensual (pide un plan, que cobra el
 *   mostrador).
 * - Con plan al día o en gracia: ve solo lo suyo. Sus lugares fijos y los
 *   horarios de las clases de su plan, donde toma lugar sin pagar aparte. Los
 *   demás planes y semanales quedan en "Ver suscripciones".
 */
export default function Horarios() {
  const { usuario } = useAuth()
  const { exito, error: avisarError, confirmar } = useAvisos()
  const navigate = useNavigate()

  const [horarios, setHorarios]     = useState([])
  const [reservados, setReservados] = useState([])
  const [fijos, setFijos]           = useState([])
  const [planes, setPlanes]         = useState([])
  const [cuota, setCuota]           = useState(null)
  const [espera, setEspera]         = useState([])
  const [seleccion, setSeleccion]   = useState([])
  const [vistaElegida, setVista]    = useState(null)
  const [modalidad, setModalidad]   = useState('semanal')
  const [disciplina, setDisciplina] = useState('todas')
  const [cargando, setCargando]     = useState(true)
  const [enviando, setEnviando]     = useState(false)

  // Las semanales son de la semana que viene: los lugares libres y "Ya
  // reservada" son de esas fechas.
  const periodo = useMemo(() => periodoDeReserva('semanal'), [])

  const cargarTodo = useCallback(async () => {
    try {
      const [listaHorarios, listaReservados, listaEspera, listaFijos, miCuota, listaPlanes] = await Promise.all([
        obtenerHorarios(periodo),
        obtenerHorariosReservados(periodo),
        // Lo secundario no frena la pantalla si falla.
        obtenerMiEspera().catch(() => []),
        obtenerMisFijos().catch(() => []),
        obtenerMiCuota().catch(() => null),
        obtenerPlanes().catch(() => [])
      ])
      setHorarios(listaHorarios)
      setReservados(listaReservados)
      setEspera(listaEspera.map(e => e.horario_id))
      setFijos(listaFijos)
      setCuota(miCuota)
      setPlanes(listaPlanes)
      // Sale de lo elegido lo que ya no se puede tomar.
      const tomados = new Set([...listaReservados, ...listaFijos.map(f => f.horario_id)])
      setSeleccion(actual => actual
        .map(s => listaHorarios.find(h => h.id === s.id))
        .filter(h => h && h.cupos_disponibles > 0 && !tomados.has(h.id)))
    } catch {
      avisarError('No pudimos cargar los horarios. Revisá tu conexión.')
    } finally {
      setCargando(false)
    }
  }, [avisarError, periodo])

  useEffect(() => { cargarTodo() }, [cargarTodo])

  useSocketEventos({
    actualizacion_horarios: () => cargarTodo(),
    reserva_cancelada: () => cargarTodo(),
    cupo_liberado: () => cargarTodo(),
    cuota_actualizada: () => cargarTodo(),
    planes_actualizados: () => cargarTodo()
  })

  const planVigente = Boolean(cuota?.plan_id) && ['al_dia', 'gracia'].includes(cuota?.estado)
  const esSocio = cuota && cuota.estado !== 'personal'
  // Con plan, arranca en lo suyo; sin plan, en el catálogo.
  const vista = planVigente ? (vistaElegida ?? 'mias') : 'catalogo'

  const cambiarVista = (nueva) => { setVista(nueva); setSeleccion([]) }
  const cambiarModalidad = (nueva) => { setModalidad(nueva); setSeleccion([]) }

  const idsFijos = useMemo(() => new Set(fijos.map(f => f.horario_id)), [fijos])
  const incluida = useCallback(
    (claseId) => Boolean(cuota?.incluye_todo) || (cuota?.clases_ids ?? []).includes(claseId),
    [cuota]
  )

  // ─── Lista de espera ───

  const alternarEspera = async (horario) => {
    const anotado = espera.includes(horario.id)
    try {
      if (anotado) {
        await salirDeEspera(horario.id)
        setEspera(actual => actual.filter(id => id !== horario.id))
        exito('Saliste de la lista de espera')
      } else {
        await anotarEnEspera(horario.id)
        setEspera(actual => [...actual, horario.id])
        exito('Te avisamos acá si se libera un lugar')
      }
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos actualizar la lista de espera')
      cargarTodo()
    }
  }

  const liberados = useMemo(
    () => horarios.filter(h => espera.includes(h.id) && h.cupos_disponibles > 0 &&
      !reservados.includes(h.id) && !idsFijos.has(h.id)),
    [horarios, espera, reservados, idsFijos]
  )

  // ─── Qué se muestra ───

  const disciplinas = useMemo(
    () => [...new Set(horarios.map(h => h.clase))].sort((a, b) => a.localeCompare(b, 'es')),
    [horarios]
  )

  // Catálogo semanal, agrupado por disciplina.
  const porDisciplina = useMemo(() => {
    const grupos = new Map()
    for (const h of horarios) {
      if (disciplina !== 'todas' && h.clase !== disciplina) continue
      if (!grupos.has(h.clase)) grupos.set(h.clase, [])
      grupos.get(h.clase).push(h)
    }
    return [...grupos.entries()].sort((a, b) => a[0].localeCompare(b[0], 'es'))
  }, [horarios, disciplina])

  // Los horarios de las clases de su plan donde todavía no tiene lugar.
  const delPlan = useMemo(
    () => horarios.filter(h => incluida(h.clase_id) && !idsFijos.has(h.id)),
    [horarios, incluida, idsFijos]
  )

  // Qué clases trae cada plan, con sus horarios, para mostrarlo.
  const clasesConHorarios = useMemo(() => {
    const mapa = new Map()
    for (const h of horarios) {
      if (!mapa.has(h.clase_id)) mapa.set(h.clase_id, { id: h.clase_id, nombre: h.clase, horarios: [] })
      mapa.get(h.clase_id).horarios.push(h)
    }
    return [...mapa.values()].sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'))
  }, [horarios])

  // ─── Selección y acciones ───

  const estaSeleccionado = (id) => seleccion.some(s => s.id === id)
  const alternar = (horario) => {
    setSeleccion(actual => actual.some(s => s.id === horario.id)
      ? actual.filter(s => s.id !== horario.id)
      : [...actual, horario]
    )
  }

  const total = useMemo(() => seleccion.reduce((acc, h) => acc + Number(h.precio), 0), [seleccion])

  const reservarSemanal = async () => {
    const n = seleccion.length
    const confirmado = await confirmar({
      titulo: `Confirmar ${n === 1 ? 'la reserva' : 'las reservas'}`,
      mensaje: `Vas a reservar ${n} ${n === 1 ? 'horario' : 'horarios'} ${textoPeriodo(periodo)}, por un total de ${precio(total)}. Después vas a poder elegir cómo pagar.`,
      textoConfirmar: 'Reservar'
    })
    if (!confirmado) return

    setEnviando(true)
    try {
      const { fecha_inicio, fecha_fin } = periodo
      await crearReserva({ horarios_ids: seleccion.map(s => s.id), tipo: 'semanal', fecha_inicio, fecha_fin })
      setSeleccion([])
      await cargarTodo()
      exito('¡Listo! Ya podés pasar a pagar tus reservas.')
      navigate('/reservas')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos crear la reserva')
    } finally {
      setEnviando(false)
    }
  }

  const tomarLugares = async () => {
    const n = seleccion.length
    const confirmado = await confirmar({
      titulo: n === 1 ? 'Tomar tu lugar fijo' : 'Tomar tus lugares fijos',
      mensaje: `${seleccion.map(h => `${h.clase} (${textoDias(h.dias).toLowerCase()})`).join(', ')}. Está incluido en tu plan: el lugar es tuyo todas las semanas mientras lo tengas al día.`,
      textoConfirmar: 'Tomar lugar'
    })
    if (!confirmado) return

    setEnviando(true)
    try {
      await tomarFijos(seleccion.map(s => s.id))
      setSeleccion([])
      await cargarTodo()
      exito(n === 1 ? '¡Listo! Ya tenés tu lugar fijo.' : '¡Listo! Ya tenés tus lugares fijos.')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos guardar tu lugar')
      cargarTodo()
    } finally {
      setEnviando(false)
    }
  }

  const soltarFijo = async (fijo) => {
    const seguro = await confirmar({
      titulo: '¿Dejar tu lugar fijo?',
      mensaje: `${fijo.clase}, ${textoDias(fijo.dias).toLowerCase()} ${rangoHorario(fijo.hora_inicio, fijo.hora_fin)}. El lugar queda libre para otro socio; si sigue habiendo, lo podés volver a tomar.`,
      textoConfirmar: 'Dejar lugar',
      peligroso: true
    })
    if (!seguro) return
    try {
      await dejarFijo(fijo.horario_id)
      await cargarTodo()
      exito('Dejaste el lugar')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos dejar el lugar')
    }
  }

  const pedir = async (plan) => {
    const confirmado = await confirmar({
      titulo: `Pedir el plan ${plan.nombre}`,
      mensaje: `${precio(plan.precio)} por mes. Lo pagás en el gimnasio y ahí queda activo: después elegís tus horarios desde acá.`,
      textoConfirmar: 'Pedir plan'
    })
    if (!confirmado) return
    try {
      await pedirPlan(plan.id)
      await cargarTodo()
      exito('Listo. Pagalo en el gimnasio para activarlo.')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos registrar el pedido')
    }
  }

  const cancelarPedido = async () => {
    try {
      await cancelarPedidoPlan()
      await cargarTodo()
      exito('Cancelaste el pedido')
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos cancelar el pedido')
    }
  }

  const hayBarra = seleccion.length > 0
  const barraFijos = vista === 'mias'

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
          <img src={logoDtc} alt={GIMNASIO.nombre} className="h-9 w-auto" />
          <div className="text-right">
            <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Hola,</p>
            <p className="text-sm font-semibold leading-tight">{usuario?.nombre}</p>
          </div>
        </div>
      </header>

      <main className="contenedor-ancho pt-5">

        {vista === 'mias' ? (
          <>
            <h1 className="text-lg font-bold tracking-tight">Tus clases</h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
              Lo que incluye tu plan
            </p>
          </>
        ) : (
          <>
            {planVigente && (
              <button onClick={() => cambiarVista('mias')} className="btn btn-fantasma btn-chico mb-2 -ml-2">
                <IconoFlecha size={14} /> Mis clases
              </button>
            )}
            <h1 className="text-lg font-bold tracking-tight">
              {planVigente ? 'Suscripciones' : 'Reservá tus clases'}
            </h1>
            <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
              {modalidad === 'semanal' ? 'Elegí uno o varios horarios y confirmá todo junto' : 'Elegí un plan y pagalo en el gimnasio'}
            </p>
          </>
        )}

        <ProfesEnSede className="mt-4" />
        <AvisoCuota className="mt-4" />
        <AvisoApto className="mt-4" />

        {cuota?.plan_pedido && (
          <div className="aparecer tarjeta mt-4 flex items-start justify-between gap-3 p-3.5"
               style={{ borderColor: 'var(--color-acento)', backgroundColor: 'var(--color-acento-bajo)' }}>
            <div className="min-w-0">
              <p className="text-sm font-semibold" style={{ color: 'var(--color-acento)' }}>
                Pediste el plan {cuota.plan_pedido}
              </p>
              <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
                Pagalo en el gimnasio y queda activo.
              </p>
            </div>
            <button onClick={cancelarPedido} className="btn btn-fantasma btn-chico shrink-0">Cancelar</button>
          </div>
        )}

        {liberados.length > 0 && (
          <div
            className="aparecer tarjeta mt-4 p-3.5"
            style={{ borderColor: 'var(--color-exito)', backgroundColor: 'var(--color-exito-bajo)' }}
          >
            <p className="text-sm font-semibold" style={{ color: 'var(--color-exito)' }}>
              ¡Se liberó un lugar!
            </p>
            <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
              {liberados.map(h => `${h.clase} ${textoDias(h.dias).toLowerCase()} ${rangoHorario(h.hora_inicio, h.hora_fin)}`).join(' · ')}.
              {' '}Es del primero que lo toma.
            </p>
          </div>
        )}

        {cargando ? (
          <div className="mt-6"><SkeletonListaHorarios /></div>
        ) : vista === 'mias' ? (
          <VistaMiPlan
            cuota={cuota}
            fijos={fijos}
            delPlan={delPlan}
            espera={espera}
            estaSeleccionado={estaSeleccionado}
            alElegir={alternar}
            alAlternarEspera={alternarEspera}
            alSoltar={soltarFijo}
            alVerSuscripciones={() => cambiarVista('catalogo')}
          />
        ) : (
          <>
            {/* Modalidad */}
            <div className="mt-5">
              <p className="titulo-seccion mb-2">Modalidad</p>
              <div className="flex gap-1 rounded-xl p-1" style={{ backgroundColor: 'var(--color-superficie)' }}>
                {[
                  { valor: 'semanal', texto: 'Semanal', detalle: '1 sem.' },
                  { valor: 'mensual', texto: 'Mensual', detalle: 'plan' }
                ].map(m => (
                  <button
                    key={m.valor}
                    onClick={() => cambiarModalidad(m.valor)}
                    className="flex-1 rounded-lg py-2.5 text-sm font-semibold transition-colors"
                    style={modalidad === m.valor
                      ? { backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }
                      : { color: 'var(--color-texto-2)' }}
                  >
                    {m.texto}
                    <span className="ml-1 text-[11px] font-normal opacity-70">{m.detalle}</span>
                  </button>
                ))}
              </div>
              <p className="mt-2 text-xs" style={{ color: 'var(--color-texto-2)' }}>
                {modalidad === 'semanal'
                  ? `Reservás ${textoPeriodo(periodo)}. Pagás la semana completa de cada horario.`
                  : 'Pagás el mes y elegís tu lugar fijo en los horarios de las clases del plan.'}
              </p>
            </div>

            {modalidad === 'semanal' ? (
              <>
                {disciplinas.length > 1 && (
                  <div className="fila-scroll mt-5">
                    {['todas', ...disciplinas].map(d => (
                      <button
                        key={d}
                        onClick={() => setDisciplina(d)}
                        className={`pildora ${disciplina === d ? 'pildora-activa' : ''}`}
                      >
                        {d === 'todas' ? 'Todas' : d}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-6">
                  {porDisciplina.length === 0 ? (
                    <div className="tarjeta p-8 text-center">
                      <p className="font-medium">Todavía no hay horarios cargados</p>
                      <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
                        Consultá en el gimnasio
                      </p>
                    </div>
                  ) : (
                    <div className="flex flex-col gap-6">
                      {porDisciplina.map(([nombre, lista]) => (
                        <section key={nombre}>
                          <h2 className="titulo-seccion mb-2">{nombre}</h2>
                          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                            {lista.map(h => (
                              <TarjetaHorario
                                key={h.id}
                                horario={h}
                                tomado={reservados.includes(h.id) || idsFijos.has(h.id)}
                                textoTomado={idsFijos.has(h.id) ? 'Tu lugar fijo' : 'Ya reservada'}
                                seleccionado={estaSeleccionado(h.id)}
                                enEspera={espera.includes(h.id)}
                                alElegir={() => alternar(h)}
                                alAlternarEspera={() => alternarEspera(h)}
                              />
                            ))}
                          </div>
                        </section>
                      ))}
                    </div>
                  )}
                </div>
              </>
            ) : (
              <ListaPlanes
                planes={planes}
                clases={clasesConHorarios}
                cuota={cuota}
                planVigente={planVigente}
                puedePedir={Boolean(esSocio)}
                alPedir={pedir}
                alCancelarPedido={cancelarPedido}
              />
            )}
          </>
        )}
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
                {seleccion.length} {seleccion.length === 1 ? 'horario' : 'horarios'}
              </p>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                {barraFijos
                  ? 'Incluido en tu plan'
                  : <>semanal · <span style={{ color: 'var(--color-acento)' }}>{precio(total)}</span></>}
              </p>
            </div>
            <div className="flex shrink-0 gap-2">
              <button onClick={() => setSeleccion([])} className="btn btn-fantasma btn-chico">
                Limpiar
              </button>
              <button onClick={barraFijos ? tomarLugares : reservarSemanal} disabled={enviando} className="btn btn-primario">
                {enviando ? 'Guardando…' : barraFijos ? 'Tomar lugar' : 'Reservar'}
              </button>
            </div>
          </div>
        </div>
      )}

      <NavBar hayBarraAccion={hayBarra} />
    </div>
  )
}

/* ─── Socio con plan: lo suyo ──────────────────────────── */

function VistaMiPlan({ cuota, fijos, delPlan, espera, estaSeleccionado, alElegir, alAlternarEspera, alSoltar, alVerSuscripciones }) {
  const gracia = cuota.estado === 'gracia'
  return (
    <>
      <div className="tarjeta mt-5 flex items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <p className="titulo-seccion">Tu plan</p>
          <p className="mt-1 truncate text-base font-bold">{cuota.plan}</p>
          <p className="mt-0.5 text-xs" style={{ color: gracia ? 'var(--color-alerta)' : 'var(--color-texto-2)' }}>
            {gracia ? `Vencido: te quedan ${cuota.dias_restantes} ${cuota.dias_restantes === 1 ? 'día' : 'días'} para pagarlo` : `Al día hasta el ${fechaCorta(cuota.cuota_vence)}`}
          </p>
        </div>
        <button onClick={alVerSuscripciones} className="btn btn-contorno btn-chico shrink-0">
          Ver suscripciones
        </button>
      </div>

      <section className="mt-6">
        <h2 className="titulo-seccion mb-2">Tus lugares fijos</h2>
        {fijos.length === 0 ? (
          <div className="tarjeta p-5 text-center text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Todavía no elegiste horarios. Tocá uno de abajo para tomar tu lugar.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {fijos.map(f => (
              <div key={f.horario_id} className="tarjeta p-3.5" style={{ opacity: f.activo ? 1 : 0.55 }}>
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <span className={`insignia ${f.activo ? 'insignia-exito' : 'insignia-alerta'} mb-1.5`}>
                      {f.activo ? <><IconoCheck size={11} /> Lugar fijo</> : 'Suspendida por el gimnasio'}
                    </span>
                    <p className="mt-1.5 truncate font-semibold">{f.clase}</p>
                    <LineaDias dias={f.dias} inicio={f.hora_inicio} fin={f.hora_fin} />
                    {f.profesor && (
                      <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>Prof. {f.profesor}</p>
                    )}
                  </div>
                  <button onClick={() => alSoltar(f)} className="btn btn-fantasma btn-chico shrink-0">Dejar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {delPlan.length > 0 && (
        <section className="mt-6">
          <h2 className="titulo-seccion mb-2">Más horarios de tu plan</h2>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {delPlan.map(h => (
              <TarjetaHorario
                key={h.id}
                horario={h}
                incluido
                seleccionado={estaSeleccionado(h.id)}
                enEspera={espera.includes(h.id)}
                alElegir={() => alElegir(h)}
                alAlternarEspera={() => alAlternarEspera(h)}
              />
            ))}
          </div>
        </section>
      )}
    </>
  )
}

/* ─── Planes mensuales ─────────────────────────────────── */

function ListaPlanes({ planes, clases, cuota, planVigente, puedePedir, alPedir, alCancelarPedido }) {
  if (planes.length === 0) {
    return (
      <div className="tarjeta mt-6 p-8 text-center">
        <p className="font-medium">Todavía no hay planes mensuales</p>
        <p className="mt-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>Consultá en el gimnasio</p>
      </div>
    )
  }
  return (
    <div className="mt-6 grid grid-cols-1 gap-3 sm:grid-cols-2">
      {planes.map(p => {
        const incluidas = p.incluye_todo ? clases : clases.filter(c => p.clases_ids.includes(c.id))
        const esElMio = planVigente && cuota?.plan_id === p.id
        const pedido = cuota?.plan_pedido_id === p.id
        return (
          <article key={p.id} className="tarjeta flex flex-col p-4"
                   style={esElMio ? { borderColor: 'var(--color-exito)' } : pedido ? { borderColor: 'var(--color-acento)' } : undefined}>
            <div className="flex items-start justify-between gap-3">
              <p className="min-w-0 text-base font-bold">{p.nombre}</p>
              <p className="shrink-0 text-right">
                <span className="text-lg font-bold">{precio(p.precio)}</span>
                <span className="block text-[11px]" style={{ color: 'var(--color-texto-3)' }}>por mes</span>
              </p>
            </div>
            {p.descripcion && (
              <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-2)' }}>{p.descripcion}</p>
            )}

            <ul className="mt-3 flex flex-col gap-2">
              {/* Con todas, alcanza con los nombres: los horarios harían una lista eterna. */}
              {p.incluye_todo && (
                <li className="text-xs">
                  <span className="font-semibold" style={{ color: 'var(--color-acento)' }}>Todas las clases del gimnasio</span>
                  <span className="mt-0.5 block" style={{ color: 'var(--color-texto-2)' }}>
                    {incluidas.map(c => c.nombre).join(' · ')}
                  </span>
                </li>
              )}
              {!p.incluye_todo && incluidas.map(c => (
                <li key={c.id} className="text-xs">
                  <span className="font-semibold">{c.nombre}</span>
                  {c.horarios.map(h => (
                    <span key={h.id} className="mt-0.5 flex items-center gap-1.5" style={{ color: 'var(--color-texto-2)' }}>
                      <IconoCalendario size={12} /> {textoDias(h.dias)} · {rangoHorario(h.hora_inicio, h.hora_fin)}
                    </span>
                  ))}
                </li>
              ))}
            </ul>

            <div className="mt-auto pt-4">
              {esElMio ? (
                <span className="insignia insignia-exito"><IconoCheck size={11} /> Tu plan actual</span>
              ) : pedido ? (
                <div className="flex items-center justify-between gap-2">
                  <span className="insignia insignia-acento">Pedido · pagalo en el gimnasio</span>
                  <button onClick={alCancelarPedido} className="btn btn-fantasma btn-chico">Cancelar</button>
                </div>
              ) : puedePedir && (
                <button onClick={() => alPedir(p)} className="btn btn-primario btn-bloque">
                  {planVigente ? 'Cambiar a este plan' : 'Quiero este plan'}
                </button>
              )}
            </div>
          </article>
        )
      })}
    </div>
  )
}

/* ─── Tarjeta de un horario ────────────────────────────── */

function LineaDias({ dias, inicio, fin }) {
  return (
    <>
      <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
        <IconoCalendario size={13} /> {textoDias(dias)}
      </p>
      <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
        <IconoReloj size={13} /> {rangoHorario(inicio, fin)}
      </p>
    </>
  )
}

function TarjetaHorario({ horario, tomado = false, textoTomado, incluido = false, seleccionado, enEspera, alElegir, alAlternarEspera }) {
  const sinCupos = horario.cupos_disponibles <= 0
  const bloqueada = tomado || sinCupos
  const pocosCupos = !sinCupos && horario.cupos_disponibles <= 3
  const liberado = enEspera && !sinCupos && !tomado

  return (
    <div className="flex flex-col gap-1.5">
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
            {(tomado || sinCupos || liberado || pocosCupos) && (
              <div className="mb-1.5 flex flex-wrap items-center gap-1.5">
                {tomado && (
                  <span className="insignia insignia-exito"><IconoCheck size={11} /> {textoTomado}</span>
                )}
                {sinCupos && !tomado && <span className="insignia insignia-error">Sin cupos</span>}
                {liberado && <span className="insignia insignia-exito">Se liberó un lugar</span>}
                {pocosCupos && !tomado && (
                  <span className="insignia insignia-alerta">Quedan {horario.cupos_disponibles}</span>
                )}
              </div>
            )}

            <p className="truncate font-semibold">{horario.clase}</p>
            <LineaDias dias={horario.dias} inicio={horario.hora_inicio} fin={horario.hora_fin} />
            {horario.profesor && (
              <p className="mt-0.5 truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>
                Prof. {horario.profesor}
              </p>
            )}
          </div>

          <div className="shrink-0 text-right">
            {incluido ? (
              <p className="text-xs font-semibold" style={{ color: 'var(--color-exito)' }}>Incluido</p>
            ) : (
              <>
                <p className="font-bold" style={{ color: seleccionado ? 'var(--color-acento)' : 'var(--color-texto)' }}>
                  {precio(horario.precio)}
                </p>
                <p className="text-[11px]" style={{ color: 'var(--color-texto-3)' }}>por semana</p>
              </>
            )}
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

      {/* Fuera del botón de la tarjeta: un botón no puede ir dentro de otro. */}
      {sinCupos && !tomado && (
        <button type="button" onClick={alAlternarEspera} className="btn btn-contorno btn-chico btn-bloque">
          {enEspera ? 'En lista de espera · Salir' : 'Avisarme si se libera un lugar'}
        </button>
      )}
    </div>
  )
}
