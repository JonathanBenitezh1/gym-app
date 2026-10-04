import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
// Letra del logo, guardada en la app: la política de contenido no deja traerla de Google.
import '@fontsource/black-ops-one/latin-400.css'
import './index.css'
import App from './App.jsx'
import { AuthProvider } from './context/AuthContext.jsx'
import { ProveedorAvisos } from './components/Avisos.jsx'
import './services/axiosConfig.js'
// Temprano: el aviso de "se puede instalar" de Android llega una sola vez, al cargar.
import './utils/instalacion.js'
import { registrarServiceWorker } from './utils/actualizacion.js'

registrarServiceWorker()

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider>
      <ProveedorAvisos>
        <App />
      </ProveedorAvisos>
    </AuthProvider>
  </StrictMode>,
)
