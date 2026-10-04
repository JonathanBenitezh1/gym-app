import { io } from 'socket.io-client'
import { salidaForzada } from '../utils/salida'

/**
 * Una sola conexión de tiempo real para toda la app.
 *
 * Antes cada pantalla (y la barra inferior) abría su propia conexión, así que
 * al moverse entre pantallas se abrían y cerraban conexiones todo el tiempo.
 * Eso llenaba la consola de avisos "WebSocket closed before established" y era
 * más carga para el servidor. Con una instancia compartida se conecta una vez
 * y se mantiene mientras la persona usa la app.
 *
 * `autoConnect: false`: no conecta al importar (la pantalla de login no necesita
 * tiempo real). Se conecta la primera vez que una pantalla se suscribe.
 */
const socket = io(import.meta.env.VITE_SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
  reconnectionDelay: 1000,
  reconnectionDelayMax: 5000,

  // WebSocket directo. Por defecto arranca con pedidos HTTP repetidos (long
  // polling) y recién después se pasa a WebSocket: dos o tres viajes más
  // hasta Virginia en cada conexión. Si una red bloquea WebSocket, vuelve a
  // probar con polling.
  transports: ['websocket', 'polling'],
  tryAllTransports: true,

  // El servidor ahora exige el mismo token que la API. Va como funcion para
  // que se lea de nuevo en cada reconexion: si viniera fijo, despues de
  // cambiar la contrasena se seguiria mandando el token viejo.
  auth: (cb) => cb({ token: localStorage.getItem('token') })
})

// La sesión se cerró con la app abierta (entró en otro dispositivo, cambió la
// clave, el gimnasio la cerró): el servidor avisa y la app sale al instante,
// sin esperar al próximo pedido.
socket.on('sesion_cerrada', ({ motivo, mensaje } = {}) => salidaForzada(motivo, mensaje))

// Al reconectarse con una sesión que ya no existe, el servidor la rechaza con
// "SESION:motivo". Sin esto, la app reintentaba conectarse para siempre.
socket.on('connect_error', (error) => {
  if (String(error?.message).startsWith('SESION:')) salidaForzada(error.message.slice(7))
  // Con la clave temporal el servidor no deja conectar: se deja de reintentar.
  // Después de elegir una propia, la próxima pantalla que se suscribe conecta.
  if (error?.message === 'CLAVE_TEMPORAL') socket.disconnect()
})

export default socket
