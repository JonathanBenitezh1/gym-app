import { useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import TextoLegal from '../components/TextoLegal'
import { IconoFlecha } from '../components/Iconos'
import privacidad from '../legal/privacidad.md?raw'
import terminos from '../legal/terminos.md?raw'

const TEXTOS = {
  privacidad: { md: privacidad, titulo: 'Política de privacidad' },
  terminos:   { md: terminos,   titulo: 'Términos y condiciones' }
}

/** /privacidad y /terminos: públicas, se leen antes de crear la cuenta. */
export default function Legal({ cual }) {
  const navigate = useNavigate()
  const { md, titulo } = TEXTOS[cual]

  useEffect(() => { window.scrollTo(0, 0) }, [cual])

  // Abierta en una pestaña nueva desde el registro no hay a dónde volver.
  const volver = () => (window.history.length > 1 ? navigate(-1) : navigate('/'))

  return (
    <div className="min-h-screen pb-10">
      <header className="sticky top-0 z-10" style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}>
        <div className="contenedor flex items-center gap-2 py-2">
          <button onClick={volver} aria-label="Volver" className="btn btn-fantasma px-3">
            <IconoFlecha size={18} />
          </button>
          <p className="truncate text-sm font-semibold">{titulo}</p>
        </div>
      </header>
      <main className="contenedor pt-5">
        <TextoLegal md={md} />
      </main>
    </div>
  )
}
