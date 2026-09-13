import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api/presencia'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const profesEnSede = async () => {
  const res = await axios.get(`${API}/en-sede`, config())
  return res.data
}

export const miTurno = async () => {
  const res = await axios.get(`${API}/mi-turno`, config())
  return res.data
}

export const marcarLlegada = async () => {
  const res = await axios.post(`${API}/llegada`, {}, config())
  return res.data
}

export const marcarSalida = async () => {
  const res = await axios.post(`${API}/salida`, {}, config())
  return res.data
}
