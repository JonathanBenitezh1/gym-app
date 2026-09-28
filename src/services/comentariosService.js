import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

/** El socio, al terminar un día de su rutina. */
export const comentarDia = async (datos) => {
  const res = await axios.post(`${API}/comentarios`, datos, config())
  return res.data
}

export const obtenerMisComentarios = async () => {
  const res = await axios.get(`${API}/comentarios/mios`, config())
  return res.data
}

/** El profe (los de sus rutinas) y el admin (todos). Con `alumno_id`, los de ese socio. */
export const obtenerComentarios = async ({ alumno_id, limite } = {}) => {
  const res = await axios.get(`${API}/comentarios`, { ...config(), params: { alumno_id, limite } })
  return res.data
}
