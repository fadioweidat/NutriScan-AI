import { useState, useEffect } from 'react';
import { RefreshCw, CheckCircle2, Power, Lock, AlertCircle, ShieldAlert } from 'lucide-react';
import manager from '../lib/connectors/health-provider-manager';

export default function WearablesCard({ supabase, onSyncComplete }) {
  const [connections, setConnections] = useState({});
  const [loading, setLoading] = useState({});
  const [syncing, setSyncing] = useState(false);
  const [consent, setConsent] = useState({});
  const [showConsentModal, setShowConsentModal] = useState(null); // providerId or null
  const [errorMsg, setErrorMsg] = useState(null);

  const providersList = [
    { id: 'apple_health', name: 'Apple Health', desc: 'Sincronizza passi, sonno, e frequenza cardiaca da iOS.' },
    { id: 'google_health_connect', name: 'Google Health Connect', desc: 'Centralizza i dati di salute su Android.' },
    { id: 'google_fit', name: 'Google Fit', desc: 'Connetti il tuo account Google Fit ed attività.' },
    { id: 'fitbit', name: 'Fitbit', desc: 'Importa passi, sonno dettagliato e battiti da Fitbit.' },
    { id: 'garmin', name: 'Garmin Connect', desc: 'Importa allenamenti avanzati, HRV e stress Garmin.' },
    { id: 'oura', name: 'Oura Ring', desc: 'Sincronizza sonno profondo, temperatura e HRV Oura.' },
    { id: 'withings', name: 'Withings Health Mate', desc: 'Sincronizza peso corporeo, BMI e pressione arteriosa.' },
    { id: 'samsung_health', name: 'Samsung Health', desc: 'Importa passi e sonno da dispositivi Samsung.' }
  ];

  useEffect(() => {
    loadConnections();
  }, [supabase]);

  async function loadConnections() {
    try {
      const activeList = await manager.getConnectedProviders(supabase);
      const connState = {};
      activeList.forEach(id => {
        connState[id] = true;
      });
      setConnections(connState);
    } catch (e) {
      console.error("Errore caricamento connessioni wearables:", e);
    }
  }

  async function handleToggleConnection(providerId) {
    if (connections[providerId]) {
      // Disconnect
      setLoading(prev => ({ ...prev, [providerId]: true }));
      try {
        await manager.disconnectProvider(supabase, providerId);
        setConnections(prev => ({ ...prev, [providerId]: false }));
        if (onSyncComplete) onSyncComplete();
      } catch (err) {
        setErrorMsg(`Errore disconnessione: ${err.message}`);
      } finally {
        setLoading(prev => ({ ...prev, [providerId]: false }));
      }
    } else {
      // Show explicit consent modal first
      setShowConsentModal(providerId);
    }
  }

  async function confirmConnection() {
    const providerId = showConsentModal;
    if (!providerId) return;

    if (!consent[providerId]) {
      setErrorMsg("È necessario accettare il consenso sul trattamento dei dati per procedere.");
      return;
    }

    setLoading(prev => ({ ...prev, [providerId]: true }));
    setShowConsentModal(null);
    setErrorMsg(null);

    try {
      // Simulate OAuth flow redirect and callback exchange
      const mockAuthCode = Math.random().toString(36).substring(7);
      await manager.connectProvider(supabase, providerId, mockAuthCode, true);
      setConnections(prev => ({ ...prev, [providerId]: true }));
      
      // Trigger instant sync post connection
      await handleSync(providerId);
    } catch (err) {
      setErrorMsg(`Errore connessione: ${err.message}`);
    } finally {
      setLoading(prev => ({ ...prev, [providerId]: false }));
    }
  }

  async function handleSync(providerId) {
    setSyncing(true);
    setErrorMsg(null);
    try {
      const syncedData = await manager.syncMetrics(supabase, providerId, 30);
      if (onSyncComplete) {
        onSyncComplete(syncedData);
      }
    } catch (err) {
      setErrorMsg(`Errore sincronizzazione ${providerId}: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  async function handleSyncAll() {
    setSyncing(true);
    setErrorMsg(null);
    const active = Object.keys(connections).filter(k => connections[k]);
    if (active.length === 0) {
      setErrorMsg("Nessun provider wearable collegato. Connetti almeno un servizio.");
      setSyncing(false);
      return;
    }

    let aggregatedData = [];
    try {
      for (const id of active) {
        const data = await manager.syncMetrics(supabase, id, 30);
        aggregatedData = [...aggregatedData, ...data];
      }
      // Deduplicate aggregated datasets
      const finalData = manager.deduplicateAndMapMetrics(aggregatedData);
      if (onSyncComplete) {
        onSyncComplete(finalData);
      }
    } catch (err) {
      setErrorMsg(`Sincronizzazione fallita: ${err.message}`);
    } finally {
      setSyncing(false);
    }
  }

  return (
    <div className="glass-card p-6 space-y-6" role="region" aria-label="Integrazione Wearables & Dispositivi">
      <div className="flex items-center justify-between border-b border-white/[0.06] pb-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
            <RefreshCw className={`w-5 h-5 text-cyan-400 ${syncing ? 'animate-spin' : ''}`} />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-1.5">
              Connessione Wearables
            </h2>
            <p className="text-xs text-slate-400">Collega sensori ed app esterne per importare i tuoi dati sanitari</p>
          </div>
        </div>
        
        <button
          onClick={handleSyncAll}
          disabled={syncing}
          className="px-4 py-2 bg-cyan-500/20 hover:bg-cyan-500/35 border border-cyan-500/30 text-cyan-400 text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5"
          aria-label="Sincronizza tutti i sensori connessi"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Sincronizza
        </button>
      </div>

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Grid of Providers */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        {providersList.map(provider => {
          const isConnected = !!connections[provider.id];
          const isLoading = !!loading[provider.id];

          return (
            <div 
              key={provider.id} 
              className={`p-4 rounded-2xl border transition-all space-y-4 flex flex-col justify-between ${
                isConnected 
                  ? 'bg-cyan-500/[0.02] border-cyan-500/20 shadow-md shadow-cyan-500/[0.02]' 
                  : 'bg-white/[0.01] border-white/[0.04] hover:bg-white/[0.02]'
              }`}
            >
              <div className="space-y-1.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-white">{provider.name}</span>
                  {isConnected && <CheckCircle2 className="w-4 h-4 text-cyan-400" />}
                </div>
                <p className="text-[10px] text-slate-400 leading-relaxed">{provider.desc}</p>
              </div>

              <div className="flex items-center gap-2 pt-2 border-t border-white/[0.04]">
                <button
                  onClick={() => handleToggleConnection(provider.id)}
                  disabled={isLoading}
                  className={`flex-1 py-1.5 rounded-xl text-[10px] font-bold transition-all flex items-center justify-center gap-1 ${
                    isConnected
                      ? 'bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/20 text-rose-400'
                      : 'bg-white/5 hover:bg-white/10 text-white'
                  }`}
                  aria-label={isConnected ? `Disconnetti ${provider.name}` : `Connetti ${provider.name}`}
                >
                  <Power className="w-3 h-3" />
                  {isConnected ? 'Scollega' : 'Collega'}
                </button>

                {isConnected && (
                  <button
                    onClick={() => handleSync(provider.id)}
                    disabled={syncing}
                    className="p-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 transition-colors"
                    title="Sincronizza ora"
                    aria-label={`Sincronizza ${provider.name}`}
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Explicit Privacy Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4">
          <div className="glass-card max-w-md w-full p-6 shadow-2xl relative space-y-5 border border-cyan-500/30">
            <h4 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-cyan-400 shrink-0" />
              Consenso esplicito al trattamento dati
            </h4>

            <div className="space-y-3 text-xs leading-relaxed text-slate-300 bg-white/[0.02] p-4 rounded-xl border border-white/[0.04]">
              <p>
                NutriScan AI richiede la tua autorizzazione esplicita per collegarsi a **{providersList.find(p => p.id === showConsentModal)?.name}**.
              </p>
              <ul className="list-disc list-inside space-y-1">
                <li>I dati saranno importati in tempo reale solo all'avvio della sincronizzazione.</li>
                <li>I dati sensibili non verranno salvati su file persistenti locali (localStorage/sessionStorage).</li>
                <li>I token OAuth saranno archiviati cifrati sul server Supabase.</li>
                <li>Puoi revocare questo consenso ed eliminare tutti i dati condivisi in qualsiasi momento premendo 'Scollega'.</li>
              </ul>
            </div>

            <div className="flex items-center gap-2.5">
              <input
                type="checkbox"
                id={`consent-check-${showConsentModal}`}
                checked={!!consent[showConsentModal]}
                onChange={e => setConsent(prev => ({ ...prev, [showConsentModal]: e.target.checked }))}
                className="w-4 h-4 bg-white/10 rounded accent-cyan-400 cursor-pointer"
              />
              <label 
                htmlFor={`consent-check-${showConsentModal}`} 
                className="text-[11px] text-slate-300 cursor-pointer select-none"
              >
                Acconsento esplicitamente al trattamento e alla sincronizzazione dei miei dati.
              </label>
            </div>

            <div className="pt-2 flex justify-end gap-3 text-xs font-semibold">
              <button 
                onClick={() => {
                  setShowConsentModal(null);
                  setErrorMsg(null);
                }}
                className="px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-white transition-colors"
              >
                Annulla
              </button>
              <button 
                onClick={confirmConnection}
                className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-600 text-black transition-colors"
              >
                Autorizza e Connetti
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
