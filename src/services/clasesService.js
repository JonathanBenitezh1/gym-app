import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// Los lugares libres y "ya reservada" son de un período: el que se está por
// reservar ({ fecha_inicio, fecha_fin }).
const delPeriodo = (periodo) =>
  periodo ? { params: { desde: periodo.fecha_inicio, hasta: periodo.fecha_fin } } : {}

export const obtenerHorarios = async (periodo) => {
  const res = await axios.get(`${API}/horarios`, delPeriodo(periodo))
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
export const obtenerHorariosReservados = async (periodo) => {
  const res = await axios.get(`${API}/reservas/reservados`, { ...config(), ...delPeriodo(periodo) })
  return res.data
}

// ─── Lista de espera ──────────────────────────────────────

export const obtenerMiEspera = async () => {
  const res = await axios.get(`${API}/espera`, config())
  return res.data
}

export const anotarEnEspera = async (horario_id) => {
  const res = await axios.post(`${API}/espera/${horario_id}`, {}, config())
  return res.data
}

export const salirDeEspera = async (horario_id) => {
  const res = await axios.delete(`${API}/espera/${horario_id}`, config())
  return res.data
}
