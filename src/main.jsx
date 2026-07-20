import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProveedorAvisos } from './components/Avisos.jsx'
import './services/axiosConfig.js'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProveedorAvisos>
        <App />
      </ProveedorAvisos>
    </AuthProvider>
  </StrictMode>,
)
