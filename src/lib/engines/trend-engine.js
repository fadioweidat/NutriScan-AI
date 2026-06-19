/**
 * Trend Engine (Phase 3)
 * Analyzes historical metrics to calculate trends (Migliorato, Peggiorato, Stabile).
 */

export function analyzeMetricTrend(history, metricKey, daysPeriod = 30) {
  if (!history || history.length === 0) {
    return 'Stabile';
  }

  // Filter history logs that fall within the daysPeriod window
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysPeriod);
  
  const filtered = history.filter(item => {
    const itemDate = new Date(item.date || item.entry_date);
    return itemDate >= cutoffDate;
  }).sort((a, b) => new Date(a.date || a.entry_date) - new Date(b.date || b.entry_date));

  if (filtered.length < 2) {
    return 'Stabile'; // Not enough data points to compute trend
  }

  // Split data points into two halves
  const midpoint = Math.floor(filtered.length / 2);
  const baselineHalf = filtered.slice(0, midpoint);
  const currentHalf = filtered.slice(midpoint);

  const getAverage = (arr) => {
    let sum = 0;
    let count = 0;
    arr.forEach(item => {
      let val = item[metricKey];
      // Handle nested values if needed
      if (typeof val === 'object' && val !== null) {
        val = val.value || val.score || val.stress_level || val.duration_hours || val.water_ml;
      }
      const num = Number(val);
      if (!isNaN(num) && num !== null) {
        sum += num;
        count++;
      }
    });
    return count > 0 ? sum / count : 0;
  };

  const avgBaseline = getAverage(baselineHalf);
  const avgCurrent = getAverage(currentHalf);

  // If baseline is 0 and current is 0, it's stable
  if (avgBaseline === 0 && avgCurrent === 0) {
    return 'Stabile';
  }

  // Define improvement direction depending on the metric
  const isStress = metricKey.toLowerCase().includes('stress');
  
  if (isStress) {
    // Stress: lower value is improvement
    const diffPct = ((avgCurrent - avgBaseline) / (avgBaseline || 1)) * 100;
    if (diffPct < -5) return 'Migliorato'; // Stress decreased
    if (diffPct > 5) return 'Peggiorato';  // Stress increased
    return 'Stabile';
  } else {
    // Health Score, Sleep, Water, Activity: higher value is improvement
    const diffPct = ((avgCurrent - avgBaseline) / (avgBaseline || 1)) * 100;
    if (diffPct > 5) return 'Migliorato';   // Value increased
    if (diffPct < -5) return 'Peggiorato';  // Value decreased
    return 'Stabile';
  }
}

export function compileAllTrends(history, daysPeriod = 30) {
  return {
    healthScore: analyzeMetricTrend(history, 'healthScore', daysPeriod),
    sleep: analyzeMetricTrend(history, 'sleepHours', daysPeriod),
    stress: analyzeMetricTrend(history, 'stressLevel', daysPeriod),
    hydration: analyzeMetricTrend(history, 'waterMl', daysPeriod),
    activity: analyzeMetricTrend(history, 'activeMinutes', daysPeriod)
  };
}

export default {
  analyzeMetricTrend,
  compileAllTrends
};
