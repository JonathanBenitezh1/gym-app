import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
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
