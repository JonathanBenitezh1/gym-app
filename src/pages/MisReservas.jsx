import { useState, useEffect, useCallback, useMemo } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAvisos } from '../components/Avisos'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { obtenerMisReservas, cancelarReserva } from '../services/clasesService'
import NavBar from '../components/NavBar'
import { SkeletonListaReservas } from '../components/Skeleton'
import { IconoReloj, IconoCalendario, IconoCheck, IconoAlerta } from '../components/Iconos'
import { precio, rangoFechas, rangoHorario } from '../utils/formato'
import logoDtc from './img/logo_png.png'

export default function MisReservas() {
  const navigate = useNavigate()
  const location = useLocation()
  const { exito, error: avisarError, confirmar } = useAvisos()

  const [reservas, setReservas] = useState([])
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      setReservas(await obtenerMisReservas())
    } catch {
      avisarError('No pudimos cargar tus reservas')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargar() }, [cargar])

  // Mensaje que llega al volver de la pantalla de pago
  useEffect(() => {
    if (location.state?.mensaje) {
      exito(location.state.mensaje, 6000)
      navigate(location.pathname, { replace: true, state: {} })
    }
  }, [location.state, location.pathname, exito, navigate])

  useSocketEventos({
    pago_confirmado: () => cargar(),
    reserva_cancelada: () => cargar(),
    actualizacion_horarios: () => cargar()
  })

  const cancelar = async (reserva) => {
    const confirmado = await confirmar({
      titulo: '¿Cancelar esta reserva?',
      mensaje: `Se va a liberar tu lugar en ${reserva.clase} (${reserva.dia_semana}). Esta acción no se puede deshacer.`,
      textoConfirmar: 'Sí, cancelar',
      textoCancelar: 'No, volver',
      peligroso: true
    })
    if (!confirmado) return

    try {
      await cancelarReserva(reserva.id)
      exito('Reserva cancelada')
      await cargar()
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos cancelar la reserva')
    }
  }

  const grupos = useMemo(() => ({
    pendientes: reservas.filter(r => r.estado === 'pendiente'),
    pagadas:    reservas.filter(r => r.estado === 'pagado'),
    canceladas: reservas.filter(r => r.estado === 'cancelado')
  }), [reservas])

  const sinNada = !cargando && reservas.length === 0
  const aPagar  = grupos.pendientes.filter(r => !r.metodo).length

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>

      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-superficie)',
          borderBottom: '1px solid var(--color-linea-sutil)'
        }}
      >
        <div className="contenedor-ancho flex items-center justify-between py-3">
          <img src={logoDtc} alt="DTC Fight & Fitness" className="h-9 w-auto" />
          <button onClick={() => navigate('/horarios')} className="btn btn-contorno btn-chico">
            Ver clases
          </button>
        </div>
      </header>

      <main className="contenedor-ancho pt-5">

        <h1 className="text-lg font-bold tracking-tight">Mis reservas</h1>
        {aPagar > 0 && (
          <p className="mt-0.5 flex items-center gap-1.5 text-sm" style={{ color: 'var(--color-alerta)' }}>
            <IconoAlerta size={14} />
            {aPagar === 1 ? 'Tenés 1 reserva sin pagar' : `Tenés ${aPagar} reservas sin pagar`}
          </p>
        )}

        {cargando ? (
          <div className="mt-6"><SkeletonListaReservas /></div>
        ) : sinNada ? (
          <div className="tarjeta mt-6 p-8 text-center">
            <span
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
            >
              <IconoCalendario size={22} />
            </span>
            <p className="font-semibold">Todavía no reservaste ninguna clase</p>
            <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: 'var(--color-texto-2)' }}>
              Mirá los horarios disponibles y armá tu semana de entrenamiento
            </p>
            <button onClick={() => navigate('/horarios')} className="btn btn-primario mt-5">
              Ver clases disponibles
            </button>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-7">
            <Grupo
              titulo="Pendientes de pago"
              cantidad={grupos.pendientes.length}
              reservas={grupos.pendientes}
              alPagar={r => navigate('/pagar', { state: { reserva: r } })}
              alCancelar={cancelar}
            />
            <Grupo
              titulo="Confirmadas"
              cantidad={grupos.pagadas.length}
              reservas={grupos.pagadas}
            />
            <Grupo
              titulo="Canceladas"
              cantidad={grupos.canceladas.length}
              reservas={grupos.canceladas}
              atenuado
            />
          </div>
        )}
      </main>

      <NavBar />
    </div>
  )
}

