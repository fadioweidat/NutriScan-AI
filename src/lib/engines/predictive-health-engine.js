/**
 * Predictive Health Engine (Phase 6)
 * Calculates health indicators over 7, 30, and 90 days.
 * Strictly educational and non-diagnostic.
 */

// Helper to analyze trends over a list of numeric values
// healthyDirection is 1 if higher is better, -1 if lower is better (e.g. stress)
function calculateTrendDirection(values, healthyDirection = 1) {
  if (!values || values.length < 2) return 'stable';
  
  const mid = Math.floor(values.length / 2);
  const firstHalf = values.slice(0, mid);
  const secondHalf = values.slice(mid);
  
  const avg1 = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
  const avg2 = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;
  
  const diff = avg2 - avg1;
  const threshold = Math.abs(avg1) * 0.05; // 5% threshold for stability

  if (Math.abs(diff) <= threshold) {
    return 'stable';
  }
  
  // If healthyDirection is 1: positive diff is improving, negative is declining
  // If healthyDirection is -1: negative diff is improving, positive is declining
  const isBetter = (diff * healthyDirection) > 0;
  return isBetter ? 'improving' : 'declining';
}

export function computePredictiveTrends({
  historyLogs = [] // array of { date, healthScore, sleepHours, sleepQuality, stressLevel, waterMl, activeMinutes, nutritionalIndex }
}) {
  const getSubArray = (days) => {
    const sorted = [...historyLogs].sort((a, b) => a.date.localeCompare(b.date));
    return sorted.slice(-days);
  };

  const periods = [7, 30, 90];
  const results = {};

  periods.forEach(days => {
    const data = getSubArray(days);
    
    const healthScores = data.map(d => d.healthScore || 70);
    const sleepDurations = data.map(d => d.sleepHours || 7);
    const stressLevels = data.map(d => d.stressLevel || 5);
    const activityMinutes = data.map(d => d.activeMinutes || 30);
    const hydrationMl = data.map(d => d.waterMl || 1500);
    const nutritionalIndexes = data.map(d => d.nutritionalIndex || 70);

    results[`days_${days}`] = {
      healthScore: calculateTrendDirection(healthScores, 1),
      sleep: calculateTrendDirection(sleepDurations, 1),
      stress: calculateTrendDirection(stressLevels, -1), // lower stress is improving
      activity: calculateTrendDirection(activityMinutes, 1),
      hydration: calculateTrendDirection(hydrationMl, 1),
      nutritionalQuality: calculateTrendDirection(nutritionalIndexes, 1)
    };
  });

  return results;
}

export default {
  computePredictiveTrends
};
