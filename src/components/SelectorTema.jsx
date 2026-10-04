import { useTema, cambiarTema } from '../utils/tema'
import { IconoSol, IconoLuna } from './Iconos'

/**
 * Elegir modo claro u oscuro (03/10/2026). `boton`: el sol/luna chico de la
 * barra del personal. Sin él, las dos pastillas de Perfil.
 */
export default function SelectorTema({ boton = false }) {
  const tema = useTema()

  if (boton) {
    const otro = tema === 'claro' ? 'oscuro' : 'claro'
    return (
      <button
        type="button"
        onClick={() => cambiarTema(otro)}
        className="btn btn-fantasma btn-chico btn-icono"
        aria-label={`Pasar a modo ${otro}`}
        title={`Modo ${otro}`}
      >
        {tema === 'claro' ? <IconoLuna size={18} /> : <IconoSol size={18} />}
      </button>
    )
  }

  return (
    <div className="flex gap-1.5" role="group" aria-label="Apariencia">
      {[
        { valor: 'oscuro', texto: 'Oscuro', Icono: IconoLuna },
        { valor: 'claro',  texto: 'Claro',  Icono: IconoSol }
      ].map(({ valor, texto, Icono }) => (
        <button
          key={valor} type="button"
          onClick={() => cambiarTema(valor)}
          aria-pressed={tema === valor}
          className={`pildora inline-flex items-center gap-1.5 ${tema === valor ? 'pildora-activa' : ''}`}
        >
          <Icono size={15} /> {texto}
        </button>
      ))}
    </div>
  )
}
