import axios from 'axios'

const API = 'http://localhost:3000/api'

const config = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

export const obtenerHorarios = async () => {
  const res = await axios.get(`${API}/horarios`)
  return res.data
}

export const crearReserva = async (datos) => {
  const res = await axios.post(`${API}/reservas`, datos, config())
  return res.data
}

export const obtenerMisReservas = async () => {
  const res = await axios.get(`${API}/reservas/mis-reservas`, config())
  return res.data
}

export const cancelarReserva = async (id) => {
  const res = await axios.put(`${API}/reservas/${id}/cancelar`, {}, config())
  return res.data
}
export const obtenerHorariosReservados = async () => {
  const res = await axios.get(`${API}/reservas/reservados`, config())
  return res.data
}