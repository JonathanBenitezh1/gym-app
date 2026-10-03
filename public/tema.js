/*
 * Modo claro u oscuro, antes de que cargue la app (03/10/2026).
 *
 * Va como archivo y no dentro de index.html porque la CSP no permite scripts
 * en línea. Se carga en el <head> sin esperar: así la pantalla de arranque ya
 * sale del color elegido, sin un destello oscuro. La misma clave que
 * src/utils/tema.js.
 */
try {
  if (localStorage.getItem('tema') === 'claro') document.documentElement.dataset.tema = 'claro'
} catch { /* sin almacenamiento: queda el oscuro */ }
