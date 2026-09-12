import { io } from 'socket.io-client'

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

  // El servidor ahora exige el mismo token que la API. Va como funcion para
  // que se lea de nuevo en cada reconexion: si viniera fijo, despues de
  // cambiar la contrasena se seguiria mandando el token viejo.
  auth: (cb) => cb({ token: localStorage.getItem('token') })
})

export default socket
