import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import healthEngine from '../lib/health-engine';
import { Loader2, Plus, Trash2, Pill, Activity } from 'lucide-react';

export default function MedicationsPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [medications, setMedications] = useState([]);
  const [supplements, setSupplements] = useState([]);
  
  const [newMed, setNewMed] = useState({ medication_name: '', dosage: '', frequency: '' });
  const [newSupp, setNewSupp] = useState({ supplement_name: '', dosage: '', frequency: '' });

  useEffect(() => {
    async function loadData() {
      if (!user) return;
      try {
        const m = await healthEngine.getMedications(user.id);
        const s = await healthEngine.getSupplements(user.id);
        setMedications(m || []);
        setSupplements(s || []);
      } catch (err) {
        console.error("Error loading medications:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [user]);

  const handleAddMed = async () => {
    if (!newMed.medication_name.trim()) return;
    try {
      const added = await healthEngine.addMedication(user.id, newMed);
      setMedications([added, ...medications]);
      setNewMed({ medication_name: '', dosage: '', frequency: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveMed = async (id) => {
    try {
      await healthEngine.removeMedication(id);
      setMedications(medications.filter(m => m.id !== id));
    } catch (err) {
      console.error(err);
    }
  };

  const handleAddSupp = async () => {
    if (!newSupp.supplement_name.trim()) return;
    try {
      const added = await healthEngine.addSupplement(user.id, newSupp);
      setSupplements([added, ...supplements]);
      setNewSupp({ supplement_name: '', dosage: '', frequency: '' });
    } catch (err) {
      console.error(err);
    }
  };

  const handleRemoveSupp = async (id) => {
    try {
      await healthEngine.removeSupplement(id);
      setSupplements(supplements.filter(s => s.id !== id));
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

  return (
    <div className="max-w-3xl mx-auto px-4 py-6 space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-white">Farmaci & Integratori</h1>
        <p className="text-white/40 text-sm mt-1">
          Gestisci i tuoi farmaci e integratori. Queste informazioni aiutano l'AI a fornirti consigli nutrizionali più precisi.
        </p>
      </div>

      {/* FARMACI */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-red-500/20 rounded-xl">
            <Activity className="w-6 h-6 text-red-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Farmaci</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            value={newMed.medication_name}
            onChange={e => setNewMed({...newMed, medication_name: e.target.value})}
            placeholder="Nome farmaco"
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500/50 focus:outline-none"
          />
          <input
            type="text"
            value={newMed.dosage}
            onChange={e => setNewMed({...newMed, dosage: e.target.value})}
            placeholder="Dosaggio (es. 50mg)"
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newMed.frequency}
              onChange={e => setNewMed({...newMed, frequency: e.target.value})}
              placeholder="Frequenza (es. 1/die)"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-red-500/50 focus:outline-none"
            />
            <button
              onClick={handleAddMed}
              disabled={!newMed.medication_name.trim()}
              className="p-3 bg-red-500 hover:bg-red-400 text-black font-semibold rounded-xl disabled:bg-white/10 disabled:text-white/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {medications.map(m => (
            <div key={m.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <div>
                <span className="text-white font-medium capitalize block">{m.medication_name}</span>
                <span className="text-white/50 text-sm">{m.dosage} • {m.frequency}</span>
              </div>
              <button onClick={() => handleRemoveMed(m.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {medications.length === 0 && <p className="text-white/30 text-sm italic">Nessun farmaco registrato.</p>}
        </div>
      </section>

      {/* INTEGRATORI */}
      <section className="bg-white/5 border border-white/10 rounded-3xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-blue-500/20 rounded-xl">
            <Pill className="w-6 h-6 text-blue-400" />
          </div>
          <h2 className="text-lg font-semibold text-white">Integratori</h2>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 mb-4">
          <input
            type="text"
            value={newSupp.supplement_name}
            onChange={e => setNewSupp({...newSupp, supplement_name: e.target.value})}
            placeholder="Nome integratore"
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
          />
          <input
            type="text"
            value={newSupp.dosage}
            onChange={e => setNewSupp({...newSupp, dosage: e.target.value})}
            placeholder="Dosaggio (es. 2000 UI)"
            className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
          />
          <div className="flex gap-2">
            <input
              type="text"
              value={newSupp.frequency}
              onChange={e => setNewSupp({...newSupp, frequency: e.target.value})}
              placeholder="Frequenza (es. mattina)"
              className="flex-1 bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500/50 focus:outline-none"
            />
            <button
              onClick={handleAddSupp}
              disabled={!newSupp.supplement_name.trim()}
              className="p-3 bg-blue-500 hover:bg-blue-400 text-black font-semibold rounded-xl disabled:bg-white/10 disabled:text-white/30 transition-colors"
            >
              <Plus className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="space-y-2">
          {supplements.map(s => (
            <div key={s.id} className="flex items-center justify-between p-4 bg-black/20 rounded-xl border border-white/5">
              <div>
                <span className="text-white font-medium capitalize block">{s.supplement_name}</span>
                <span className="text-white/50 text-sm">{s.dosage} • {s.frequency}</span>
              </div>
              <button onClick={() => handleRemoveSupp(s.id)} className="p-2 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
          {supplements.length === 0 && <p className="text-white/30 text-sm italic">Nessun integratore registrato.</p>}
        </div>
      </section>

    </div>
  );
}
