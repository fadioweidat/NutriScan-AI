import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import engine from '../lib/nutrition-engine';
import {
  Utensils, Beef, Flame, Timer, Save, Loader2, Check,
  ArrowRight
} from 'lucide-react';

const DIET_TYPES = [
  {
    key: 'standard',
    label: 'Standard',
    description: 'Dieta bilanciata con tutti i gruppi alimentari',
    icon: Utensils,
    color: 'lime',
    risks: [],
  },
  {
    key: 'keto',
    label: 'Keto',
    description: 'Alto contenuto di grassi, basso contenuto di carboidrati (<50g/giorno)',
    icon: Flame,
    color: 'orange',
    risks: ['Magnesio', 'Potassio', 'Fibre'],
  },
  {
    key: 'carnivore',
    label: 'Carnivore',
    description: 'Basata principalmente su carne e prodotti animali',
    icon: Beef,
    color: 'red',
    risks: ['Vitamina C', 'Fibre', 'Folati'],
  },
  {
    key: 'intermittent_fasting',
    label: 'Digiuno Intermittente',
    description: 'Finestre alimentari programmate (es. 16:8)',
    icon: Timer,
    color: 'cyan',
    risks: ['Apporto proteico', 'Idratazione', 'Micronutrienti'],
  },
];

const MACRO_LABELS = {
  calories: { label: 'Calorie', unit: 'kcal' },
  proteins: { label: 'Proteine', unit: 'g' },
  carbs: { label: 'Carboidrati', unit: 'g' },
  fats: { label: 'Grassi', unit: 'g' },
  fiber: { label: 'Fibre', unit: 'g' },
};

const colorMap = {
  lime: {
    activeBg: 'bg-lime-500/15',
    activeBorder: 'border-lime-500/50',
    activeText: 'text-lime-400',
    iconBg: 'bg-lime-500/10',
  },
  orange: {
    activeBg: 'bg-orange-500/15',
    activeBorder: 'border-orange-500/50',
    activeText: 'text-orange-400',
    iconBg: 'bg-orange-500/10',
  },
  red: {
    activeBg: 'bg-red-500/15',
    activeBorder: 'border-red-500/50',
    activeText: 'text-red-400',
    iconBg: 'bg-red-500/10',
  },
  cyan: {
    activeBg: 'bg-cyan-500/15',
    activeBorder: 'border-cyan-500/50',
    activeText: 'text-cyan-400',
    iconBg: 'bg-cyan-500/10',
  },
};

