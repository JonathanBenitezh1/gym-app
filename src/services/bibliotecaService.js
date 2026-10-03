import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

/** Biblioteca de ejercicios (migración 020). La leen profes y admin; la cambia el admin. */
export const obtenerBiblioteca = async () => {
  const res = await axios.get(`${API}/biblioteca`, config())
  return res.data
}

/** Los ejercicios de rutinas y plantillas que todavía no tienen ficha. Solo admin. */
export const obtenerPendientes = async () => {
  const res = await axios.get(`${API}/biblioteca/pendientes`, config())
  return res.data
}

export const crearEjercicio = async (datos) => {
  const res = await axios.post(`${API}/biblioteca`, datos, config())
  return res.data
}

export const editarEjercicio = async (id, datos) => {
  const res = await axios.put(`${API}/biblioteca/${id}`, datos, config())
  return res.data
}

export const borrarEjercicio = async (id) => {
  const res = await axios.delete(`${API}/biblioteca/${id}`, config())
  return res.data
}
