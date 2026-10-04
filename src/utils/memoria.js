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
const pedidos = new Map()

export const recordado = (clave) => memoria.get(clave)

export const recordar = (clave, valor) => { memoria.set(clave, valor) }

/**
 * Cuándo se pidió algo por última vez (revisión de código del 04/10/2026).
 * La campanita, la barra de abajo y el ícono de mensajes se vuelven a montar
 * en cada pantalla y repetían sus pedidos cada vez: 5 por cada cambio de
 * sección. Lo que se pidió hace menos de `ms` no se vuelve a pedir; los
 * eventos de tiempo real los actualizan igual.
 */
export const pedidoReciente = (clave, ms = 60 * 1000) =>
  Date.now() - (pedidos.get(clave) ?? 0) < ms
export const anotarPedido = (clave) => { pedidos.set(clave, Date.now()) }

export const olvidarTodo = () => { memoria.clear(); pedidos.clear() }
