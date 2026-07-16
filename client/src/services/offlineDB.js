import { openDB } from 'idb';

const DB_NAME = 'ruam-offline';
const DB_VERSION = 1;

async function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('pendingActions')) {
        db.createObjectStore('pendingActions', { keyPath: 'id', autoIncrement: true });
      }
      if (!db.objectStoreNames.contains('cachedData')) {
        db.createObjectStore('cachedData', { keyPath: 'key' });
      }
    },
  });
}

export async function savePendingAction(action) {
  const db = await getDB();
  await db.add('pendingActions', { ...action, timestamp: Date.now() });
}

export async function getPendingActions() {
  const db = await getDB();
  return db.getAll('pendingActions');
}

export async function clearPendingActions() {
  const db = await getDB();
  await db.clear('pendingActions');
}

export async function cacheData(key, data) {
  const db = await getDB();
  await db.put('cachedData', { key, data, timestamp: Date.now() });
}

export async function getCachedData(key) {
  const db = await getDB();
  const record = await db.get('cachedData', key);
  return record?.data || null;
}

export async function hasNonConformingLots() {
  const actions = await getPendingActions();
  return actions.some(a =>
    a.endpoint?.includes('/quality/packaging') && a.body && !a.body.sealed_ok
  );
}
