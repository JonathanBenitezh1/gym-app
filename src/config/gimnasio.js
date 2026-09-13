/**
 * Todo lo que cambia de un gimnasio a otro, en un solo lugar.
 *
 * Antes el nombre estaba escrito a mano en ocho pantallas, en el título de la
 * página y en el manifiesto de la app instalable. Para armar la app de otro
 * gimnasio había que buscar y reemplazar, y siempre se escapaba alguno.
 *
 * Lo importan las pantallas y también `vite.config.js`, que corre en Node. Por
 * eso acá no puede haber `import.meta.env`: solo valores fijos.
 */
export const GIMNASIO = {
  nombre:      'DTC Fight & Fitness',
  nombreCorto: 'DTC Gym',
  descripcion: 'Reservá tus clases y gestioná tu entrenamiento',

  // Colores de la app instalada: la barra del sistema y la pantalla de arranque.
  colorTema:  '#2c4a5a',
  colorFondo: '#202123',

  // WhatsApp del gimnasio, con característica: "3511234567". Vacío esconde el
  // botón de contacto. `VITE_WHATSAPP` en el entorno lo reemplaza sin tocar
  // este archivo.
  whatsapp: ''
}
