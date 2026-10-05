import axios from 'axios'

// URL base del backend — en desarrollo apunta a localhost
const API = import.meta.env.VITE_API_URL + '/api'

// `legal`: { acepta_legal, menor, tutor_nombre } cuando los términos están prendidos.
export const registrarUsuario = async (nombre, email, password, dni, telefono, legal = {}) => {
  const response = await axios.post(`${API}/auth/registro`, {
    nombre, email, password, dni, telefono, ...legal
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