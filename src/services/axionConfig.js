import axios from 'axios'

axios.interceptors.response.use(
  response => response,
  error => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token')
      localStorage.removeItem('usuario')
      window.location.href = '/'
    }
    return Promise.reject(error)
  }
)

export default axios