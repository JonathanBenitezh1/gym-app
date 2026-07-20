import { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react'
import { IconoCheck, IconoAlerta, IconoInfo, IconoCruz } from './Iconos'

/**
 * Avisos flotantes y diálogos de confirmación.
 *
 * Antes cada pantalla manejaba su propio `error`/`exito` en un <p> suelto,
 * y las confirmaciones usaban el `confirm()` del navegador, que se ve
 * distinto en cada dispositivo y rompe el estilo de la app.
 */

const ContextoAvisos = createContext(null)

export function useAvisos() {
  const ctx = useContext(ContextoAvisos)
  if (!ctx) throw new Error('useAvisos necesita estar dentro de <ProveedorAvisos>')
  return ctx
}

let siguienteId = 1

export function ProveedorAvisos({ children }) {
  const [avisos, setAvisos] = useState([])
  const [confirmacion, setConfirmacion] = useState(null)
  const resolverRef = useRef(null)

  const cerrar = useCallback((id) => {
    setAvisos(previos => previos.filter(a => a.id !== id))
  }, [])

  const mostrar = useCallback((tipo, mensaje, duracion = 4000) => {
    const id = siguienteId++
    setAvisos(previos => [...previos, { id, tipo, mensaje }])
    if (duracion > 0) {
      setTimeout(() => cerrar(id), duracion)
    }
    return id
  }, [cerrar])

  const exito = useCallback((m, d) => mostrar('exito', m, d), [mostrar])
  const error = useCallback((m, d) => mostrar('error', m, d), [mostrar])
  const info  = useCallback((m, d) => mostrar('info',  m, d), [mostrar])

  /**
   * Reemplazo de window.confirm. Devuelve una promesa que resuelve
   * en true o false, así se puede usar con await igual que el original.
   */
  const confirmar = useCallback((opciones) => {
    const config = typeof opciones === 'string' ? { mensaje: opciones } : opciones
    setConfirmacion({
      titulo: config.titulo || '¿Confirmás?',
      mensaje: config.mensaje || '',
      textoConfirmar: config.textoConfirmar || 'Confirmar',
      textoCancelar: config.textoCancelar || 'Cancelar',
      peligroso: Boolean(config.peligroso)
    })
    return new Promise(resolve => { resolverRef.current = resolve })
  }, [])

  const responder = useCallback((respuesta) => {
    setConfirmacion(null)
    if (resolverRef.current) {
      resolverRef.current(respuesta)
      resolverRef.current = null
    }
  }, [])

  return (
    <ContextoAvisos.Provider value={{ exito, error, info, confirmar }}>
      {children}
      <PilaDeAvisos avisos={avisos} alCerrar={cerrar} />
      {confirmacion && <DialogoConfirmar {...confirmacion} alResponder={responder} />}
    </ContextoAvisos.Provider>
  )
}

/* ─── Avisos flotantes ─────────────────────────────────── */

const ESTILOS = {
  exito: { clase: 'insignia-exito',  Icono: IconoCheck  },
  error: { clase: 'insignia-error',  Icono: IconoAlerta },
  info:  { clase: 'insignia-acento', Icono: IconoInfo   }
}

function PilaDeAvisos({ avisos, alCerrar }) {
  if (avisos.length === 0) return null

  return (
    <div
      className="fixed top-0 left-0 right-0 z-[60] flex flex-col items-center gap-2 px-3 pt-3 pointer-events-none"
      role="status"
      aria-live="polite"
    >
      {avisos.map(aviso => {
        const { clase, Icono } = ESTILOS[aviso.tipo] || ESTILOS.info
        return (
          <div
            key={aviso.id}
            className="bajar-aviso tarjeta pointer-events-auto flex w-full max-w-md items-start gap-3 px-4 py-3 shadow-lg"
            style={{ backgroundColor: 'var(--color-elevado)' }}
          >
            <span className={`insignia ${clase} shrink-0 !rounded-lg !p-1.5`}>
              <Icono size={15} />
            </span>
            <p className="flex-1 text-sm leading-snug" style={{ color: 'var(--color-texto)' }}>
              {aviso.mensaje}
            </p>
            <button
              onClick={() => alCerrar(aviso.id)}
              className="shrink-0 rounded-md p-1 transition-colors hover:bg-white/10"
              style={{ color: 'var(--color-texto-3)' }}
              aria-label="Cerrar aviso"
            >
              <IconoCruz size={15} />
            </button>
          </div>
        )
      })}
    </div>
  )
}

/* ─── Diálogo de confirmación ──────────────────────────── */

function DialogoConfirmar({ titulo, mensaje, textoConfirmar, textoCancelar, peligroso, alResponder }) {
  const botonRef = useRef(null)

  useEffect(() => {
    botonRef.current?.focus()
    const alTecla = (e) => { if (e.key === 'Escape') alResponder(false) }
    window.addEventListener('keydown', alTecla)
    return () => window.removeEventListener('keydown', alTecla)
  }, [alResponder])

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,.6)' }}
      onClick={() => alResponder(false)}
      role="dialog"
      aria-modal="true"
      aria-labelledby="titulo-confirmacion"
    >
      <div
        className="tarjeta aparecer w-full max-w-sm p-5"
        style={{ backgroundColor: 'var(--color-elevado)' }}
        onClick={e => e.stopPropagation()}
      >
        <h2 id="titulo-confirmacion" className="text-base font-bold">{titulo}</h2>
        {mensaje && (
          <p className="mt-2 text-sm leading-relaxed" style={{ color: 'var(--color-texto-2)' }}>
            {mensaje}
          </p>
        )}
        <div className="mt-5 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button className="btn btn-contorno" onClick={() => alResponder(false)}>
            {textoCancelar}
          </button>
          <button
            ref={botonRef}
            className={`btn ${peligroso ? 'btn-peligro' : 'btn-primario'}`}
            onClick={() => alResponder(true)}
          >
            {textoConfirmar}
          </button>
        </div>
      </div>
    </div>
  )
}
