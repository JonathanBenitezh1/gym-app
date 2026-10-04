import { useNavigate, useLocation } from 'react-router-dom'
import CampanaAvisos from './CampanaAvisos'
import { IconoMensaje } from './Iconos'
import { useNoLeidos } from '../hooks/useNoLeidos'
import logoGimnasio from '../pages/img/logo.webp'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Barra de arriba de las pantallas del socio: logo, el nombre del gimnasio con
 * la letra del logo, la campanita de avisos y lo que cada pantalla agregue a
 * la derecha (el saludo, un botón).
 */
export default function EncabezadoSocio({ children }) {
  return (
    <header
      className="sticky top-0 z-20"
      style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}
    >
      <div className="contenedor-ancho flex items-center justify-between gap-2 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <img src={logoGimnasio} alt="" className="h-10 w-10 shrink-0" />
          <p className="titulo-marca min-w-0" aria-label={GIMNASIO.nombre}>
            <span className="block text-[15px]">{GIMNASIO.marca[0]}</span>
            <span className="block text-[9.5px] tracking-wide">{GIMNASIO.marca[1]}</span>
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-1.5">
          <BotonMensajes />
          <CampanaAvisos />
          {children}
        </div>
      </div>
    </header>
  )
}

/** Mensajes con el profe y el gimnasio (migración 021), con los no leídos. */
function BotonMensajes() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { no_leidos: noLeidos } = useNoLeidos()
  return (
    <button
      type="button"
      onClick={() => navigate('/consultas')}
      aria-current={pathname === '/consultas' ? 'page' : undefined}
      aria-label={noLeidos > 0 ? `Mensajes, ${noLeidos} sin leer` : 'Mensajes'}
      className="btn btn-fantasma btn-chico relative"
      style={{ paddingInline: '.5rem', color: pathname === '/consultas' ? 'var(--color-acento)' : undefined }}
    >
      <IconoMensaje size={21} />
      {noLeidos > 0 && (
        <span
          className="absolute -right-0.5 -top-0.5 flex h-[1.1rem] min-w-[1.1rem] items-center justify-center rounded-full px-1 text-[10px] font-bold"
          style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-sobre-error)' }}
        >
          {noLeidos}
        </span>
      )}
    </button>
  )
}
