/**
 * Exportar a Excel (plan de mejoras 1.5). Se arma un CSV como lo abre el
 * Excel en castellano: punto y coma entre columnas, coma decimal, y la marca
 * UTF-8 al principio para que respete los acentos.
 */

const celda = (valor) => {
  if (valor === null || valor === undefined) return ''
  const texto = typeof valor === 'number'
    ? String(valor).replace('.', ',')
    : String(valor)
  // Comillas si trae separadores, comillas o saltos de línea.
  return /[;"\n\r]/.test(texto) ? `"${texto.replace(/"/g, '""')}"` : texto
}

/** columnas: [{ titulo, valor: (fila) => … }] */
export function aCsv(filas, columnas) {
  const lineas = [
    columnas.map(c => celda(c.titulo)).join(';'),
    ...filas.map(f => columnas.map(c => celda(c.valor(f))).join(';'))
  ]
  return '﻿' + lineas.join('\r\n') + '\r\n'
}

export function descargar(nombre, texto) {
  const url = URL.createObjectURL(new Blob([texto], { type: 'text/csv;charset=utf-8' }))
  const a = document.createElement('a')
  a.href = url
  a.download = nombre
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
