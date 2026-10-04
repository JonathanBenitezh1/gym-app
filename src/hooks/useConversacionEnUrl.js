import { useCallback, useEffect, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'

/**
 * La conversación abierta vive en la dirección (?con=), no solo en el estado
 * (auditoría del 04/10/2026):
 * - "atrás" en Android cierra la conversación y no la pantalla entera;
 * - el aviso al celular abre directo la conversación (?con= en la url);
 * - cerrar con el botón vuelve atrás si la abrió la persona, así "atrás"
 *   después no la vuelve a abrir; si llegó por un aviso, solo saca el ?con=.
 * Los demás parámetros (?solapa=, ?seccion=) se respetan.
 */
export function useConversacionEnUrl() {
  const [params, setParams] = useSearchParams()
  const navigate = useNavigate()
  const con = params.get('con')
  const abrioLaPersona = useRef(false)

  // Si se cerró con "atrás", lo que se abra después empieza de cero.
  useEffect(() => { if (!con) abrioLaPersona.current = false }, [con])

  const abrir = useCallback((valor) => {
    abrioLaPersona.current = true
    const nuevos = new URLSearchParams(params)
    nuevos.set('con', String(valor))
    setParams(nuevos)
  }, [params, setParams])

  const cerrar = useCallback(() => {
    if (abrioLaPersona.current) {
      abrioLaPersona.current = false
      navigate(-1)
      return
    }
    const nuevos = new URLSearchParams(params)
    nuevos.delete('con')
    setParams(nuevos, { replace: true })
  }, [params, setParams, navigate])

  return { con, abrir, cerrar }
}
