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

function TarjetaHorario() {
  return (
    <div className="tarjeta p-3.5">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1">
          <Bloque className="mb-2 h-4 w-20" style={{ borderRadius: 999 }} />
          <Bloque className="mb-2 h-4 w-32" />
          <Bloque className="mb-1.5 h-3 w-24" />
          <Bloque className="h-3 w-20" />
        </div>
        <div className="shrink-0">
          <Bloque className="mb-2 h-4 w-16" />
          <Bloque className="h-3 w-10" />
        </div>
      </div>
    </div>
  )
}

export function SkeletonListaHorarios() {
  return (
    <div className="flex flex-col gap-6" role="status" aria-label="Cargando horarios">
      {[0, 1].map(grupo => (
        <div key={grupo}>
          <Bloque className="mb-2 h-3 w-24" />
          <div className="grid gap-2.5 sm:grid-cols-2">
            <TarjetaHorario />
            <TarjetaHorario />
          </div>
        </div>
      ))}
    </div>
  )
}

function TarjetaReserva() {
  return (
    <div className="tarjeta p-4">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="flex-1">
          <Bloque className="mb-2 h-4 w-32" />
          <Bloque className="mb-1.5 h-3 w-40" />
          <Bloque className="h-3 w-28" />
        </div>
        <div className="shrink-0">
          <Bloque className="mb-2 h-4 w-16" />
          <Bloque className="h-5 w-20" style={{ borderRadius: 999 }} />
        </div>
      </div>
      <Bloque className="h-9 w-full" style={{ borderRadius: '0.7rem' }} />
    </div>
  )
}

export function SkeletonListaReservas() {
  return (
    <div className="flex flex-col gap-3" role="status" aria-label="Cargando reservas">
      <Bloque className="h-3 w-36" />
      <TarjetaReserva />
      <TarjetaReserva />
    </div>
  )
}

export function SkeletonPerfil() {
  return (
    <div role="status" aria-label="Cargando perfil">
      <div className="contenedor flex items-center gap-4 py-6">
        <Bloque className="h-16 w-16" style={{ borderRadius: 999 }} />
        <div className="flex-1">
          <Bloque className="mb-2 h-5 w-36" />
          <Bloque className="mb-1.5 h-3 w-44" />
          <Bloque className="h-3 w-24" />
        </div>
      </div>
      <div className="contenedor flex flex-col gap-2.5">
        {[0, 1, 2, 3].map(i => (
          <Bloque key={i} className="h-14 w-full" style={{ borderRadius: '1rem' }} />
        ))}
      </div>
    </div>
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
