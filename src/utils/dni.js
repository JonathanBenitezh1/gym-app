/**
 * Lee lo que manda el lector de código de barras al pasar un DNI.
 *
 * El lector se comporta como un teclado: "escribe" el contenido del PDF417 y
 * aprieta Enter. Hay dos formatos de DNI tarjeta:
 *
 *   nuevo (desde 2012): 00123456789@APELLIDO@NOMBRE@M@12345678@A@01/01/1990@15/05/2015
 *                       trámite, apellido, nombre, sexo, DNI, ejemplar, nacimiento, emisión
 *   viejo (2009-2012):  @12345678    @A@1@APELLIDO@NOMBRE@ARGENTINA@01/01/1990@M@...
 *                       vacío, DNI, ejemplar, ..., apellido, nombre, nacionalidad, nacimiento, sexo
 *
 * Con la distribución de teclado latinoamericana, muchos lectores escriben
 * " donde va @, porque el lector teclea como si fuera un teclado de EE. UU.
 * Se aceptan los dos.
 *
 * También acepta el DNI escrito a mano (7 u 8 números, con o sin puntos).
 *
 * Sin dependencias, para poder probarlo con Node.
 */
export function leerDni(texto) {
  const crudo = String(texto ?? '').trim()
  if (!crudo) return null

  // Escrito a mano: "30.123.456" o "30123456"
  const manual = crudo.replace(/[.\s]/g, '')
  if (/^\d{7,8}$/.test(manual)) return { dni: manual, sexo: null }

  const separador = crudo.includes('@') ? '@' : crudo.includes('"') ? '"' : null
  if (!separador) return null
  const campos = crudo.split(separador).map(c => c.trim())

  const esDni = (c) => /^\d{7,8}$/.test(c)
  const sexoValido = (c) => (['M', 'F', 'X'].includes(c) ? c : null)

  // Formato viejo: arranca con el separador y el DNI va segundo.
  if (campos[0] === '' && esDni(campos[1])) {
    const sexo = campos.map(sexoValido).find(Boolean) ?? null
    return { dni: campos[1], sexo }
  }
  // Formato nuevo: el DNI es el quinto campo y el sexo el cuarto.
  if (campos.length >= 5 && esDni(campos[4])) {
    return { dni: campos[4], sexo: sexoValido(campos[3]) }
  }
  return null
}
