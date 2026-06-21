/**
 * Health Digital Twin Engine (Phase 6)
 * Aggregates complete health profiles and logs into a virtual model.
 * Strictly educational and non-diagnostic.
 */

export function buildDigitalTwinContext({
  profile = {},
  conditions = [],
  allergies = [],
  medications = [],
  supplements = [],
  reports = [],
  biomarkers = [],
  sleepLogs = [],
  stressLogs = [],
  hydrationLogs = [],
  activityLogs = [],
  mealsHistory = []
}) {
  const latestReport = reports[0] || null;
  const activeConditions = (conditions || []).map(c => c.condition_name || c.name).filter(Boolean);
  const activeAllergies = (allergies || []).map(a => a.allergy_name || a.name || a).filter(Boolean);
  const activeMeds = (medications || []).filter(m => m.is_active).map(m => m.medication_name || m.name);
  const activeSupps = (supplements || []).filter(s => s.is_active).map(s => s.supplement_name || s.name);

  // Calculate averages over available logs
  const avgSleep = sleepLogs.length > 0
    ? sleepLogs.reduce((sum, log) => sum + Number(log.duration_hours || 0), 0) / sleepLogs.length
    : 7.0;

  const avgStress = stressLogs.length > 0
    ? stressLogs.reduce((sum, log) => sum + Number(log.stress_level || 5), 0) / stressLogs.length
    : 5.0;

  const avgHydration = hydrationLogs.length > 0
    ? hydrationLogs.reduce((sum, log) => sum + Number(log.water_ml || 0), 0) / hydrationLogs.length
    : 1500;

  const avgActivity = activityLogs.length > 0
    ? activityLogs.reduce((sum, log) => sum + Number(log.duration_minutes || 0), 0) / activityLogs.length
    : 30;

  // Compile active biomarkers from latest report
  const currentBiomarkers = {};
  biomarkers.forEach(b => {
    currentBiomarkers[b.biomarker_key || b.name] = {
      value: Number(b.value),
      unit: b.unit,
      referenceRange: b.reference_range || b.range,
      status: b.status || 'normal' // e.g. 'high', 'low', 'normal'
    };
  });

  return {
    profile: {
      age: profile?.age || 30,
      sex: profile?.sex || 'male',
      weight: profile?.weight_kg || 75,
      height: profile?.height_cm || 175,
      activityLevel: profile?.activity_level || 'moderato',
      dietType: profile?.diet_type || 'standard'
    },
    clinical: {
      conditions: activeConditions,
      allergies: activeAllergies,
      medications: activeMeds,
      supplements: activeSupps,
      latestReportDate: latestReport?.test_date || null
    },
    biomarkers: currentBiomarkers,
    lifestyleAverages: {
      sleepHours: Number(avgSleep.toFixed(1)),
      stressLevel: Number(avgStress.toFixed(1)),
      waterMl: Math.round(avgHydration),
      activityMinutes: Math.round(avgActivity)
    },
    mealsCount: mealsHistory.length,
    timestamp: Date.now(),
    disclaimer: "DISCLAIMER MEDICO: Questo modello virtuale ha esclusivamente scopo informativo ed educativo e non costituisce una diagnosi medica o prescrizione clinica."
  };
}

export default {
  buildDigitalTwinContext
};
