/**
 * Edad, autorización de un adulto y aceptación de los términos y la política.
 * Los usan el registro y la pantalla que se interpone a los socios que ya
 * tenían cuenta cuando cambia la versión (AceptarLegal).
 *
 * Menores: se registran con la autorización de su madre, padre o tutor, que
 * acepta en su nombre (opción B de la política, decisión del 05/10/2026).
 */

const MensajeError = ({ texto }) => texto
  ? <p className="mt-1 text-xs" style={{ color: 'var(--color-error)' }}>{texto}</p>
  : null

// En una pestaña nueva: en el registro, irse de la página borraba lo escrito.
const LinkNuevo = ({ a, children }) => (
  <a href={a} target="_blank" rel="noopener noreferrer"
     className="font-semibold underline underline-offset-2" style={{ color: 'var(--color-acento)' }}>
    {children}
  </a>
)

export default function CamposLegales({ valor, alCambiar, errores = {} }) {
  const cambiar = (campo, dato) => alCambiar({ ...valor, [campo]: dato })

  return (
    <div className="flex flex-col gap-4">
      <fieldset>
        <legend className="etiqueta-campo">¿Tenés 18 años o más?</legend>
        <div className="flex gap-2">
          {[[false, 'Sí'], [true, 'No, soy menor']].map(([esMenor, texto]) => (
            <label key={texto}
                   className="btn btn-contorno flex-1"
                   style={valor.menor === esMenor ? { borderColor: 'var(--color-acento)', color: 'var(--color-acento)' } : undefined}>
              <input type="radio" name="edad" className="sr-only" checked={valor.menor === esMenor}
                     onChange={() => cambiar('menor', esMenor)} />
              {texto}
            </label>
          ))}
        </div>
        <MensajeError texto={errores.menor} />
      </fieldset>

      {valor.menor && (
        <div>
          <label htmlFor="tutor" className="etiqueta-campo">Nombre completo de tu madre, padre o tutor</label>
          <input id="tutor" className={`campo ${errores.tutor ? 'campo-error' : ''}`} value={valor.tutor}
                 autoComplete="off" onChange={e => cambiar('tutor', e.target.value)} />
          {errores.tutor
            ? <MensajeError texto={errores.tutor} />
            : <p className="mt-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>
                Esa persona autoriza tu cuenta y acepta los términos en tu nombre.
              </p>}
        </div>
      )}

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          <input type="checkbox" checked={valor.acepta} onChange={e => cambiar('acepta', e.target.checked)}
                 className="mt-0.5 h-5 w-5 shrink-0" style={{ accentColor: 'var(--color-acento)' }} />
          <span>
            Leí y acepto los <LinkNuevo a="/terminos">Términos y condiciones</LinkNuevo> y
            la <LinkNuevo a="/privacidad">Política de privacidad</LinkNuevo>, incluido el uso de
            mis datos de salud y su guardado en servidores fuera del país.
          </span>
        </label>
        <MensajeError texto={errores.acepta} />
      </div>

      {/* Leyenda obligatoria de la Resolución AAIP 14/2018. */}
      <p className="text-xs leading-snug" style={{ color: 'var(--color-texto-3)' }}>
        La Agencia de Acceso a la Información Pública, en su carácter de Órgano de Control de
        la Ley N° 25.326, tiene la atribución de atender las denuncias y reclamos que
        interpongan quienes resulten afectados en sus derechos por incumplimiento de las
        normas vigentes en materia de protección de datos personales.
      </p>
    </div>
  )
}
