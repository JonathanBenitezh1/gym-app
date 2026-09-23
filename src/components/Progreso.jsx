import { useState, useMemo } from 'react'
import { IconoMas, IconoBasura, IconoChevron } from './Iconos'
import { fechaCorta, hoyISO } from '../utils/formato'

// Medidas de un toque. "Otra" abre el campo libre para marcas personales.
const PRESETS = [
  { medida: 'Peso',           unidad: 'kg' },
  { medida: 'Cintura',        unidad: 'cm' },
  { medida: 'Cadera',         unidad: 'cm' },
  { medida: 'Brazo',          unidad: 'cm' },
  { medida: 'Grasa corporal', unidad: '%'  }
]
const UNIDADES = ['kg', 'reps', 'seg', 'min', 'cm', '%']

const numero = (v) => Number(v).toLocaleString('es-AR', { maximumFractionDigits: 2 })

/**
 * Progreso del socio agrupado por medida: último valor, cambio desde el primer
 * registro y una línea con la evolución.
 *
 * Con `alGuardar` y `alBorrar` es editable (el socio); sin ellos es solo
 * lectura (el profe al armar la rutina).
 */
export default function Progreso({ registros, alGuardar, alBorrar, vacio }) {
  const editable = Boolean(alGuardar)
  const [abierta, setAbierta] = useState(null)

  // Se agrupa sin distinguir mayúsculas: "sentadilla" y "Sentadilla" son lo mismo.
  const grupos = useMemo(() => {
    const mapa = new Map()
    for (const r of registros) {
      const clave = `${r.medida.toLowerCase()}|${r.unidad}`
      if (!mapa.has(clave)) mapa.set(clave, { clave, medida: r.medida, unidad: r.unidad, puntos: [] })
      mapa.get(clave).puntos.push(r)
    }
    return [...mapa.values()]
  }, [registros])

  return (
    <div className="flex flex-col gap-2.5">
      {editable && <FormularioProgreso alGuardar={alGuardar} medidasPrevias={grupos} />}

      {grupos.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>{vacio}</p>
      ) : grupos.map(g => {
        const primero = g.puntos[0]
        const ultimo  = g.puntos.at(-1)
        const cambio  = ultimo.valor - primero.valor
        const expandida = abierta === g.clave
        return (
          <article key={g.clave} className="tarjeta overflow-hidden">
            <button
              type="button"
              onClick={() => setAbierta(expandida ? null : g.clave)}
              aria-expanded={expandida}
              className="flex w-full items-center gap-3 p-3.5 text-left"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{g.medida}</p>
                <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                  {g.puntos.length > 1
                    ? `${cambio > 0 ? '+' : ''}${numero(cambio)} ${g.unidad} desde ${fechaCorta(primero.fecha)}`
                    : `Registrado el ${fechaCorta(ultimo.fecha)}`}
                </p>
              </div>
              {g.puntos.length > 1 && <Linea puntos={g.puntos} />}
              <p className="shrink-0 text-right">
                <span className="text-lg font-bold">{numero(ultimo.valor)}</span>
                <span className="ml-1 text-xs" style={{ color: 'var(--color-texto-3)' }}>{g.unidad}</span>
              </p>
              <span
                className="shrink-0 transition-transform"
                style={{ color: 'var(--color-texto-3)', transform: expandida ? 'rotate(180deg)' : 'none' }}
              >
                <IconoChevron size={16} />
              </span>
            </button>

            {expandida && (
              <ul style={{ borderTop: '1px solid var(--color-linea-sutil)' }}>
                {[...g.puntos].reverse().map(p => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between gap-3 px-3.5 py-2 text-sm"
                    style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}
                  >
                    <span style={{ color: 'var(--color-texto-2)' }}>{fechaCorta(p.fecha)}</span>
                    <span className="flex items-center gap-2">
                      <span className="font-medium">{numero(p.valor)} {p.unidad}</span>
                      {editable && (
                        <button
                          type="button" onClick={() => alBorrar(p)}
                          className="btn btn-fantasma btn-chico" aria-label={`Borrar registro del ${fechaCorta(p.fecha)}`}
                        >
                          <IconoBasura size={14} />
                        </button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </article>
        )
      })}
    </div>
  )
}

/** Línea chica de una sola serie. El eje x es el orden de los registros, no el tiempo. */
function Linea({ puntos }) {
  const ANCHO = 72, ALTO = 28, M = 3
  const valores = puntos.map(p => p.valor)
  const min = Math.min(...valores), max = Math.max(...valores)
  const rango = max - min || 1
  const xy = valores.map((v, i) => [
    M + i * (ANCHO - 2 * M) / (valores.length - 1),
    ALTO - M - (v - min) / rango * (ALTO - 2 * M)
  ])
  const [ux, uy] = xy.at(-1)
  return (
    <svg width={ANCHO} height={ALTO} viewBox={`0 0 ${ANCHO} ${ALTO}`} className="shrink-0" aria-hidden="true">
      <polyline
        points={xy.map(p => p.join(',')).join(' ')}
        fill="none" stroke="var(--color-acento)" strokeWidth="2"
        strokeLinejoin="round" strokeLinecap="round"
      />
      <circle cx={ux} cy={uy} r="3" fill="var(--color-acento)" />
    </svg>
  )
}

function FormularioProgreso({ alGuardar, medidasPrevias }) {
  const [abierto, setAbierto] = useState(false)
  const [eleccion, setEleccion] = useState('Peso')
  const [libre, setLibre]       = useState({ medida: '', unidad: 'kg' })
  const [valor, setValor]       = useState('')
  const [fecha, setFecha]       = useState(hoyISO())
  const [guardando, setGuardando] = useState(false)

  // Las marcas propias que ya cargó aparecen como opción, así no las reescribe.
  const opciones = useMemo(() => {
    const propias = medidasPrevias
      .filter(g => !PRESETS.some(p => p.medida.toLowerCase() === g.medida.toLowerCase()))
      .map(g => ({ medida: g.medida, unidad: g.unidad }))
    return [...PRESETS, ...propias]
  }, [medidasPrevias])

  const enviar = async (e) => {
    e.preventDefault()
    const base = eleccion === 'otra' ? libre : opciones.find(o => o.medida === eleccion)
    const numeroValor = Number(String(valor).replace(',', '.'))
    setGuardando(true)
    const ok = await alGuardar({ medida: base.medida.trim(), unidad: base.unidad, valor: numeroValor, fecha })
    setGuardando(false)
    if (ok) { setValor(''); setAbierto(false) }
  }

  if (!abierto) {
    return (
      <button type="button" onClick={() => setAbierto(true)} className="btn btn-contorno btn-bloque">
        <IconoMas size={16} /> Registrar medida o marca
      </button>
    )
  }

  return (
    <form onSubmit={enviar} className="tarjeta aparecer flex flex-col gap-3 p-4">
      <div>
        <label htmlFor="medida" className="etiqueta-campo">Qué medís</label>
        <select id="medida" className="campo" value={eleccion} onChange={e => setEleccion(e.target.value)}>
          {opciones.map(o => <option key={o.medida} value={o.medida}>{o.medida} ({o.unidad})</option>)}
          <option value="otra">Otra: marca personal…</option>
        </select>
      </div>

      {eleccion === 'otra' && (
        <div className="flex gap-2">
          <div className="flex-1">
            <label htmlFor="medida-libre" className="etiqueta-campo">Ejercicio o medida</label>
            <input
              id="medida-libre" className="campo" required maxLength={40}
              placeholder="Ej: Sentadilla" value={libre.medida}
              onChange={e => setLibre({ ...libre, medida: e.target.value })}
            />
          </div>
          <div className="w-24">
            <label htmlFor="unidad" className="etiqueta-campo">Unidad</label>
            <select id="unidad" className="campo" value={libre.unidad} onChange={e => setLibre({ ...libre, unidad: e.target.value })}>
              {UNIDADES.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </div>
        </div>
      )}

      <div className="flex gap-2">
        <div className="flex-1">
          <label htmlFor="valor" className="etiqueta-campo">Valor</label>
          <input
            id="valor" className="campo" required inputMode="decimal"
            placeholder="Ej: 78,5" value={valor}
            onChange={e => setValor(e.target.value)}
          />
        </div>
        <div className="flex-1">
          <label htmlFor="fecha" className="etiqueta-campo">Fecha</label>
          <input
            id="fecha" type="date" className="campo" required max={hoyISO()}
            value={fecha} onChange={e => setFecha(e.target.value)}
          />
        </div>
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => setAbierto(false)} className="btn btn-fantasma flex-1">Cancelar</button>
        <button type="submit" disabled={guardando} className="btn btn-primario flex-1">
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
      </div>
    </form>
  )
}
