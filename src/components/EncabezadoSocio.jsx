import CampanaAvisos from './CampanaAvisos'
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
          <CampanaAvisos />
          {children}
        </div>
      </div>
    </header>
  )
}
