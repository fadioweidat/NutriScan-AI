import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, Cpu, Layers, HardDrive, ToggleLeft, 
  ToggleRight, ListCollapse, Activity, ShieldAlert 
} from 'lucide-react';
import { auditSystemHealth } from '../lib/operations/system-health-engine.js';

export default function AdminConsoleCard() {
  const { user } = useAuth();
  
  // Local feature flag states (stored in memory/session only)
  const [flags, setFlags] = useState({
    enableAiCoach: true,
    enableOcrScanning: true,
    enableWearablesSync: true,
    enableDigitalTwin: true
  });

  const [systemHealth, setSystemHealth] = useState(null);

  useEffect(() => {
    // Get live system health diagnostics
    auditSystemHealth().then(health => setSystemHealth(health));
  }, []);

  const toggleFlag = (flagKey) => {
    setFlags(prev => ({
      ...prev,
      [flagKey]: !prev[flagKey]
    }));
  };

  return (
    <div className="bg-[#0e0e16] border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header & Warning */}
      <div className="flex items-center gap-3 border-b border-white/5 pb-3">
        <ShieldAlert className="w-6 h-6 text-lime-400" />
        <div>
          <h3 className="text-white font-bold text-base">Console di Amministrazione SaaS</h3>
          <p className="text-[10px] text-slate-500">Governance operativa, log di audit e telemetria aggregata.</p>
        </div>
      </div>

      <div className="p-3 bg-white/[0.02] border border-white/[0.04] rounded-xl text-[10px] text-slate-400 leading-normal flex gap-2">
        <span className="font-semibold text-lime-400 uppercase">Privacy Guard:</span>
        <p>I dati di questa console sono esclusivamente aggregati. Nessun referto medico, biomarcatore o pasto individuale viene mai esposto o loggato in questa interfaccia.</p>
      </div>

      {/* Grid statistics */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Utenti Attivi</span>
            <Users className="w-4 h-4 text-lime-400" />
          </div>
          <p className="text-xl font-bold text-white">270</p>
          <div className="text-[9px] text-slate-500 mt-1 flex gap-1.5">
            <span>Free: 142</span>
            <span>Pro: 85</span>
            <span>Prem: 43</span>
          </div>
        </div>

        {/* AI Usage */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">AI Prompts</span>
            <Cpu className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white">1,280</p>
          <p className="text-[9px] text-slate-500 mt-1">Aggregato ultime 24 ore</p>
        </div>

        {/* OCR Scans */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Scansioni OCR</span>
            <Layers className="w-4 h-4 text-lime-400" />
          </div>
          <p className="text-xl font-bold text-white">320</p>
          <p className="text-[9px] text-slate-500 mt-1">Esami + scontrini completati</p>
        </div>

        {/* Storage Usage */}
        <div className="bg-white/5 border border-white/5 rounded-xl p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[10px] text-slate-400 font-semibold uppercase">Storage Usato</span>
            <HardDrive className="w-4 h-4 text-cyan-400" />
          </div>
          <p className="text-xl font-bold text-white">852.4 MB</p>
          <p className="text-[9px] text-slate-500 mt-1">Documenti PDF archiviati</p>
        </div>
      </div>

      {/* Feature flags toggles */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-white ml-1">Feature Flags (Stato in Memoria Client)</h4>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {Object.entries(flags).map(([key, enabled]) => (
            <button
              key={key}
              onClick={() => toggleFlag(key)}
              className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-xl hover:bg-white/[0.04] transition-all text-left"
            >
              <span className="text-xs text-slate-300 font-medium capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </span>
              {enabled ? (
                <ToggleRight className="w-6 h-6 text-lime-400" />
              ) : (
                <ToggleLeft className="w-6 h-6 text-slate-600" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* System status latencies */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-white ml-1">Telemetria Latenza Servizi</h4>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {systemHealth ? (
            Object.entries(systemHealth).map(([service, data]) => (
              <div key={service} className="bg-white/5 border border-white/5 p-2 rounded-xl text-center">
                <p className="text-[10px] text-slate-500">{service}</p>
                <p className="text-sm font-bold text-white mt-1">{data.latency}ms</p>
                <span className={`inline-block text-[9px] font-semibold mt-1 px-1.5 py-0.5 rounded-full ${
                  data.status === 'OK' ? 'bg-green-500/20 text-green-400' :
                  data.status === 'Warning' ? 'bg-yellow-500/20 text-yellow-400' :
                  'bg-red-500/20 text-red-400'
                }`}>
                  {data.status}
                </span>
              </div>
            ))
          ) : (
            <p className="text-xs text-slate-500">Caricamento latenze...</p>
          )}
        </div>
      </div>

      {/* Audit Log Trail */}
      <div className="space-y-3">
        <h4 className="text-xs font-bold text-white ml-1">Log di Audit Amministrativi Recenti</h4>
        <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-2 text-[10px] text-slate-400 font-mono max-h-40 overflow-y-auto">
          <p className="flex justify-between border-b border-white/5 pb-1">
            <span>[2026-06-21 16:15] USER_REFRESH_TOKEN_COMPLETED - correlationId=8a3ef10</span>
            <span className="text-slate-500">user=795e2fd0</span>
          </p>
          <p className="flex justify-between border-b border-white/5 pb-1">
            <span>[2026-06-21 16:22] BACKUP_INTEGRITY_CHECK - success=true - type=restore_simulation</span>
            <span className="text-slate-500">system=validator</span>
          </p>
          <p className="flex justify-between border-b border-white/5 pb-1">
            <span>[2026-06-21 16:40] CLIENT_RATE_LIMIT_TRIGGERED - ip=127.0.0.1 - endpoint=/api/ocr</span>
            <span className="text-slate-500">user=45da8be1</span>
          </p>
          <p className="flex justify-between">
            <span>[2026-06-21 16:55] LOCAL_STORAGE_POLICIES_AUDIT - status=clean - no_clinical_leak</span>
            <span className="text-slate-500">security=auditor</span>
          </p>
        </div>
      </div>
    </div>
  );
}
