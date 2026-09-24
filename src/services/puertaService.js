import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

// Sin tiempo límite, con internet caído una consulta podía quedar colgada
// mucho tiempo y la puerta no avanzaba. A los 4 segundos se da por cortado y
// la pantalla decide con la lista guardada.
const config = (timeout = 4000) => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` },
  timeout
})

export const registrarIngreso = async (dni) => {
  const res = await axios.post(`${API}/puerta/ingreso`, { dni }, config())
  return res.data
}

export const obtenerUltimosIngresos = async (limite = 8) => {
  const res = await axios.get(`${API}/puerta/ingresos`, { ...config(), params: { limite } })
  return res.data
}

/**
 * La foto se pide con el token y se muestra como blob: la política de
 * contenido de la app ya permite imágenes blob:, y así la foto nunca queda
 * en una URL pública.
 */
export const obtenerFotoUrl = async (usuario_id) => {
  const res = await axios.get(`${API}/puerta/foto/${usuario_id}`, { ...config(), responseType: 'blob' })
  return URL.createObjectURL(res.data)
}

export const obtenerFotoBlob = async (usuario_id) => {
  const res = await axios.get(`${API}/puerta/foto/${usuario_id}`, { ...config(), responseType: 'blob' })
  return res.data
}

export const obtenerPadron = async () => {
  const res = await axios.get(`${API}/puerta/padron`, config(20000))
  return res.data
}

export const mandarLote = async (ingresos) => {
  const res = await axios.post(`${API}/puerta/ingresos/lote`, { ingresos }, config(20000))
  return res.data
}
