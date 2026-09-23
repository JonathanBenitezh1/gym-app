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

export const buscarAlumnos        = async (q) => {
  const res = await axios.get(`${API}/profesor/alumnos`, { ...config(), params: { q } })
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

export const obtenerPlantillas    = async () => {
  const res = await axios.get(`${API}/profesor/plantillas`, config())
  return res.data
}

export const guardarPlantilla     = async (datos) => {
  const res = await axios.post(`${API}/profesor/plantillas`, datos, config())
  return res.data
}

export const borrarPlantilla      = async (id) => {
  const res = await axios.delete(`${API}/profesor/plantillas/${id}`, config())
  return res.data
}

export const obtenerMisRutinas    = async () => {
  const res = await axios.get(`${API}/profesor/mis-rutinas`, config())
  return res.data
}
export const obtenerAlumnosDeHorario = async (horario_id, fecha) => {
  const res = await axios.get(
    `${API}/asistencia/${horario_id}/alumnos?fecha=${fecha}`, 
    config()
  )
  return res.data
}

export const marcarAsistencia = async (datos) => {
  const res = await axios.post(`${API}/asistencia/marcar`, datos, config())
  return res.data
}