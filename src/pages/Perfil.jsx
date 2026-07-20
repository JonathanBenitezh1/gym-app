import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { obtenerPerfil, editarPerfil, cambiarPassword, obtenerHistorialPagos } from '../services/perfilService'
import { obtenerMisReservas } from '../services/clasesService'
import NavBar from '../components/NavBar'
import { SkeletonPerfil } from '../components/Skeleton'
import { IconoChevron, IconoPerfil, IconoPago, IconoCalendario, IconoOjo, IconoOjoTachado } from '../components/Iconos'
import { precio, fechaCorta, rangoFechas, hora, fechaHora } from '../utils/formato'

export default function Perfil() {
  const { guardarSesion } = useAuth()
  const { exito, error: avisarError } = useAvisos()
  const navigate = useNavigate()

  const [perfil, setPerfil]     = useState(null)
  const [reservas, setReservas] = useState([])
  const [pagos, setPagos]       = useState([])
  const [cargando, setCargando] = useState(true)
  const [seccion, setSeccion]   = useState('datos')

  const cargar = useCallback(async () => {
    const [p, r, pg] = await Promise.allSettled([
      obtenerPerfil(),
      obtenerMisReservas(),
      obtenerHistorialPagos()
    ])
    if (p.status === 'fulfilled') setPerfil(p.value)
    else avisarError('No pudimos cargar tus datos')
    setReservas(r.status === 'fulfilled' ? r.value : [])
    setPagos(pg.status === 'fulfilled' ? pg.value : [])
    setCargando(false)
  }, [avisarError])

  useEffect(() => { cargar() }, [cargar])

  const alternar = (nombre) => setSeccion(s => (s === nombre ? null : nombre))

  const pendientes = reservas.filter(r => r.estado === 'pendiente').length

  if (cargando) {
    return (
      <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>
        <SkeletonPerfil />
        <NavBar />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>

      {/* Cabecera */}
      <header style={{ backgroundColor: 'var(--color-superficie)', borderBottom: '1px solid var(--color-linea-sutil)' }}>
        <div className="contenedor flex items-center gap-4 py-6">
          <span
            className="flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-2xl font-bold"
            style={{ backgroundColor: 'var(--color-acento)', color: 'var(--color-sobre-acento)' }}
          >
            {perfil?.nombre?.trim().charAt(0).toUpperCase() || '?'}
          </span>
          <div className="min-w-0">
            <h1 className="truncate text-lg font-bold">{perfil?.nombre}</h1>
            <p className="truncate text-sm" style={{ color: 'var(--color-texto-2)' }}>{perfil?.email}</p>
            <p className="mt-1 flex items-center gap-2 text-xs" style={{ color: 'var(--color-texto-3)' }}>
              <span>DNI {perfil?.dni}</span>
              {perfil?.created_at && <span>· Desde {fechaCorta(perfil.created_at)}</span>}
            </p>
          </div>
        </div>
      </header>

      <main className="contenedor flex flex-col gap-2.5 pt-4">

        <Acordeon
          nombre="datos" abierta={seccion} alAlternar={alternar}
          Icono={IconoPerfil} titulo="Mis datos"
        >
          <SeccionDatos
            perfil={perfil}
            alGuardar={async (form) => {
              const actualizado = await editarPerfil(form)
              setPerfil(actualizado)
              guardarSesion(localStorage.getItem('token'), actualizado)
              exito('Datos actualizados')
            }}
            alError={avisarError}
          />
        </Acordeon>

        <Acordeon
          nombre="clave" abierta={seccion} alAlternar={alternar}
          Icono={IconoPerfil} titulo="Cambiar contraseña"
        >
          <SeccionClave alExito={exito} alError={avisarError} />
        </Acordeon>

        <Acordeon
          nombre="reservas" abierta={seccion} alAlternar={alternar}
          Icono={IconoCalendario} titulo="Mis reservas"
          insignia={pendientes > 0 && `${pendientes} pendiente${pendientes > 1 ? 's' : ''}`}
        >
          {reservas.length === 0 ? (
            <Vacio texto="Todavía no tenés reservas" />
          ) : (
            <ul className="flex flex-col">
              {reservas.map(r => (
                <li key={r.id} className="flex items-start justify-between gap-3 py-3"
                    style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{r.clase}</p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      {r.dia_semana} · {hora(r.hora_inicio)} · {r.tipo}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      {rangoFechas(r.fecha_inicio, r.fecha_fin)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{precio(r.total)}</p>
                    <EstadoInsignia estado={r.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
          <button onClick={() => navigate('/reservas')} className="btn btn-contorno btn-bloque mt-3">
            Ver todas mis reservas
          </button>
        </Acordeon>

        <Acordeon
          nombre="pagos" abierta={seccion} alAlternar={alternar}
          Icono={IconoPago} titulo="Historial de pagos"
        >
          {pagos.length === 0 ? (
            <Vacio texto="Todavía no registraste pagos" />
          ) : (
            <ul className="flex flex-col">
              {pagos.map(p => (
                <li key={p.id} className="flex items-start justify-between gap-3 py-3"
                    style={{ borderBottom: '1px solid var(--color-linea-sutil)' }}>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{p.clase}</p>
                    <p className="text-xs capitalize" style={{ color: 'var(--color-texto-3)' }}>
                      {p.metodo} · {p.tipo}
                    </p>
                    <p className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                      {fechaHora(p.created_at)}
                    </p>
                  </div>
                  <div className="shrink-0 text-right">
                    <p className="text-sm font-bold">{precio(p.monto)}</p>
                    <EstadoInsignia estado={p.estado} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Acordeon>
      </main>

      <NavBar />
    </div>
  )
}

/* ─── Piezas ───────────────────────────────────────────── */

function Acordeon({ nombre, abierta, alAlternar, Icono, titulo, insignia, children }) {
  const expandida = abierta === nombre
  return (
    <section className="tarjeta overflow-hidden">
      <button
        onClick={() => alAlternar(nombre)}
        aria-expanded={expandida}
        className="flex w-full items-center gap-3 px-4 py-4 text-left transition-colors hover:bg-white/[.03]"
      >
        <span style={{ color: 'var(--color-acento)' }}><Icono size={19} /></span>
        <span className="flex-1 text-sm font-semibold">{titulo}</span>
        {insignia && <span className="insignia insignia-alerta">{insignia}</span>}
        <span
          className="transition-transform"
          style={{ color: 'var(--color-texto-3)', transform: expandida ? 'rotate(180deg)' : 'none' }}
        >
          <IconoChevron size={18} />
        </span>
      </button>
      {expandida && (
        <div className="aparecer px-4 pb-4" style={{ borderTop: '1px solid var(--color-linea-sutil)' }}>
          <div className="pt-3">{children}</div>
        </div>
      )}
    </section>
  )
}

function Vacio({ texto }) {
  return <p className="py-2 text-sm" style={{ color: 'var(--color-texto-3)' }}>{texto}</p>
}

function EstadoInsignia({ estado }) {
  const mapa = {
    pagado:    ['insignia-exito',  'Pagado'],
    cancelado: ['insignia-error',  'Cancelado'],
    pendiente: ['insignia-alerta', 'Pendiente']
  }
  const [clase, texto] = mapa[estado] || mapa.pendiente
  return <span className={`insignia ${clase} mt-1`}>{texto}</span>
}

function SeccionDatos({ perfil, alGuardar, alError }) {
  const [editando, setEditando] = useState(false)
  const [form, setForm] = useState({
    nombre: perfil?.nombre || '',
    email: perfil?.email || '',
    telefono: perfil?.telefono || ''
  })
  const [guardando, setGuardando] = useState(false)

  const guardar = async () => {
    setGuardando(true)
    try {
      await alGuardar(form)
      setEditando(false)
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos actualizar tus datos')
    } finally {
      setGuardando(false)
    }
  }

  if (!editando) {
    return (
      <>
        <dl className="flex flex-col gap-2.5 text-sm">
          <Dato etiqueta="Nombre"   valor={perfil?.nombre} />
          <Dato etiqueta="Email"    valor={perfil?.email} />
          <Dato etiqueta="Teléfono" valor={perfil?.telefono || 'Sin cargar'} />
          <Dato etiqueta="DNI"      valor={perfil?.dni} />
        </dl>
        <button onClick={() => setEditando(true)} className="btn btn-contorno btn-bloque mt-4">
          Editar mis datos
        </button>
      </>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="p-nombre" className="etiqueta-campo">Nombre</label>
        <input id="p-nombre" className="campo" value={form.nombre}
               onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="p-email" className="etiqueta-campo">Email</label>
        <input id="p-email" type="email" inputMode="email" className="campo" value={form.email}
               onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
      </div>
      <div>
        <label htmlFor="p-tel" className="etiqueta-campo">Teléfono</label>
        <input id="p-tel" type="tel" inputMode="numeric" className="campo" value={form.telefono}
               onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} />
      </div>
      <div className="mt-1 flex gap-2">
        <button onClick={guardar} disabled={guardando} className="btn btn-primario flex-1">
          {guardando ? 'Guardando…' : 'Guardar'}
        </button>
        <button onClick={() => setEditando(false)} className="btn btn-contorno">
          Cancelar
        </button>
      </div>
    </div>
  )
}

function Dato({ etiqueta, valor }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt style={{ color: 'var(--color-texto-3)' }}>{etiqueta}</dt>
      <dd className="truncate text-right font-medium">{valor}</dd>
    </div>
  )
}

function SeccionClave({ alExito, alError }) {
  const [form, setForm] = useState({ actual: '', nueva: '', repetir: '' })
  const [ver, setVer] = useState(false)
  const [guardando, setGuardando] = useState(false)

  const enviar = async () => {
    if (form.nueva.length < 6) return alError('La nueva contraseña debe tener al menos 6 caracteres')
    if (form.nueva !== form.repetir) return alError('Las contraseñas nuevas no coinciden')

    setGuardando(true)
    try {
      await cambiarPassword({ password_actual: form.actual, password_nueva: form.nueva })
      setForm({ actual: '', nueva: '', repetir: '' })
      alExito('Contraseña actualizada')
    } catch (err) {
      alError(err.response?.data?.error || 'No pudimos cambiar la contraseña')
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="flex flex-col gap-3">
      <div>
        <label htmlFor="c-actual" className="etiqueta-campo">Contraseña actual</label>
        <div className="relative">
          <input
            id="c-actual" type={ver ? 'text' : 'password'} className="campo pr-12"
            autoComplete="current-password" value={form.actual}
            onChange={e => setForm(f => ({ ...f, actual: e.target.value }))}
          />
          <button
            type="button" onClick={() => setVer(v => !v)}
            aria-label={ver ? 'Ocultar contraseñas' : 'Mostrar contraseñas'}
            className="absolute right-1 top-1/2 -translate-y-1/2 rounded-lg p-2.5 hover:bg-white/5"
            style={{ color: 'var(--color-texto-3)' }}
          >
            {ver ? <IconoOjoTachado size={18} /> : <IconoOjo size={18} />}
          </button>
        </div>
      </div>
      <div>
        <label htmlFor="c-nueva" className="etiqueta-campo">Nueva contraseña</label>
        <input
          id="c-nueva" type={ver ? 'text' : 'password'} className="campo"
          autoComplete="new-password" placeholder="Mínimo 6 caracteres" value={form.nueva}
          onChange={e => setForm(f => ({ ...f, nueva: e.target.value }))}
        />
      </div>
      <div>
        <label htmlFor="c-repetir" className="etiqueta-campo">Repetir nueva</label>
        <input
          id="c-repetir" type={ver ? 'text' : 'password'} className="campo"
          autoComplete="new-password" value={form.repetir}
          onChange={e => setForm(f => ({ ...f, repetir: e.target.value }))}
        />
      </div>
      <button onClick={enviar} disabled={guardando} className="btn btn-primario btn-bloque mt-1">
        {guardando ? 'Cambiando…' : 'Cambiar contraseña'}
      </button>
    </div>
  )
}
