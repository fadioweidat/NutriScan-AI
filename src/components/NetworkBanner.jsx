import { useState, useEffect } from 'react';
import { WifiOff, RotateCw, CheckCircle2 } from 'lucide-react';
import { startSyncListener } from '../lib/sync-manager';
import { supabase } from '../lib/supabase';

export default function NetworkBanner() {
  const [syncStatus, setSyncStatus] = useState('synced'); // 'synced' | 'syncing' | 'offline'
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Start listening to connectivity status and trigger offline sync
    const unsubscribe = startSyncListener(supabase, (status) => {
      setSyncStatus(status);
      if (status === 'offline' || status === 'syncing') {
        setVisible(true);
      } else if (status === 'synced') {
        // Show success briefly, then hide
        setVisible(true);
        const timer = setTimeout(() => {
          setVisible(false);
        }, 3000);
        return () => clearTimeout(timer);
      }
    });

    return () => unsubscribe();
  }, []);

  if (!visible) return null;

  const config = {
    offline: {
      text: "Connessione assente. Le modifiche verranno salvate in locale.",
      bgColor: "bg-amber-500/10 border-amber-500/30 text-amber-300",
      icon: <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
    },
    syncing: {
      text: "Sincronizzazione dati con il server in corso...",
      bgColor: "bg-cyan-500/10 border-cyan-500/30 text-cyan-300",
      icon: <RotateCw className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />
    },
    synced: {
      text: "Tutti i dati sono stati sincronizzati correttamente!",
      bgColor: "bg-emerald-500/10 border-emerald-500/30 text-emerald-300",
      icon: <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
    }
  };

  const active = config[syncStatus] || config.synced;

  return (
    <div className="fixed bottom-6 right-6 left-6 md:left-auto md:w-96 z-50 animate-bounce-short">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl border backdrop-blur-xl shadow-2xl ${active.bgColor} transition-all duration-300`}>
        {active.icon}
        <span className="text-xs font-semibold tracking-wide">
          {active.text}
        </span>
      </div>
    </div>
  );
}
