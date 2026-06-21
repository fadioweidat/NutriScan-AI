/**
 * Biomarker Forecast Engine (Phase 6)
 * Traces and projects future values of key blood biomarkers.
 * Strictly educational and non-diagnostic.
 */

export function forecastBiomarkers({
  reports = [], // array of { id, test_date }
  historicalBiomarkers = [] // array of all historical { report_id, biomarker_key, value, unit }
}) {
  const forecasts = {};
  
  const targetKeys = [
    'glucose', 'glicemia',
    'hba1c',
    'cholesterol', 'colesterolo',
    'hdl',
    'ldl',
    'triglycerides', 'trigliceridi',
    'vitamin_d', 'vitamina_d',
    'vitamin_b12', 'vitamina_b12',
    'ferritin', 'ferritina',
    'iron', 'ferro'
  ];

  const canonicalMap = {
    'glicemia': 'glucose',
    'colesterolo': 'cholesterol',
    'trigliceridi': 'triglycerides',
    'vitamina_d': 'vitamin_d',
    'vitamina_b12': 'vitamin_b12',
    'ferritina': 'ferritin',
    'ferro': 'iron'
  };

  const getCanonicalKey = (k) => {
    const lower = (k || '').toLowerCase().trim();
    return canonicalMap[lower] || lower;
  };

  // Map report_id to test_date
  const reportDates = {};
  reports.forEach(r => {
    reportDates[r.id] = new Date(r.test_date).getTime();
  });

  // Group biomarker values by canonical key
  const valuesByKey = {};
  historicalBiomarkers.forEach(b => {
    const rawKey = b.biomarker_key || b.name || '';
    const canonicalKey = getCanonicalKey(rawKey);
    if (!reportDates[b.report_id]) return; // ignore orphan entries

    if (!valuesByKey[canonicalKey]) {
      valuesByKey[canonicalKey] = [];
    }

    valuesByKey[canonicalKey].push({
      time: reportDates[b.report_id],
      value: Number(b.value),
      unit: b.unit
    });
  });

  targetKeys.forEach(key => {
    const canonicalKey = getCanonicalKey(key);
    const history = valuesByKey[canonicalKey] || [];
    // Sort chronologically
    history.sort((a, b) => a.time - b.time);

    // Filter duplicates on same day
    const uniqueHistory = [];
    const seenTimes = new Set();
    history.forEach(item => {
      if (!seenTimes.has(item.time)) {
        seenTimes.add(item.time);
        uniqueHistory.push(item);
      }
    });

    if (uniqueHistory.length < 2) {
      forecasts[key] = {
        key,
        history: uniqueHistory,
        forecastValue: null,
        message: "Dati insufficienti per una previsione affidabile.",
        confidenceScore: 0,
        trend: 'stable'
      };
      return;
    }

    // Normalize time to days since the first report in history to prevent floating-point overflow
    const minTime = uniqueHistory[0].time;
    const normalizedHistory = uniqueHistory.map(item => ({
      timeDays: (item.time - minTime) / (24 * 60 * 60 * 1000),
      value: item.value
    }));

    const n = normalizedHistory.length;
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;
    
    normalizedHistory.forEach(item => {
      sumX += item.timeDays;
      sumY += item.value;
      sumXY += item.timeDays * item.value;
      sumXX += item.timeDays * item.timeDays;
    });

    const slopeNumerator = (n * sumXY) - (sumX * sumY);
    const slopeDenominator = (n * sumXX) - (sumX * sumX);
    
    const slope = slopeDenominator !== 0 ? slopeNumerator / slopeDenominator : 0;
    const intercept = (sumY - (slope * sumX)) / n;

    // Project 60 days into the future from the latest test date
    const latestTimeDays = normalizedHistory[n - 1].timeDays;
    const targetTimeDays = latestTimeDays + 60; // +60 days
    const forecastVal = (slope * targetTimeDays) + intercept;

    // Determine trend and confidence score
    const percentDiff = uniqueHistory[n - 1].value !== 0 
      ? ((forecastVal - uniqueHistory[n - 1].value) / uniqueHistory[n - 1].value) 
      : 0;

    let trend = 'stable';
    if (percentDiff > 0.05) trend = 'increasing';
    if (percentDiff < -0.05) trend = 'decreasing';

    // Confidence scales with number of tests and temporal dispersion
    let confidence = Math.min(40 + (n * 10), 90); // starts at 60 for 2 tests, caps at 90
    
    // Penalize if the latest test is very old (e.g. > 180 days)
    const latestTime = uniqueHistory[n - 1].time;
    const ageDays = (Date.now() - latestTime) / (24 * 60 * 60 * 1000);
    if (ageDays > 180) {
      confidence = Math.max(confidence - 20, 30);
    }

    forecasts[key] = {
      key,
      history: uniqueHistory,
      forecastValue: Number(forecastVal.toFixed(1)),
      unit: uniqueHistory[0].unit,
      confidenceScore: Math.round(confidence),
      trend,
      message: `La previsione a 60 giorni stima un livello di ${forecastVal.toFixed(1)} ${uniqueHistory[0].unit} (confidenza ${Math.round(confidence)}%).`
    };
  });

  return forecasts;
}

export default {
  forecastBiomarkers
};
