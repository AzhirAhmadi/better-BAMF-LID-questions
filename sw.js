const CACHE_NAME = 'bamf-quiz-v1';
const urlsToCache = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './bamf-questions.json',
    './bamf-questions-en.json'
];

self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => cache.addAll(urlsToCache))
    );
});

self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // Return cached version or fetch from network
                return response || fetch(event.request);
            })
    );
});