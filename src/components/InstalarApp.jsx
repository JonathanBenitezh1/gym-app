import { useState, useSyncExternalStore } from 'react'
import {
  puedeInstalarse, suscribir, instalar, yaInstalada, esIOS, esNavegadorDeApp
} from '../utils/instalacion'
import { IconoCompartir, IconoAgregar, IconoDescargar, IconoCruz } from './Iconos'
import { GIMNASIO } from '../config/gimnasio'

// Cerrada, vuelve a aparecer a las dos semanas: el socio que no quiso hoy
// puede querer más adelante, pero no todos los días.
const CLAVE = 'instalar.cerradaHasta'
const DOS_SEMANAS = 14 * 24 * 60 * 60 * 1000

const cerradaHasta = () => {
  try { return Number(localStorage.getItem(CLAVE)) || 0 } catch { return 0 }
}

/**
 * Tarjeta "Instalá la app". En Android abre el cartel de instalación; en
 * iPhone, que no tiene ese cartel, explica los tres toques de Safari. No
 * aparece si ya está instalada ni en una PC sin opción de instalar.
 */
export default function InstalarApp({ className = '' }) {
  const android = useSyncExternalStore(suscribir, puedeInstalarse)
  const [cerrada, setCerrada] = useState(() => cerradaHasta() > Date.now())
  const [instalando, setInstalando] = useState(false)

  const iphone = esIOS(navigator)
  if (cerrada || yaInstalada() || (!android && !iphone)) return null

  const cerrar = () => {
    try { localStorage.setItem(CLAVE, String(Date.now() + DOS_SEMANAS)) } catch { /* sin guardar: vuelve al recargar */ }
    setCerrada(true)
  }

  const instalarAhora = async () => {
    setInstalando(true)
    const instalada = await instalar()
    setInstalando(false)
    if (!instalada) cerrar()
  }

  return (
    <div className={`aparecer tarjeta p-4 ${className}`} style={{ borderColor: 'var(--color-acento)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-semibold">Instalá la app de {GIMNASIO.nombreCorto}</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>
            Queda en tu pantalla de inicio y abre como cualquier app.
          </p>
        </div>
        <button onClick={cerrar} className="btn btn-fantasma btn-chico -mr-2 -mt-1 shrink-0" aria-label="Ahora no">
          <IconoCruz size={16} />
        </button>
      </div>

      {android ? (
        <button onClick={instalarAhora} disabled={instalando} className="btn btn-primario btn-bloque mt-3">
          <IconoDescargar size={17} /> {instalando ? 'Instalando…' : 'Instalar'}
        </button>
      ) : esNavegadorDeApp(navigator.userAgent) ? (
        <p className="mt-3 text-sm">
          Primero abrila en <strong>Safari</strong>: tocá los tres puntos de arriba y elegí <strong>Abrir en el navegador</strong>.
        </p>
      ) : (
        <ol className="mt-3 flex flex-col gap-2 text-sm">
          <Paso numero={1}>
            Tocá <span className="inline-flex items-center gap-1 font-semibold"><IconoCompartir size={17} /> Compartir</span>, abajo en el centro
          </Paso>
          <Paso numero={2}>
            Elegí <span className="inline-flex items-center gap-1 font-semibold"><IconoAgregar size={17} /> Agregar a inicio</span>
          </Paso>
          <Paso numero={3}>
            Tocá <span className="font-semibold">Agregar</span>
          </Paso>
        </ol>
      )}
    </div>
  )
}

function Paso({ numero, children }) {
  return (
    <li className="flex items-start gap-2.5">
      <span
        className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold"
        style={{ backgroundColor: 'var(--color-acento-bajo)', color: 'var(--color-acento)' }}
      >
        {numero}
      </span>
      <span className="min-w-0">{children}</span>
    </li>
  )
}
