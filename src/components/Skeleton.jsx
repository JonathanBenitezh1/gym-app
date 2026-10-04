/**
 * Esqueletos de carga.
 *
 * Muestran la forma del contenido mientras llega, en vez de un
 * "Cargando..." suelto: la pantalla no salta cuando aparecen los datos.
 */

export function Bloque({ className = '', style = {} }) {
  return (
    <div
      className={`animate-pulse rounded-md ${className}`}
      style={{ backgroundColor: 'var(--color-elevado)', ...style }}
      aria-hidden="true"
    />
  )
}

export function SkeletonLista({ filas = 3 }) {
  return (
    <div className="flex flex-col gap-2.5" role="status" aria-label="Cargando">
      {Array.from({ length: filas }).map((_, i) => (
        <Bloque key={i} className="h-20 w-full" style={{ borderRadius: '1rem' }} />
      ))}
    </div>
  )
}
