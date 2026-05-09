import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { obtenerPerfil, editarPerfil, cambiarPassword } from '../services/perfilService'
import { obtenerMisReservas } from '../services/clasesService'
import { obtenerMisRutinas } from '../services/profesorService'
import NavBar from '../components/NavBar'

export default function Perfil() {
  const { usuario, guardarSesion, cerrarSesion } = useAuth()
  const navigate = useNavigate()

  // Estados perfil
  const [perfil, setPerfil]           = useState(null)
  const [editando, setEditando]       = useState(false)
  const [formPerfil, setFormPerfil]   = useState({})
  const [formPassword, setFormPassword] = useState({
    password_actual: '', password_nueva: '', confirmar: ''
  })

  // Estados acordeón
  const [seccionAbierta, setSeccionAbierta] = useState(null)

  // Estados datos
  const [reservas, setReservas]   = useState([])
  const [rutinas, setRutinas]     = useState([])
  const [sesionAbierta, setSesionAbierta] = useState({})

  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [exito, setExito]         = useState('')

  useEffect(() => {
    if (!usuario) navigate('/')
    cargarDatos()
  }, [])

  const cargarDatos = async () => {
    try {
      const [p, r, ru] = await Promise.all([
        obtenerPerfil(),
        obtenerMisReservas(),
        obtenerMisRutinas()
      ])
      setPerfil(p)
      setFormPerfil({ nombre: p.nombre, email: p.email, telefono: p.telefono || '' })
      setReservas(r)
      setRutinas(ru)
    } catch {
      setError('Error al cargar los datos')
    }
  }

  const mostrarExito = (msg) => {
    setExito(msg)
    setTimeout(() => setExito(''), 3000)
  }

  const toggleSeccion = (s) => {
    setSeccionAbierta(seccionAbierta === s ? null : s)
  }

  const toggleSesion = (rutina_id, sesion_id) => {
    setSesionAbierta(prev => ({
      ...prev,
      [rutina_id]: prev[rutina_id] === sesion_id ? null : sesion_id
    }))
  }

  const handleEditarPerfil = async () => {
    setLoading(true)
    setError('')
    try {
      const actualizado = await editarPerfil(formPerfil)
      setPerfil(actualizado)
      // Actualizamos el contexto con los nuevos datos
      guardarSesion(localStorage.getItem('token'), actualizado)
      setEditando(false)
      mostrarExito('Perfil actualizado correctamente')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al actualizar')
    } finally {
      setLoading(false)
    }
  }

  const handleCambiarPassword = async () => {
    if (formPassword.password_nueva !== formPassword.confirmar) {
      setError('Las contraseñas no coinciden')
      return
    }
    setLoading(true)
    setError('')
    try {
      await cambiarPassword({
        password_actual: formPassword.password_actual,
        password_nueva: formPassword.password_nueva
      })
      setFormPassword({ password_actual: '', password_nueva: '', confirmar: '' })
      mostrarExito('Contraseña actualizada correctamente')
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña')
    } finally {
      setLoading(false)
    }
  }

  const colorEstado = (estado) => {
    if (estado === 'pagado')    return { backgroundColor: '#e8f5e9', color: '#2d8a4e' }
    if (estado === 'cancelado') return { backgroundColor: '#fce8e8', color: '#e05555' }
    return { backgroundColor: '#fff8e1', color: '#b8860b' }
  }

  const formatearFecha = (fecha) => new Date(fecha).toLocaleDateString('es-AR', {
    day: '2-digit', month: '2-digit', year: 'numeric'
  })

  const inputStyle = { borderColor: '#87CEEB', color: '#2c4a5a', backgroundColor: '#ffffff' }

  return (
    <div className="min-h-screen pb-24" style={{ backgroundColor: '#202123' }}>

      {/* Header */}
      <div className="px-6 py-6" style={{ backgroundColor: '#25272e' }}>
        <div className="flex items-center gap-4">
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center text-2xl font-bold"
            style={{ backgroundColor: '#87CEEB', color: '#1a3a4a' }}
          >
            {perfil?.nombre?.charAt(0).toUpperCase()}
          </div>
          <div>
            <p className="font-bold text-white text-lg">{perfil?.nombre}</p>
            <p className="text-xs" style={{ color: '#b4b8b9' }}>{perfil?.email}</p>
            <p className="text-xs" style={{ color: '#b4b8b9' }}>DNI: {perfil?.dni}</p>
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">

        {/* Mensajes */}
        {error && <p className="text-sm text-center" style={{ color: '#e05555' }}>{error}</p>}
        {exito && <p className="text-sm text-center" style={{ color: '#2d8a4e' }}>{exito}</p>}

        {/* ─── ACORDEÓN: MIS DATOS ─── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
          <div
            onClick={() => toggleSeccion('datos')}
            className="flex items-center justify-between px-5 py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>👤</span>
              <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>Mis datos</p>
            </div>
            <span style={{ color: '#87CEEB' }}>
              {seccionAbierta === 'datos' ? '▲' : '▼'}
            </span>
          </div>

          {seccionAbierta === 'datos' && (
            <div className="px-5 pb-5 flex flex-col gap-3"
              style={{ borderTop: '1px solid #e0ecf4' }}>

              {!editando ? (
                <>
                  <div className="flex flex-col gap-2 pt-3">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#202224' }}>Nombre:</span>
                      <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>{perfil?.nombre}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{  color: '#202224' }}>Email:</span>
                      <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>{perfil?.email}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{  color: '#202224' }}>Teléfono:</span>
                      <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>{perfil?.telefono || 'No cargado'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{  color: '#202224' }}>DNI:</span>
                      <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>{perfil?.dni}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{  color: '#202224' }}>Miembro desde:</span>
                      <span className="text-sm font-medium" style={{ color: '#2c4a5a' }}>
                        {perfil?.created_at && formatearFecha(perfil.created_at)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => setEditando(true)}
                    className="w-full py-2 rounded-lg text-sm font-semibold"
                    style={{ backgroundColor: '#161717', color: '#d6dde0' }}
                  >
                    Editar datos
                  </button>
                </>
              ) : (
                <>
                  <div className="flex flex-col gap-2 pt-3">
                    <input
                      placeholder="Nombre"
                      value={formPerfil.nombre}
                      onChange={e => setFormPerfil({...formPerfil, nombre: e.target.value})}
                      className="border rounded-lg px-4 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="email"
                      placeholder="Email"
                      value={formPerfil.email}
                      onChange={e => setFormPerfil({...formPerfil, email: e.target.value})}
                      className="border rounded-lg px-4 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                    <input
                      type="tel"
                      placeholder="Teléfono"
                      value={formPerfil.telefono}
                      onChange={e => setFormPerfil({...formPerfil, telefono: e.target.value})}
                      className="border rounded-lg px-4 py-2 text-sm outline-none"
                      style={inputStyle}
                    />
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={handleEditarPerfil}
                      disabled={loading}
                      className="flex-1 py-2 rounded-lg text-sm font-semibold"
                      style={{ backgroundColor: '#202424', color: '#d6dde0' }}
                    >
                      {loading ? 'Guardando...' : 'Guardar'}
                    </button>
                    <button
                      onClick={() => setEditando(false)}
                      className="px-4 py-2 rounded-lg text-sm"
                      style={{ backgroundColor: '#e76464', color: '#e4eaef' }}
                    >
                      Cancelar
                    </button>
                  </div>

                  {/* Cambiar contraseña */}
                  <div className="pt-2" style={{ borderTop: '1px solid #e0ecf4' }}>
                    <p className="text-xs font-semibold mb-2" style={{ color: '#778899' }}>
                      CAMBIAR CONTRASEÑA
                    </p>
                    <div className="flex flex-col gap-2">
                      <input
                        type="password"
                        placeholder="Contraseña actual"
                        value={formPassword.password_actual}
                        onChange={e => setFormPassword({...formPassword, password_actual: e.target.value})}
                        className="border rounded-lg px-4 py-2 text-sm outline-none"
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        placeholder="Nueva contraseña"
                        value={formPassword.password_nueva}
                        onChange={e => setFormPassword({...formPassword, password_nueva: e.target.value})}
                        className="border rounded-lg px-4 py-2 text-sm outline-none"
                        style={inputStyle}
                      />
                      <input
                        type="password"
                        placeholder="Confirmar nueva contraseña"
                        value={formPassword.confirmar}
                        onChange={e => setFormPassword({...formPassword, confirmar: e.target.value})}
                        className="border rounded-lg px-4 py-2 text-sm outline-none"
                        style={inputStyle}
                      />
                      <button
                        onClick={handleCambiarPassword}
                        disabled={loading}
                        className="w-full py-2 rounded-lg text-sm font-semibold"
                        style={{ backgroundColor: '#2c4a5a', color: '#ffffff' }}
                      >
                        {loading ? 'Cambiando...' : 'Cambiar contraseña'}
                      </button>
                    </div>
                  </div>
                </>
              )}
            </div>
          )}
        </div>

        {/* ─── ACORDEÓN: MIS RESERVAS ─── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
          <div
            onClick={() => toggleSeccion('reservas')}
            className="flex items-center justify-between px-5 py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>📅</span>
              <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>
                Mis reservas
                {reservas.filter(r => r.estado === 'pendiente').length > 0 && (
                  <span className="ml-2 px-2 py-0.5 rounded-full text-xs"
                    style={{ backgroundColor: '#dbdb0c', color: '#323739' }}>
                    {reservas.filter(r => r.estado === 'pendiente').length} pendientes
                  </span>
                )}
              </p>
            </div>
            <span style={{ color: '#87CEEB' }}>
              {seccionAbierta === 'reservas' ? '▲' : '▼'}
            </span>
          </div>

          {seccionAbierta === 'reservas' && (
            <div className="px-5 pb-5" style={{ borderTop: '1px solid #e0ecf4' }}>
              {reservas.length === 0
                ? <p className="text-sm pt-4" style={{ color: '#778899' }}>No tenés reservas.</p>
                : reservas.map(r => (
                  <div key={r.id} className="py-3" style={{ borderBottom: '1px solid #e0ecf4' }}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-medium text-sm" style={{ color: '#2c4a5a' }}>{r.clase}</p>
                        <p className="text-xs" style={{ color: '#778899' }}>
                          {r.dia_semana} · {r.hora_inicio?.slice(0,5)} · {r.tipo}
                        </p>
                        <p className="text-xs" style={{ color: '#778899' }}>
                          {r.fecha_inicio} → {r.fecha_fin}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-sm" style={{ color: '#2c4a5a' }}>
                          ${parseFloat(r.total).toFixed(0)}
                        </p>
                        <span className="text-xs px-2 py-0.5 rounded-full"
                          style={colorEstado(r.estado)}>
                          {r.estado}
                        </span>
                      </div>
                    </div>
                    {r.estado === 'pendiente' && (
                      <button
                        onClick={() => navigate('/pagar', { state: { reserva: r } })}
                        className="mt-2 w-full py-1.5 rounded-lg text-xs font-semibold"
                        style={{ backgroundColor: '#348941', color: '#dee5e8' }}
                      >
                        Pagar ahora
                      </button>
                    )}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* ─── ACORDEÓN: MIS RUTINAS ─── */}
        <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#f0f7ff' }}>
          <div
            onClick={() => toggleSeccion('rutinas')}
            className="flex items-center justify-between px-5 py-4 cursor-pointer"
          >
            <div className="flex items-center gap-3">
              <span>💪</span>
              <p className="font-semibold text-sm" style={{ color: '#2c4a5a' }}>Mis rutinas</p>
            </div>
            <span style={{ color: '#87CEEB' }}>
              {seccionAbierta === 'rutinas' ? '▲' : '▼'}
            </span>
          </div>

          {seccionAbierta === 'rutinas' && (
            <div className="pb-4" style={{ borderTop: '1px solid #e0ecf4' }}>
              {rutinas.length === 0
                ? <p className="text-sm px-5 pt-4" style={{ color: '#778899' }}>
                    No tenés rutinas asignadas.
                  </p>
                : rutinas.map(rutina => (
                  <div key={rutina.id}>
                    <div className="px-5 py-3"
                      style={{ borderBottom: '1px solid #e0ecf4' }}>
                      <p className="text-xs font-semibold" style={{ color: '#778899' }}>
                        Prof. {rutina.profesor}
                      </p>
                    </div>
                    {rutina.sesiones?.map(sesion => (
                      <div key={sesion.id}>
                        <div
                          onClick={() => toggleSesion(rutina.id, sesion.id)}
                          className="flex items-center justify-between px-5 py-3 cursor-pointer"
                          style={{ backgroundColor: '#f8fbff', borderBottom: '1px solid #e0ecf4' }}
                        >
                          <p className="text-sm font-semibold uppercase"
                            style={{ color: '#2c4a5a' }}>
                            {sesion.nombre}
                          </p>
                          <span style={{ color: '#87CEEB' }}>
                            {sesionAbierta[rutina.id] === sesion.id ? '▲' : '▼'}
                          </span>
                        </div>
                        {sesionAbierta[rutina.id] === sesion.id && (
                          <div style={{ backgroundColor: '#f0f7ff' }}>
                            {sesion.ejercicios?.map((ej, idx) => (
                              <div key={idx} className="px-5 py-2"
                                style={{ borderBottom: '1px solid #e0ecf4' }}>
                                <p className="text-sm font-medium uppercase"
                                  style={{ color: '#2c4a5a' }}>
                                  {ej.nombre}
                                </p>
                                <div className="flex gap-4 mt-1">
                                  <p className="text-xs" style={{ color: '#778899' }}>
                                    Series: <span className="font-semibold" style={{ color: '#87CEEB' }}>{ej.series}</span>
                                  </p>
                                  <p className="text-xs" style={{ color: '#778899' }}>
                                    Reps: <span className="font-semibold" style={{ color: '#87CEEB' }}>{ej.repeticiones}</span>
                                  </p>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ))
              }
            </div>
          )}
        </div>

        {/* Botón cerrar sesión */}
        <button
          onClick={() => { cerrarSesion(); navigate('/') }}
          className="w-full py-3 rounded-2xl text-sm font-semibold mt-2"
          style={{ backgroundColor: '#fce8e8', color: '#e05555' }}
        >
          Cerrar sesión
        </button>

      </div>
      <NavBar />
    </div>
  )
}