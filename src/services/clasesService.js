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

// ─── Planes y lugares fijos ───────────────────────────────

export const obtenerPlanes = async () => {
  const res = await axios.get(`${API}/planes`)
  return res.data
}

export const pedirPlan = async (plan_id) => {
  const res = await axios.post(`${API}/planes/${plan_id}/pedir`, {}, config())
  return res.data
}

export const cancelarPedidoPlan = async () => {
  const res = await axios.delete(`${API}/planes/pedido`, config())
  return res.data
}

export const obtenerMisFijos = async () => {
  const res = await axios.get(`${API}/reservas/fijos`, config())
  return res.data
}

export const tomarFijos = async (horarios_ids) => {
  const res = await axios.post(`${API}/reservas/fijos`, { horarios_ids }, config())
  return res.data
}

export const dejarFijo = async (horario_id) => {
  const res = await axios.delete(`${API}/reservas/fijos/${horario_id}`, config())
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
