import manager, { encryptToken, decryptToken } from './src/lib/connectors/health-provider-manager.js';
import { calculateRecoveryMetrics, compileRecoveryTrend } from './src/lib/engines/recovery-engine.js';
import { analyzeActivity } from './src/lib/engines/activity-intelligence-engine.js';
import { analyzeHeartMetrics } from './src/lib/engines/heart-intelligence-engine.js';
import { analyzeWeightMetrics, compileWeightTrend } from './src/lib/engines/weight-intelligence-engine.js';

console.log("=== STARTING HEALTH ECOSYSTEM & WEARABLES VALIDATION ===\n");

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

// Mock Supabase Client
const mockSupabase = {
  auth: {
    userObj: {
      id: 'test-user-id',
      user_metadata: {}
    },
    async getUser() {
      return { data: { user: this.userObj }, error: null };
    },
    async updateUser(payload) {
      if (payload?.data) {
        this.userObj.user_metadata = {
          ...this.userObj.user_metadata,
          ...payload.data
        };
      }
      return { error: null };
    }
  }
};

// 1. Validate Token Encryption & Decryption
try {
  const secretToken = "access_token_12345";
  const encrypted = encryptToken(secretToken);
  const decrypted = decryptToken(encrypted);
  
  assert(encrypted !== secretToken, "Token was successfully obfuscated/encrypted");
  assert(decrypted === secretToken, "Token was successfully decrypted back to original");
} catch (e) {
  assert(false, `Token encryption test crashed: ${e.message}`);
}

// 2. Validate Health Connect Layer & Provider Manager Connection Flow
try {
  // Test connection without consent (should fail)
  let consentError = false;
  try {
    await manager.connectProvider(mockSupabase, 'fitbit', 'code123', false);
  } catch (e) {
    consentError = true;
    assert(e.message.includes("Consenso"), "Refused connection without explicit consent");
  }
  if (!consentError) {
    assert(false, "Allowed connection without explicit user consent");
  }

  // Test successful connection with consent
  const connectResult = await manager.connectProvider(mockSupabase, 'fitbit', 'code123', true);
  assert(connectResult.success === true, "Successfully connected Fitbit provider with user consent");

  const connectedList = await manager.getConnectedProviders(mockSupabase);
  assert(connectedList.includes('fitbit'), "Fitbit is listed in connected providers list");

  const isConnected = await manager.isConnected(mockSupabase, 'fitbit');
  assert(isConnected === true, "isConnected reports provider status as true");
} catch (e) {
  assert(false, `Provider manager connection flow failed: ${e.message}`);
}

// 3. Validate Data Synchronization & Deduplication
try {
  // Sync metrics for connected Fitbit provider
  const syncedData = await manager.syncMetrics(mockSupabase, 'fitbit', 5);
  assert(syncedData.length === 5, "Successfully synchronized 5 days of Fitbit metrics");

  // Verify format of synchronized metrics
  const firstDay = syncedData[0];
  assert(firstDay.date !== undefined, "Synced day contains a date");
  assert(firstDay.steps !== undefined, "Synced day contains steps count");
  assert(firstDay.sleepHours !== undefined, "Synced day contains sleep duration hours");
  assert(firstDay.hrv !== undefined, "Synced day contains HRV ms");
  assert(firstDay.restingHeartRate !== undefined, "Synced day contains resting heart rate");
  assert(firstDay.activeCalories !== undefined, "Synced day contains active calories burned");
  assert(firstDay.weightKg !== undefined, "Synced day contains weight");

  // Test deduplication logic directly
  const duplicateMetricsList = [
    { date: '2026-06-20', steps: 10000, sleepDurationHours: 7.5 },
    { date: '2026-06-20', steps: 8000, sleepDurationHours: 7.2 }, // duplicate date
    { date: '2026-06-19', steps: 12000, sleepDurationHours: 6.8 }
  ];
  const deduplicated = manager.deduplicateAndMapMetrics(duplicateMetricsList);
  assert(deduplicated.length === 2, "Deduplication manager correctly filtered out duplicate date entry");
  assert(deduplicated[1].steps === 10000, "Deduplication priority matched the first occurring date entry");
} catch (e) {
  assert(false, `Data sync/deduplication test failed: ${e.message}`);
}

