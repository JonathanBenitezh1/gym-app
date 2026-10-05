import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

// Se pide una vez por visita: el ingreso y el registro la usan los dos.
let pedido = null

/**
 * La versión vigente de los términos; 0 si el servidor los tiene apagados
 * (LEGAL_VERSION, migración 023). Sin conexión da 0: no muestra los links, y
 * el registro igual falla con el error del servidor si hacía falta aceptar.
 */
export function obtenerVersionLegal() {
  pedido ??= axios.get(`${API}/auth/legal`)
    .then(r => Number(r.data?.version) || 0)
    .catch(() => { pedido = null; return 0 })
  return pedido
}

export const aceptarLegal = async ({ version, menor, tutor_nombre }) => {
  const res = await axios.post(`${API}/perfil/legal`, { version, menor, tutor_nombre }, config())
  return res.data
}

export const eliminarMiCuenta = async (password) => {
  const res = await axios.delete(`${API}/perfil`, { ...config(), data: { password } })
  return res.data
}
