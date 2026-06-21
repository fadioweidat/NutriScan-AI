import { useState, useEffect } from 'react';
import { ShieldCheck, RefreshCw, AlertTriangle, AlertCircle, Info, Database, Cpu, Cloud, Brain, RefreshCcw } from 'lucide-react';
import healthEngine from '../lib/operations/system-health-engine';
import { supabase } from '../lib/supabase';

export default function SystemStatusCard() {
  const [healthData, setHealthData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  useEffect(() => {
    runDiagnostics();
  }, []);

  async function runDiagnostics() {
    setLoading(true);
    try {
      const data = await healthEngine.auditSystemHealth(supabase);
      setHealthData(data);
      setLastUpdated(new Date().toLocaleTimeString('it-IT'));
    } catch (e) {
      console.error("Errore diagnostica sistema:", e);
    } finally {
      setLoading(false);
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'OK':
        return <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]" />;
      case 'Warning':
        return <div className="w-2.5 h-2.5 rounded-full bg-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] animate-pulse" />;
      case 'Critical':
      default:
        return <div className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)] animate-ping" />;
    }
  };

  const getStatusTextClass = (status) => {
    switch (status) {
      case 'OK': return 'text-emerald-400';
      case 'Warning': return 'text-amber-400';
      case 'Critical':
      default:
        return 'text-rose-400 font-extrabold';
    }
  };

  const getModuleIcon = (name) => {
    const lower = name.toLowerCase();
    if (lower.includes('supabase') || lower.includes('database')) {
      return <Database className="w-4 h-4 text-cyan-400" />;
    }
    if (lower.includes('functions') || lower.includes('ocr')) {
      return <Cpu className="w-4 h-4 text-purple-400" />;
    }
    if (lower.includes('storage') || lower.includes('pwa')) {
      return <Cloud className="w-4 h-4 text-indigo-400" />;
    }
    if (lower.includes('ai')) {
      return <Brain className="w-4 h-4 text-pink-400" />;
    }
    return <RefreshCcw className="w-4 h-4 text-lime-400" />;
  };

  return (
    <div className="glass-card p-6 relative overflow-hidden space-y-6" role="region" aria-label="Governance & Stato del Sistema">
      {/* Background glow effects */}
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl" />
      <div className="absolute -bottom-12 -right-12 w-32 h-32 bg-lime-500/5 rounded-full blur-2xl" />

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <ShieldCheck className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white">Stato del Sistema & Governance</h3>
            <p className="text-[11px] text-slate-400">Monitoraggio latenze, disponibilità e conformità di sicurezza</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="text-[10px] text-slate-500 hidden sm:inline">Aggiornato alle {lastUpdated}</span>
          )}
          <button
            onClick={runDiagnostics}
            disabled={loading}
            className="p-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-all disabled:opacity-40"
            title="Aggiorna diagnostica"
            aria-label="Ricarica stato diagnostica"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {loading && !healthData ? (
        <div className="flex items-center justify-center py-10">
          <RefreshCw className="w-6 h-6 text-cyan-400 animate-spin" />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
          {healthData && Object.entries(healthData).map(([name, item]) => (
            <div 
              key={name}
              className="p-4 rounded-2xl border border-white/[0.03] bg-white/[0.01] hover:bg-white/[0.02] transition-all flex flex-col justify-between space-y-3"
            >
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  {getModuleIcon(name)}
                  <span className="text-xs font-bold text-white">{name}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  {getStatusIcon(item.status)}
                  <span className={`text-[10px] font-semibold ${getStatusTextClass(item.status)}`}>
                    {item.status}
                  </span>
                </div>
              </div>

              <div className="space-y-1">
                <p className="text-[10px] text-slate-400 leading-normal">{item.desc}</p>
                {item.latency > 0 ? (
                  <span className="text-[10px] font-mono text-cyan-400/90">{item.latency} ms</span>
                ) : (
                  <span className="text-[10px] font-mono text-slate-500">N/D</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Safety Notice */}
      <div className="p-3 rounded-xl bg-cyan-500/[0.02] border border-cyan-500/10 text-[10px] text-cyan-400/90 leading-relaxed flex gap-2">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          <strong>Nota di Sicurezza:</strong> Questa console è riservata agli amministratori. I dati raccolti sono anonimizzati (User hash SHA-256) ed elaborati in memoria React. Nessun log clinico o referto scontrino è esposto o persistito nel browser.
        </span>
      </div>
    </div>
  );
}
