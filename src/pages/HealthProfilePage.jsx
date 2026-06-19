import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import healthEngine from '../lib/health-engine';
import { AlertTriangle, Check, Loader2, ShieldAlert, Plus, Trash2 } from 'lucide-react';

export default function HealthProfilePage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  
  const [profile, setProfile] = useState(null);
  const [conditions, setConditions] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [intolerances, setIntolerances] = useState([]);
  
  const [newCondition, setNewCondition] = useState('');
  const [newAllergy, setNewAllergy] = useState('');
  const [newIntolerance, setNewIntolerance] = useState('');

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const p = await healthEngine.getHealthProfile(user.id);
        const c = await healthEngine.getConditions(user.id);
        const a = await healthEngine.getAllergies(user.id);
        const i = await healthEngine.getIntolerances(user.id);
        setProfile(p);
        setConditions(c || []);
        setAllergies(a || []);
        setIntolerances(i || []);
      } catch (err) {
        console.error("Error loading health profile:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleConsent = async () => {
    setSaving(true);
    try {
      const updated = await healthEngine.saveHealthProfile(user.id, { 
        privacy_consent: true, 
        privacy_consent_date: new Date().toISOString() 
      });
      setProfile(updated);
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCondition = async () => {
    if (!newCondition.trim()) return;
    try {
      const added = await healthEngine.addCondition(user.id, newCondition.trim());
      setConditions([added, ...conditions]);
      setNewCondition('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveCondition = async (id) => {
    try {
      await healthEngine.removeCondition(id);
      setConditions(conditions.filter(c => c.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddAllergy = async () => {
    if (!newAllergy.trim()) return;
    try {
      const added = await healthEngine.addAllergy(user.id, newAllergy.trim());
      setAllergies([added, ...allergies]);
      setNewAllergy('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveAllergy = async (id) => {
    try {
      await healthEngine.removeAllergy(id);
      setAllergies(allergies.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddIntolerance = async () => {
    if (!newIntolerance.trim()) return;
    try {
      const added = await healthEngine.addIntolerance(user.id, newIntolerance.trim());
      setIntolerances([added, ...intolerances]);
      setNewIntolerance('');
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveIntolerance = async (id) => {
    try {
      await healthEngine.removeIntolerance(id);
      setIntolerances(intolerances.filter(i => i.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  // Privacy Consent Gate
  if (!profile?.privacy_consent) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-amber-500/30 rounded-3xl p-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500"></div>
          <ShieldAlert className="w-12 h-12 text-amber-400 mb-6" />
          <h2 className="text-2xl font-bold text-white mb-4">Privacy Dati Sanitari</h2>
          <p className="text-white/70 mb-6 leading-relaxed">
            Per offrirti suggerimenti personalizzati, NutriScan AI elaborerà le informazioni sulle tue condizioni mediche, allergie e intolleranze. 
            <br/><br/>
            Questi sono considerati "dati sanitari sensibili". Verranno salvati nel database in modo sicuro, criptati e accessibili <b>esclusivamente da te</b>.
          </p>
          <button
            onClick={handleConsent}
            disabled={saving}
            className="w-full py-4 bg-amber-500 hover:bg-amber-400 text-black font-bold rounded-xl transition-all flex items-center justify-center gap-2"
          >
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Check className="w-5 h-5" />}
            Acconsento al trattamento dei dati
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Profilo Salute</h1>
        <p className="text-white/40 text-sm mt-1">
          Configura patologie, allergie e intolleranze per personalizzare i suggerimenti nutrizionali.
        </p>
      </div>

      {/* PATOLOGIE */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Condizioni Mediche</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newCondition}
            onChange={e => setNewCondition(e.target.value)}
            placeholder="Es. Diabete, Ipertensione..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-lime-500/50 focus:outline-none"
          />
          <button
            onClick={handleAddCondition}
            disabled={!newCondition.trim()}
            className="px-6 bg-lime-500 hover:bg-lime-400 text-black font-semibold rounded-xl disabled:bg-white/10 disabled:text-white/30 transition-colors"
          >
            Aggiungi
          </button>
        </div>
        <div className="space-y-2">
          {conditions.map(c => (
            <div key={c.id} className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
              <span className="text-white/90 capitalize">{c.condition_name}</span>
              <button onClick={() => handleRemoveCondition(c.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {conditions.length === 0 && <p className="text-white/30 text-sm italic">Nessuna condizione registrata.</p>}
        </div>
      </section>

      {/* ALLERGIE */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Allergie</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newAllergy}
            onChange={e => setNewAllergy(e.target.value)}
            placeholder="Es. Arachidi, Pesce..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-orange-500/50 focus:outline-none"
          />
          <button
            onClick={handleAddAllergy}
            disabled={!newAllergy.trim()}
            className="px-6 bg-orange-500 hover:bg-orange-400 text-black font-semibold rounded-xl disabled:bg-white/10 disabled:text-white/30 transition-colors"
          >
            Aggiungi
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {allergies.map(a => (
            <div key={a.id} className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 border border-orange-500/30 rounded-full">
              <span className="text-orange-400 text-sm font-medium capitalize">{a.allergy_name}</span>
              <button onClick={() => handleRemoveAllergy(a.id)} className="text-orange-400/50 hover:text-orange-400">
                &times;
              </button>
            </div>
          ))}
          {allergies.length === 0 && <p className="text-white/30 text-sm italic w-full">Nessuna allergia registrata.</p>}
        </div>
      </section>

      {/* INTOLLERANZE */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <h2 className="text-lg font-semibold text-white mb-4">Intolleranze</h2>
        <div className="flex gap-2 mb-4">
          <input
            type="text"
            value={newIntolerance}
            onChange={e => setNewIntolerance(e.target.value)}
            placeholder="Es. Lattosio, Glutine..."
            className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-cyan-500/50 focus:outline-none"
          />
          <button
            onClick={handleAddIntolerance}
            disabled={!newIntolerance.trim()}
            className="px-6 bg-cyan-500 hover:bg-cyan-400 text-black font-semibold rounded-xl disabled:bg-white/10 disabled:text-white/30 transition-colors"
          >
            Aggiungi
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {intolerances.map(i => (
            <div key={i.id} className="flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-500/30 rounded-full">
              <span className="text-cyan-400 text-sm font-medium capitalize">{i.intolerance_name}</span>
              <button onClick={() => handleRemoveIntolerance(i.id)} className="text-cyan-400/50 hover:text-cyan-400">
                &times;
              </button>
            </div>
          ))}
          {intolerances.length === 0 && <p className="text-white/30 text-sm italic w-full">Nessuna intolleranza registrata.</p>}
        </div>
      </section>

    </div>
  );
}
