import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  User, Calendar, Weight, Ruler, Target, Activity,
  Save, Loader2, Check, Calculator
} from 'lucide-react';
import BillingSettings from '../components/BillingSettings.jsx';
import AdminConsoleCard from '../components/AdminConsoleCard.jsx';
import ProductionAdminDashboard from '../components/ProductionAdminDashboard.jsx';
import BetaSupportSection from '../components/BetaSupportSection.jsx';

const GOALS = [
  { value: 'lose_weight', label: 'Perdere peso' },
  { value: 'maintain', label: 'Mantenere peso' },
  { value: 'gain_muscle', label: 'Aumentare massa muscolare' },
  { value: 'health', label: 'Salute generale' },
];

const ACTIVITY_LEVELS = [
  { value: 'sedentary', label: 'Sedentario', factor: 1.2, desc: 'Lavoro da scrivania, poco movimento' },
  { value: 'light', label: 'Leggero', factor: 1.375, desc: 'Esercizio leggero 1-3 giorni/settimana' },
  { value: 'moderate', label: 'Moderato', factor: 1.55, desc: 'Esercizio moderato 3-5 giorni/settimana' },
  { value: 'active', label: 'Attivo', factor: 1.725, desc: 'Esercizio intenso 6-7 giorni/settimana' },
  { value: 'very_active', label: 'Molto attivo', factor: 1.9, desc: 'Atleta o lavoro fisico pesante' },
];

function calculateBMI(weight, heightCm) {
  if (!weight || !heightCm) return null;
  const heightM = heightCm / 100;
  return weight / (heightM * heightM);
}

function calculateBMR(weight, heightCm, age, sex) {
  if (!weight || !heightCm || !age) return null;
  // Harris-Benedict equation
  if (sex === 'male') {
    return 88.362 + (13.397 * weight) + (4.799 * heightCm) - (5.677 * age);
  }
  return 447.593 + (9.247 * weight) + (3.098 * heightCm) - (4.330 * age);
}

function calculateTDEE(bmr, activityLevel) {
  if (!bmr) return null;
  const level = ACTIVITY_LEVELS.find((a) => a.value === activityLevel);
  return bmr * (level?.factor || 1.2);
}

function getRecommendedCalories(tdee, goal) {
  if (!tdee) return null;
  switch (goal) {
    case 'lose_weight': return Math.round(tdee - 500);
    case 'muscle_gain': return Math.round(tdee + 300);
    default: return Math.round(tdee);
  }
}

function getBMILabel(bmi) {
  if (bmi < 18.5) return { label: 'Sottopeso', color: 'text-yellow-400' };
  if (bmi < 25) return { label: 'Normopeso', color: 'text-green-400' };
  if (bmi < 30) return { label: 'Sovrappeso', color: 'text-yellow-400' };
  return { label: 'Obesità', color: 'text-red-400' };
}

