import { BrowserRouter, Routes, Route } from 'react-router-dom'

// Páginas (las vamos a crear de a poco)
import Login from './pages/Login'
import Horarios from './pages/Horarios'
import MisReservas from './pages/MisReservas'
import PanelPC from './pages/admin/PanelPc'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/"          element={<Login />} />
        <Route path="/horarios"  element={<Horarios />} />
        <Route path="/reservas"  element={<MisReservas />} />
        <Route path="/panel-gym" element={<PanelPC />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App