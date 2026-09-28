/**
 * Circuitos y comentarios de las rutinas (migración 019, 28/09/2026).
 *
 * Un ejercicio con `en_circuito` va seguido del de arriba: juntos forman un
 * circuito que se repite las series del primero. Sin React: se puede probar
 * con Node.
 */

/**
 * Los ejercicios de un día, agrupados: cada grupo es un ejercicio suelto o un
 * circuito. `numero` es el de la lista (1, 2, 3…); en un circuito cada uno
 * lleva además su letra (3A, 3B, 3C).
 */
export function agruparEjercicios(ejercicios = []) {
  const grupos = []
  for (const ej of ejercicios) {
    const ultimo = grupos.at(-1)
    if (ej.en_circuito && ultimo) ultimo.ejercicios.push(ej)
    else grupos.push({ numero: grupos.length + 1, ejercicios: [ej] })
  }
  return grupos.map(g => ({ ...g, circuito: g.ejercicios.length > 1, series: g.ejercicios[0].series }))
}

/** Letra de cada ejercicio dentro del circuito: A, B, C… */
export const letra = (i) => String.fromCharCode(65 + i)

// Los mismos valores que el servidor (controllers/comentariosController.js).
export const SENSACIONES = [
  { valor: 1, texto: 'Muy mal',   insignia: 'insignia-error' },
  { valor: 2, texto: 'Mal',       insignia: 'insignia-error' },
  { valor: 3, texto: 'Normal',    insignia: 'insignia-neutra' },
  { valor: 4, texto: 'Bien',      insignia: 'insignia-exito' },
  { valor: 5, texto: 'Excelente', insignia: 'insignia-exito' }
]

export const GANAS = [
  { valor: 1, texto: 'Pocas',    insignia: 'insignia-alerta' },
  { valor: 2, texto: 'Normales', insignia: 'insignia-neutra' },
  { valor: 3, texto: 'Muchas',   insignia: 'insignia-exito' }
]

export const sensacionDe = (v) => SENSACIONES.find(s => s.valor === v)
export const ganasDe = (v) => GANAS.find(g => g.valor === v)
