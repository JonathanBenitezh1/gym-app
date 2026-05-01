import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Login from './pages/Login'
import Registro from './pages/Registro'
import Horarios from './pages/Horarios'
import MisReservas from './pages/MisReservas'
import Pagar from './pages/Pagar'
import PanelPC from './pages/admin/PanelPC'
import MisClasesProfesor from './pages/profesor/MisClases'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/registro"  element={<Registro />} />
        <Route path="/horarios"  element={<Horarios />} />
        <Route path="/reservas"  element={<MisReservas />} />
        <Route path="/pagar"     element={<Pagar />} />
        <Route path="/panel-gym" element={<PanelPC />} />
        <Route path="/mis-clases" element={<MisClasesProfesor />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App