import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { GIMNASIO } from './src/config/gimnasio.js'

/**
 * Completa el index.html con los datos de config/gimnasio.js, el mismo archivo
 * que usan las pantallas. Se usan llaves dobles y no %NOMBRE% porque Vite ya
 * reserva esa sintaxis para las variables de entorno.
 */
function datosDelGimnasioEnElHtml() {
  const escapar = (texto) =>
    String(texto).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;')

  return {
    name: 'datos-del-gimnasio',
    transformIndexHtml: {
      order: 'pre',
      handler: (html) => html
        .replaceAll('{{GYM_NOMBRE}}', escapar(GIMNASIO.nombre))
        .replaceAll('{{GYM_NOMBRE_CORTO}}', escapar(GIMNASIO.nombreCorto))
        .replaceAll('{{GYM_COLOR_TEMA}}', escapar(GIMNASIO.colorTema))
    }
  }
}

export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    datosDelGimnasioEnElHtml(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.svg', 'icons/*.png'],
      manifest: {
        name: GIMNASIO.nombre,
        short_name: GIMNASIO.nombreCorto,
        description: GIMNASIO.descripcion,
        theme_color: GIMNASIO.colorTema,
        background_color: GIMNASIO.colorFondo,
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: 'icons/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'icons/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Sin caché de la API, a propósito. Antes cada GET a /api se guardaba
        // con la dirección como única clave, sin importar quién estaba
        // logueado, y se servía si la red tardaba más de 10 segundos. En un
        // teléfono compartido un socio podía ver el perfil y las reservas del
        // anterior, y con el servidor despertando se veían cupos viejos. La
        // app instalable guarda solo sus propios archivos.
        cleanupOutdatedCaches: true
      }
    })
  ],
})