/**
 * Recovery Intelligence Engine (Phase 8)
 * Computes sleep debt, fatigue, recovery score, and trends.
 * Strictly educational and non-diagnostic.
 */

export function calculateRecoveryMetrics({
  sleepHours = 7.0,
  sleepQuality = 70, // 0-100
  hrv = 55, // ms
  activeMinutes = 30, // minutes
  stressLevel = 5 // 1-10
}) {
  // 1. Sleep Debt: relative to 8.0 hours baseline
  const sleepDebt = Math.max(0, 8.0 - sleepHours);

  // 2. Fatigue Score: composite 0-100 based on stress, training, and sleep debt
  const stressWeight = stressLevel * 6.5; // max 65
  const activityWeight = Math.min(activeMinutes / 10, 15); // max 15
  const sleepDebtWeight = sleepDebt * 10; // max 20
  const rawFatigue = stressWeight + activityWeight + sleepDebtWeight;
  const fatigueScore = Math.max(0, Math.min(100, Math.round(rawFatigue)));

  // 3. Recovery Score: 0-100 based on sleep quality, sleep duration, and HRV
  // Baseline averages: 8h sleep, 75+ quality, 60+ HRV
  const sleepDurationContrib = (sleepHours / 8.0) * 35; // max 35
  const sleepQualityContrib = (sleepQuality / 100.0) * 35; // max 35
  const hrvContrib = Math.min((hrv / 65) * 30, 30); // max 30
  
  // Penalties
  const stressPenalty = stressLevel * 2.5; // max 25
  const overtrainingPenalty = activeMinutes > 90 ? (activeMinutes - 90) * 0.15 : 0; // penalty for excess workouts

  const rawRecovery = sleepDurationContrib + sleepQualityContrib + hrvContrib - stressPenalty - overtrainingPenalty;
  const recoveryScore = Math.max(0, Math.min(100, Math.round(rawRecovery)));

  return {
    recoveryScore,
    fatigueScore,
    sleepDebt: Number(sleepDebt.toFixed(1)),
    hrv,
    disclaimer: "DISCLAIMER: I punteggi di recupero e fatica sono stime matematiche a scopo informativo e non costituiscono diagnosi o indicazioni terapeutiche."
  };
}

export function compileRecoveryTrend(historyList = []) {
  if (historyList.length < 2) return 'stable';

  const n = historyList.length;
  const latestAvg = historyList.slice(-3).reduce((sum, item) => sum + (item.recoveryScore || 70), 0) / Math.min(n, 3);
  const baselineAvg = historyList.slice(0, -3).reduce((sum, item) => sum + (item.recoveryScore || 70), 0) / Math.max(1, n - 3);

  const percentDiff = (latestAvg - baselineAvg) / (baselineAvg || 70);
  if (percentDiff > 0.05) return 'improving';
  if (percentDiff < -0.05) return 'declining';
  return 'stable';
}

export default {
  calculateRecoveryMetrics,
  compileRecoveryTrend
};
