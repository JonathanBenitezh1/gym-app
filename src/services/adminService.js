import axios from 'axios'

const API = 'http://localhost:3000/api'

// Función helper que agrega el token a cada pedido
const config = () => ({
  headers: {
    Authorization: `Bearer ${localStorage.getItem('token')}`
  }
})

// ─── CLASES ───────────────────────────────────────────

export const obtenerClases = async () => {
  const res = await axios.get(`${API}/admin/clases`, config())
  return res.data
}

export const crearClase = async (datos) => {
  const res = await axios.post(`${API}/admin/clases`, datos, config())
  return res.data
}

export const editarClase = async (id, datos) => {
  const res = await axios.put(`${API}/admin/clases/${id}`, datos, config())
  return res.data
}

export const eliminarClase = async (id) => {
  const res = await axios.delete(`${API}/admin/clases/${id}`, config())
  return res.data
}

// ─── HORARIOS ─────────────────────────────────────────

export const crearHorario = async (datos) => {
  const res = await axios.post(`${API}/admin/horarios`, datos, config())
  return res.data
}

export const editarHorario = async (id, datos) => {
  const res = await axios.put(`${API}/admin/horarios/${id}`, datos, config())
  return res.data
}

export const eliminarHorario = async (id) => {
  const res = await axios.delete(`${API}/admin/horarios/${id}`, config())
  return res.data
}

// ─── USUARIOS ─────────────────────────────────────────

export const obtenerUsuarios = async () => {
  const res = await axios.get(`${API}/admin/usuarios`, config())
  return res.data
}

export const cambiarRol = async (id, rol) => {
  const res = await axios.put(`${API}/admin/usuarios/${id}/rol`, { rol }, config())
  return res.data
}

// ─── RESERVAS ─────────────────────────────────────────

export const obtenerReservas = async () => {
  const res = await axios.get(`${API}/admin/reservas`, config())
  return res.data
}

export const confirmarPagoEfectivo = async (id) => {
  const res = await axios.put(`${API}/admin/reservas/${id}/confirmar-pago`, {}, config())
  return res.data
}
export const obtenerProfesores = async () => {
  const res = await axios.get(`${API}/admin/profesores`, config())
  return res.data
}