import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'
import Cargando from './components/Cargando'

import Login from './pages/Login'
import Horarios from './pages/Horarios'
import MisReservas from './pages/MisReservas'
import Pagar from './pages/Pagar'
import Rutinas from './pages/Rutinas'
import Perfil from './pages/Perfil'

// Las pantallas del personal y el registro se bajan recién cuando se abren.
// Antes iban todas en un solo archivo: cada socio descargaba el panel del
// admin, la puerta y la pantalla del profe sin usarlos nunca (auditoría del
// 27/09/2026). La app instalada igual las guarda todas para sin conexión.
//
// Después de publicar una versión, una app que quedó abierta con la anterior
// puede pedir un archivo que ya no existe. Se recarga una vez para tomar la
// nueva, en vez de quedar en blanco.
const CLAVE_RECARGA = 'recarga-por-version'
const conReintento = (importar) => lazy(() => importar()
  .then((modulo) => {
    try { sessionStorage.removeItem(CLAVE_RECARGA) } catch { /* sin almacenamiento */ }
    return modulo
  })
  .catch((error) => {
    let yaRecargo = true
    try { yaRecargo = sessionStorage.getItem(CLAVE_RECARGA) === '1' } catch { /* sin almacenamiento */ }
    if (yaRecargo) throw error
    try { sessionStorage.setItem(CLAVE_RECARGA, '1') } catch { /* sin almacenamiento */ }
    window.location.reload()
    return new Promise(() => {})
  }))

const Registro  = conReintento(() => import('./pages/Registro'))
const PanelPC   = conReintento(() => import('./pages/admin/PanelPC'))
const MisClases = conReintento(() => import('./pages/profesor/MisClases'))
const Puerta    = conReintento(() => import('./pages/Puerta'))
const Consultas = conReintento(() => import('./pages/Consultas'))
const MensajesRecepcion = conReintento(() => import('./pages/MensajesRecepcion'))
const Legal     = conReintento(() => import('./pages/Legal'))

// Los profesionales (nutrición, kinesiología, entrenamiento personal)
// gestionan sus clases igual que los profesores.
const DOCENTES = ['profesor', 'profesional', 'admin']

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<Cargando pantalla />}>
        <Routes>

          {/* Públicas */}
          <Route path="/"         element={<Login />} />
          <Route path="/registro" element={<Registro />} />
          <Route path="/privacidad" element={<Legal cual="privacidad" />} />
          <Route path="/terminos"   element={<Legal cual="terminos" />} />

          {/* Alumnos */}
          <Route path="/horarios" element={
            <RutaProtegida roles={['alumno']}><Horarios /></RutaProtegida>
          } />
          <Route path="/perfil" element={
            <RutaProtegida roles={['alumno']}><Perfil /></RutaProtegida>
          } />
          <Route path="/reservas" element={
            <RutaProtegida roles={['alumno']}><MisReservas /></RutaProtegida>
          } />
          <Route path="/pagar" element={
            <RutaProtegida roles={['alumno']}><Pagar /></RutaProtegida>
          } />
          <Route path="/rutinas" element={
            <RutaProtegida roles={['alumno']}><Rutinas /></RutaProtegida>
          } />
          <Route path="/consultas" element={
            <RutaProtegida roles={['alumno']}><Consultas /></RutaProtegida>
          } />

          {/* Profesores y profesionales */}
          <Route path="/mis-clases" element={
            <RutaProtegida roles={DOCENTES}><MisClases /></RutaProtegida>
          } />

          {/* Administración */}
          <Route path="/panel-gym" element={
            <RutaProtegida roles={['admin']}><PanelPC /></RutaProtegida>
          } />

          {/* Pantalla de ingreso: el empleado de la puerta, y el admin */}
          <Route path="/puerta" element={
            <RutaProtegida roles={['recepcion', 'admin']}><Puerta /></RutaProtegida>
          } />

          {/* Mensajes al gimnasio, para recepción (el admin los ve en el panel) */}
          <Route path="/mensajes" element={
            <RutaProtegida roles={['recepcion', 'admin']}><MensajesRecepcion /></RutaProtegida>
          } />

          {/* Cualquier otra dirección */}
          <Route path="*" element={<Login />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
