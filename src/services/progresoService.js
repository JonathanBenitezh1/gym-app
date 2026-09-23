import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const obtenerMiProgreso = async () => {
  const res = await axios.get(`${API}/progreso`, config())
  return res.data
}

export const registrarProgreso = async (datos) => {
  const res = await axios.post(`${API}/progreso`, datos, config())
  return res.data
}

export const borrarProgreso = async (id) => {
  const res = await axios.delete(`${API}/progreso/${id}`, config())
  return res.data
}

// Para profes y admin
export const obtenerProgresoDeAlumno = async (alumno_id) => {
  const res = await axios.get(`${API}/profesor/progreso/${alumno_id}`, config())
  return res.data
}
