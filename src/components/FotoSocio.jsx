import { useState, useEffect, useRef } from 'react'
import { guardarFotoSocio, borrarFotoSocio } from '../services/adminService'
import { obtenerFotoUrl } from '../services/puertaService'
import { IconoCruz } from './Iconos'

// La foto se achica antes de mandarla: 480 px de lado y JPG. Así pesa 30 a
// 60 KB y entra en el límite del servidor sin agrandarlo.
const LADO = 480
const TOPE_BYTES = 68 * 1024

/** Recorta al centro en cuadrado y comprime, bajando la calidad si hace falta. */
function comprimir(fuente, ancho, alto) {
  const lado = Math.min(ancho, alto)
  const lienzo = document.createElement('canvas')
  lienzo.width = LADO
  lienzo.height = LADO
  lienzo.getContext('2d').drawImage(fuente, (ancho - lado) / 2, (alto - lado) / 2, lado, lado, 0, 0, LADO, LADO)
  for (const calidad of [0.82, 0.7, 0.58, 0.45]) {
    const url = lienzo.toDataURL('image/jpeg', calidad)
    if ((url.length - 23) * 0.75 <= TOPE_BYTES) return url
  }
  return null
}

/**
 * Sacar o subir la foto de un socio. Se abre desde Usuarios.
 *
 * La saca el gimnasio, no el socio: si la subiera el socio podría poner la de
 * otra persona, y la foto es lo que evita que alguien entre con el DNI ajeno.
 */
export default function FotoSocio({ socio, alCerrar, alExito, alError }) {
  const video = useRef(null)
  const flujo = useRef(null)
  const [actual, setActual]   = useState(null)   // la foto guardada
  const [nueva, setNueva]     = useState(null)   // data URL por guardar
  const [camara, setCamara]   = useState('apagada') // apagada | encendida | sin_permiso
  const [guardando, setGuardando] = useState(false)

  useEffect(() => {
    let url = null
    if (socio.tiene_foto) {
      obtenerFotoUrl(socio.id).then(u => { url = u; setActual(u) }).catch(() => {})
    }
    return () => { if (url) URL.revokeObjectURL(url) }
  }, [socio])

  const apagar = () => {
    flujo.current?.getTracks().forEach(t => t.stop())
    flujo.current = null
  }
  useEffect(() => apagar, [])

  const encender = async () => {
    try {
      flujo.current = await navigator.mediaDevices.getUserMedia({ video: { width: 960, height: 720, facingMode: 'user' } })
      setCamara('encendida')
      setNueva(null)
      // El video se monta con el estado nuevo; se conecta en el próximo cuadro.
      requestAnimationFrame(() => { if (video.current) video.current.srcObject = flujo.current })
    } catch {
      setCamara('sin_permiso')
    }
  }

  const sacar = () => {
    const v = video.current
    if (!v?.videoWidth) return
    const url = comprimir(v, v.videoWidth, v.videoHeight)
    if (!url) return alError('No pudimos comprimir la foto. Probá con más luz.')
    setNueva(url)
    apagar()
    setCamara('apagada')
  }

  const subir = (e) => {
    const archivo = e.target.files?.[0]
    e.target.value = ''
    if (!archivo) return
    if (!archivo.type.startsWith('image/')) return alError('Elegí una imagen')
    const img = new Image()
    const url = URL.createObjectURL(archivo)
    img.onload = () => {
      const comprimida = comprimir(img, img.naturalWidth, img.naturalHeight)
      URL.revokeObjectURL(url)
      if (!comprimida) return alError('No pudimos comprimir esa imagen')
      apagar()
      setCamara('apagada')
      setNueva(comprimida)
    }
    img.onerror = () => { URL.revokeObjectURL(url); alError('No pudimos abrir esa imagen') }
    img.src = url
  }

  const guardar = async () => {
    setGuardando(true)
    try {
      await guardarFotoSocio(socio.id, nueva)
      alExito(`Foto de ${socio.nombre} guardada`)
      alCerrar(true)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos guardar la foto')
    } finally {
      setGuardando(false)
    }
  }

  const borrar = async () => {
    try {
      await borrarFotoSocio(socio.id)
      alExito('Foto borrada')
      alCerrar(true)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos borrar la foto')
    }
  }

  const cerrar = () => { apagar(); alCerrar(false) }

  return (
    <div
      className="fixed inset-0 z-[70] flex items-end justify-center p-4 sm:items-center"
      style={{ backgroundColor: 'rgba(0,0,0,.6)' }}
      role="dialog" aria-modal="true" aria-labelledby="titulo-foto"
    >
      <div className="tarjeta aparecer flex w-full max-w-md flex-col gap-4 p-5">
        <div className="flex items-center justify-between gap-3">
          <h2 id="titulo-foto" className="font-bold">Foto de {socio.nombre}</h2>
          <button onClick={cerrar} className="btn btn-fantasma btn-chico" aria-label="Cerrar"><IconoCruz size={16} /></button>
        </div>

        <div className="mx-auto flex aspect-square w-full max-w-72 items-center justify-center overflow-hidden rounded-2xl"
             style={{ backgroundColor: 'var(--color-elevado)' }}>
          {camara === 'encendida' ? (
            <video ref={video} autoPlay playsInline muted className="h-full w-full object-cover" style={{ transform: 'scaleX(-1)' }} />
          ) : nueva || actual ? (
            <img src={nueva || actual} alt="" className="h-full w-full object-cover" />
          ) : (
            <p className="px-6 text-center text-sm" style={{ color: 'var(--color-texto-3)' }}>Todavía no tiene foto</p>
          )}
        </div>

        {camara === 'sin_permiso' && (
          <p className="text-sm" style={{ color: 'var(--color-error)' }}>
            No hay acceso a la cámara. Revisá el permiso del navegador o subí una foto desde un archivo.
          </p>
        )}

        <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
          De frente, con buena luz y sin anteojos de sol ni gorra. Se usa solo para identificarlo en la puerta.
        </p>

        <div className="flex flex-wrap gap-2">
          {camara === 'encendida' ? (
            <button onClick={sacar} className="btn btn-primario flex-1">Sacar foto</button>
          ) : (
            <button onClick={encender} className="btn btn-contorno flex-1">{nueva || actual ? 'Sacar otra' : 'Abrir cámara'}</button>
          )}
          <label className="btn btn-contorno flex-1 cursor-pointer">
            Subir archivo
            <input type="file" accept="image/*" className="hidden" onChange={subir} />
          </label>
        </div>

        <div className="flex gap-2">
          {socio.tiene_foto && !nueva && (
            <button onClick={borrar} className="btn btn-peligro flex-1">Borrar foto</button>
          )}
          {nueva && (
            <button onClick={guardar} disabled={guardando} className="btn btn-primario flex-1">
              {guardando ? 'Guardando…' : 'Guardar foto'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
