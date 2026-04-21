import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas (las vamos a crear de a poco)
import Login from './pages/Login'
import Registro from './pages/Registro'
import Horarios from './pages/Horarios'
import MisReservas from './pages/MisReservas'
import PanelPC from './pages/admin/PanelPC'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/registro"  element={<Registro />} />
        <Route path="/horarios"  element={<Horarios />} />
        <Route path="/reservas"  element={<MisReservas />} />
        <Route path="/panel-gym" element={<PanelPC />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App