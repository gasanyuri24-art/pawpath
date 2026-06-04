// Pawpath — сервис-воркер для офлайн-работы.
// После первого открытия приложение работает без интернета.
// При обновлении файлов меняйте номер версии — старый кэш удалится.
const CACHE = "pawpath-v12";

const ASSETS = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./css/styles.css",
  "./js/data.js",
  "./js/breeds.js",
  "./js/audio.js",
  "./js/state.js",
  "./js/screens.js",
  "./js/tools.js",
  "./js/commands.js",
  "./js/health.js",
  "./js/reminders.js",
  "./js/app.js",
  "./assets/icon.svg",
  "./assets/apple-touch-icon.png",
  "./assets/icon-192.png",
  "./assets/icon-512.png",
];

self.addEventListener("install", (e) => {
  e.waitUntil(
    caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting())
  );
});

self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

// Network-first: всегда берём свежее из сети (онлайн), офлайн — из кэша.
// Так обновления приложения появляются сразу, без двойной перезагрузки.
self.addEventListener("fetch", (e) => {
  if (e.request.method !== "GET") return;
  const url = new URL(e.request.url);
  if (url.origin !== self.location.origin) return;   // чужие домены не трогаем
  e.respondWith(
    fetch(e.request)
      .then((res) => {
        const copy = res.clone();
        caches.open(CACHE).then((c) => c.put(e.request, copy)).catch(() => {});
        return res;
      })
      .catch(() => caches.match(e.request).then((hit) => hit || caches.match("./index.html")))
  );
});