/* ─── Grupo por estado ─────────────────────────────────── */

function Grupo({ titulo, cantidad, reservas, alPagar, alCancelar, atenuado }) {
  if (cantidad === 0) return null
  return (
    <section style={atenuado ? { opacity: 0.6 } : undefined}>
      <h2 className="titulo-seccion mb-2">{titulo} ({cantidad})</h2>
      <div className="grid gap-2.5 sm:grid-cols-2">
        {reservas.map(r => (
          <TarjetaReserva
            key={r.id}
            reserva={r}
            alPagar={alPagar}
            alCancelar={alCancelar}
          />
        ))}
      </div>
    </section>
  )
}

/* ─── Tarjeta de reserva ───────────────────────────────── */

const ESTILO_ESTADO = {
  pagado:    { clase: 'insignia-exito',  texto: 'Pagada' },
  cancelado: { clase: 'insignia-error',  texto: 'Cancelada' },
  pendiente: { clase: 'insignia-alerta', texto: 'Pendiente' }
}

function TarjetaReserva({ reserva, alPagar, alCancelar }) {
  const estado = ESTILO_ESTADO[reserva.estado] || ESTILO_ESTADO.pendiente
  const esperandoPago = reserva.estado === 'pendiente'

  return (
    <article className="tarjeta flex flex-col p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-semibold">{reserva.clase}</p>
          <p className="mt-1 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
            <IconoReloj size={13} />
            {reserva.dia_semana} · {rangoHorario(reserva.hora_inicio, reserva.hora_fin)}
          </p>
          <p className="mt-0.5 flex items-center gap-1.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>
            <IconoCalendario size={13} />
            {rangoFechas(reserva.fecha_inicio, reserva.fecha_fin)}
          </p>
          <p className="mt-0.5 text-xs capitalize" style={{ color: 'var(--color-texto-3)' }}>
            {reserva.rama} · {reserva.tipo}
          </p>
        </div>

        <div className="shrink-0 text-right">
          <p className="font-bold">{precio(reserva.total)}</p>
          <span className={`insignia ${estado.clase} mt-1.5`}>{estado.texto}</span>
        </div>
      </div>

      {esperandoPago && (
        <div className="mt-4 flex flex-col gap-2">
          {reserva.metodo ? (
            <div
              className="flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={reserva.metodo === 'efectivo'
                ? { backgroundColor: 'var(--color-alerta-bajo)', color: 'var(--color-alerta)' }
                : { backgroundColor: 'var(--color-exito-bajo)', color: 'var(--color-exito)' }}
            >
              {reserva.metodo === 'efectivo' ? <IconoAlerta size={14} /> : <IconoCheck size={14} />}
              <span>
                {reserva.metodo === 'efectivo'
                  ? 'Acordate de abonar en el gimnasio antes de entrenar'
                  : `Pago registrado por ${reserva.metodo}`}
              </span>
            </div>
          ) : (
            <button onClick={() => alPagar?.(reserva)} className="btn btn-primario btn-bloque">
              Pagar ahora
            </button>
          )}
          {alCancelar && (
            <button onClick={() => alCancelar(reserva)} className="btn btn-fantasma btn-chico btn-bloque">
              Cancelar reserva
            </button>
          )}
        </div>
      )}
    </article>
  )
}
