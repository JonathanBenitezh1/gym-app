import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerMisRutinas } from '../services/profesorService'
import NavBar from '../components/NavBar'
export default function Rutinas() {
  const { usuario, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  const [rutinas, setRutinas]           = useState([])
  const [sesionAbierta, setSesionAbierta] = useState({}) // { rutina_id: sesion_id }
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState('')

  useEffect(() => {
    if (!usuario) navigate('/')
    cargarRutinas()
  }, [])

  const cargarRutinas = async () => {
    try {
      const data = await obtenerMisRutinas()
      setRutinas(data)
    } catch {
      setError('Error al cargar las rutinas')
    } finally {
      setLoading(false)
    }
  }

  const toggleSesion = (rutina_id, sesion_id) => {
    setSesionAbierta(prev => ({
      ...prev,
      [rutina_id]: prev[rutina_id] === sesion_id ? null : sesion_id
    }))
  }

  const formatearFecha = (fecha) => {
    return new Date(fecha).toLocaleDateString('es-AR', {
      day: '2-digit', month: '2-digit', year: 'numeric'
    })
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#202123' }}>

      {/* Navbar */}
      <div className="flex items-center justify-between px-6 py-4"
        style={{ backgroundColor: '#25272e' }}>
        <h1 className="text-lg font-bold text-white">💪 Mis Rutinas</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => navigate('/horarios')}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#144a4e', color: '#d6dde0' }}>
            Clases
          </button>
          <button onClick={() => navigate('/reservas')}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#144a4e', color: '#d6dde0' }}>
            Reservas
          </button>
          <button onClick={() => { cerrarSesion(); navigate('/') }}
            className="text-xs px-3 py-1 rounded-lg"
            style={{ backgroundColor: '#642828', color: '#eff1f4' }}>
            Salir
          </button>
        </div>
      </div>

      <div className="px-4 pt-4 pb-8">

        {error && <p className="text-sm mb-3 text-center" style={{ color: '#e05555' }}>{error}</p>}

        {loading ? (
          <p className="text-center text-sm mt-8" style={{ color: '#f0f7ff' }}>Cargando rutinas...</p>

        ) : rutinas.length === 0 ? (
          <div className="rounded-2xl p-8 text-center mt-4" style={{ backgroundColor: '#2f373f' }}>
            <p className="text-2xl mb-3">📋</p>
            <p className="font-medium text-sm mb-1" style={{ color: '#ccdae1' }}>
              Todavía no tenés rutinas asignadas
            </p>
            <p className="text-xs" style={{ color: '#328723' }}>
              Tu profesor te va a cargar una rutina personalizada
            </p>
          </div>

        ) : (
          <div className="flex flex-col gap-5 mt-2">
            {rutinas.map(rutina => (
              <div key={rutina.id} className="rounded-2xl overflow-hidden"
                style={{ backgroundColor: '#f0f7ff' }}>

                {/* Header del plan */}
                <div className="px-5 py-4"
                  style={{ backgroundColor: '#87CEEB' }}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-bold text-sm uppercase tracking-wide"
                        style={{ color: '#1a3a4a' }}>
                        Plan de {usuario?.nombre}
                      </p>
                      <p className="text-xs mt-0.5" style={{ color: '#2c4a5a' }}>
                        Plan personalizado
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-medium" style={{ color: '#2c4a5a' }}>
                        Prof. {rutina.profesor}
                      </p>
                      <p className="text-xs" style={{ color: '#2c4a5a' }}>
                        Actualizado: {formatearFecha(rutina.updated_at)}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sesiones acordeón */}
                {rutina.sesiones?.length > 0
                  ? rutina.sesiones.map(sesion => (
                    <div key={sesion.id}
                      style={{ borderBottom: '1px solid #e0ecf4' }}>

                      {/* Header sesión - clickeable */}
                      <div
                        onClick={() => toggleSesion(rutina.id, sesion.id)}
                        className="flex items-center justify-between px-5 py-4 cursor-pointer"
                        style={{ backgroundColor: '#ffffff' }}
                      >
                        <p className="font-semibold text-sm uppercase tracking-wide"
                          style={{ color: '#2c4a5a' }}>
                          {sesion.nombre}
                        </p>
                        <span style={{ color: '#87CEEB', fontSize: 18 }}>
                          {sesionAbierta[rutina.id] === sesion.id ? '▲' : '▼'}
                        </span>
                      </div>

                      {/* Ejercicios — se muestran si la sesión está abierta */}
                      {sesionAbierta[rutina.id] === sesion.id && (
                        <div style={{ backgroundColor: '#f8fbff' }}>
                          {sesion.ejercicios?.map((ej, idx) => (
                            <div key={ej.id || idx}
                              className="px-5 py-3"
                              style={{ borderTop: '1px solid #e0ecf4' }}>
                              <p className="font-medium text-sm uppercase mb-1"
                                style={{ color: '#2c4a5a' }}>
                                {ej.nombre}
                              </p>
                              <div className="flex gap-6">
                                <div>
                                  <p className="text-xs" style={{ color: '#778899' }}>Series</p>
                                  <p className="text-sm font-semibold" style={{ color: '#87CEEB' }}>
                                    {ej.series}
                                  </p>
                                </div>
                                <div>
                                  <p className="text-xs" style={{ color: '#778899' }}>Reps.</p>
                                  <p className="text-sm font-semibold" style={{ color: '#87CEEB' }}>
                                    {ej.repeticiones}
                                  </p>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  ))
                  : (
                    <div className="px-5 py-4">
                      <p className="text-sm" style={{ color: '#778899' }}>
                        Esta rutina no tiene sesiones cargadas aún.
                      </p>
                    </div>
                  )
                }
              </div>
            ))}
          </div>
        )}
      </div>
      <NavBar />
    </div>
  )
}