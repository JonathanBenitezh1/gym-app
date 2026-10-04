import { useState, useEffect, useCallback, useMemo, useRef } from 'react'
import { obtenerRiesgo, anotarContactoRiesgo } from '../../services/adminService'
import { useSocketEventos } from '../../hooks/useSocketEventos'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoBuscar, IconoWhatsapp } from '../../components/Iconos'
import { fechaCorta, fechaHora } from '../../utils/formato'
import { linkWhatsapp, mensajeRiesgo } from '../../utils/whatsapp'
import { recordado, recordar } from '../../utils/memoria'

const OPCIONES_DIAS = [7, 10, 14, 21, 30]

const MOTIVOS = {
  plan_vencido:   { texto: 'Plan vencido',       color: 'var(--color-error)',  insignia: 'insignia-error' },
  sin_venir:      { texto: 'No viene',           color: 'var(--color-alerta)', insignia: 'insignia-alerta' },
  dejo_semanales: { texto: 'Dejó las semanales', color: 'var(--color-acento)', insignia: 'insignia-acento' }
}

const FILTROS = [
  { id: 'todos', texto: 'Todos' },
  { id: 'plan_vencido', texto: 'Plan vencido' },
  { id: 'sin_venir', texto: 'No vienen' },
  { id: 'dejo_semanales', texto: 'Dejaron las semanales' }
]

// El mensaje de WhatsApp va por el motivo que más pesa: el plan, después las
// visitas, después las semanales.
const ORDEN = ['plan_vencido', 'sin_venir', 'dejo_semanales']
const principal = (socio) => ORDEN.find(t => socio.motivos.some(m => m.tipo === t))

const diaAntes = (texto) => new Date(Date.parse(`${texto}T00:00:00Z`) - 86400000).toISOString().slice(0, 10)
const dias = (n) => (n === 1 ? '1 día' : `${n} días`)

/** Lo que se ve de cada motivo, con sus fechas. */
function detalle(m, s) {
  if (m.tipo === 'sin_venir') {
    if (!m.nunca) return `Hace ${dias(m.dias)} que no viene · última vez el ${fechaCorta(s.ultima_visita)}`
    return s.ultimo_pago_plan
      ? `No figura ninguna visita · ${dias(m.dias)} desde que pagó el plan`
      : `No figura ninguna visita · ${dias(m.dias)} desde que se registró`
  }
  if (m.tipo === 'plan_vencido') {
    const plan = s.plan ? `Plan ${s.plan}` : 'El plan'
    return m.estado === 'gracia'
      ? `${plan} venció el ${fechaCorta(s.cuota_vence)} · ${m.dias_restantes === 1 ? 'queda 1 día' : `quedan ${m.dias_restantes} días`} de gracia`
      : `${plan} venció el ${fechaCorta(s.cuota_vence)}, hace ${dias(m.hace)}`
  }
  return `Su última semanal fue hasta el ${fechaCorta(diaAntes(s.ultima_semanal_fin))}, hace ${dias(m.hace)}`
}

/**
 * Socios en riesgo (plan de mejoras 2.2): los que dejaron de venir, no
 * renovaron el plan o dejaron de reservar semanales, con el WhatsApp ya
 * escrito. Al tocarlo queda anotado, así nadie le escribe dos veces.
 */
