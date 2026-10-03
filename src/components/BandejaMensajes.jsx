import { useState, useEffect, useCallback } from 'react'
import { obtenerBandeja } from '../services/mensajesService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { useAuth } from '../context/AuthContext'
import { SkeletonLista } from './Skeleton'
import Conversacion from './Conversacion'
import AvisosCelular from './AvisosCelular'
import { IconoBuscar } from './Iconos'
import { recordado, recordar } from '../utils/memoria'
import { momento } from '../utils/formato'

/**
 * Mensajes de los socios, para el personal (migración 021). El profe ve los
 * suyos; recepción, los del gimnasio; el admin, todos: los del gimnasio para
 * responder y los de los profes solo para leer.
 */
export default function BandejaMensajes({ alError }) {
  const { usuario } = useAuth()
  const esAdmin = usuario?.rol === 'admin'
  const [lista, setLista] = useState(() => recordado('mensajes.bandeja') ?? [])
  const [cargando, setCargando] = useState(() => !recordado('mensajes.bandeja'))
  const [filtro, setFiltro] = useState('responder')   // admin: 'responder' | 'profes'
  const [buscar, setBuscar] = useState('')
  const [abierta, setAbierta] = useState(null)

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerBandeja()
      setLista(datos)
      recordar('mensajes.bandeja', datos)
    } catch {
      alError('No pudimos cargar los mensajes')
    } finally {
      setCargando(false)
    }
  }, [alError])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ mensaje_nuevo: cargar })

  const cerrar = useCallback(() => { setAbierta(null); cargar() }, [cargar])

  const texto = buscar.trim().toLowerCase()
  const visibles = lista
    .filter(c => !esAdmin || (filtro === 'responder' ? c.atiende : !c.atiende))
    .filter(c => !texto || c.alumno.toLowerCase().includes(texto) || String(c.dni ?? '').startsWith(texto))
  const deProfes = esAdmin ? lista.filter(c => !c.atiende).length : 0

  return (
    <div className="flex flex-col gap-3">
      <AvisosCelular compacto titulo="Recibí los mensajes en el celular" />

      <div className="flex flex-wrap items-center justify-between gap-2">
        {esAdmin ? (
          <div className="flex gap-1.5">
            <button onClick={() => setFiltro('responder')} className={`pildora ${filtro === 'responder' ? 'pildora-activa' : ''}`}>
              Para responder
            </button>
            <button onClick={() => setFiltro('profes')} className={`pildora ${filtro === 'profes' ? 'pildora-activa' : ''}`}>
              De los profes ({deProfes})
            </button>
          </div>
        ) : <h2 className="titulo-seccion">Mensajes de los socios</h2>}
        {lista.length > 6 && (
          <label className="relative w-full sm:w-56">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
              <IconoBuscar size={15} />
            </span>
            <input className="campo pl-9" placeholder="Buscar socio" aria-label="Buscar socio"
                   value={buscar} onChange={e => setBuscar(e.target.value)} />
          </label>
        )}
      </div>

      {esAdmin && filtro === 'profes' && (
        <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          Solo para leer: las responde cada profe. Los socios saben que el gimnasio puede verlas.
        </p>
      )}

      {cargando ? <SkeletonLista filas={3} /> : visibles.length === 0 ? (
        <div className="tarjeta p-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
          {lista.length === 0 ? 'Todavía no hay mensajes. Cuando un socio escriba, aparece acá.' : 'No hay mensajes en esta lista.'}
        </div>
      ) : (
        <ul className="tarjeta overflow-hidden">
          {visibles.map((c, i) => (
            <li key={c.id} style={i > 0 ? { borderTop: '1px solid var(--color-linea-sutil)' } : undefined}>
              <button
                onClick={() => setAbierta(c)}
                className="flex w-full items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-white/[.03]"
              >
                <span
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                  style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-acento)' }}
                >
                  {c.alumno.charAt(0).toUpperCase()}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="flex items-baseline justify-between gap-2">
                    <span className="truncate text-sm font-semibold">{c.alumno}</span>
                    <span className="shrink-0 text-[11px]" style={{ color: 'var(--color-texto-3)' }}>{momento(c.ultimo_en)}</span>
                  </span>
                  <span className="block truncate text-xs" style={{ color: c.no_leidos ? 'var(--color-texto)' : 'var(--color-texto-3)' }}>
                    {esAdmin && <>{c.profesor_id === null ? 'Gimnasio' : `Prof. ${c.profesor}`} · </>}
                    {c.ultimo ? `${c.ultimo.de_alumno ? '' : 'Respuesta: '}${c.ultimo.texto}` : ''}
                  </span>
                </span>
                {c.no_leidos > 0 && (
                  <span
                    className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-[11px] font-bold"
                    style={{ backgroundColor: 'var(--color-error)', color: '#fff' }}
                  >
                    {c.no_leidos}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}

      {abierta && (
        <Conversacion
          key={abierta.id}
          conversacionId={abierta.id}
          titulo={abierta.alumno}
          subtitulo={[
            abierta.dni && `DNI ${abierta.dni}`,
            abierta.profesor_id === null ? 'Al gimnasio' : `Prof. ${abierta.profesor}`
          ].filter(Boolean).join(' · ')}
          alVolver={cerrar}
          alCambiar={cargar}
        />
      )}
    </div>
  )
}
