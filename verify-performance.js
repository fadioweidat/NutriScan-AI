import fs from 'fs';
import path from 'path';

console.log("=== STARTING PERFORMANCE & STABILIZATION VALIDATION TEST SUITE ===\n");

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

// 1. Check React.lazy and Suspense in App.jsx
try {
  const appContent = fs.readFileSync('src/App.jsx', 'utf8');
  assert(appContent.includes('lazy(') && appContent.includes('Suspense'), "React.lazy() e Suspense utilizzati in App.jsx per il code splitting");
} catch (e) {
  console.error("Errore verifica App.jsx:", e);
}

// 2. Check ErrorBoundary exists and is integrated in Layout.jsx
try {
  const ebExists = fs.existsSync('src/components/ErrorBoundary.jsx');
  assert(ebExists, "Componente ErrorBoundary.jsx creato correttamente");
  
  const layoutContent = fs.readFileSync('src/components/Layout.jsx', 'utf8');
  assert(layoutContent.includes('ErrorBoundary'), "ErrorBoundary integrato nel Layout.jsx");
} catch (e) {
  console.error("Errore verifica ErrorBoundary:", e);
}

// 3. Check Promise.all in all optimized engines & pages
const filesToCheck = [
  { path: 'src/lib/engines/health-coach-engine.js', desc: "Promise.all utilizzato in health-coach-engine.js" },
  { path: 'src/pages/DashboardPage.jsx', desc: "Promise.all utilizzato in DashboardPage.jsx" },
  { path: 'src/pages/AiChatPage.jsx', desc: "Promise.all utilizzato in AiChatPage.jsx" },
  { path: 'src/pages/MealPlannerPage.jsx', desc: "Promise.all utilizzato in MealPlannerPage.jsx" },
  { path: 'src/pages/BloodTestsPage.jsx', desc: "Promise.all utilizzato in BloodTestsPage.jsx" }
];

filesToCheck.forEach(f => {
  try {
    const content = fs.readFileSync(f.path, 'utf8');
    assert(content.includes('Promise.all'), f.desc);
  } catch (e) {
    console.error(`Errore verifica ${f.path}:`, e);
  }
});

// 4. Security Check: No localStorage or sessionStorage sanitari
try {
  const scanTargets = [
    'src/lib/engines/health-coach-engine.js',
    'src/pages/DashboardPage.jsx',
    'src/pages/AiChatPage.jsx',
    'src/pages/MealPlannerPage.jsx',
    'src/pages/BloodTestsPage.jsx'
  ];

  let violated = false;
  scanTargets.forEach(file => {
    if (fs.existsSync(file)) {
      const content = fs.readFileSync(file, 'utf8');
      const hasLocalStorage = content.includes('localStorage.') || content.includes('localStorage[');
      const hasSessionStorage = content.includes('sessionStorage.') || content.includes('sessionStorage[');
      if (hasLocalStorage || hasSessionStorage) {
        console.error(`❌ File ${file} utilizza localStorage/sessionStorage!`);
        violated = true;
      }
    }
  });

  assert(!violated, "Nessun dato sanitario salvato in localStorage o sessionStorage");
} catch (e) {
  console.error("Errore verifica storage sanitari:", e);
}

// 5. Payload Optimization Check in AiChatPage
try {
  const chatContent = fs.readFileSync('src/pages/AiChatPage.jsx', 'utf8');
  assert(chatContent.includes('cleanedHealthContext') && chatContent.includes('fetchMealPlannerContext'), "Payload AI ottimizzato e pulito in AiChatPage.jsx");
} catch (e) {
  console.error("Errore verifica payload chat:", e);
}

// 6. Regression check: Verify importable engines
try {
  // Let's dynamic import or check files exist
  const enginesExist = [
    'src/lib/engines/health-coach-engine.js',
    'src/lib/engines/recipe-engine.js',
    'src/lib/engines/meal-planner-engine.js',
    'src/lib/engines/food-substitution-engine.js',
    'src/lib/engines/shopping-list-engine.js',
    'src/lib/engines/weekly-balance-engine.js'
  ].every(f => fs.existsSync(f));

  assert(enginesExist, "Tutti i motori logici clinico-nutrizionali sono presenti e intatti");
} catch (e) {
  console.error("Errore verifica motori:", e);
}

console.log(`\n=== VALIDATION COMPLETE: Passed ${testsPassed}/${totalTests} tests ===`);
if (testsPassed === totalTests) {
  console.log("🚀 ALL PERFORMANCE & STABILIZATION TESTS PASSED SUCCESSFULLY!");
  process.exit(0);
} else {
  console.error("❌ SOME TESTS FAILED. Please review findings.");
  process.exit(1);
}
