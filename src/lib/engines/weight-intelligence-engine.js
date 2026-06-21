/**
 * Weight Intelligence Engine (Phase 8)
 * Analyzes weight fluctuations, BMI, and calorie balances.
 * Strictly educational and non-diagnostic.
 */

export function analyzeWeightMetrics({
  weightKg = 70.0,
  heightCm = 175,
  mealsCalories = 2000,
  activeCalories = 300,
  sleepHours = 7
}) {
  // 1. BMI Calculation
  const heightM = heightCm / 100;
  const bmi = heightM > 0 ? weightKg / (heightM * heightM) : 0;
  
  let bmiClass = 'normopeso';
  if (bmi < 18.5) bmiClass = 'sottopeso';
  else if (bmi >= 25 && bmi < 30) bmiClass = 'sovrappeso';
  else if (bmi >= 30) bmiClass = 'obesità';

  // 2. Caloric Balance
  // BMR (Basal Metabolic Rate) estimate using Mifflin-St Jeor (Male standard base)
  const bmrEstimate = 10 * weightKg + 6.25 * heightCm - 5 * 35 + 5; // standard male baseline ~ 1600-1700
  const dailyOutflow = bmrEstimate + activeCalories;
  const netCalorieBalance = mealsCalories - dailyOutflow;

  const insights = [];
  
  // 3. Generate educational insights
  if (netCalorieBalance > 300) {
    insights.push({
      type: 'surplus',
      title: "Surplus calorico stimato",
      message: `Il tuo bilancio calorico odierno registra un surplus di circa +${Math.round(netCalorieBalance)} kcal rispetto al fabbisogno stimato (In: ${mealsCalories} kcal vs Out: ${Math.round(dailyOutflow)} kcal). Consigliato per l'aumento della massa muscolare, sconsigliato in definizione.`,
      severity: 'info'
    });
  } else if (netCalorieBalance < -300) {
    insights.push({
      type: 'deficit',
      title: "Deficit calorico attivo",
      message: `Stai registrando un deficit calorico stimato di ${Math.round(netCalorieBalance)} kcal (In: ${mealsCalories} kcal vs Out: ${Math.round(dailyOutflow)} kcal). Questo andamento stimola la lipolisi (riduzione del grasso corporeo) a scopi energetici.`,
      severity: 'success'
    });
  } else {
    insights.push({
      type: 'maintenance',
      title: "Bilancio calorico in mantenimento",
      message: `Il tuo introito calorico (${mealsCalories} kcal) copre quasi perfettamente il consumo metabolico complessivo stimato (${Math.round(dailyOutflow)} kcal). Ideale per mantenere stabile la massa corporea attuale.`,
      severity: 'info'
    });
  }

  // Sleep & Weight correlation
  if (sleepHours < 6.0 && netCalorieBalance > 200) {
    insights.push({
      type: 'sleep_correlation',
      title: "Mancanza di sonno e stoccaggio grassi",
      message: "Dormire meno di 6 ore altera i livelli di grelina e leptina, riducendo il metabolismo energetico basale ed esacerbando gli accumuli di calorie in surplus.",
      severity: 'warning'
    });
  }

  return {
    weightKg: Number(weightKg.toFixed(1)),
    bmi: Number(bmi.toFixed(1)),
    bmiClass,
    bmrEstimate: Math.round(bmrEstimate),
    dailyOutflow: Math.round(dailyOutflow),
    netCalorieBalance: Math.round(netCalorieBalance),
    insights,
    disclaimer: "DISCLAIMER: Il calcolo del BMI, del metabolismo basale (BMR) e del deficit calorico è basato su formule matematiche generali e non sostituisce valutazioni antropometriche eseguite da nutrizionisti o medici."
  };
}

export function compileWeightTrend(historyList = []) {
  if (historyList.length < 2) return 'stable';

  const n = historyList.length;
  const latestWeight = historyList[n - 1].weightKg;
  const previousWeight = historyList[0].weightKg;

  if (latestWeight > previousWeight + 0.5) return 'increasing';
  if (latestWeight < previousWeight - 0.5) return 'decreasing';
  return 'stable';
}

export default {
  analyzeWeightMetrics,
  compileWeightTrend
};
