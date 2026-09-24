import { useState, useEffect } from 'react'
import { obtenerEstadisticas } from '../../services/adminService'
import { SkeletonLista } from '../../components/Skeleton'
import { precio, hora } from '../../utils/formato'

const MESES_CORTOS = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic']
const nombreMes = (aaaamm) => MESES_CORTOS[Number(aaaamm.slice(5, 7)) - 1]

/**
 * Números del gimnasio: cobrado por mes, socios, ocupación y asistencia.
 * Todas las barras son de una sola serie, así que van en el color de acento
 * y sin leyenda: el título de cada bloque dice qué se mide.
 */
export default function SeccionEstadisticas({ alError }) {
  const [datos, setDatos] = useState(null)

  useEffect(() => {
    obtenerEstadisticas()
      .then(setDatos)
      .catch(() => { alError('No pudimos cargar las estadísticas'); setDatos(false) })
  }, [alError])

  if (datos === null) return <SkeletonLista filas={4} />
  if (datos === false) return null

  const { ingresos, socios, ocupacion, asistencia, pendientes, puerta } = datos
  const actual   = ingresos.at(-1)
  const anterior = ingresos.at(-2)
  const variacion = anterior?.total > 0
    ? Math.round((actual.total - anterior.total) / anterior.total * 100)
    : null

  return (
    <div className="flex flex-col gap-5">

      <div className="grid grid-cols-2 gap-2.5 lg:grid-cols-4">
        <Cifra
          valor={precio(actual.total)} titulo={`Cobrado en ${nombreMes(actual.mes)}`} acento
          detalle={variacion === null ? null : `${variacion >= 0 ? '+' : ''}${variacion}% vs ${nombreMes(anterior.mes)}`}
        />
        <Cifra valor={precio(pendientes.monto)} titulo="Por cobrar"
               detalle={`${pendientes.cantidad} ${pendientes.cantidad === 1 ? 'reserva' : 'reservas'}`} />
        <Cifra valor={socios.activos} titulo="Socios activos"
               detalle={`${socios.nuevos_mes} ${socios.nuevos_mes === 1 ? 'nuevo' : 'nuevos'} este mes`} />
        <Cifra valor={socios.sin_apto} titulo="Sin apto vigente" alerta={socios.sin_apto > 0} />
      </div>

      <section className="tarjeta p-4">
        <h2 className="titulo-seccion">Cobrado por mes</h2>
        <p className="mb-4 text-xs" style={{ color: 'var(--color-texto-3)' }}>Pagos confirmados, últimos 6 meses</p>
        <BarrasMensuales ingresos={ingresos} />
      </section>

      {puerta && (
        <section className="tarjeta p-4">
          <h2 className="titulo-seccion">Ingresos por la puerta</h2>
          <p className="mb-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>
            Hoy entraron <b style={{ color: 'var(--color-texto)' }}>{puerta.entraron}</b>
            {puerta.rechazados > 0 && <> y se rechazaron <b style={{ color: 'var(--color-error)' }}>{puerta.rechazados}</b></>}.
            {' '}Abajo, el promedio por hora de los últimos 30 días.
          </p>
          {puerta.por_hora.length === 0
            ? <Vacio texto="Todavía no hay ingresos registrados por la puerta." />
            : <BarrasPorHora datos={puerta.por_hora} />}
        </section>
      )}

      <section className="tarjeta p-4">
        <h2 className="titulo-seccion">Ocupación por horario</h2>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>Lugares tomados hoy sobre el total</p>
        {ocupacion.length === 0 ? <Vacio texto="No hay horarios activos." /> : (
          <ul className="flex flex-col gap-2.5">
            {ocupacion.map(h => (
              <BarraHorizontal
                key={h.id}
                etiqueta={`${h.clase} · ${h.dia_semana.slice(0, 3)} ${hora(h.hora_inicio)}`}
                valor={h.ocupados} total={h.cupos_totales}
                texto={`${h.ocupados}/${h.cupos_totales}`}
              />
            ))}
          </ul>
        )}
      </section>

      <section className="tarjeta p-4">
        <h2 className="titulo-seccion">Asistencia por clase</h2>
        <p className="mb-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>
          Presentes sobre lo que marcaron los profes, últimos 30 días
        </p>
        {asistencia.length === 0 ? (
          <Vacio texto="Todavía no hay asistencia marcada en los últimos 30 días. Los profes la toman desde su panel." />
        ) : (
          <ul className="flex flex-col gap-2.5">
            {asistencia.map(a => (
              <BarraHorizontal
                key={a.clase} etiqueta={a.clase}
                valor={a.presentes} total={a.marcadas}
                texto={`${Math.round(a.presentes / a.marcadas * 100)}% · ${a.presentes} de ${a.marcadas}`}
              />
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}

function Cifra({ valor, titulo, detalle, acento, alerta }) {
  return (
    <div className="tarjeta p-3.5">
      <p
        className="text-xl font-bold tracking-tight"
        style={{ color: acento ? 'var(--color-acento)' : alerta ? 'var(--color-alerta)' : 'var(--color-texto)' }}
      >
        {valor}
      </p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{titulo}</p>
      {detalle && <p className="mt-1 text-[11px]" style={{ color: 'var(--color-texto-2)' }}>{detalle}</p>}
    </div>
  )
}

/** Columnas por mes. El monto va escrito solo en el mes actual y al pasar el mouse o tocar. */
function BarrasMensuales({ ingresos }) {
  const [activo, setActivo] = useState(ingresos.length - 1)
  const maximo = Math.max(...ingresos.map(m => m.total), 1)

  return (
    <div>
      <p className="mb-2 text-sm">
        <span className="font-bold">{precio(ingresos[activo].total)}</span>
        <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          {' '}en {nombreMes(ingresos[activo].mes)} · {ingresos[activo].pagos} {ingresos[activo].pagos === 1 ? 'pago' : 'pagos'}
        </span>
      </p>
      <div className="flex h-36 items-end gap-2" style={{ borderBottom: '1px solid var(--color-linea)' }}>
        {ingresos.map((m, i) => (
          <button
            key={m.mes} type="button"
            onMouseEnter={() => setActivo(i)} onFocus={() => setActivo(i)} onClick={() => setActivo(i)}
            aria-label={`${nombreMes(m.mes)}: ${precio(m.total)}`}
            className="flex h-full flex-1 items-end"
          >
            <span
              className="block w-full rounded-t"
              style={{
                height: `${m.total / maximo * 100}%`,
                minHeight: m.total > 0 ? 4 : 0,
                backgroundColor: 'var(--color-acento)',
                opacity: i === activo ? 1 : 0.45,
                transition: 'opacity .15s'
              }}
            />
          </button>
        ))}
      </div>
      <div className="mt-1.5 flex gap-2">
        {ingresos.map((m, i) => (
          <span
            key={m.mes} className="flex-1 text-center text-[11px]"
            style={{ color: i === activo ? 'var(--color-texto)' : 'var(--color-texto-3)' }}
          >
            {nombreMes(m.mes)}
          </span>
        ))}
      </div>
    </div>
  )
}

/** Promedio de ingresos por hora. Se completan las horas sin datos entre la primera y la última. */
function BarrasPorHora({ datos }) {
  const [activa, setActiva] = useState(null)
  const mapa = new Map(datos.map(d => [d.hora, d.promedio]))
  const desde = Math.min(...datos.map(d => d.hora))
  const hasta = Math.max(...datos.map(d => d.hora))
  const horas = Array.from({ length: hasta - desde + 1 }, (_, i) => desde + i)
  const maximo = Math.max(...datos.map(d => d.promedio), 1)
  const pico = datos.reduce((a, b) => (b.promedio > a.promedio ? b : a))
  const mostrada = activa ?? pico.hora

  return (
    <div>
      <p className="mb-2 text-sm">
        <span className="font-bold">{(mapa.get(mostrada) ?? 0).toLocaleString('es-AR')}</span>
        <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          {' '}por día entre las {mostrada} y las {mostrada + 1}{activa === null ? ' · la hora pico' : ''}
        </span>
      </p>
      <div className="flex h-28 items-end gap-1" style={{ borderBottom: '1px solid var(--color-linea)' }}>
        {horas.map(h => {
          const v = mapa.get(h) ?? 0
          return (
            <button
              key={h} type="button"
              onMouseEnter={() => setActiva(h)} onFocus={() => setActiva(h)} onClick={() => setActiva(h)}
              onMouseLeave={() => setActiva(null)}
              aria-label={`${h} h: ${v} por día`}
              className="flex h-full flex-1 items-end"
            >
              <span
                className="block w-full rounded-t"
                style={{
                  height: `${v / maximo * 100}%`, minHeight: v > 0 ? 3 : 0,
                  backgroundColor: 'var(--color-acento)',
                  opacity: h === mostrada ? 1 : 0.45
                }}
              />
            </button>
          )
        })}
      </div>
      <div className="mt-1.5 flex gap-1">
        {horas.map(h => (
          <span key={h} className="flex-1 text-center text-[10px] tabular-nums"
                style={{ color: h === mostrada ? 'var(--color-texto)' : 'var(--color-texto-3)' }}>
            {h}
          </span>
        ))}
      </div>
    </div>
  )
}

function BarraHorizontal({ etiqueta, valor, total, texto }) {
  const porcentaje = total > 0 ? valor / total * 100 : 0
  return (
    <li>
      <div className="mb-1 flex items-baseline justify-between gap-3 text-xs">
        <span className="truncate">{etiqueta}</span>
        <span className="shrink-0" style={{ color: 'var(--color-texto-2)' }}>{texto}</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full" style={{ backgroundColor: 'var(--color-elevado)' }}>
        <div
          className="h-full rounded-full"
          style={{ width: `${porcentaje}%`, backgroundColor: 'var(--color-acento)' }}
        />
      </div>
    </li>
  )
}

function Vacio({ texto }) {
  return <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>{texto}</p>
}
