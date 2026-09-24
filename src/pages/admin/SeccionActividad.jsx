import { useState, useEffect, useCallback } from 'react'
import { obtenerActividad } from '../../services/adminService'
import { useAuth } from '../../context/AuthContext'
import { SkeletonLista } from '../../components/Skeleton'
import { IconoBuscar } from '../../components/Iconos'
import { precio, fechaHora, fechaCorta } from '../../utils/formato'

/** Cómo se lee cada acción y de qué color se pinta. */
const ACCIONES = {
  'pago.registrar':               { texto: 'registró el pago de su reserva', color: 'var(--color-alerta)' },
  'pago.confirmar':               { texto: 'confirmó el cobro a',            color: 'var(--color-exito)' },
  'reserva.cancelar':             { texto: 'canceló su reserva',             color: 'var(--color-texto-2)' },
  'clase.crear':                  { texto: 'creó la clase',                  color: 'var(--color-acento)' },
  'clase.editar':                 { texto: 'editó la clase',                 color: 'var(--color-texto-2)' },
  'clase.desactivar':             { texto: 'desactivó la clase',             color: 'var(--color-error)' },
  'clase.eliminar':               { texto: 'eliminó la clase',               color: 'var(--color-error)' },
  'horario.crear':                { texto: 'creó un horario',                color: 'var(--color-acento)' },
  'horario.editar':               { texto: 'editó un horario',               color: 'var(--color-texto-2)' },
  'horario.eliminar':             { texto: 'eliminó un horario',             color: 'var(--color-error)' },
  'usuario.rol':                  { texto: 'cambió el rol de',               color: 'var(--color-acento)' },
  'usuario.baja':                 { texto: 'dio de baja a',                  color: 'var(--color-error)' },
  'usuario.reactivar':            { texto: 'reactivó a',                     color: 'var(--color-exito)' },
  'cuota.pago':                   { texto: 'cobró la cuota a',               color: 'var(--color-exito)' },
  'cuota.corregir':               { texto: 'corrigió el vencimiento de',     color: 'var(--color-alerta)' },
  'cuota.config':                 { texto: 'cambió la configuración de la cuota', color: 'var(--color-acento)' },
  'usuario.apto':                 { texto: 'actualizó el apto médico de',    color: 'var(--color-acento)' },
  'usuario.restablecer_password': { texto: 'restableció la clave de',        color: 'var(--color-alerta)' },
  'turno.llegada':                { texto: 'llegó al gimnasio',              color: 'var(--color-exito)' },
  'turno.salida':                 { texto: 'se fue del gimnasio',            color: 'var(--color-texto-2)' }
}

/** El detalle de cada movimiento, armado con lo que quedó guardado. */
function detalleLegible(d = {}) {
  const partes = []
  if (d.nombre)                          partes.push(d.nombre)
  if (d.dia_semana)                      partes.push([d.dia_semana, d.hora_inicio?.slice(0, 5)].filter(Boolean).join(' '))
  if (d.monto !== undefined)             partes.push(precio(d.monto))
  if (d.precio !== undefined)            partes.push(precio(d.precio))
  if (d.metodo)                          partes.push(d.metodo)
  if (d.antes && d.despues)              partes.push(`de ${d.antes} a ${d.despues}`)
  if (d.reservas_canceladas)             partes.push(`${d.reservas_canceladas} reservas canceladas`)
  if (d.sin_aviso_previo)                partes.push('sin aviso previo del socio')
  if (d.meses)                           partes.push(d.meses === 1 ? '1 mes' : `${d.meses} meses`)
  if (d.vence_nuevo)                     partes.push(`hasta el ${fechaCorta(d.vence_nuevo)}`)
  if ('anterior' in d && 'vence' in d)   partes.push(`de ${d.anterior ? fechaCorta(d.anterior) : 'sin fecha'} a ${d.vence ? fechaCorta(d.vence) : 'sin fecha'}`)
  if (d.dias_gracia !== undefined)       partes.push(`${d.dias_gracia} días de gracia`)
  return partes.join(' · ')
}

