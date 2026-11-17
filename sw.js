/* Terminal Paradigm Brief: offline worker.
   Keeps a copy of the app so it opens with no internet. Change VERSION on every update. */
var VERSION = "tp-brief-2026-11-18-2";
var SHELL = ["./", "index.html", "data.js", "geo.js", "map.js", "logo.png", "manifest.webmanifest", "icon-192.png", "icon-512.png"];

self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(VERSION).then(function (c) { return c.addAll(SHELL); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var req = e.request; if (req.method !== "GET") return;
  var url = new URL(req.url), own = url.origin === self.location.origin;
  var font = url.hostname === "fonts.googleapis.com" || url.hostname === "fonts.gstatic.com";
  if (!own && !font) return;
  if (own && /\/live\.js$/.test(url.pathname)) {      /* the daily file: newest copy first, saved copy only when offline */
    e.respondWith(fetch(req, { cache: "no-cache" }).then(function (res) {
      if (res && res.ok) { var copy = res.clone(); caches.open(VERSION).then(function (c) { c.put(req, copy); }); return res; }
      return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || res; });
    }).catch(function () { return caches.match(req, { ignoreSearch: true }).then(function (hit) { return hit || Response.error(); }); }));
    return;
  }
  e.respondWith(caches.open(VERSION).then(function (cache) {
    return cache.match(req, { ignoreSearch: own }).then(function (hit) {
      var fresh = fetch(req).then(function (res) {
        if (res && (res.ok || res.type === "opaque")) cache.put(req, res.clone());
        return res;
      }).catch(function () { return hit || (own && req.mode === "navigate" ? cache.match("index.html") : Response.error()); });
      return hit || fresh;      /* saved copy first, refreshed in the background */
    });
  }));
});
