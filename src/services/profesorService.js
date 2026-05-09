import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const obtenerMisClases     = async () => {
  const res = await axios.get(`${API}/profesor/mis-clases`, config())
  return res.data
}

export const obtenerMisHorarios   = async () => {
  const res = await axios.get(`${API}/profesor/mis-horarios`, config())
  return res.data
}

export const modificarHorario     = async (id, datos) => {
  const res = await axios.put(`${API}/profesor/horarios/${id}`, datos, config())
  return res.data
}

export const buscarAlumnoPorDni   = async (dni) => {
  const res = await axios.get(`${API}/profesor/alumnos/${dni}`, config())
  return res.data
}

export const obtenerRutinaDeAlumno = async (alumno_id) => {
  const res = await axios.get(`${API}/profesor/rutinas/${alumno_id}`, config())
  return res.data
}

export const guardarRutina        = async (datos) => {
  const res = await axios.post(`${API}/profesor/rutinas`, datos, config())
  return res.data
}

export const obtenerMisRutinas    = async () => {
  const res = await axios.get(`${API}/profesor/mis-rutinas`, config())
  return res.data
}