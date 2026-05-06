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

function App() {
  return (
    <BrowserRouter>
      <Routes>

        {/* Rutas públicas */}
        <Route path="/"          element={<Login />} />
        <Route path="/registro"  element={<Registro />} />

        {/* Rutas solo para alumnos */}
        <Route path="/horarios" element={
          <RutaProtegida roles={['alumno']}>
            <Horarios />
          </RutaProtegida>
        } />
        <Route path="/perfil" element={
          <RutaProtegida roles={['alumno']}>
          <Perfil />
          </RutaProtegida>
              } />
        <Route path="/reservas" element={
          <RutaProtegida roles={['alumno']}>
            <MisReservas />
          </RutaProtegida>
        } />
        <Route path="/pagar" element={
          <RutaProtegida roles={['alumno']}>
            <Pagar />
          </RutaProtegida>
        } />
        <Route path="/rutinas" element={
          <RutaProtegida roles={['alumno']}>
            <Rutinas />
          </RutaProtegida>
        } />

        {/* Rutas solo para profesores */}
        <Route path="/mis-clases" element={
          <RutaProtegida roles={['profesor', 'admin']}>
            <MisClases />
          </RutaProtegida>
        } />

        {/* Rutas solo para admin */}
        <Route path="/panel-gym" element={
          <RutaProtegida roles={['admin']}>
            <PanelPC />
          </RutaProtegida>
        } />

        {/* Ruta para cualquier URL que no existe */}
        <Route path="*" element={<Login />} />

      </Routes>
    </BrowserRouter>
  )
}

export default App