export default function ProfilePage() {
  const { profile, updateProfile } = useAuth();

  const [fullName, setFullName] = useState('');
  const [age, setAge] = useState('');
  const [sex, setSex] = useState('male');
  const [weight, setWeight] = useState('');
  const [height, setHeight] = useState('');
  const [goal, setGoal] = useState('health');
  const [activityLevel, setActivityLevel] = useState('moderate');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [isAdminActive, setIsAdminActive] = useState(false);

  // Load existing profile data
  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAge(profile.age || '');
      setSex(profile.sex || 'male');
      setWeight(profile.weight_kg || '');
      setHeight(profile.height_cm || '');
      setGoal(profile.goal || 'health');
      setActivityLevel(profile.activity_level || 'moderate');
    }
  }, [profile]);

  // Auto-calculated values
  const bmi = useMemo(() => calculateBMI(Number(weight), Number(height)), [weight, height]);
  const bmr = useMemo(
    () => calculateBMR(Number(weight), Number(height), Number(age), sex),
    [weight, height, age, sex]
  );
  const tdee = useMemo(
    () => calculateTDEE(bmr, activityLevel),
    [bmr, activityLevel]
  );
  const recommendedCalories = useMemo(
    () => getRecommendedCalories(tdee, goal),
    [tdee, goal]
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      const updates = {
        full_name: fullName.trim(),
        age: Number(age) || null,
        sex,
        weight_kg: Number(weight) || null,
        height_cm: Number(height) || null,
        goal,
        activity_level: activityLevel,
        bmi: bmi ? Math.round(bmi * 10) / 10 : null,
        bmr: bmr ? Math.round(bmr) : null,
        tdee: tdee ? Math.round(tdee) : null,
        recommended_calories: recommendedCalories,
      };
      
      const { error } = await updateProfile(updates);
      
      if (error) {
        console.error('Errore update profilo:', error);
        return;
      }
      
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Errore salvataggio profilo:', err);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-xl font-bold text-white">Il Mio Profilo</h1>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Profilo salvato con successo!
        </div>
      )}

      {/* Form Card */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
            Nome completo
          </label>
          <div className="relative">
            <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
            <input
              type="text"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Mario Rossi"
              className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
            />
          </div>
        </div>

        {/* Age + Sex row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
              Età
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="number"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                placeholder="30"
                min={1}
                max={120}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
              Sesso
            </label>
            <div className="flex gap-2">
              {['male', 'female'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setSex(s)}
                  className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all border ${
                    sex === s
                      ? 'bg-lime-500/15 border-lime-500/50 text-lime-400'
                      : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                  }`}
                >
                  {s === 'male' ? 'Maschio' : 'Femmina'}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Weight + Height row */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
              Peso (kg)
            </label>
            <div className="relative">
              <Weight className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="number"
                value={weight}
                onChange={(e) => setWeight(e.target.value)}
                placeholder="75"
                min={20}
                max={300}
                step={0.1}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
              />
            </div>
          </div>
          <div>
            <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
              Altezza (cm)
            </label>
            <div className="relative">
              <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
              <input
                type="number"
                value={height}
                onChange={(e) => setHeight(e.target.value)}
                placeholder="175"
                min={100}
                max={250}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
              />
            </div>
          </div>
        </div>

        {/* Goal */}
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
            <Target className="inline w-3.5 h-3.5 mr-1" />
            Obiettivo
          </label>
          <div className="grid grid-cols-2 gap-2">
            {GOALS.map((g) => (
              <button
                key={g.value}
                type="button"
                onClick={() => setGoal(g.value)}
                className={`p-3 rounded-xl text-sm font-medium transition-all border text-left ${
                  goal === g.value
                    ? 'bg-lime-500/15 border-lime-500/50 text-lime-400'
                    : 'bg-white/5 border-white/10 text-white/50 hover:bg-white/10'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* Activity Level */}
        <div>
          <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
            <Activity className="inline w-3.5 h-3.5 mr-1" />
            Livello di attività
          </label>
          <div className="space-y-2">
            {ACTIVITY_LEVELS.map((a) => (
              <button
                key={a.value}
                type="button"
                onClick={() => setActivityLevel(a.value)}
                className={`w-full p-3 rounded-xl text-left transition-all border ${
                  activityLevel === a.value
                    ? 'bg-lime-500/15 border-lime-500/50'
                    : 'bg-white/5 border-white/10 hover:bg-white/10'
                }`}
              >
                <span className={`text-sm font-medium ${
                  activityLevel === a.value ? 'text-lime-400' : 'text-white/70'
                }`}>
                  {a.label}
                </span>
                <p className="text-xs text-white/40 mt-0.5">{a.desc}</p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Calculated Values */}
      {(bmi || bmr || tdee) && (
        <div>
          <h3 className="text-white/70 text-sm font-medium mb-3 ml-1 flex items-center gap-2">
            <Calculator className="w-4 h-4" />
            Valori Calcolati
          </h3>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            {bmi && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">BMI</p>
                <p className="text-2xl font-bold text-white">{bmi.toFixed(1)}</p>
                <p className={`text-xs mt-1 ${getBMILabel(bmi).color}`}>
                  {getBMILabel(bmi).label}
                </p>
              </div>
            )}
            {bmr && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">BMR</p>
                <p className="text-2xl font-bold text-white">{Math.round(bmr)}</p>
                <p className="text-xs text-white/40 mt-1">kcal/giorno</p>
              </div>
            )}
            {tdee && (
              <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 text-center">
                <p className="text-white/40 text-xs mb-1">TDEE</p>
                <p className="text-2xl font-bold text-white">{Math.round(tdee)}</p>
                <p className="text-xs text-white/40 mt-1">kcal/giorno</p>
              </div>
            )}
            {recommendedCalories && (
              <div className="bg-lime-500/5 backdrop-blur-xl border border-lime-500/20 rounded-2xl p-4 text-center">
                <p className="text-lime-400/60 text-xs mb-1">Consigliato</p>
                <p className="text-2xl font-bold text-lime-400">{recommendedCalories}</p>
                <p className="text-xs text-lime-400/50 mt-1">kcal/giorno</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving}
        className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-500/50 text-black font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20"
      >
        {saving ? (
          <>
            <Loader2 className="w-5 h-5 animate-spin" />
            Salvataggio...
          </>
        ) : saveSuccess ? (
          <>
            <Check className="w-5 h-5" />
            Salvato!
          </>
        ) : (
          <>
            <Save className="w-5 h-5" />
            Salva Profilo
          </>
        )}
      </button>

      {/* Billing & SaaS Subscriptions (Phase 10) */}
      <div className="pt-6 border-t border-white/5 space-y-3">
        <h3 className="text-white font-bold text-base ml-1">Fatturazione & Piani SaaS</h3>
        <BillingSettings />
      </div>

      {/* Beta Program & Customer Support (Phase 12) */}
      <div className="pt-6 border-t border-white/5 space-y-3">
        <h3 className="text-white font-bold text-base ml-1">Programma Beta & Supporto Clienti</h3>
        <BetaSupportSection />
      </div>

      {/* Admin Telemetry Panel (Phase 10) */}
      <div className="pt-6 border-t border-white/5 space-y-4">
        <div className="flex items-center justify-between ml-1">
          <h3 className="text-white font-bold text-base">Amministrazione Piattaforma</h3>
          <button
            onClick={() => setIsAdminActive(!isAdminActive)}
            className="text-xs font-semibold text-lime-400 hover:text-lime-300 bg-lime-500/10 px-3 py-1.5 rounded-lg border border-lime-500/20 transition-all"
            id="admin-console-toggle"
          >
            {isAdminActive ? 'Nascondi Console' : 'Mostra Console Admin'}
          </button>
        </div>
        {isAdminActive && (
          <div className="space-y-6">
            <AdminConsoleCard />
            <ProductionAdminDashboard />
          </div>
        )}
      </div>
    </div>
  );
}
