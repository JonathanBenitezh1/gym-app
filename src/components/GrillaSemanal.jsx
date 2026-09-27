import { useState } from 'react'
import { DIAS_SEMANA, hora } from '../utils/formato'

const TONOS = {
  exito:  { borde: 'var(--color-exito)',  fondo: 'var(--color-exito-bajo)',  texto: 'var(--color-exito)' },
  error:  { borde: 'var(--color-error)',  fondo: 'var(--color-error-bajo)',  texto: 'var(--color-error)' },
  alerta: { borde: 'var(--color-alerta)', fondo: 'var(--color-alerta-bajo)', texto: 'var(--color-alerta)' },
  acento: { borde: 'var(--color-acento)', fondo: 'var(--color-acento-bajo)', texto: 'var(--color-acento)' },
  neutro: { borde: 'var(--color-linea)',  fondo: 'var(--color-superficie)',  texto: 'var(--color-texto-3)' }
}

const minutos = (valor) => {
  const [h, m] = String(valor).split(':').map(Number)
  return h * 60 + m
}

// "2026-09-28" + 2 → "30"
const diaDelMes = (desde, n) => new Date(Date.parse(`${desde}T00:00:00Z`) + n * 86400000).getUTCDate()

/**
 * Grilla de lunes a domingo (plan de mejoras 2.3), para el socio y el panel.
 *
 * Recibe los horarios ya armados como `items`:
 * { id, dias, hora_inicio, hora_fin, titulo, subtitulo, nota, tono, resaltado, apagado, alTocar }.
 * Un horario de varios días aparece en cada uno; tocarlo en cualquier día es
 * tocar el horario entero, como en la lista.
 *
 * En el celular, un día por vez con sus clases en orden de hora: siete
 * columnas no entran en 375 px. Desde tablet, las siete columnas.
 *
 * `desde`: el lunes de la semana que se muestra, para poner la fecha en cada día.
 */
export default function GrillaSemanal({ items, desde }) {
  const porDia = DIAS_SEMANA.map(d => ({
    ...d,
    fecha: desde ? diaDelMes(desde, d.numero - 1) : null,
    items: items
      .filter(i => i.dias.includes(d.numero))
      .sort((a, b) => minutos(a.hora_inicio) - minutos(b.hora_inicio) || a.titulo.localeCompare(b.titulo, 'es'))
  }))
  const [elegido, setElegido] = useState(() => porDia.find(d => d.items.length > 0)?.numero ?? 1)
  const dia = porDia[elegido - 1]

  return (
    <>
      {/* Celular: un día por vez */}
      <div className="md:hidden">
        <div className="grid grid-cols-7 gap-1" role="tablist" aria-label="Días de la semana">
          {porDia.map(d => {
            const activo = d.numero === elegido
            return (
              <button
                key={d.numero}
                type="button"
                role="tab"
                aria-selected={activo}
                aria-label={`${d.nombre}${d.fecha ? ` ${d.fecha}` : ''}: ${d.items.length} ${d.items.length === 1 ? 'clase' : 'clases'}`}
                onClick={() => setElegido(d.numero)}
                className="flex flex-col items-center rounded-lg py-1.5 text-xs font-semibold transition-colors"
                style={activo
                  ? { backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }
                  : { backgroundColor: 'var(--color-superficie)', color: d.items.length ? 'var(--color-texto-2)' : 'var(--color-texto-3)' }}
              >
                {d.corto}
                <span className="text-[11px] font-normal opacity-80">{d.fecha ?? (d.items.length || '–')}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-3 flex flex-col gap-2" role="tabpanel">
          {dia.items.length === 0 ? (
            <p className="tarjeta p-5 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>
              Sin clases el {dia.nombre.toLowerCase()}
            </p>
          ) : dia.items.map(i => <Bloque key={i.id} item={i} />)}
        </div>
      </div>

      {/* Tablet y PC: las siete columnas */}
      <div className="hidden md:grid md:grid-cols-7 md:gap-2">
        {porDia.map(d => (
          <div key={d.numero} className="flex min-w-0 flex-col gap-1.5">
            <p className="titulo-seccion text-center">
              {d.corto}{d.fecha && <span className="ml-1 font-normal">{d.fecha}</span>}
            </p>
            {d.items.length === 0
              ? <p className="text-center text-xs" style={{ color: 'var(--color-texto-3)' }}>—</p>
              : d.items.map(i => <Bloque key={i.id} item={i} compacto />)}
          </div>
        ))}
      </div>
    </>
  )
}

/** Lista / Semana, arriba de los horarios (socio y panel). */
export function SelectorFormato({ formato, alCambiar }) {
  return (
    <div className="flex shrink-0 gap-0.5 rounded-lg p-0.5" style={{ backgroundColor: 'var(--color-superficie)' }}
         role="group" aria-label="Cómo ver los horarios">
      {[['lista', 'Lista'], ['semana', 'Semana']].map(([valor, texto]) => (
        <button
          key={valor}
          type="button"
          aria-pressed={formato === valor}
          onClick={() => alCambiar(valor)}
          className="rounded-md px-3 py-1 text-xs font-semibold transition-colors"
          style={formato === valor
            ? { backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }
            : { color: 'var(--color-texto-2)' }}
        >
          {texto}
        </button>
      ))}
    </div>
  )
}

function Bloque({ item, compacto = false }) {
  const t = TONOS[item.tono] ?? TONOS.neutro
  const estilo = {
    borderLeft: `3px solid ${t.borde}`,
    backgroundColor: item.resaltado ? t.fondo : 'var(--color-superficie)',
    opacity: item.apagado ? 0.55 : 1
  }
  const contenido = (
    <>
      <p className="text-[11px] font-semibold tabular-nums" style={{ color: item.resaltado ? t.texto : 'var(--color-texto-2)' }}>
        {hora(item.hora_inicio)}{compacto ? '' : ` a ${hora(item.hora_fin)}`}
      </p>
      <p className={`font-semibold ${compacto ? 'text-xs leading-snug' : 'text-sm'} break-words`}>{item.titulo}</p>
      {item.subtitulo && !compacto && (
        <p className="truncate text-xs" style={{ color: 'var(--color-texto-3)' }}>{item.subtitulo}</p>
      )}
      {item.nota && (
        <p className="mt-0.5 text-[11px] font-medium leading-snug" style={{ color: t.texto }}>{item.nota}</p>
      )}
    </>
  )

  if (!item.alTocar) return <div className="rounded-lg p-2" style={estilo}>{contenido}</div>
  return (
    <button
      type="button"
      onClick={item.alTocar}
      aria-pressed={item.seleccionado}
      className="w-full rounded-lg p-2 text-left transition-colors hover:brightness-110"
      style={estilo}
    >
      {contenido}
    </button>
  )
}
