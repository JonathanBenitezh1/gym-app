/*
 * Avisos al celular (push), plan de mejoras 2.1.
 *
 * El service worker de la app instalable importa este archivo
 * (vite.config.js → workbox.importScripts). El servidor manda
 * { titulo, texto, url, etiqueta }; tocar el aviso abre la app en esa
 * pantalla, o la trae al frente si ya estaba abierta.
 *
 * La etiqueta agrupa: un "tu plan vence" nuevo reemplaza al anterior en vez
 * de apilarse.
 */

self.addEventListener('push', (evento) => {
  let aviso = {}
  try {
    aviso = evento.data?.json() ?? {}
  } catch {
    aviso = { texto: evento.data?.text() }
  }
  evento.waitUntil(self.registration.showNotification(aviso.titulo || 'Aviso', {
    body: aviso.texto || '',
    icon: '/icons/icon-192.png',
    tag: aviso.etiqueta || undefined,
    data: { url: aviso.url || '/' }
  }))
})

self.addEventListener('notificationclick', (evento) => {
  evento.notification.close()
  const destino = new URL(evento.notification.data?.url || '/', self.location.origin).href

  evento.waitUntil((async () => {
    const abiertas = await self.clients.matchAll({ type: 'window', includeUncontrolled: true })
    const app = abiertas.find(v => new URL(v.url).origin === self.location.origin)
    if (!app) return self.clients.openWindow(destino)
    await app.focus()
    if (app.url !== destino) await app.navigate(destino).catch(() => {})
  })())
})
