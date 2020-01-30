importScripts('https://cdn.jsdelivr.net/npm/workbox-cdn@4.3.1/workbox/workbox-sw.js')

// --------------------------------------------------
// Configure
// --------------------------------------------------

// Set workbox config
workbox.setConfig({
  "debug": false
})

// Start controlling any existing clients as soon as it activates
workbox.core.clientsClaim()

// Skip over the SW waiting lifecycle stage
workbox.core.skipWaiting()

workbox.precaching.cleanupOutdatedCaches()

// --------------------------------------------------
// Precaches
// --------------------------------------------------

// Precache assets

workbox.precaching.precacheAndRoute([
  "/"
], {
  "cacheId": "coh2-tactical-map-icons-renderer-prod",
  "directoryIndex": "/"
})

// --------------------------------------------------
// Runtime Caching
// --------------------------------------------------

// Register route handlers for runtimeCaching
workbox.routing.registerRoute(new RegExp('/.*'), new workbox.strategies.NetworkFirst ({"cacheableResponse":{"statuses":[0,200]}}), 'GET')
workbox.routing.registerRoute(new RegExp('/coh2-tactical-map-icons-renderer/_nuxt/'), new workbox.strategies.CacheFirst ({}), 'GET')
