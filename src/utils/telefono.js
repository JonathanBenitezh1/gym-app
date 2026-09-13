/**
 * Normaliza un teléfono argentino al formato que espera wa.me: 549 + 10 dígitos.
 *
 * Acepta lo que se suele tipear a mano: "351 238-0434", "0351 15 2380434",
 * "+54 9 351 2380434". Devuelve null si no llega a ser un número usable, así
 * el botón se puede esconder en vez de abrir un chat roto.
 *
 * Va en un archivo sin dependencias a propósito: así se puede probar con Node
 * sin levantar Vite.
 */
export function telefonoWhatsapp(valor) {
  if (!valor) return null

  let n = String(valor).replace(/\D/g, '')

  // El 0 de larga distancia y el 54 9 del formato internacional.
  if (n.startsWith('0')) n = n.slice(1)
  if (n.startsWith('54')) n = n.slice(2)
  if (n.startsWith('9')) n = n.slice(1)

  // El 15 de celular va después de la característica, que tiene de 2 a 4
  // dígitos (11, 351, 3541). Se prueba sacarlo en cada posición y se queda la
  // variante que deja los 10 dígitos de un número válido.
  if (n.length > 10) {
    for (const corte of [2, 3, 4]) {
      if (n.slice(corte, corte + 2) === '15') {
        const sinQuince = n.slice(0, corte) + n.slice(corte + 2)
        if (sinQuince.length === 10) {
          n = sinQuince
          break
        }
      }
    }
  }

  if (n.length !== 10) return null

  return `549${n}`
}