export default function SeccionRiesgo({ alError }) {
  // Lo último, al instante (utils/memoria.js); se actualiza por detrás.
  const [datos, setDatos]       = useState(() => recordado('panel.riesgo.10') ?? null)
  const [diasSin, setDiasSin]   = useState(10)
  const [filtro, setFiltro]     = useState('todos')
  const [busqueda, setBusqueda] = useState('')

  // Si se cambian los días mientras carga, la respuesta vieja se descarta
  // (auditoría del 04/10/2026).
  const vigente = useRef(diasSin)

  const cargar = useCallback(async () => {
    vigente.current = diasSin
    try {
      const d = await obtenerRiesgo(diasSin)
      recordar(`panel.riesgo.${diasSin}`, d)
      if (vigente.current !== diasSin) return
      setDatos(d)
    } catch {
      if (vigente.current !== diasSin) return
      alError('No pudimos cargar los socios en riesgo')
      setDatos(prev => prev ?? false)
    }
  }, [diasSin, alError])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ nuevo_ingreso: cargar, cobro_registrado: cargar, nueva_reserva: cargar })

  const conteo = useMemo(() => {
    const c = { sin_venir: 0, plan_vencido: 0, dejo_semanales: 0 }
    for (const s of datos?.socios ?? []) for (const m of s.motivos) c[m.tipo]++
    return c
  }, [datos])

  const visibles = useMemo(() => {
    const texto = busqueda.trim().toLowerCase()
    return (datos?.socios ?? []).filter(s =>
      (filtro === 'todos' || s.motivos.some(m => m.tipo === filtro)) &&
      (!texto || s.nombre.toLowerCase().includes(texto) || String(s.dni).includes(texto))
    )
  }, [datos, filtro, busqueda])

  if (datos === null) return <SkeletonLista filas={4} />
  if (datos === false) return null

  // Se anota sin frenar el link: WhatsApp se abre igual aunque falle.
  const escribir = (socio, motivo) => {
    anotarContactoRiesgo(socio.id, motivo)
      .then(({ ultimo_contacto }) => setDatos(d => ({
        ...d, socios: d.socios.map(x => (x.id === socio.id ? { ...x, ultimo_contacto } : x))
      })))
      .catch(() => alError('Se abrió WhatsApp, pero no pudimos anotar que le escribiste'))
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="tarjeta flex flex-col gap-3 p-4">
        <div>
          <p className="text-sm font-semibold">Socios en riesgo</p>
          <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>
            Los que no vienen, no renovaron el plan (en gracia o vencido hace hasta 60 días) o dejaron de reservar
            semanales (la última terminó hace 14 días o más). Escribiles antes de que se vayan.
          </p>
        </div>
        <div>
          <p className="etiqueta-campo">"No viene": días sin pasar por la puerta ni figurar presente</p>
          <div className="fila-scroll">
            {OPCIONES_DIAS.map(n => (
              <button key={n} onClick={() => setDiasSin(n)} className={`pildora ${diasSin === n ? 'pildora-activa' : ''}`}>
                {n} días
              </button>
            ))}
          </div>
        </div>
      </div>

      {!datos.visitas_al_dia && (
        <div className="tarjeta p-4 text-sm" style={{ borderColor: 'var(--color-alerta)', color: 'var(--color-texto-2)' }}>
          {datos.ultimo_registro_visitas
            ? `La puerta y la asistencia no registran a nadie desde el ${fechaCorta(datos.ultimo_registro_visitas)}.`
            : 'La puerta y la asistencia todavía no registraron a nadie.'}
          {' '}Hasta que se usen, "No viene" no es confiable: van a aparecer socios que sí vienen.
        </div>
      )}

      <div className="grid grid-cols-3 gap-2.5">
        <Cifra valor={conteo.plan_vencido} texto="Plan vencido" color={MOTIVOS.plan_vencido.color} />
        <Cifra valor={conteo.sin_venir} texto="No vienen" color={MOTIVOS.sin_venir.color} />
        <Cifra valor={conteo.dejo_semanales} texto="Dejaron las semanales" color={MOTIVOS.dejo_semanales.color} />
      </div>

      <div className="tarjeta flex flex-col gap-3 p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
            <IconoBuscar size={17} />
          </span>
          <input
            id="buscar-riesgo" className="campo pl-10" placeholder="Buscar por nombre o DNI"
            value={busqueda} onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <div className="fila-scroll">
          {FILTROS.map(f => (
            <button key={f.id} onClick={() => setFiltro(f.id)} className={`pildora ${filtro === f.id ? 'pildora-activa' : ''}`}>
              {f.texto}
            </button>
          ))}
        </div>
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--color-texto-3)' }}>
          {datos.socios.length === 0 ? 'Ningún socio en riesgo. Todo en orden.' : 'Ningún socio con ese filtro.'}
        </p>
      ) : (
        <div className="grid grid-cols-1 gap-2.5 lg:grid-cols-2">
          {visibles.map(s => {
            const motivo = principal(s)
            const whatsapp = linkWhatsapp(s.telefono, mensajeRiesgo(s, motivo))
            return (
              <article key={s.id} className="tarjeta flex flex-col gap-3 p-3.5">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold">{s.nombre}</p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      DNI {s.dni}{s.plan ? ` · Plan ${s.plan}` : ' · Sin plan'}
                    </p>
                  </div>
                  <div className="flex shrink-0 flex-wrap justify-end gap-1">
                    {s.motivos.map(m => (
                      <span key={m.tipo} className={`insignia ${MOTIVOS[m.tipo].insignia}`}>
                        {MOTIVOS[m.tipo].texto}
                      </span>
                    ))}
                  </div>
                </div>

                <ul className="flex flex-col gap-1 text-xs" style={{ color: 'var(--color-texto-2)' }}>
                  {s.motivos.map(m => <li key={m.tipo}>{detalle(m, s)}</li>)}
                </ul>

                <div className="flex flex-wrap items-center gap-2">
                  {whatsapp ? (
                    <a
                      href={whatsapp} target="_blank" rel="noopener noreferrer"
                      onClick={() => escribir(s, motivo)}
                      className="btn btn-contorno btn-chico"
                    >
                      <IconoWhatsapp size={14} /> Escribirle
                    </a>
                  ) : (
                    <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>Sin teléfono cargado</span>
                  )}
                  {s.ultimo_contacto && (
                    <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      Le escribieron el {fechaHora(s.ultimo_contacto)}
                    </span>
                  )}
                </div>
              </article>
            )
          })}
        </div>
      )}
    </div>
  )
}

function Cifra({ valor, texto, color }) {
  return (
    <div className="tarjeta p-3.5">
      <p className="text-xl font-bold" style={{ color: valor > 0 ? color : 'var(--color-texto)' }}>{valor}</p>
      <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{texto}</p>
    </div>
  )
}