// 4. Validate Recovery Engine Math & Trends
try {
  const recoveryMetrics = calculateRecoveryMetrics({
    sleepHours: 6.0,     // 2 hours sleep debt (8.0 base)
    sleepQuality: 65,
    hrv: 45,
    activeMinutes: 100,  // overtraining (>90m)
    stressLevel: 8       // high stress
  });

  assert(recoveryMetrics.sleepDebt === 2.0, "Recovery engine calculated correct sleep debt (2.0 hours)");
  assert(recoveryMetrics.fatigueScore > 60, "Recovery engine computed elevated fatigue score (>60) for high stress & low sleep");
  assert(recoveryMetrics.recoveryScore < 50, "Recovery score is appropriately depressed (<50) due to stress, sleep debt and overtraining");
  assert(recoveryMetrics.disclaimer !== undefined, "Recovery metrics output contains safety disclaimer");

  // Recovery trends
  const historyList = [
    { recoveryScore: 50 },
    { recoveryScore: 55 },
    { recoveryScore: 78 },
    { recoveryScore: 82 }
  ];
  const trend = compileRecoveryTrend(historyList);
  assert(trend === 'improving', "Recovery trend compiled correctly as 'improving'");
} catch (e) {
  assert(false, `Recovery engine tests failed: ${e.message}`);
}

// 5. Validate Activity Intelligence Engine
try {
  const lowActivity = analyzeActivity({
    activeMinutes: 15,
    activeCalories: 100,
    sleepHours: 7.0,
    waterMl: 1500,
    sugarGrams: 50,
    healthScore: 70
  });
  
  assert(lowActivity.volumeStatus === 'low', "Volume status marked as low for <30 minutes");
  const sugarSedentaryWarn = lowActivity.insights.find(i => i.type === 'correlation_nutrition');
  assert(sugarSedentaryWarn !== undefined, "Sedentary + high sugar intake warning correctly triggered");

  const dehyActivity = analyzeActivity({
    activeMinutes: 50,
    activeCalories: 350,
    sleepHours: 7.0,
    waterMl: 1200, // low hydration
    sugarGrams: 10,
    healthScore: 80
  });
  const dehyWarn = dehyActivity.insights.find(i => i.type === 'correlation_hydration');
  assert(dehyWarn !== undefined, "Dehydration warning triggered for long active duration with low fluid intake");
} catch (e) {
  assert(false, `Activity intelligence engine tests failed: ${e.message}`);
}

// 6. Validate Heart Intelligence Engine
try {
  const bradycardiaAthletic = analyzeHeartMetrics({
    restingHeartRate: 46,
    averageHeartRate: 65,
    hrv: 85,
    stressLevel: 2
  });
  assert(bradycardiaAthletic.rhrStatus === 'low', "Low RHR status flagged correctly (<50)");
  assert(bradycardiaAthletic.hrvStatus === 'high', "High HRV status flagged correctly (>75)");

  const highStressSympathetic = analyzeHeartMetrics({
    restingHeartRate: 85,
    averageHeartRate: 98,
    hrv: 28,
    stressLevel: 9
  });
  assert(highStressSympathetic.rhrStatus === 'high', "High RHR status flagged correctly (>80)");
  assert(highStressSympathetic.hrvStatus === 'low', "Low HRV status flagged correctly (<35)");
  assert(highStressSympathetic.autonomicBalance === 'sympathetic_dominance', "Sympathetic nervous system dominance detected");
  assert(highStressSympathetic.disclaimer !== undefined, "Heart metrics output contains cardiac safety disclaimer");
} catch (e) {
  assert(false, `Heart intelligence engine tests failed: ${e.message}`);
}

// 7. Validate Weight Intelligence Engine
try {
  const surplusWeight = analyzeWeightMetrics({
    weightKg: 85.0,
    heightCm: 180,
    mealsCalories: 2600,
    activeCalories: 200,
    sleepHours: 7.0
  });

  assert(surplusWeight.bmi === 26.2, "BMI calculated correctly (26.2)");
  assert(surplusWeight.bmiClass === 'sovrappeso', "BMI classification matches overweight range ('sovrappeso')");
  assert(surplusWeight.netCalorieBalance > 0, "Caloric balance shows surplus positive balance");
  const weightTrend = compileWeightTrend([{ weightKg: 84.0 }, { weightKg: 85.0 }]);
  assert(weightTrend === 'increasing', "Weight trend compiled as 'increasing'");
} catch (e) {
  assert(false, `Weight intelligence engine tests failed: ${e.message}`);
}

// 8. Validate Local Storage Privacy Constraints
try {
  // In node environment, global.localStorage might not exist. If it does (e.g. mock), verify it's clean.
  if (typeof global.localStorage !== 'undefined') {
    assert(global.localStorage.getItem('user_metadata') === null, "No health/auth user metadata in localStorage");
  } else {
    console.log("ℹ️ Node environment has no global.localStorage, satisfying browser privacy constraints.");
  }
} catch (e) {
  assert(false, `Privacy verification failed: ${e.message}`);
}

// Final Summary
console.log(`\n=== VALIDATION SUMMARY ===`);
console.log(`Passed: ${testsPassed} / ${totalTests} tests`);

if (testsPassed === totalTests) {
  console.log("\n⭐️ ALL PHASE 8 TESTS PASSED SUCCESSFULLY! ⭐️\n");
  process.exit(0);
} else {
  console.error("\n❌ SOME TESTS FAILED. Please review output above.\n");
  process.exit(1);
}
