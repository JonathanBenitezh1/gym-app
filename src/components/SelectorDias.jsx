import { DIAS_SEMANA } from '../utils/formato'

/**
 * Elegir varios días de una vez: un horario de "lunes, miércoles y viernes"
 * se carga una sola vez. `dias` son números, 1 = lunes … 7 = domingo.
 */
export default function SelectorDias({ dias, alCambiar, conDomingo = false }) {
  const alternar = (numero) => alCambiar(
    dias.includes(numero) ? dias.filter(d => d !== numero) : [...dias, numero].sort((a, b) => a - b)
  )
  return (
    <div className="flex flex-wrap gap-1.5" role="group" aria-label="Días">
      {DIAS_SEMANA.filter(d => conDomingo || d.numero !== 7 || dias.includes(7)).map(d => (
        <button
          key={d.numero}
          type="button"
          aria-pressed={dias.includes(d.numero)}
          onClick={() => alternar(d.numero)}
          className={`pildora ${dias.includes(d.numero) ? 'pildora-activa' : ''}`}
        >
          {d.corto}
        </button>
      ))}
    </div>
  )
}
