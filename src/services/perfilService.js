import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const obtenerPerfil = async () => {
  const res = await axios.get(`${API}/perfil`, config())
  return res.data
}

export const obtenerHistorialPagos = async () => {
  const res = await axios.get(`${API}/perfil/pagos`, config())
  return res.data
}
export const editarPerfil = async (datos) => {
  const res = await axios.put(`${API}/perfil`, datos, config())
  return res.data
}

export const cambiarPassword = async (datos) => {
  const res = await axios.put(`${API}/perfil/cambiar-password`, datos, config())
  return res.data
}