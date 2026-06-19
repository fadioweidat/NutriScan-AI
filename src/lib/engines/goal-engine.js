import { calculateDietCompliance } from './daily-score-engine.js';

/**
 * Goal Engine (Phase 3)
 * Tracks daily goals and calculates the completion percentage.
 */

export function checkDailyGoals({ totals, dietType, meals = [], sleepLog, stressLog, hydrationLog, activityLogs = [], conditions = [] }) {
  const goals = [];

  // 1. Water Intake Goal (Target: >= 2000 ml)
  const water = hydrationLog ? Number(hydrationLog.water_ml || 0) : 0;
  goals.push({
    key: 'hydration',
    name: 'Idratazione',
    target: '2000 ml',
    current: `${water} ml`,
    completed: water >= 2000
  });

  // 2. Sleep Duration Goal (Target: >= 7 hours)
  const sleepHours = sleepLog ? Number(sleepLog.duration_hours || 0) : 0;
  const sleepQuality = sleepLog ? Number(sleepLog.quality_score || 0) : 0;
  goals.push({
    key: 'sleep',
    name: 'Sonno Rinfrescante',
    target: '>= 7.0 ore',
    current: `${sleepHours} ore (Qualità: ${sleepQuality}/5)`,
    completed: sleepHours >= 7 && sleepQuality >= 3
  });

  // 3. Stress Relief Goal (Target: <= 4 stress level)
  const stress = stressLog ? Number(stressLog.stress_level || 5) : 5;
  goals.push({
    key: 'stress',
    name: 'Gestione Stress',
    target: '<= 4',
    current: `Livello ${stress}`,
    completed: stress <= 4
  });

  // 4. Physical Activity Goal (Target: >= 30 minutes)
  const activeMin = activityLogs ? activityLogs.reduce((sum, act) => sum + Number(act.duration_minutes || 0), 0) : 0;
  goals.push({
    key: 'activity',
    name: 'Attività Fisica',
    target: '>= 30 min',
    current: `${activeMin} minuti`,
    completed: activeMin >= 30
  });

  // 5. Diet Adherence / Nutrition Goal
  const compliance = calculateDietCompliance(totals, dietType, meals, conditions);
  const dietCompleted = compliance >= 80;

  goals.push({
    key: 'diet',
    name: 'Aderenza Dieta',
    target: 'Aderenza >= 80%',
    current: `${compliance}% aderenza`,
    completed: dietCompleted
  });

  const completedCount = goals.filter(g => g.completed).length;
  const totalCount = goals.length;
  const percent = Math.round((completedCount / totalCount) * 100);

  return {
    goals,
    completedCount,
    totalCount,
    percent
  };
}

export default {
  checkDailyGoals
};
