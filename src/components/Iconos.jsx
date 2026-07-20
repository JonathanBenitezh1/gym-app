/**
 * Íconos en SVG.
 *
 * Antes se usaban emojis, que se dibujan distinto en cada sistema
 * (y en algunos Android ni aparecen). Estos heredan el color del
 * texto y escalan sin perder nitidez.
 */

const base = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.8,
  strokeLinecap: 'round',
  strokeLinejoin: 'round'
}

function Svg({ children, size = 22, ...props }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden="true"
      {...base}
      {...props}
    >
      {children}
    </svg>
  )
}

export const IconoPesa = (p) => (
  <Svg {...p}>
    <path d="M6.5 6.5v11M3.5 9v6M17.5 6.5v11M20.5 9v6M6.5 12h11" />
  </Svg>
)

export const IconoRutina = (p) => (
  <Svg {...p}>
    <path d="M9 4h6a1 1 0 0 1 1 1v1H8V5a1 1 0 0 1 1-1Z" />
    <path d="M8 6H6a1 1 0 0 0-1 1v12a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V7a1 1 0 0 0-1-1h-2" />
    <path d="M9 11h6M9 15h4" />
  </Svg>
)

export const IconoPago = (p) => (
  <Svg {...p}>
    <rect x="2.5" y="5.5" width="19" height="13" rx="2" />
    <path d="M2.5 10h19" />
  </Svg>
)

export const IconoPerfil = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="8.5" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0 1 15 0" />
  </Svg>
)

export const IconoSalir = (p) => (
  <Svg {...p}>
    <path d="M15 5h3a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1h-3" />
    <path d="M10 8l-4 4 4 4M6 12h9" />
  </Svg>
)

export const IconoWhatsapp = (p) => (
  <Svg {...p} strokeWidth={1.7}>
    <path d="M3.5 20.5l1.3-4.4A8 8 0 1 1 8 19.4l-4.5 1.1Z" />
    <path d="M9 9.5c0 3 2.5 5.5 5.5 5.5.6 0 1-.5 1-1l-1.4-.7-.9.8a5 5 0 0 1-2.3-2.3l.8-.9L11 9.5c0-.5-.4-1-1-1s-1 .4-1 1Z" />
  </Svg>
)

export const IconoCalendario = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="5" width="17" height="15" rx="2" />
    <path d="M3.5 10h17M8 3.5v3M16 3.5v3" />
  </Svg>
)

export const IconoReloj = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 7.5V12l3 1.8" />
  </Svg>
)

export const IconoUsuarios = (p) => (
  <Svg {...p}>
    <circle cx="9" cy="8.5" r="3.2" />
    <path d="M2.8 19.5a6.2 6.2 0 0 1 12.4 0" />
    <path d="M16 5.6a3.2 3.2 0 0 1 0 5.8M17.5 14.4a6.2 6.2 0 0 1 3.7 5.1" />
  </Svg>
)

export const IconoCheck = (p) => (
  <Svg {...p}><path d="M5 12.5l4.5 4.5L19 7.5" /></Svg>
)

export const IconoCruz = (p) => (
  <Svg {...p}><path d="M6 6l12 12M18 6L6 18" /></Svg>
)

export const IconoFlecha = (p) => (
  <Svg {...p}><path d="M15 5l-7 7 7 7" /></Svg>
)

export const IconoChevron = (p) => (
  <Svg {...p}><path d="M6 9l6 6 6-6" /></Svg>
)

export const IconoAlerta = (p) => (
  <Svg {...p}>
    <path d="M12 4.5 2.8 20h18.4L12 4.5Z" />
    <path d="M12 10v4M12 17.2v.1" />
  </Svg>
)

export const IconoInfo = (p) => (
  <Svg {...p}>
    <circle cx="12" cy="12" r="8.5" />
    <path d="M12 11v5.5M12 7.8v.1" />
  </Svg>
)

export const IconoOjo = (p) => (
  <Svg {...p}>
    <path d="M2.5 12S6 6 12 6s9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z" />
    <circle cx="12" cy="12" r="2.6" />
  </Svg>
)

export const IconoOjoTachado = (p) => (
  <Svg {...p}>
    <path d="M4 4l16 16" />
    <path d="M9.6 9.7a2.6 2.6 0 0 0 3.6 3.6" />
    <path d="M6.4 6.6C3.9 8.2 2.5 12 2.5 12s3.5 6 9.5 6c1.6 0 3-.4 4.2-1M9.8 6.3A8.9 8.9 0 0 1 12 6c6 0 9.5 6 9.5 6a16 16 0 0 1-2.4 3.1" />
  </Svg>
)

export const IconoBasura = (p) => (
  <Svg {...p}>
    <path d="M4.5 7h15M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7" />
    <path d="M6.5 7l.8 12a1 1 0 0 0 1 1h7.4a1 1 0 0 0 1-1l.8-12" />
  </Svg>
)

export const IconoLapiz = (p) => (
  <Svg {...p}>
    <path d="M16.5 4.5l3 3L8 19H5v-3L16.5 4.5Z" />
  </Svg>
)

export const IconoMas = (p) => (
  <Svg {...p}><path d="M12 5v14M5 12h14" /></Svg>
)

export const IconoPanel = (p) => (
  <Svg {...p}>
    <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="3.5" width="7" height="7" rx="1.5" />
    <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    <rect x="13.5" y="13.5" width="7" height="7" rx="1.5" />
  </Svg>
)

export const IconoLlave = (p) => (
  <Svg {...p}>
    <circle cx="8" cy="12" r="4" />
    <path d="M12 12h8M17.5 12v3M20 12v2.5" />
  </Svg>
)

export const IconoBuscar = (p) => (
  <Svg {...p}>
    <circle cx="11" cy="11" r="6.5" />
    <path d="M16 16l4.5 4.5" />
  </Svg>
)
