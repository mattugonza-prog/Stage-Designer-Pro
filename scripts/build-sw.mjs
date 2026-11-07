import { readdir, readFile, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import path from 'node:path';
async function walk(dir) {
  const entries = await readdir(dir, { withFileTypes: true });
  const groups = await Promise.all(
    entries.map((e) => (e.isDirectory() ? walk(path.join(dir, e.name)) : [path.join(dir, e.name)])),
  );
  return groups.flat().filter((file) => !file.endsWith('sw.js'));
}
// An optional directory makes it possible to verify the same artifact beneath
// a project URL without replacing the development workspace's dist directory.
const outputDirectory = process.argv[2] || 'dist';
const files = (await walk(outputDirectory)).sort();
const hash = createHash('sha256');
for (const file of files) hash.update(file).update(await readFile(file));
const buildId = hash.digest('hex').slice(0, 16);
const urls = files.map((file) => path.relative(outputDirectory, file).replaceAll(path.sep, '/'));
await writeFile(
  path.join(outputDirectory, 'sw.js'),
  `// Generated from the complete production build, including lazy-loaded editors and exports.
const SCOPE = self.registration.scope;
const PREFIX = 'stagepro-' + SCOPE + '-';
const CACHE = PREFIX + ${JSON.stringify(buildId)};
const ASSETS = ${JSON.stringify(urls)}.map(asset => new URL(asset, SCOPE).href);
const INDEX = new URL('index.html', SCOPE).href;
self.addEventListener('install', event => event.waitUntil(caches.open(CACHE).then(cache => cache.addAll(ASSETS))));
self.addEventListener('activate', event => event.waitUntil(Promise.all([caches.keys().then(keys => Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)))), self.clients.claim()])));
self.addEventListener('fetch', event => {
  const url = new URL(event.request.url);
  if (event.request.method !== 'GET' || url.origin !== self.location.origin || !url.href.startsWith(SCOPE)) return;
  event.respondWith(caches.open(CACHE).then(async cache => {
    // Public, same-origin build assets are identical across Origin headers (Vite uses Vary: Origin).
    const cached = await cache.match(event.request, { ignoreVary: true });
    if (cached) return cached;
    try { return await fetch(event.request); }
    catch (error) { if (event.request.mode === 'navigate') return await cache.match(INDEX) || Response.error(); throw error; }
  }));
});
`,
);
console.log(`Offline cache: ${urls.length} local assets (stagepro-${buildId}, scoped at runtime).`);
