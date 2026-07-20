import { BrowserRouter, Routes, Route } from 'react-router-dom'
import RutaProtegida from './components/RutaProtegida'

import Login from './pages/Login'
import Registro from './pages/Registro'
import Horarios from './pages/Horarios'
import MisReservas from './pages/MisReservas'
import Pagar from './pages/Pagar'
import Rutinas from './pages/Rutinas'
import PanelPC from './pages/admin/PanelPC'
import MisClases from './pages/profesor/MisClases'
import Perfil from './pages/Perfil'

// Los profesionales (nutrición, kinesiología, entrenamiento personal)
// gestionan sus clases igual que los profesores.
const DOCENTES = ['profesor', 'profesional', 'admin']

function App() {
  return (
    <BrowserRouter>
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

        {/* Cualquier otra dirección */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App
