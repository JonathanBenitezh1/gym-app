import { useState } from 'react'
import { useNavigate, useLocation, Navigate } from 'react-router-dom'
import axios from 'axios'
import { useAvisos } from '../components/Avisos'
import { IconoFlecha, IconoCheck, IconoInfo } from '../components/Iconos'
import { precio, rangoFechas, hora } from '../utils/formato'

const API = import.meta.env.VITE_API_URL + '/api'

// MercadoPago queda apagado hasta que exista la cuenta y el endpoint
// en el servidor. Para activarlo: VITE_MERCADOPAGO=true
const MERCADOPAGO_ACTIVO = import.meta.env.VITE_MERCADOPAGO === 'true'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export default function Pagar() {
  const navigate = useNavigate()
  const location = useLocation()
  const { error: avisarError } = useAvisos()

  const reserva = location.state?.reserva

  const [metodo, setMetodo]     = useState('')
  const [cargando, setCargando] = useState(false)

  // Sin reserva no hay nada que pagar. Se resuelve con <Navigate> y no
  // llamando a navigate() en el cuerpo del componente, que sería un
  // efecto secundario durante el render.
  if (!reserva) return <Navigate to="/reservas" replace />

  const pagarEfectivo = async () => {
    setCargando(true)
    try {
      // El importe no se manda: el servidor lo toma de la reserva guardada.
      await axios.post(`${API}/pagos`, {
        reserva_id: reserva.id,
        metodo: 'efectivo'
      }, config())

      navigate('/reservas', {
        state: { mensaje: 'Pago en efectivo registrado. Acordate de abonar en el gimnasio antes de entrenar.' }
      })
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos registrar el pago')
    } finally {
      setCargando(false)
    }
  }

  const pagarMercadoPago = async () => {
    setCargando(true)
    try {
      const res = await axios.post(`${API}/pagos/mercadopago`, {
        reserva_id: reserva.id,
        descripcion: `Reserva ${reserva.tipo} - ${reserva.clase}`
      }, config())
      window.location.href = res.data.init_point
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos iniciar el pago online')
      setCargando(false)
    }
  }

  return (
    <div className="min-h-screen pb-10">

      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-superficie)',
          borderBottom: '1px solid var(--color-linea-sutil)'
        }}
      >
        <div className="contenedor flex items-center gap-3 py-3">
          <button
            onClick={() => navigate('/reservas')}
            className="btn btn-fantasma btn-chico -ml-2"
            aria-label="Volver a mis reservas"
          >
            <IconoFlecha size={18} />
          </button>
          <h1 className="font-bold">Pagar reserva</h1>
        </div>
      </header>

      <main className="contenedor flex flex-col gap-4 pt-5">

        {/* Resumen */}
        <section className="tarjeta p-5">
          <h2 className="titulo-seccion mb-3">Resumen</h2>
          <dl className="flex flex-col gap-2.5 text-sm">
            <Fila etiqueta="Clase" valor={reserva.clase} />
            <Fila etiqueta="Día y hora" valor={`${reserva.dia_semana} ${hora(reserva.hora_inicio)}`} />
            <Fila etiqueta="Modalidad" valor={reserva.tipo} capitalizar />
            <Fila etiqueta="Período" valor={rangoFechas(reserva.fecha_inicio, reserva.fecha_fin)} />
          </dl>
          <div
            className="mt-4 flex items-baseline justify-between border-t pt-3.5"
            style={{ borderColor: 'var(--color-linea-sutil)' }}
          >
            <span className="font-semibold">Total</span>
            <span className="text-xl font-bold" style={{ color: 'var(--color-acento)' }}>
              {precio(reserva.total)}
            </span>
          </div>
        </section>

        {/* Métodos */}
        <section className="tarjeta p-5">
          <h2 className="titulo-seccion mb-3">¿Cómo querés pagar?</h2>

          <div className="flex flex-col gap-2.5">
            <OpcionPago
              elegida={metodo === 'efectivo'}
              alElegir={() => setMetodo('efectivo')}
              titulo="Efectivo"
              detalle="Abonás en el gimnasio y el administrador lo confirma"
              inicial="$"
              colorInicial="var(--color-exito)"
              fondoInicial="var(--color-exito-bajo)"
            />

            <OpcionPago
              elegida={metodo === 'mercadopago'}
              alElegir={() => MERCADOPAGO_ACTIVO && setMetodo('mercadopago')}
              deshabilitada={!MERCADOPAGO_ACTIVO}
              titulo="MercadoPago"
              detalle={MERCADOPAGO_ACTIVO
                ? 'Tarjeta, débito o dinero en cuenta'
                : 'Todavía no está disponible'}
              inicial="MP"
              colorInicial="#ffffff"
              fondoInicial="#009ee3"
              etiqueta={!MERCADOPAGO_ACTIVO && 'Próximamente'}
            />
          </div>

          {metodo === 'efectivo' && (
            <p
              className="aparecer mt-3 flex items-start gap-2 rounded-lg px-3 py-2.5 text-xs"
              style={{ backgroundColor: 'var(--color-alerta-bajo)', color: 'var(--color-alerta)' }}
            >
              <IconoInfo size={14} />
              <span>
                Tu lugar queda reservado, pero la reserva figura como pendiente
                hasta que abones en el gimnasio.
              </span>
            </p>
          )}
        </section>

        {metodo && (
          <button
            onClick={metodo === 'efectivo' ? pagarEfectivo : pagarMercadoPago}
            disabled={cargando}
            className="btn btn-primario btn-bloque aparecer"
          >
            {cargando
              ? 'Procesando…'
              : metodo === 'efectivo'
                ? 'Confirmar pago en efectivo'
                : 'Ir a MercadoPago'}
          </button>
        )}
      </main>
    </div>
  )
}

function Fila({ etiqueta, valor, capitalizar }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt style={{ color: 'var(--color-texto-3)' }}>{etiqueta}</dt>
      <dd className={`text-right font-medium ${capitalizar ? 'capitalize' : ''}`}>{valor}</dd>
    </div>
  )
}

function OpcionPago({
  elegida, alElegir, deshabilitada, titulo, detalle,
  inicial, colorInicial, fondoInicial, etiqueta
}) {
  return (
    <button
      type="button"
      onClick={alElegir}
      disabled={deshabilitada}
      aria-pressed={elegida}
      className="tarjeta flex w-full items-center gap-3 p-3.5 text-left transition-colors disabled:cursor-not-allowed"
      style={{
        backgroundColor: elegida ? 'var(--color-acento-bajo)' : 'var(--color-elevado)',
        borderColor: elegida ? 'var(--color-acento)' : 'transparent',
        opacity: deshabilitada ? 0.5 : 1
      }}
    >
      <span
        className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
        style={{ backgroundColor: fondoInicial, color: colorInicial }}
      >
        {inicial}
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-2">
          <span className="font-semibold">{titulo}</span>
          {etiqueta && <span className="insignia insignia-neutra">{etiqueta}</span>}
        </span>
        <span className="mt-0.5 block text-xs" style={{ color: 'var(--color-texto-2)' }}>
          {detalle}
        </span>
      </span>

      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2"
        style={{
          borderColor: elegida ? 'var(--color-acento)' : 'var(--color-linea)',
          backgroundColor: elegida ? 'var(--color-acento)' : 'transparent',
          color: 'var(--color-sobre-acento)'
        }}
      >
        {elegida && <IconoCheck size={12} />}
      </span>
    </button>
  )
}
