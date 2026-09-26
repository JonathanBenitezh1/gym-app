/**
 * Lo último que mostró cada pantalla del socio (26/09/2026).
 *
 * Antes cada pantalla arrancaba de cero al entrar: pedía todo de nuevo al
 * servidor y mostraba barras de carga mientras tanto, así que cambiar de
 * sección se veía como un parpadeo. Ahora al volver a una sección se muestra
 * al instante lo que tenía y se actualiza por detrás.
 *
 * Solo en memoria: se pierde al recargar la app y se borra al entrar o salir
 * de una cuenta (AuthContext), para que en un teléfono compartido nadie vea
 * lo del anterior.
 */

const memoria = new Map()

export const recordado = (clave) => memoria.get(clave)

export const recordar = (clave, valor) => { memoria.set(clave, valor) }

export const olvidarTodo = () => { memoria.clear() }