// Lo último que se cargó, y de quién. Al volver a abrir la sección se muestra
// al instante mientras se actualiza de fondo: antes cada visita arrancaba con
// barras de carga que después se achicaban de golpe.
//
// Se lee y se escribe a través de estas dos funciones y no directo desde el
// componente: el compilador de React no puede memorizar una función que
// reasigna una variable del módulo.
let ultimaCarga = null

function cargaRecordada(usuarioId) {
  return ultimaCarga?.usuarioId === usuarioId ? ultimaCarga.movimientos : null
}

function recordarCarga(usuarioId, movimientos) {
  ultimaCarga = { usuarioId, movimientos }
}

/**
 * Quién hizo qué. Sirve para revisar el trabajo del panel y encontrar un
 * movimiento sin tener que adivinar.
 */
export default function SeccionActividad({ alError }) {
  const { usuario } = useAuth()
  const usuarioId = usuario?.id
  const guardada = cargaRecordada(usuarioId)

  const [movimientos, setMovimientos] = useState(guardada || [])
  const [cargando, setCargando]       = useState(guardada === null)
  const [esperaLarga, setEsperaLarga] = useState(false)
  const [busqueda, setBusqueda]       = useState('')

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerActividad(150)
      recordarCarga(usuarioId, datos)
      setMovimientos(datos)
    } catch {
      alError('No se pudo cargar la actividad')
    } finally {
      setCargando(false)
    }
  }, [alError, usuarioId])

  useEffect(() => { cargar() }, [cargar])

  // El esqueleto aparece solo si la primera carga pasa de 300 ms, así una
  // respuesta rápida no se ve como un parpadeo.
  useEffect(() => {
    if (!cargando) return
    const temporizador = setTimeout(() => setEsperaLarga(true), 300)
    return () => clearTimeout(temporizador)
  }, [cargando])

  const texto = busqueda.trim().toLowerCase()
  const visibles = texto
    ? movimientos.filter(m =>
        m.quien?.toLowerCase().includes(texto) ||
        m.afectado?.toLowerCase().includes(texto))
    : movimientos

  let contenido
  if (cargando) {
    // Dos filas y no cinco: si no hay movimientos, el recuadro vacío que viene
    // después mide parecido y la pantalla no pega el salto.
    contenido = esperaLarga ? <SkeletonLista filas={2} /> : null
  } else if (visibles.length === 0) {
    contenido = (
      <div className="tarjeta p-8 text-center text-sm" style={{ color: 'var(--color-texto-2)' }}>
        {texto ? 'Ningún movimiento coincide con el filtro' : 'Todavía no hay movimientos registrados'}
      </div>
    )
  } else {
    contenido = (
      <div className="tarjeta divide-y" style={{ borderColor: 'var(--color-linea-sutil)' }}>
        {visibles.map(m => {
          const accion = ACCIONES[m.accion] || { texto: m.accion, color: 'var(--color-texto-2)' }
          const detalle = detalleLegible(m.detalle)
          // Cuando la persona se afecta a sí misma (canceló su propia
          // reserva), no se repite el nombre.
          const mostrarAfectado = m.afectado && m.afectado !== m.quien

          return (
            <div key={m.id} className="flex items-start justify-between gap-3 p-3">
              <div className="min-w-0">
                <p className="text-sm">
                  <span className="font-semibold">{m.quien || 'Alguien'}</span>
                  {m.rol_quien && (
                    <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}> ({m.rol_quien})</span>
                  )}
                  <span style={{ color: accion.color }}> {accion.texto} </span>
                  {mostrarAfectado && <span className="font-semibold">{m.afectado}</span>}
                </p>
                {detalle && (
                  <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-3)' }}>{detalle}</p>
                )}
              </div>
              <span className="shrink-0 text-xs tabular-nums" style={{ color: 'var(--color-texto-3)' }}>
                {fechaHora(m.creado_en)}
              </span>
            </div>
          )
        })}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      <div className="tarjeta p-4">
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--color-texto-3)' }}>
            <IconoBuscar size={17} />
          </span>
          <input
            className="campo pl-10"
            placeholder="Filtrar por persona"
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
          />
        </div>
        <p className="mt-2 text-xs" style={{ color: 'var(--color-texto-3)' }}>
          Los últimos movimientos del gimnasio: pagos, cancelaciones, cambios de clases, horarios y usuarios.
        </p>
      </div>

      {contenido}
    </div>
  )
}
