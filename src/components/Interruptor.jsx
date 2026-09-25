/**
 * Interruptor de encendido / apagado, afuera de los formularios de edición:
 * activar o desactivar algo es un toque, sin abrir el editor.
 */
export default function Interruptor({ activo, alCambiar, etiqueta, disabled = false }) {
  return (
    <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs" style={{ color: 'var(--color-texto-2)' }}>
      <button
        type="button"
        role="switch"
        aria-checked={Boolean(activo)}
        aria-label={etiqueta}
        disabled={disabled}
        onClick={() => alCambiar(!activo)}
        className="interruptor"
      />
      {activo ? 'Activo' : 'Inactivo'}
    </label>
  )
}