export default function DietSettingsPage() {
  const { profile, updateProfile } = useAuth();

  const [selectedDiet, setSelectedDiet] = useState('standard');
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Load from profile
  useEffect(() => {
    if (profile?.diet_type) {
      setSelectedDiet(profile.diet_type);
    }
  }, [profile]);

  // Compute RDA for the currently selected diet
  const currentRDA = useMemo(
    () => engine.getRDA({ ...profile, diet_type: selectedDiet }),
    [profile, selectedDiet]
  );

  // Compute standard RDA for comparison
  const standardRDA = useMemo(
    () => engine.getRDA({ ...profile, diet_type: 'standard' }),
    [profile]
  );

  const handleSave = async () => {
    setSaving(true);
    setSaveSuccess(false);
    try {
      await updateProfile({
        ...profile,
        diet_type: selectedDiet,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    } catch (err) {
      console.error('Errore salvataggio dieta:', err);
    } finally {
      setSaving(false);
    }
  };

  const isDietChanged = profile?.diet_type !== selectedDiet;

  return (
    <div className="max-w-2xl mx-auto px-4 py-6 space-y-6">
      <div>
        <h1 className="text-xl font-bold text-white">Impostazioni Dieta</h1>
        <p className="text-white/40 text-sm mt-1">
          Scegli il tipo di dieta per personalizzare i tuoi obiettivi nutrizionali
        </p>
      </div>

      {/* Success Message */}
      {saveSuccess && (
        <div className="p-3 bg-green-500/10 border border-green-500/30 rounded-xl text-green-400 text-sm flex items-center gap-2">
          <Check className="w-4 h-4" />
          Impostazioni dieta salvate con successo!
        </div>
      )}

      {/* Diet Type Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {DIET_TYPES.map((diet) => {
          const Icon = diet.icon;
          const isActive = selectedDiet === diet.key;
          const colors = colorMap[diet.color];
          return (
            <button
              key={diet.key}
              onClick={() => {
                setSelectedDiet(diet.key);
                setSaveSuccess(false);
              }}
              className={`p-5 rounded-2xl border text-left transition-all duration-300 ${
                isActive
                  ? `${colors.activeBg} ${colors.activeBorder} shadow-lg`
                  : 'bg-white/5 border-white/10 hover:bg-white/10 hover:border-white/20'
              }`}
            >
              <div className={`inline-flex p-2.5 rounded-xl mb-3 ${
                isActive ? colors.iconBg : 'bg-white/5'
              }`}>
                <Icon className={`w-5 h-5 ${isActive ? colors.activeText : 'text-white/50'}`} />
              </div>
              <h3 className={`font-semibold mb-1 ${isActive ? colors.activeText : 'text-white/80'}`}>
                {diet.label}
              </h3>
              <p className="text-white/40 text-xs leading-relaxed mb-4">
                {diet.description}
              </p>
              
              {diet.risks.length > 0 && (
                <div className="mt-auto border-t border-white/5 pt-3">
                  <p className="text-[10px] font-semibold text-white/50 uppercase tracking-wider mb-1.5">Rischi da Monitorare:</p>
                  <div className="flex flex-wrap gap-1.5">
                    {diet.risks.map(r => (
                      <span key={r} className={`px-2 py-0.5 text-[10px] rounded-md border ${
                        isActive ? `${colors.activeBorder} ${colors.activeText} bg-white/5` : 'border-white/10 text-white/50 bg-white/5'
                      }`}>
                        {r}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* RDA Preview */}
      <div>
        <h3 className="text-white/70 text-sm font-medium mb-3 ml-1">
          Obiettivi nutrizionali — {DIET_TYPES.find((d) => d.key === selectedDiet)?.label}
        </h3>
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4">
          <div className="space-y-3">
            {Object.entries(MACRO_LABELS).map(([key, { label, unit }]) => {
              const current = Math.round(currentRDA[key] || 0);
              const standard = Math.round(standardRDA[key] || 0);
              const diff = current - standard;
              const showDiff = selectedDiet !== 'standard' && diff !== 0;

              return (
                <div key={key} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/60 text-sm">{label}</span>
                  <div className="flex items-center gap-3">
                    {showDiff && (
                      <div className="flex items-center gap-1">
                        <span className="text-white/30 text-xs line-through">
                          {standard} {unit}
                        </span>
                        <ArrowRight className="w-3 h-3 text-white/20" />
                      </div>
                    )}
                    <span className="text-white font-semibold text-sm">
                      {current} {unit}
                    </span>
                    {showDiff && (
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        diff > 0
                          ? 'text-green-400 bg-green-500/10'
                          : 'text-red-400 bg-red-500/10'
                      }`}>
                        {diff > 0 ? '+' : ''}{diff}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Vitamin/Mineral RDA preview */}
          {currentRDA.vitamins && (
            <div className="mt-4 pt-4 border-t border-white/5">
              <p className="text-white/40 text-xs mb-2">Vitamine (RDA giornaliera)</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(currentRDA.vitamins).map(([key, value]) => {
                  const labels = {
                    vitamin_a: 'Vit. A', vitamin_c: 'Vit. C', vitamin_d: 'Vit. D',
                    vitamin_e: 'Vit. E', vitamin_k: 'Vit. K', vitamin_b12: 'Vit. B12',
                  };
                  if (!labels[key]) return null;
                  return (
                    <div key={key} className="text-center py-1">
                      <p className="text-white/40 text-xs">{labels[key]}</p>
                      <p className="text-white text-sm font-medium">
                        {typeof value === 'number' ? (value < 1 ? value.toFixed(1) : Math.round(value)) : value}
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {currentRDA.minerals && (
            <div className="mt-3 pt-3 border-t border-white/5">
              <p className="text-white/40 text-xs mb-2">Minerali (RDA giornaliera)</p>
              <div className="grid grid-cols-3 gap-2">
                {Object.entries(currentRDA.minerals).map(([key, value]) => {
                  const labels = {
                    calcium: 'Calcio', iron: 'Ferro', magnesium: 'Magnesio',
                    zinc: 'Zinco', potassium: 'Potassio',
                  };
                  if (!labels[key]) return null;
                  return (
                    <div key={key} className="text-center py-1">
                      <p className="text-white/40 text-xs">{labels[key]}</p>
                      <p className="text-white text-sm font-medium">
                        {typeof value === 'number' ? Math.round(value) : value} mg
                      </p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Save Button */}
      <button
        onClick={handleSave}
        disabled={saving || !isDietChanged}
        className="w-full py-3.5 bg-lime-500 hover:bg-lime-400 disabled:bg-white/10 disabled:text-white/30 text-black font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 shadow-lg shadow-lime-500/20 disabled:shadow-none"
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
            Salva Impostazioni
          </>
        )}
      </button>
    </div>
  );
}
