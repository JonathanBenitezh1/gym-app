import axios from 'axios'

const API = 'http://localhost:3000/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

export const obtenerPerfil = async () => {
  const res = await axios.get(`${API}/perfil`, config())
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