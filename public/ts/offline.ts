// PDKS Offline Queue — IndexedDB ile giriş/çıkış kuyruğu

const DB_NAME    = 'pdks-offline';
const DB_VERSION = 1;
const STORE      = 'attendance-queue'; // HomePage.ts ile aynı store

export interface OfflineItem {
  id:        string;
  type:      'in' | 'out';
  qrValue:   string;
  timestamp: string;   // ISO
  retries:   number;
}

let _db: IDBDatabase | null = null;

function openDB(): Promise<IDBDatabase> {
  if (_db) return Promise.resolve(_db);
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => { _db = req.result; resolve(req.result); };
    req.onerror   = () => reject(req.error);
  });
}

export async function enqueue(item: Omit<OfflineItem, 'retries'>): Promise<void> {
  const db    = await openDB();
  const entry: OfflineItem = { ...item, retries: 0 };
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put(entry);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function dequeue(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).delete(id);
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

export async function getAll(): Promise<OfflineItem[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).getAll();
    req.onsuccess = () => resolve(req.result as OfflineItem[]);
    req.onerror   = () => reject(req.error);
  });
}

export async function updateRetries(id: string, retries: number): Promise<void> {
  const db   = await openDB();
  const item = await new Promise<OfflineItem | undefined>((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readonly');
    const req = tx.objectStore(STORE).get(id);
    req.onsuccess = () => resolve(req.result as OfflineItem | undefined);
    req.onerror   = () => reject(req.error);
  });
  if (!item) return;
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(STORE, 'readwrite');
    const req = tx.objectStore(STORE).put({ ...item, retries });
    req.onsuccess = () => resolve();
    req.onerror   = () => reject(req.error);
  });
}

// Senkronizasyon — online gelince tüm kuyruğu gönder
export async function syncQueue(
  sendFn: (item: OfflineItem) => Promise<void>,
  onSuccess?: (item: OfflineItem) => void,
  onError?:   (item: OfflineItem, err: Error) => void,
): Promise<void> {
  const items = await getAll();
  for (const item of items) {
    try {
      await sendFn(item);
      await dequeue(item.id);
      onSuccess?.(item);
    } catch (err) {
      const retries = item.retries + 1;
      if (retries >= 3) {
        await dequeue(item.id);  // 3 denemeden sonra bırak
      } else {
        await updateRetries(item.id, retries);
      }
      onError?.(item, err instanceof Error ? err : new Error(String(err)));
    }
  }
}

// Offline/Online durumu izle + banner
export function initOfflineBanner(): void {
  const banner = document.getElementById('offline-banner');
  if (!banner) return;

  const update = () => {
    banner.style.display = navigator.onLine ? 'none' : 'block';
    if (navigator.onLine) {
      // Bağlantı gelince Background Sync dene
      if ('serviceWorker' in navigator && 'SyncManager' in window) {
        navigator.serviceWorker.ready.then((reg) => {
          (reg as ServiceWorkerRegistration & { sync?: { register: (tag: string) => Promise<void> } })
            .sync?.register('pdks-offline-sync').catch(() => {});
        });
      }
    }
  };

  window.addEventListener('online',  update);
  window.addEventListener('offline', update);
  update();
}

// SW mesajı alınca sync
export function listenSWSync(
  sendFn: (item: OfflineItem) => Promise<void>,
  onSuccess?: (item: OfflineItem) => void,
  onError?:   (item: OfflineItem, err: Error) => void,
): void {
  if (!('serviceWorker' in navigator)) return;
  navigator.serviceWorker.addEventListener('message', (event) => {
    if (event.data?.type === 'SYNC_OFFLINE_QUEUE') {
      syncQueue(sendFn, onSuccess, onError).catch(() => {});
    }
  });
}
