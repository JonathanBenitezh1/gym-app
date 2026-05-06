import axios from 'axios'

// URL base del backend — en desarrollo apunta a localhost
const API = 'http://localhost:3000/api'

export const registrarUsuario = async (nombre, email, password, dni, telefono) => {
  const response = await axios.post(`${API}/auth/registro`, {
    nombre, email, password, dni, telefono
  })
  return response.data
}

export const loginUsuario = async (email, password) => {
  const response = await axios.post(`${API}/auth/login`, {
    email,
    password
  })
  return response.data
}