import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import axios from 'axios'

const API = 'http://localhost:3000/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export default function Pagar() {
  const { usuario } = useAuth()
  const navigate    = useNavigate()
  const location    = useLocation()

  // Recibimos la reserva desde MisReservas
  const reserva = location.state?.reserva

  const [metodo, setMetodo]   = useState('') // 'mercadopago' o 'efectivo'
  const [loading, setLoading] = useState(false)
  const [error, setError]     = useState('')
  const [exito, setExito]     = useState('')

  // Si no hay reserva redirigimos
  if (!reserva) {
    navigate('/reservas')
    return null
  }

  const handlePagoEfectivo = async () => {
    setLoading(true)
    setError('')

    try {
      // Registramos el pago en efectivo como pendiente
      // El admin lo confirma desde su panel cuando recibe el dinero
      await axios.post(`${API}/pagos`, {
        reserva_id: reserva.id,
        monto: reserva.total,
        metodo: 'efectivo'
      }, config())

      setExito('¡Pago registrado! Acercate al gimnasio para abonar en efectivo. El admin confirmará tu pago.')
      setTimeout(() => navigate('/reservas'), 3000)

    } catch (err) {
      setError(err.response?.data?.error || 'Error al registrar el pago')
    } finally {
      setLoading(false)
    }
  }

  const handlePagoMercadoPago = async () => {
    setLoading(true)
    setError('')

    try {
      // Le pedimos al backend que genere el link de pago de MercadoPago
      const res = await axios.post(`${API}/pagos/mercadopago`, {
        reserva_id: reserva.id,
        monto: reserva.total,
        descripcion: `Reserva ${reserva.tipo} - ${reserva.clase}`
      }, config())

      // Redirigimos al checkout de MercadoPago
      window.location.href = res.data.init_point

    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar el pago')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#778899' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#2c4a5a' }}>
        <button
          onClick={() => navigate('/reservas')}
          className="text-white text-sm"
        >
          ← Volver
        </button>
        <h1 className="text-lg font-bold text-white">💳 Pagar</h1>
        <div style={{ width: 60 }} />
      </div>

      <div className="px-4 pt-6 pb-8 flex flex-col gap-4">

        {/* Resumen de la reserva */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#f0f7ff' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#778899' }}>
            RESUMEN DE TU RESERVA
          </p>
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: '#778899' }}>Clase</span>
            <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>{reserva.clase}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: '#778899' }}>Día y horario</span>
            <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              {reserva.dia_semana} {reserva.hora_inicio?.slice(0,5)}
            </span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: '#778899' }}>Tipo</span>
            <span className="text-sm font-medium capitalize" style={{ color: '#2c4a5a' }}>{reserva.tipo}</span>
          </div>
          <div className="flex justify-between mb-2">
            <span className="text-sm" style={{ color: '#778899' }}>Período</span>
            <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
              {reserva.fecha_inicio} → {reserva.fecha_fin}
            </span>
          </div>
          <div
            className="flex justify-between pt-3 mt-2"
            style={{ borderTop: '1px solid #87CEEB' }}
          >
            <span className="font-bold" style={{ color: '#2c4a5a' }}>Total</span>
            <span className="font-bold text-lg" style={{ color: '#2c4a5a' }}>
              ${parseFloat(reserva.total).toFixed(2)}
            </span>
          </div>
        </div>

        {/* Selección de método de pago */}
        <div className="rounded-2xl p-5" style={{ backgroundColor: '#f0f7ff' }}>
          <p className="text-xs font-semibold mb-3" style={{ color: '#778899' }}>
            ELEGÍ TU MÉTODO DE PAGO
          </p>

          {/* MercadoPago */}
          <div
            onClick={() => setMetodo('mercadopago')}
            className="flex items-center gap-3 p-4 rounded-xl mb-3 cursor-pointer border-2 transition-all"
            style={{
              borderColor: metodo === 'mercadopago' ? '#87CEEB' : 'transparent',
              backgroundColor: metodo === 'mercadopago' ? '#e8f4fb' : '#f8fbff'
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
              style={{ backgroundColor: '#009ee3', color: 'white', fontSize: 14 }}
            >
              MP
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>
                MercadoPago
              </p>
              <p className="text-xs" style={{ color: '#778899' }}>
                Pagá con tarjeta, débito o dinero en cuenta
              </p>
            </div>
            <div className="ml-auto">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#87CEEB' }}
              >
                {metodo === 'mercadopago' && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#87CEEB' }} />
                )}
              </div>
            </div>
          </div>

          {/* Efectivo */}
          <div
            onClick={() => setMetodo('efectivo')}
            className="flex items-center gap-3 p-4 rounded-xl cursor-pointer border-2 transition-all"
            style={{
              borderColor: metodo === 'efectivo' ? '#87CEEB' : 'transparent',
              backgroundColor: metodo === 'efectivo' ? '#e8f4fb' : '#f8fbff'
            }}
          >
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-lg"
              style={{ backgroundColor: '#e8f5e9', fontSize: 20 }}
            >
              💵
            </div>
            <div>
              <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>
                Efectivo
              </p>
              <p className="text-xs" style={{ color: '#778899' }}>
                Abonás en el gimnasio, el admin confirma el pago
              </p>
            </div>
            <div className="ml-auto">
              <div
                className="w-5 h-5 rounded-full border-2 flex items-center justify-center"
                style={{ borderColor: '#87CEEB' }}
              >
                {metodo === 'efectivo' && (
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: '#87CEEB' }} />
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensajes */}
        {error && (
          <p className="text-sm text-center" style={{ color: '#e05555' }}>{error}</p>
        )}
        {exito && (
          <div className="rounded-2xl p-4 text-center" style={{ backgroundColor: '#e8f5e9' }}>
            <p className="text-sm font-medium" style={{ color: '#2d8a4e' }}>{exito}</p>
          </div>
        )}

        {/* Botón confirmar */}
        {metodo && !exito && (
          <button
            onClick={metodo === 'efectivo' ? handlePagoEfectivo : handlePagoMercadoPago}
            disabled={loading}
            className="w-full py-3 rounded-2xl font-bold text-sm"
            style={{
              backgroundColor: loading ? '#b0d8ed' : '#87CEEB',
              color: '#1a3a4a'
            }}
          >
            {loading
              ? 'Procesando...'
              : metodo === 'efectivo'
                ? 'Confirmar pago en efectivo'
                : 'Pagar con MercadoPago'
            }
          </button>
        )}

      </div>
    </div>
  )
}