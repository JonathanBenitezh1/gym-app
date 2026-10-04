import { useState, useEffect, useCallback } from 'react'
import { useConversacionEnUrl } from '../hooks/useConversacionEnUrl'
import { obtenerContactos } from '../services/mensajesService'
import { useSocketEventos } from '../hooks/useSocketEventos'
import { useAvisos } from '../components/Avisos'
import EncabezadoSocio from '../components/EncabezadoSocio'
import NavBar from '../components/NavBar'
import Cargando from '../components/Cargando'
import Conversacion from '../components/Conversacion'
import { IconoMensaje } from '../components/Iconos'
import { recordado, recordar } from '../utils/memoria'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Mensajes del socio (migración 021, 03/10/2026): con el gimnasio y con el
 * profe que le armó la rutina. El gimnasio puede leer todas, y se le avisa.
 * `?con=gimnasio` o `?con=<id del profe>` abre esa conversación directo.
 */

const NOTA = 'Tu profe responde en el horario del gimnasio. El gimnasio puede ver estas conversaciones.'

const nombreDe = (c) => (c.profesor_id === null ? GIMNASIO.nombre : `Prof. ${c.nombre}`)
const claveDe = (c) => (c.profesor_id === null ? 'gimnasio' : String(c.profesor_id))

export default function Consultas() {
  const { error: avisarError } = useAvisos()
  const [contactos, setContactos] = useState(() => recordado('consultas') ?? [])
  const [cargando, setCargando] = useState(() => !recordado('consultas'))
  const { con, abrir: abrirEnUrl, cerrar: cerrarEnUrl } = useConversacionEnUrl()

  const cargar = useCallback(async () => {
    try {
      const lista = await obtenerContactos()
      setContactos(lista)
      recordar('consultas', lista)
    } catch {
      avisarError('No pudimos cargar tus mensajes')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargar() }, [cargar])
  useSocketEventos({ mensaje_nuevo: cargar })

  const abierta = contactos.find(c => claveDe(c) === con)
  const abrir = (c) => abrirEnUrl(claveDe(c))
  const cerrar = useCallback(() => { cerrarEnUrl(); cargar() }, [cerrarEnUrl, cargar])

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>
      <EncabezadoSocio />

      <main className="contenedor-ancho pt-5">
        <h1 className="text-lg font-bold tracking-tight">Mensajes</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          Consultale a tu profe o al gimnasio
        </p>

        {cargando ? <Cargando /> : (
          <ul className="tarjeta mt-5 overflow-hidden">
            {contactos.map((c, i) => (
              <li key={claveDe(c)} style={i > 0 ? { borderTop: '1px solid var(--color-linea-sutil)' } : undefined}>
                <button
                  onClick={() => abrir(c)}
                  className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition-colors hover:bg-tinte/[.03]"
                >
                  <span
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold"
                    style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-acento)' }}
                  >
                    {c.profesor_id === null ? <IconoMensaje size={18} /> : c.nombre.charAt(0).toUpperCase()}
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold">{nombreDe(c)}</span>
                    <span className="block truncate text-xs" style={{ color: c.no_leidos ? 'var(--color-texto)' : 'var(--color-texto-3)' }}>
                      {c.ultimo
                        ? `${c.ultimo.de_alumno ? 'Vos: ' : ''}${c.ultimo.texto}`
                        : c.profesor_id === null ? 'Pagos, horarios, lo que necesites' : 'Dudas de tu rutina'}
                    </span>
                  </span>
                  {c.no_leidos > 0 && (
                    <span
                      className="flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full px-1.5 text-xs font-bold"
                      style={{ backgroundColor: 'var(--color-error)', color: 'var(--color-sobre-error)' }}
                    >
                      {c.no_leidos}
                    </span>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}

        {!cargando && contactos.length === 1 && (
          <p className="mt-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>
            Cuando un profe te arme una rutina, vas a poder escribirle desde acá.
          </p>
        )}
        <p className="mt-3 text-xs" style={{ color: 'var(--color-texto-3)' }}>{NOTA}</p>
      </main>

      {abierta && (
        <Conversacion
          key={claveDe(abierta)}
          conversacionId={abierta.conversacion_id}
          profesorId={abierta.profesor_id}
          titulo={nombreDe(abierta)}
          subtitulo={abierta.profesor_id === null ? 'Recepción y administración' : 'Tu profe'}
          nota={NOTA}
          alVolver={cerrar}
          alCambiar={cargar}
        />
      )}

      <NavBar />
    </div>
  )
}
