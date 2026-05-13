// Bloque animado genérico
export function SkeletonBlock({ className = '', style = {} }) {
  return (
    <div
      className={`rounded-lg animate-pulse ${className}`}
      style={{ backgroundColor: '#3a4048', ...style }}
    />
  )
}

// Skeleton para una card de horario
export function SkeletonHorario() {
  return (
    <div className="rounded-2xl p-4" style={{ backgroundColor: '#2f373f' }}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-20 mb-2" />
          <SkeletonBlock className="h-4 w-40 mb-1" />
          <SkeletonBlock className="h-3 w-32 mb-1" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
        <div className="ml-4">
          <SkeletonBlock className="h-4 w-14 mb-1" />
          <SkeletonBlock className="h-3 w-16" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para la lista completa de horarios
export function SkeletonListaHorarios() {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: 5 }).map((_, i) => (
        <SkeletonHorario key={i} />
      ))}
    </div>
  )
}

// Skeleton para una card de reserva
export function SkeletonReserva() {
  return (
    <div className="rounded-2xl p-4 mb-3" style={{ backgroundColor: '#3e4045' }}>
      <div className="flex items-start justify-between mb-3">
        <div className="flex-1">
          <SkeletonBlock className="h-4 w-36 mb-1" />
          <SkeletonBlock className="h-3 w-44 mb-1" />
          <SkeletonBlock className="h-3 w-32 mb-1" />
          <SkeletonBlock className="h-3 w-40" />
        </div>
        <div className="ml-4">
          <SkeletonBlock className="h-4 w-16 mb-1" />
          <SkeletonBlock className="h-5 w-20" style={{ borderRadius: '9999px' }} />
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <SkeletonBlock className="h-8 flex-1" style={{ borderRadius: '0.5rem' }} />
        <SkeletonBlock className="h-8 w-24" style={{ borderRadius: '0.5rem' }} />
      </div>
    </div>
  )
}

// Skeleton para lista de reservas
export function SkeletonListaReservas() {
  return (
    <div>
      <SkeletonBlock className="h-3 w-40 mb-2 mx-1" />
      <SkeletonReserva />
      <SkeletonReserva />
      <SkeletonBlock className="h-3 w-36 mb-2 mx-1 mt-4" />
      <SkeletonReserva />
    </div>
  )
}
// Skeleton para el header de perfil
export function SkeletonPerfilHeader() {
  return (
    <div className="px-6 py-6" style={{ backgroundColor: '#25272e' }}>
      <div className="flex items-center gap-4">
        <SkeletonBlock
          className="w-14 h-14"
          style={{ borderRadius: '9999px', flexShrink: 0 }}
        />
        <div>
          <SkeletonBlock className="h-5 w-36 mb-1" />
          <SkeletonBlock className="h-3 w-44 mb-1" />
          <SkeletonBlock className="h-3 w-24" />
        </div>
      </div>
    </div>
  )
}

// Skeleton para un acordeón
export function SkeletonAcordeon() {
  return (
    <div className="rounded-2xl overflow-hidden" style={{ backgroundColor: '#2f373f' }}>
      <div className="flex items-center justify-between px-5 py-4">
        <div className="flex items-center gap-3">
          <SkeletonBlock className="h-5 w-5" style={{ borderRadius: '0.25rem' }} />
          <SkeletonBlock className="h-4 w-32" />
        </div>
        <SkeletonBlock className="h-3 w-3" />
      </div>
    </div>
  )
}

// Skeleton página completa de Perfil
export function SkeletonPerfil() {
  return (
    <>
      <SkeletonPerfilHeader />
      <div className="px-4 pt-4 pb-4 flex flex-col gap-3">
        <SkeletonAcordeon />
        <SkeletonAcordeon />
        <SkeletonAcordeon />
        <SkeletonAcordeon />
        <SkeletonBlock className="h-12 w-full" style={{ borderRadius: '1rem' }} />
      </div>
    </>
  )
}