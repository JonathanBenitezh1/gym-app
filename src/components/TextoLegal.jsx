import { Link } from 'react-router-dom'
import { GIMNASIO } from '../config/gimnasio'

/**
 * Muestra los términos o la política (src/legal/*.md) con el estilo de la app.
 *
 * Es un lector de markdown chico, a propósito: entiende solo lo que usan esos
 * dos textos (títulos, párrafos, listas, tablas, citas, negrita, cursiva y
 * links). Arma elementos de React, nunca HTML crudo. Así el texto que revisa
 * el abogado es el mismo archivo que se publica, sin sumar una librería.
 *
 * Los [CORCHETES] se completan con GIMNASIO.legal.
 */

function completar(texto) {
  return texto.replace(/\[([^\]]+)\](?!\()/g, (todo, clave) => GIMNASIO.legal?.[clave] || todo)
}

/** Negrita, cursiva y links dentro de una línea. */
function enLinea(texto, clave = 'l') {
  const partes = []
  const patron = /\*\*(.+?)\*\*|\*(.+?)\*|\[([^\]]+)\]\(([^)]+)\)/g
  let ultimo = 0
  let m
  while ((m = patron.exec(texto))) {
    if (m.index > ultimo) partes.push(texto.slice(ultimo, m.index))
    const k = `${clave}-${m.index}`
    if (m[1] !== undefined) partes.push(<strong key={k}>{enLinea(m[1], k)}</strong>)
    else if (m[2] !== undefined) partes.push(<em key={k}>{enLinea(m[2], k)}</em>)
    else if (m[4].startsWith('/')) partes.push(<Link key={k} to={m[4]} className="underline underline-offset-2" style={{ color: 'var(--color-acento)' }}>{m[3]}</Link>)
    else partes.push(<a key={k} href={m[4]} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2" style={{ color: 'var(--color-acento)' }}>{m[3]}</a>)
    ultimo = patron.lastIndex
  }
  if (ultimo < texto.length) partes.push(texto.slice(ultimo))
  return partes
}

const celdas = (linea) => linea.trim().replace(/^\||\|$/g, '').split('|').map(c => c.trim())

/** Agrupa las líneas en bloques: título, párrafo, lista, tabla, cita, separador. */
function bloques(md) {
  const lineas = completar(md.replace(/<!--[\s\S]*?-->/g, '')).split(/\r?\n/)
  const salida = []
  let i = 0
  while (i < lineas.length) {
    const linea = lineas[i]
    if (!linea.trim()) { i++; continue }
    const titulo = linea.match(/^(#{1,3})\s+(.*)/)
    if (titulo) { salida.push({ tipo: 'titulo', nivel: titulo[1].length, texto: titulo[2] }); i++; continue }
    if (/^---+\s*$/.test(linea)) { salida.push({ tipo: 'separador' }); i++; continue }
    const juntar = (prueba) => {
      const grupo = []
      while (i < lineas.length && prueba(lineas[i])) grupo.push(lineas[i++])
      return grupo
    }
    if (linea.startsWith('|')) {
      const filas = juntar(l => l.startsWith('|')).filter(l => !/^\|[\s:|-]+\|?\s*$/.test(l)).map(celdas)
      salida.push({ tipo: 'tabla', encabezado: filas[0], filas: filas.slice(1) })
      continue
    }
    if (/^- /.test(linea)) {
      salida.push({ tipo: 'lista', items: juntar(l => /^- /.test(l)).map(l => l.slice(2)) })
      continue
    }
    if (linea.startsWith('>')) {
      salida.push({ tipo: 'cita', texto: juntar(l => l.startsWith('>')).map(l => l.replace(/^>\s?/, '')).join(' ') })
      continue
    }
    // La primera va siempre: si no, una línea rara ("-x", "#x") no avanzaba nunca.
    i++
    salida.push({ tipo: 'parrafo', lineas: [linea, ...juntar(l => l.trim() && !/^(#|- |\||>|---)/.test(l))] })
  }
  return salida
}

export default function TextoLegal({ md }) {
  return (
    <div className="flex flex-col gap-3 text-sm leading-relaxed" style={{ color: 'var(--color-texto-2)' }}>
      {bloques(md).map((b, n) => {
        const k = `b${n}`
        switch (b.tipo) {
          case 'titulo':
            return b.nivel === 1
              ? <h1 key={k} className="text-xl font-bold tracking-tight" style={{ color: 'var(--color-texto)' }}>{enLinea(b.texto, k)}</h1>
              : <h2 key={k} className="mt-3 text-base font-semibold" style={{ color: 'var(--color-texto)' }}>{enLinea(b.texto, k)}</h2>
          case 'separador':
            return <hr key={k} style={{ borderColor: 'var(--color-linea-sutil)' }} />
          case 'lista':
            return (
              <ul key={k} className="flex list-disc flex-col gap-1.5 pl-5">
                {b.items.map((it, j) => <li key={j}>{enLinea(it, `${k}-${j}`)}</li>)}
              </ul>
            )
          case 'cita':
            return (
              <blockquote key={k} className="rounded-xl px-4 py-3 text-xs"
                          style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto)' }}>
                {enLinea(b.texto, k)}
              </blockquote>
            )
          case 'tabla':
            return (
              <div key={k} className="overflow-x-auto rounded-xl" style={{ border: '1px solid var(--color-linea-sutil)' }}>
                <table className="w-full text-left text-xs">
                  <thead style={{ backgroundColor: 'var(--color-elevado)', color: 'var(--color-texto)' }}>
                    <tr>{b.encabezado.map((c, j) => <th key={j} className="px-3 py-2 font-semibold">{enLinea(c, `${k}-h${j}`)}</th>)}</tr>
                  </thead>
                  <tbody>
                    {b.filas.map((f, j) => (
                      <tr key={j} style={{ borderTop: '1px solid var(--color-linea-sutil)' }}>
                        {f.map((c, x) => <td key={x} className="px-3 py-2 align-top">{enLinea(c, `${k}-${j}-${x}`)}</td>)}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )
          default:
            return (
              <p key={k}>
                {b.lineas.map((l, j) => <span key={j}>{j > 0 && <br />}{enLinea(l, `${k}-${j}`)}</span>)}
              </p>
            )
        }
      })}
    </div>
  )
}
