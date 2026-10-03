import axios from 'axios'

const API = import.meta.env.VITE_API_URL + '/api'

const config = () => ({
  headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
})

/** Mensajes (migración 021). El socio: con quién puede hablar. */
export const obtenerContactos = async () => {
  const res = await axios.get(`${API}/mensajes/contactos`, config())
  return res.data
}

/** El personal: las conversaciones que atiende (el admin, todas). */
export const obtenerBandeja = async () => {
  const res = await axios.get(`${API}/mensajes/bandeja`, config())
  return res.data
}

/** { no_leidos, atiende } */
export const obtenerNoLeidos = async () => {
  const res = await axios.get(`${API}/mensajes/no-leidos`, config())
  return res.data
}

/** Abre una conversación (la marca como leída). `antes`: para traer los anteriores. */
export const obtenerConversacion = async (id, antes) => {
  const res = await axios.get(`${API}/mensajes/${id}`, { ...config(), params: { antes } })
  return res.data
}

/** { texto, conversacion_id } o, el socio para empezar, { texto, profesor_id } (null: el gimnasio). */
export const enviarMensaje = async (datos) => {
  const res = await axios.post(`${API}/mensajes`, datos, config())
  return res.data
}
