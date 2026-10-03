import { useState, useEffect } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from './Avisos'
import { estadoAvisos, activarAvisos, desactivarAvisos, ErrorAvisos } from '../utils/avisosCelular'
import { mandarAvisoDePrueba } from '../services/avisosService'

const QUE_AVISA = [
  'Tu plan, unos días antes de que venza y cuando vence',
  'Un lugar que se liberó en tu lista de espera',
  'Tus pagos confirmados'
]

/**
 * Activar los avisos al celular (plan de mejoras 2.1).
 *
 * Completo, en Perfil: explica qué avisa y cada estado (bloqueados, iPhone sin
 * instalar). `compacto`, en la campanita: solo la invitación a activarlos, y
 * nada si no se puede. `titulo` cambia la invitación (la bandeja de mensajes
 * del personal la usa para los mensajes).
 */
export default function AvisosCelular({ compacto = false, titulo = 'Recibí estos avisos en el celular' }) {
  const { usuario } = useAuth()
  const { exito, error: avisarError } = useAvisos()
  const [estado, setEstado] = useState(null)
  const [trabajando, setTrabajando] = useState(false)

  useEffect(() => {
    let vigente = true
    estadoAvisos(usuario?.id).then(e => { if (vigente) setEstado(e) }).catch(() => {})
    return () => { vigente = false }
  }, [usuario?.id])

  const activar = async () => {
    setTrabajando(true)
    try {
      const nuevo = await activarAvisos(usuario.id)
      setEstado(nuevo)
      if (nuevo === 'activos') exito('Listo: te vamos a avisar en este celular')
    } catch (e) {
      avisarError(e.response?.data?.error || (e instanceof ErrorAvisos ? e.message : 'No pudimos activar los avisos'))
    } finally {
      setTrabajando(false)
    }
  }

  const desactivar = async () => {
    setTrabajando(true)
    try {
      await desactivarAvisos()
      setEstado('apagados')
    } catch {
      avisarError('No pudimos desactivar los avisos')
    } finally {
      setTrabajando(false)
    }
  }

  const probar = async () => {
    try {
      await mandarAvisoDePrueba()
      exito('Aviso enviado: tiene que llegarte en unos segundos')
    } catch (e) {
      avisarError(e.response?.data?.error || 'No pudimos mandar el aviso')
    }
  }

  if (compacto) {
    if (estado !== 'apagados') return null
    return (
      <div className="rounded-xl p-3" style={{ border: '1px solid var(--color-acento)', backgroundColor: 'var(--color-acento-bajo)' }}>
        <p className="text-sm font-semibold">{titulo}</p>
        <p className="mt-0.5 text-xs" style={{ color: 'var(--color-texto-2)' }}>Te llegan aunque tengas la app cerrada.</p>
        <button onClick={activar} disabled={trabajando} className="btn btn-primario btn-chico mt-2">
          {trabajando ? 'Activando…' : 'Activar'}
        </button>
      </div>
    )
  }

  if (estado === null) {
    return <p className="py-2 text-sm" style={{ color: 'var(--color-texto-3)' }}>Revisando…</p>
  }

  const nota = {
    instalar: 'En iPhone los avisos llegan solo con la app instalada. Instalala desde Safari (Compartir → Agregar a inicio), abrila desde el ícono y activalos acá.',
    no_soportado: 'Este navegador no permite avisos. En Android usá Chrome; en iPhone, la app instalada.',
    bloqueado: 'Bloqueaste los avisos de esta app. Para recibirlos, habilitá las notificaciones en los ajustes del celular y volvé a esta pantalla.'
  }[estado]
  if (nota) return <p className="text-sm" style={{ color: 'var(--color-texto-2)' }}>{nota}</p>

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm">
        {estado === 'activos'
          ? <><span className="insignia insignia-exito mr-1.5">Activados</span>en este celular. Te avisamos:</>
          : 'Te avisamos en el celular, aunque tengas la app cerrada:'}
      </p>
      <ul className="flex flex-col gap-1 text-sm" style={{ color: 'var(--color-texto-2)' }}>
        {QUE_AVISA.map(q => <li key={q}>· {q}</li>)}
      </ul>
      {estado === 'activos' ? (
        <div className="flex flex-col gap-2">
          <button onClick={probar} disabled={trabajando} className="btn btn-primario btn-bloque">
            Mandar aviso de prueba
          </button>
          <button onClick={desactivar} disabled={trabajando} className="btn btn-contorno btn-bloque">
            {trabajando ? 'Desactivando…' : 'Desactivar en este celular'}
          </button>
        </div>
      ) : (
        <button onClick={activar} disabled={trabajando} className="btn btn-primario btn-bloque">
          {trabajando ? 'Activando…' : 'Activar avisos'}
        </button>
      )}
    </div>
  )
}
