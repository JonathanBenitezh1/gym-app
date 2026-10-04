import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import BandejaMensajes from '../components/BandejaMensajes'
import SelectorTema from '../components/SelectorTema'
import logoGimnasio from './img/logo.webp'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Mensajes de los socios al gimnasio, para recepción (migración 021). El
 * admin los atiende desde el panel; esta pantalla es la de recepción, que no
 * tiene panel: se llega desde la puerta.
 */
export default function MensajesRecepcion() {
  const { usuario } = useAuth()
  const { error: avisarError } = useAvisos()
  const navigate = useNavigate()

  return (
    <div className="min-h-screen pb-12">
      <header
        className="sticky top-0 z-20"
        style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}
      >
        <div className="contenedor-ancho flex items-center justify-between gap-2 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <img src={logoGimnasio} alt={GIMNASIO.nombre} className="h-9 w-auto shrink-0" />
            <div className="min-w-0">
              <h1 className="text-sm font-bold leading-tight">Mensajes</h1>
              <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>{usuario?.nombre}</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-1.5">
            <SelectorTema boton />
            <button
              onClick={() => navigate(usuario?.rol === 'admin' ? '/panel-gym' : '/puerta')}
              className="btn btn-contorno btn-chico"
            >
              {usuario?.rol === 'admin' ? 'Volver al panel' : 'Volver a la puerta'}
            </button>
          </div>
        </div>
      </header>

      <main className="contenedor-ancho pt-5">
        <BandejaMensajes alError={avisarError} />
      </main>
    </div>
  )
}
