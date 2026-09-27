import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

/** La clave pública VAPID del servidor, o null si no tiene los avisos configurados. */
export const obtenerClavePublica = async () => {
  const res = await axios.get(`${API}/avisos/clave-publica`)
  return res.data.clave
}

export const guardarSuscripcion = async (suscripcion) => {
  const res = await axios.post(`${API}/avisos/suscripcion`, suscripcion, config())
  return res.data
}

export const mandarAvisoDePrueba = async () => {
  const res = await axios.post(`${API}/avisos/prueba`, {}, config())
  return res.data
}

export const borrarSuscripcion = async (endpoint) => {
  const res = await axios.delete(`${API}/avisos/suscripcion`, { ...config(), data: { endpoint } })
  return res.data
}
