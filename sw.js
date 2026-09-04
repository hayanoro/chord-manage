// キャッシュの名前。中身を更新したらここの数字を必ず上げること。
const CACHE = 'chordnote-v1.0.1';

// 最初にまとめて保存しておくファイル
const ASSETS = [
  './',
  './index.html',
  './manifest.json',
  './icon.png'
];

// インストール時：ASSETSを一括で保存する
self.addEventListener('install', e => {
  e.waitUntil(
    caches.open(CACHE)
      .then(c => c.addAll(ASSETS))
      .then(() => self.skipWaiting())
  );
});

// 有効化時：古い名前のキャッシュを全部捨てる
self.addEventListener('activate', e => {
  e.waitUntil(
    caches.keys()
      .then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

// 通信の横取り
self.addEventListener('fetch', e => {
  const req = e.request;

  // GET以外（データ送信など）は触らない
  if (req.method !== 'GET') return;
  // GASへの通信は必ずネットに行かせる（古いデータを返さないため）
  if (req.url.includes('script.google.com')) return;

  e.respondWith(
    caches.match(req).then(hit => {
      // 手元にあれば即返す。同時に裏で最新版を取りに行って更新しておく
      const fresh = fetch(req).then(res => {
        if (res && res.status === 200) {
          const copy = res.clone();
          caches.open(CACHE).then(c => c.put(req, copy));
        }
        return res;
      }).catch(() => null);

      return hit || fresh.then(r => r || caches.match('./index.html'));
    })
  );
});
