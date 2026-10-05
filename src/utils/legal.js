/** Lo que comparten el registro y AceptarLegal (components/CamposLegales.jsx). */

export const LEGAL_VACIO = { menor: null, tutor: '', acepta: false }

/** Errores por campo, o {} si está todo. */
export function validarLegal(v) {
  const e = {}
  if (v.menor === null) e.menor = 'Indicá si tenés 18 años o más'
  if (v.menor && v.tutor.trim().length < 3) e.tutor = 'Escribí el nombre completo del adulto que te autoriza'
  if (!v.acepta) e.acepta = 'Para seguir tenés que aceptar los términos y la política de privacidad'
  return e
}

/** Lo que espera la API. */
export const legalParaEnviar = (v) => ({ menor: v.menor, tutor_nombre: v.menor ? v.tutor.trim() : undefined })
