import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../context/AuthContext'
import { useAvisos } from '../components/Avisos'
import { obtenerMisRutinas } from '../services/profesorService'
import NavBar from '../components/NavBar'
import Progreso from '../components/Progreso'
import { obtenerMiProgreso, registrarProgreso, borrarProgreso } from '../services/progresoService'
import { SkeletonLista } from '../components/Skeleton'
import { IconoChevron, IconoRutina } from '../components/Iconos'
import { fechaCorta } from '../utils/formato'
import logoGimnasio from './img/logo.webp'
import { GIMNASIO } from '../config/gimnasio'

export default function Rutinas() {
  const { usuario } = useAuth()
  const { error: avisarError, exito, confirmar } = useAvisos()

  const [rutinas, setRutinas]   = useState([])
  const [abierta, setAbierta]   = useState({})   // { [rutinaId]: sesionId }
  const [cargando, setCargando] = useState(true)

  const cargar = useCallback(async () => {
    try {
      const datos = await obtenerMisRutinas()
      setRutinas(datos)
      // Abrimos la primera sesión de cada rutina: casi siempre es lo que
      // el alumno viene a mirar, y ahorra un toque.
      const iniciales = {}
      for (const r of datos) {
        if (r.sesiones?.length) iniciales[r.id] = r.sesiones[0].id
      }
      setAbierta(iniciales)
    } catch {
      avisarError('No pudimos cargar tus rutinas')
    } finally {
      setCargando(false)
    }
  }, [avisarError])

  useEffect(() => { cargar() }, [cargar])

  const [progreso, setProgreso] = useState([])
  useEffect(() => {
    obtenerMiProgreso().then(setProgreso).catch(() => avisarError('No pudimos cargar tu progreso'))
  }, [avisarError])

  const guardarProgreso = async (datos) => {
    try {
      const nuevo = await registrarProgreso(datos)
      setProgreso(actual => [...actual, nuevo].sort((a, b) =>
        a.medida.localeCompare(b.medida) || a.fecha.localeCompare(b.fecha) || a.id - b.id))
      exito('Registrado')
      return true
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos guardar el registro')
      return false
    }
  }

  const quitarProgreso = async (registro) => {
    if (!await confirmar({
      titulo: '¿Borrar este registro?',
      mensaje: `${registro.medida}: ${registro.valor} ${registro.unidad}`,
      textoConfirmar: 'Borrar'
    })) return
    try {
      await borrarProgreso(registro.id)
      setProgreso(actual => actual.filter(r => r.id !== registro.id))
    } catch (err) {
      avisarError(err.response?.data?.error || 'No pudimos borrar el registro')
    }
  }

  const alternar = (rutinaId, sesionId) => {
    setAbierta(prev => ({
      ...prev,
      [rutinaId]: prev[rutinaId] === sesionId ? null : sesionId
    }))
  }

  return (
    <div className="min-h-screen" style={{ paddingBottom: 'calc(var(--alto-nav) + 1.5rem)' }}>

      <header
        className="sticky top-0 z-20"
        style={{
          backgroundColor: 'var(--color-superficie)',
          borderBottom: '1px solid var(--color-linea-sutil)'
        }}
      >
        <div className="contenedor-ancho flex items-center py-3">
          <img src={logoGimnasio} alt={GIMNASIO.nombre} className="h-9 w-auto" />
        </div>
      </header>

      <main className="contenedor-ancho pt-5">

        <h1 className="text-lg font-bold tracking-tight">Mis rutinas</h1>
        <p className="mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
          Los planes que te armó tu profesor
        </p>

        {cargando ? (
          <div className="mt-6"><SkeletonLista filas={2} /></div>
        ) : rutinas.length === 0 ? (
          <div className="tarjeta mt-6 p-8 text-center">
            <span
              className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full"
              style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
            >
              <IconoRutina size={22} />
            </span>
            <p className="font-semibold">Todavía no tenés rutinas</p>
            <p className="mx-auto mt-1 max-w-xs text-sm" style={{ color: 'var(--color-texto-2)' }}>
              Cuando tu profesor te cargue un plan personalizado, va a aparecer acá
            </p>
          </div>
        ) : (
          <div className="mt-6 flex flex-col gap-4">
            {rutinas.map(rutina => (
              <article key={rutina.id} className="tarjeta overflow-hidden">

                <div
                  className="flex items-center justify-between gap-3 px-4 py-3.5"
                  style={{ backgroundColor: 'var(--color-elevado)' }}
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-bold">
                      Plan de {usuario?.nombre?.split(' ')[0]}
                    </p>
                    <p className="truncate text-xs" style={{ color: 'var(--color-texto-2)' }}>
                      Prof. {rutina.profesor}
                    </p>
                  </div>
                  {rutina.updated_at && (
                    <span className="insignia insignia-neutra shrink-0">
                      {fechaCorta(rutina.updated_at)}
                    </span>
                  )}
                </div>

                {rutina.sesiones?.length > 0 ? (
                  <div>
                    {rutina.sesiones.map(sesion => {
                      const expandida = abierta[rutina.id] === sesion.id
                      const ejercicios = sesion.ejercicios || []
                      return (
                        <div
                          key={sesion.id}
                          style={{ borderTop: '1px solid var(--color-linea-sutil)' }}
                        >
                          <button
                            onClick={() => alternar(rutina.id, sesion.id)}
                            aria-expanded={expandida}
                            className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left transition-colors hover:bg-white/[.03]"
                          >
                            <span className="min-w-0">
                              <span className="block truncate text-sm font-semibold uppercase tracking-wide">
                                {sesion.nombre}
                              </span>
                              <span className="text-xs" style={{ color: 'var(--color-texto-3)' }}>
                                {ejercicios.length} {ejercicios.length === 1 ? 'ejercicio' : 'ejercicios'}
                              </span>
                            </span>
                            <span
                              className="shrink-0 transition-transform"
                              style={{
                                color: 'var(--color-acento)',
                                transform: expandida ? 'rotate(180deg)' : 'none'
                              }}
                            >
                              <IconoChevron size={18} />
                            </span>
                          </button>

                          {expandida && (
                            <ul className="aparecer flex flex-col">
                              {ejercicios.length === 0 ? (
                                <li className="px-4 pb-4 text-sm" style={{ color: 'var(--color-texto-3)' }}>
                                  Esta sesión todavía no tiene ejercicios cargados.
                                </li>
                              ) : ejercicios.map((ej, i) => (
                                <li
                                  key={ej.id || i}
                                  className="flex items-center justify-between gap-3 px-4 py-2.5"
                                  style={{
                                    borderTop: '1px solid var(--color-linea-sutil)',
                                    backgroundColor: 'var(--color-fondo)'
                                  }}
                                >
                                  <span className="flex min-w-0 items-center gap-2.5">
                                    <span
                                      className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-bold"
                                      style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto-3)' }}
                                    >
                                      {i + 1}
                                    </span>
                                    <span className="truncate text-sm font-medium">{ej.nombre}</span>
                                  </span>
                                  <span className="flex shrink-0 gap-3 text-xs">
                                    <span style={{ color: 'var(--color-texto-3)' }}>
                                      <b style={{ color: 'var(--color-acento)' }}>{ej.series}</b> series
                                    </span>
                                    <span style={{ color: 'var(--color-texto-3)' }}>
                                      <b style={{ color: 'var(--color-acento)' }}>{ej.repeticiones}</b> reps
                                    </span>
                                  </span>
                                </li>
                              ))}
                            </ul>
                          )}
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p className="px-4 py-4 text-sm" style={{ color: 'var(--color-texto-3)' }}>
                    Esta rutina todavía no tiene sesiones cargadas.
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
        <section className="mt-8">
          <h2 className="text-lg font-bold tracking-tight">Mi progreso</h2>
          <p className="mb-3 mt-0.5 text-sm" style={{ color: 'var(--color-texto-2)' }}>
            Peso, medidas y marcas personales. Tu profe también lo ve.
          </p>
          <Progreso
            registros={progreso} alGuardar={guardarProgreso} alBorrar={quitarProgreso}
            vacio="Todavía no registraste nada. Anotá tu peso o una marca para ver cómo avanzás."
          />
        </section>
      </main>

      <NavBar />
    </div>
  )
}
