import { useState, useEffect } from 'react';
import { 
  Shield, Server, Activity, TrendingUp, Users, 
  CreditCard, HardDrive, Cpu, Loader2, RefreshCw 
} from 'lucide-react';
import { ReleaseConfig } from '../lib/logger/monitoring-integration.js';

export default function ProductionAdminDashboard() {
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState(null);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    setLoading(true);
    // Simulate real production monitoring API fetch delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    setMetrics({
      uptime: '99.98%',
      errorRate: '0.04%',
      latencies: {
        db: '12ms',
        ai: '840ms',
        ocr: '1250ms',
        storage: '45ms'
      },
      storageUsed: '4.2 GB / 100 GB',
      activeUsers: 840,
      plansDistribution: {
        free: 520,
        pro: 240,
        premium: 80
      },
      paymentMetrics: {
        mrr: '€3,999',
        failedPaymentsCount: 2
      }
    });
    setLoading(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center p-12 bg-white/5 border border-white/10 rounded-2xl">
        <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-white/10 pb-4">
        <div>
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-lime-400" />
            Production Infrastructure & Live Operations
          </h2>
          <p className="text-xs text-white/50 mt-1">
            Console di telemetria e monitoraggio aggregato. Nessun dato clinico individuale viene esposto.
          </p>
        </div>
        <button 
          onClick={fetchMetrics}
          className="p-2 bg-white/5 hover:bg-white/10 text-white/70 rounded-xl transition-all flex items-center gap-1.5 text-xs font-semibold"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Aggiorna
        </button>
      </div>

      {/* Version Card Context */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Versione Rilascio</span>
          <p className="text-sm font-semibold text-lime-400 mt-0.5">{ReleaseConfig.version}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Commit Hash</span>
          <p className="text-sm font-mono text-white/70 mt-0.5">{ReleaseConfig.commitHash}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Build Date</span>
          <p className="text-xs text-white/60 mt-0.5">{new Date(ReleaseConfig.buildDate).toLocaleDateString()}</p>
        </div>
        <div>
          <span className="text-[10px] text-slate-500 uppercase font-bold tracking-wider">Ambiente</span>
          <p className="text-xs font-bold text-cyan-400 mt-0.5 uppercase">{ReleaseConfig.environment}</p>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Core Stats */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-xl space-y-4">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Server className="w-4 h-4 text-lime-400" />
            Stato Infrastruttura
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] text-slate-500">Uptime</span>
              <p className="text-base font-bold text-white">{metrics.uptime}</p>
            </div>
            <div>
              <span className="text-[10px] text-slate-500">Error Rate</span>
              <p className="text-base font-bold text-emerald-400">{metrics.errorRate}</p>
            </div>
          </div>
          <div>
            <span className="text-[10px] text-slate-500 flex items-center gap-1">
              <HardDrive className="w-3.5 h-3.5" />
              Storage Volume Utilizzato
            </span>
            <p className="text-xs text-white/70 mt-1">{metrics.storageUsed}</p>
          </div>
        </div>

        {/* Latencies */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Cpu className="w-4 h-4 text-cyan-400" />
            Latenza Servizi
          </h3>
          <div className="space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Database (Supabase)</span>
              <span className="text-white font-semibold">{metrics.latencies.db}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">OpenAI (Nutrition Chat)</span>
              <span className="text-white font-semibold">{metrics.latencies.ai}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">USDA API / OCR Scans</span>
              <span className="text-white font-semibold">{metrics.latencies.ocr}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Storage Uploads</span>
              <span className="text-white font-semibold">{metrics.latencies.storage}</span>
            </div>
          </div>
        </div>

        {/* SaaS & Subscriptions */}
        <div className="bg-white/[0.02] border border-white/5 p-5 rounded-xl space-y-3">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
            <Users className="w-4 h-4 text-purple-400" />
            Commercial & SaaS
          </h3>
          <div className="flex justify-between text-xs border-b border-white/5 pb-2">
            <span className="text-slate-500">Utenti Attivi</span>
            <span className="text-white font-bold">{metrics.activeUsers}</span>
          </div>
          <div className="space-y-1.5 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Piani Free</span>
              <span className="text-white">{metrics.plansDistribution.free}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Piani Pro</span>
              <span className="text-lime-400 font-medium">{metrics.plansDistribution.pro}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Piani Premium</span>
              <span className="text-cyan-400 font-bold">{metrics.plansDistribution.premium}</span>
            </div>
          </div>
          <div className="pt-2 border-t border-white/5 flex justify-between text-xs">
            <span className="text-slate-500 flex items-center gap-1">
              <CreditCard className="w-3.5 h-3.5" />
              MRR Stimato (Stripe)
            </span>
            <span className="text-lime-400 font-bold">{metrics.paymentMetrics.mrr}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
