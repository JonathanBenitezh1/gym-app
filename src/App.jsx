import { lazy, Suspense } from 'react'
import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'

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
const Registro  = lazy(() => import('./pages/Registro'))
const PanelPC   = lazy(() => import('./pages/admin/PanelPC'))
const MisClases = lazy(() => import('./pages/profesor/MisClases'))
const Puerta    = lazy(() => import('./pages/Puerta'))

// Los profesionales (nutrición, kinesiología, entrenamiento personal)
// gestionan sus clases igual que los profesores.
const DOCENTES = ['profesor', 'profesional', 'admin']

function App() {
  return (
    <BrowserRouter>
      <Suspense fallback={<div className="min-h-screen" />}>
        <Routes>

          {/* Públicas */}
          <Route path="/"         element={<Login />} />
          <Route path="/registro" element={<Registro />} />

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

          {/* Cualquier otra dirección */}
          <Route path="*" element={<Login />} />

        </Routes>
      </Suspense>
    </BrowserRouter>
  )
}

export default App
