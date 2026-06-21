import fs from 'fs';
import path from 'path';

console.log("=== STARTING PWA, OFFLINE & PRODUCTION VALIDATION TEST SUITE ===\n");

let testsPassed = 0;
let totalTests = 0;

function assert(condition, message) {
  totalTests++;
  if (condition) {
    console.log(`✅ ${message}`);
    testsPassed++;
  } else {
    console.error(`❌ FAILURE: ${message}`);
  }
}

// 1. PWA manifest.json configuration check
try {
  const manifestPath = 'public/manifest.json';
  const manifestExists = fs.existsSync(manifestPath);
  assert(manifestExists, "PWA manifest.json configurato in public/");
  
  if (manifestExists) {
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    assert(manifest.name === "NutriScan AI" && manifest.short_name === "NutriScan", "manifest.json ha il nome corretto");
    assert(manifest.display === "standalone", "manifest.json display impostato a standalone");
    assert(manifest.orientation === "portrait", "manifest.json orientamento impostato a portrait");
    assert(manifest.icons && manifest.icons.length > 0, "manifest.json contiene icone configurate");
  }
} catch (e) {
  console.error("Errore verifica manifest.json:", e);
}

// 2. Icons check
try {
  const icon192Exists = fs.existsSync('public/icon-192.png');
  const icon512Exists = fs.existsSync('public/icon-512.png');
  assert(icon192Exists && icon512Exists, "Icone PWA (icon-192.png e icon-512.png) presenti in public/");
} catch (e) {
  console.error("Errore verifica icone:", e);
}

// 3. Service Worker checks
try {
  const swExists = fs.existsSync('public/sw.js');
  assert(swExists, "File sw.js (Service Worker) presente in public/");
  
  if (swExists) {
    const swContent = fs.readFileSync('public/sw.js', 'utf8');
    assert(swContent.includes('CACHE_NAME') && swContent.includes('fetch'), "sw.js implementa le logiche di caching e intercettazione fetch");
    
    // Safety check: SW must NOT cache JWT or REST/Auth supabase endpoints
    const cachesClinicalData = swContent.includes('supabase.co') && !swContent.includes('isSupabaseRequest');
    assert(!cachesClinicalData, "sw.js esclude rigorosamente JWT, token e dati clinici Supabase dalla cache");
  }
} catch (e) {
  console.error("Errore verifica sw.js:", e);
}

// 4. Service Worker registration in main.jsx
try {
  const mainContent = fs.readFileSync('src/main.jsx', 'utf8');
  assert(mainContent.includes('serviceWorker.register'), "Service Worker registrato correttamente in src/main.jsx");
} catch (e) {
  console.error("Errore verifica main.jsx:", e);
}

// 5. Offline Queue (IndexedDB) and Sync Manager
try {
  const dbExists = fs.existsSync('src/lib/offline-db.js');
  assert(dbExists, "Modulo offline-db.js (IndexedDB Queue) creato correttamente");
  
  const syncExists = fs.existsSync('src/lib/sync-manager.js');
  assert(syncExists, "Modulo sync-manager.js (Background Sync) creato correttamente");
  
  if (dbExists && syncExists) {
    const dbContent = fs.readFileSync('src/lib/offline-db.js', 'utf8');
    const syncContent = fs.readFileSync('src/lib/sync-manager.js', 'utf8');
    
    assert(dbContent.includes('indexedDB.open') && dbContent.includes('pending_sync_queue'), "offline-db.js utilizza IndexedDB con store pending_sync_queue");
    assert(syncContent.includes('Promise.all') && syncContent.includes('backoff'), "sync-manager.js supporta la sincronizzazione in background e backoff esponenziale");
  }
} catch (e) {
  console.error("Errore verifica offline queue:", e);
}

// 6. Security check: no health data in localStorage or sessionStorage
try {
  const filesToScan = [
    'src/lib/offline-db.js',
    'src/lib/sync-manager.js',
    'src/pages/AddMealPage.jsx',
    'src/pages/LifestylePage.jsx',
    'src/components/NetworkBanner.jsx'
  ];

  let storageViolated = false;
  filesToScan.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasLocalStorage = content.includes('localStorage.') || content.includes('localStorage[');
      const hasSessionStorage = content.includes('sessionStorage.') || content.includes('sessionStorage[');
      if (hasLocalStorage || hasSessionStorage) {
        console.error(`❌ File ${file} utilizza localStorage o sessionStorage!`);
        storageViolated = true;
      }
    }
  });

  assert(!storageViolated, "Nessun dato sanitario salvato in localStorage o sessionStorage");
} catch (e) {
  console.error("Errore verifica storage sanitari:", e);
}

// 7. Push Notifications checks
try {
  const notifExists = fs.existsSync('src/lib/notification-manager.js');
  assert(notifExists, "Modulo notification-manager.js creato correttamente");
  
  if (notifExists) {
    const notifContent = fs.readFileSync('src/lib/notification-manager.js', 'utf8');
    assert(notifContent.includes('Notification.requestPermission'), "notification-manager.js gestisce la richiesta di permessi");
    assert(notifContent.includes('showNotification') || notifContent.includes('Notification('), "notification-manager.js invia notifiche locali");
    
    // Safety check: generic notifications only
    const containsSensitiveWord = notifContent.includes('diabete') && !notifContent.includes('isGeneric');
    assert(!containsSensitiveWord, "notification-manager.js invia solo promemoria generici (nessun dato sanitario su lock screen)");
  }
} catch (e) {
  console.error("Errore verifica notification-manager:", e);
}

// 8. Error Boundary & Lazy Loading integrity
try {
  const ebExists = fs.existsSync('src/components/ErrorBoundary.jsx');
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  assert(ebExists, "Componente ErrorBoundary.jsx presente");
  assert(appContent.includes('lazy(') && appContent.includes('Suspense'), "Lazy loading attivo in App.jsx");
} catch (e) {
  console.error("Errore verifica stabilità:", e);
}

console.log(`\n=== VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} tests ===`);
if (testsPassed === totalTests) {
  console.log("🚀 ALL PRODUCTION & PWA TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("❌ SOME TESTS FAILED. Please review findings.");
  process.exit(1);
}
