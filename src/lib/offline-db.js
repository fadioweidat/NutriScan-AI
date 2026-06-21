const DB_NAME = 'nutriscan_offline_db';
const STORE_NAME = 'pending_sync_queue';
const DB_VERSION = 1;

let dbInstance = null;

export function initDb() {
  if (dbInstance) return Promise.resolve(dbInstance);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'id', autoIncrement: true });
      }
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onerror = (event) => {
      console.error("IndexedDB initialization error:", event.target.error);
      reject(event.target.error);
    };
  });
}

// Simple XOR-based encryption/decryption with UTF-8 support
const SECRET_KEY = 'NutriScanAI_Offline_Secure_Key_2026';

function encrypt(text) {
  if (!text) return '';
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(unescape(encodeURIComponent(result)));
}

function decrypt(base64) {
  if (!base64) return '';
  try {
    const text = decodeURIComponent(escape(atob(base64)));
    let result = '';
    for (let i = 0; i < text.length; i++) {
      const charCode = text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch (e) {
    console.error("[Offline DB] Decryption failed:", e);
    return null;
  }
}

// Minimizes payload by removing unnecessary metadata or blank values
function minimizePayload(payload) {
  if (!payload || typeof payload !== 'object') return payload;
  const minimized = {};
  for (const [key, value] of Object.entries(payload)) {
    if (value !== null && value !== undefined && value !== '' && key !== 'created_at' && key !== 'updated_at') {
      if (typeof value === 'object' && !Array.isArray(value)) {
        minimized[key] = minimizePayload(value);
      } else {
        minimized[key] = value;
      }
    }
  }
  return minimized;
}

export async function enqueueAction(type, table, payload) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    // Minimize and encrypt payload to prevent plaintext exposure of medical/dietary logs in IndexedDB
    const minimized = minimizePayload(payload);
    const encryptedPayload = encrypt(JSON.stringify(minimized));

    const action = {
      type,
      table,
      payload: encryptedPayload,
      timestamp: Date.now()
    };

    const request = store.add(action);

    request.onsuccess = () => {
      resolve(request.result); // returns the auto-incremented key
    };

    request.onerror = (event) => {
      console.error("IndexedDB enqueue error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function getQueue() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onsuccess = () => {
      const result = request.result || [];
      // Decrypt payloads back to original objects
      const decryptedResult = result.map(action => {
        if (action.payload && typeof action.payload === 'string') {
          try {
            return {
              ...action,
              payload: JSON.parse(decrypt(action.payload))
            };
          } catch (e) {
            console.error("Error decrypting payload in getQueue:", e);
          }
        }
        return action;
      });
      resolve(decryptedResult);
    };

    request.onerror = (event) => {
      console.error("IndexedDB getQueue error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function dequeueAction(id) {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.delete(id);

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error("IndexedDB dequeue error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export async function clearQueue() {
  const db = await initDb();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();

    request.onsuccess = () => {
      resolve(true);
    };

    request.onerror = (event) => {
      console.error("IndexedDB clearQueue error:", event.target.error);
      reject(event.target.error);
    };
  });
}

export default {
  initDb,
  enqueueAction,
  getQueue,
  dequeueAction,
  clearQueue
};
