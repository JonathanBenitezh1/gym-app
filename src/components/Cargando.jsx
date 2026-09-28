/**
 * Tres puntitos de carga, los mismos de la pantalla de arranque (index.html).
 * `pantalla`: ocupa toda la pantalla, para cuando todavía no hay nada que
 * mostrar (una sección que se está bajando).
 */
export default function Cargando({ pantalla = false }) {
  return (
    <div
      className={`flex items-center justify-center ${pantalla ? 'min-h-dvh' : 'py-10'}`}
      role="status"
      aria-label="Cargando"
    >
      <div className="cargando-puntos"><span /><span /><span /></div>
    </div>
  )
}
