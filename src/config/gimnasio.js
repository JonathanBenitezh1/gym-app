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
  // Desde el 25/09/2026. Antes: DTC Fight & Fitness. "De" en mayúscula, como
  // lo escribe el gimnasio.
  nombre:      'Destribats Centro De Entrenamiento',
  nombreCorto: 'DCE',
  // El nombre al lado del logo en la barra del socio, en dos renglones.
  marca: ['Destribats', 'Centro De Entrenamiento'],
  descripcion: 'Reservá tus clases y gestioná tu entrenamiento',

  // Colores de la app instalada: la barra del sistema y la pantalla de arranque.
  colorTema:  '#2c4a5a',
  colorFondo: '#202123',

  // WhatsApp del gimnasio, con característica: "3511234567". Vacío esconde el
  // botón de contacto. `VITE_WHATSAPP` en el entorno lo reemplaza sin tocar
  // este archivo.
  whatsapp: '',

  // Lo que va entre corchetes en los términos y la política (src/legal/*.md).
  // Vacío deja el corchete a la vista: hay que completarlo todo antes de
  // prender LEGAL_VERSION en el servidor.
  legal: {
    'RAZÓN SOCIAL O NOMBRE DEL TITULAR': '',
    'CUIT': '',
    'DOMICILIO DEL GIMNASIO': '',
    'DOMICILIO': '',
    'EMAIL DE CONTACTO': '',
    'NOMBRE DEL DESARROLLADOR': '',
    'NÚMERO DE INSCRIPCIÓN': '',
    'FECHA DE LANZAMIENTO': ''
  }
}
