import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import lifestyleEngine from '../lib/lifestyle-engine';
import { Moon, Activity, Droplets, HeartPulse, Stethoscope, Loader2, Save, Trash2, Plus } from 'lucide-react';

export default function LifestylePage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [sleep, setSleep] = useState({ duration_hours: 8, quality_score: 3, notes: '' });
  const [stress, setStress] = useState({ stress_level: 5, triggers: '', notes: '' });
  const [hydration, setHydration] = useState({ water_ml: 2000, target_reached: true });
  const [digestion, setDigestion] = useState({ quality_score: 4, symptoms: '', notes: '' });
  
  const [activities, setActivities] = useState([]);
  const [newActivity, setNewActivity] = useState({ activity_type: '', duration_minutes: 30, intensity: 'media', calories_burned: '' });

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const ctx = await lifestyleEngine.getTodayLifestyleContext(user.id);
      if (ctx.sleep) setSleep(ctx.sleep);
      if (ctx.stress) setStress(ctx.stress);
      if (ctx.hydration) setHydration(ctx.hydration);
      if (ctx.digestion) setDigestion(ctx.digestion);
      if (ctx.activities) setActivities(ctx.activities);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user]);

  const handleSaveForms = async () => {
    setSaving(true);
    try {
      await Promise.all([
        lifestyleEngine.saveSleepLog(user.id, { ...sleep, id: undefined, user_id: undefined, created_at: undefined, updated_at: undefined }),
        lifestyleEngine.saveStressLog(user.id, { ...stress, id: undefined, user_id: undefined, created_at: undefined, updated_at: undefined }),
        lifestyleEngine.saveHydrationLog(user.id, { ...hydration, id: undefined, user_id: undefined, created_at: undefined, updated_at: undefined }),
        lifestyleEngine.saveDigestionLog(user.id, { ...digestion, id: undefined, user_id: undefined, created_at: undefined, updated_at: undefined })
      ]);
      await loadData();
    } catch (err) {
      console.error(err);
    } finally {
      setSaving(false);
    }
  };

  const handleAddActivity = async () => {
    if (!newActivity.activity_type.trim()) return;
    try {
      const added = await lifestyleEngine.addActivity(user.id, {
        ...newActivity,
        calories_burned: newActivity.calories_burned ? parseInt(newActivity.calories_burned) : null
      });
      setActivities([...activities, added]);
      setNewActivity({ activity_type: '', duration_minutes: 30, intensity: 'media', calories_burned: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveActivity = async (id) => {
    try {
      await lifestyleEngine.removeActivity(id);
      setActivities(activities.filter(a => a.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
    </div>
  );

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-2xl font-bold text-white">Diario Lifestyle</h1>
          <p className="text-white/50 text-sm mt-1">Registra le tue abitudini di oggi per migliorare le analisi dell'AI.</p>
        </div>
        <button
          onClick={handleSaveForms}
          disabled={saving}
          className="flex items-center gap-2 bg-lime-500 hover:bg-lime-400 text-black px-6 py-2.5 rounded-xl font-bold transition-all disabled:opacity-50"
        >
          {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Salva Log
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* SONNO */}
        <section className="bg-white/5 border border-indigo-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <Moon className="w-5 h-5 text-indigo-400" />
            <h2 className="text-lg font-semibold text-white">Sonno</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Durata (Ore)</label>
              <input type="number" step="0.5" value={sleep.duration_hours || ''} onChange={e => setSleep({...sleep, duration_hours: parseFloat(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Qualità (1-5)</label>
              <input type="range" min="1" max="5" value={sleep.quality_score || 3} onChange={e => setSleep({...sleep, quality_score: parseInt(e.target.value)})} className="w-full accent-indigo-500" />
              <div className="flex justify-between text-xs text-white/40 mt-1"><span>Pessimo</span><span>Ottimo</span></div>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Note / Interruzioni</label>
              <input type="text" value={sleep.notes || ''} onChange={e => setSleep({...sleep, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Es. risvegli notturni..." />
            </div>
          </div>
        </section>

        {/* STRESS */}
        <section className="bg-white/5 border border-red-500/30 rounded-3xl p-6">
          <div className="flex items-center gap-3 mb-4">
            <HeartPulse className="w-5 h-5 text-red-400" />
            <h2 className="text-lg font-semibold text-white">Stress</h2>
          </div>
          <div className="space-y-4">
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Livello Stress (1-10)</label>
              <input type="range" min="1" max="10" value={stress.stress_level || 5} onChange={e => setStress({...stress, stress_level: parseInt(e.target.value)})} className="w-full accent-red-500" />
              <div className="flex justify-between text-xs text-white/40 mt-1"><span>Relax</span><span>Estremo</span></div>
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Trigger Principali</label>
              <input type="text" value={stress.triggers || ''} onChange={e => setStress({...stress, triggers: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Es. Lavoro, Traffico..." />
            </div>
            <div>
              <label className="text-white/60 text-xs uppercase mb-1 block">Note</label>
              <input type="text" value={stress.notes || ''} onChange={e => setStress({...stress, notes: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
            </div>
          </div>
        </section>

        {/* IDRATAZIONE E DIGESTIONE */}
        <div className="space-y-6">
          <section className="bg-white/5 border border-cyan-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Droplets className="w-5 h-5 text-cyan-400" />
              <h2 className="text-lg font-semibold text-white">Idratazione</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs uppercase mb-1 block">Acqua Bevuta (ml)</label>
                <input type="number" step="100" value={hydration.water_ml || 0} onChange={e => setHydration({...hydration, water_ml: parseInt(e.target.value)})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
              </div>
              <label className="flex items-center gap-2 text-white/80 cursor-pointer">
                <input type="checkbox" checked={hydration.target_reached} onChange={e => setHydration({...hydration, target_reached: e.target.checked})} className="accent-cyan-500 w-4 h-4 rounded" />
                Target Raggiunto?
              </label>
            </div>
          </section>

          <section className="bg-white/5 border border-amber-500/30 rounded-3xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Stethoscope className="w-5 h-5 text-amber-400" />
              <h2 className="text-lg font-semibold text-white">Digestione</h2>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-white/60 text-xs uppercase mb-1 block">Qualità Digestione (1-5)</label>
                <input type="range" min="1" max="5" value={digestion.quality_score || 4} onChange={e => setDigestion({...digestion, quality_score: parseInt(e.target.value)})} className="w-full accent-amber-500" />
              </div>
              <div>
                <label className="text-white/60 text-xs uppercase mb-1 block">Sintomi / Note</label>
                <input type="text" value={digestion.symptoms || ''} onChange={e => setDigestion({...digestion, symptoms: e.target.value})} className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" placeholder="Es. Gonfiore post pranzo..." />
              </div>
            </div>
          </section>
        </div>

        {/* ATTIVITÀ FISICA */}
        <section className="bg-white/5 border border-lime-500/30 rounded-3xl p-6 md:col-span-2">
          <div className="flex items-center gap-3 mb-6">
            <Activity className="w-5 h-5 text-lime-400" />
            <h2 className="text-lg font-semibold text-white">Attività Fisica Oggi</h2>
          </div>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <input type="text" placeholder="Attività (es. Corsa)" value={newActivity.activity_type} onChange={e=>setNewActivity({...newActivity, activity_type: e.target.value})} className="flex-1 min-w-[150px] bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
            <input type="number" placeholder="Minuti" value={newActivity.duration_minutes} onChange={e=>setNewActivity({...newActivity, duration_minutes: e.target.value})} className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
            <select value={newActivity.intensity} onChange={e=>setNewActivity({...newActivity, intensity: e.target.value})} className="w-32 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white appearance-none">
              <option value="bassa">Bassa</option>
              <option value="media">Media</option>
              <option value="alta">Alta</option>
            </select>
            <input type="number" placeholder="Cal" value={newActivity.calories_burned} onChange={e=>setNewActivity({...newActivity, calories_burned: e.target.value})} className="w-24 bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-white" />
            <button onClick={handleAddActivity} disabled={!newActivity.activity_type} className="bg-lime-500 hover:bg-lime-400 text-black p-2.5 rounded-xl disabled:opacity-50">
              <Plus className="w-5 h-5" />
            </button>
          </div>

          <div className="space-y-2">
            {activities.map(a => (
              <div key={a.id} className="flex justify-between items-center bg-black/20 p-3 rounded-xl border border-white/5">
                <div>
                  <span className="font-medium text-white">{a.activity_type}</span>
                  <span className="text-white/50 text-sm ml-2">({a.duration_minutes} min • {a.intensity})</span>
                </div>
                <div className="flex items-center gap-4">
                  {a.calories_burned && <span className="text-lime-400 text-sm">{a.calories_burned} kcal</span>}
                  <button onClick={() => handleRemoveActivity(a.id)} className="text-red-400 hover:text-red-300"><Trash2 className="w-4 h-4"/></button>
                </div>
              </div>
            ))}
            {activities.length === 0 && <p className="text-white/30 text-sm italic">Nessuna attività registrata oggi.</p>}
          </div>
        </section>

      </div>
    </div>
  );
}
