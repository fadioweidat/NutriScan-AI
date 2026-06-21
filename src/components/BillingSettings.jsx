import { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { 
  CreditCard, Check, AlertTriangle, Shield, 
  ExternalLink, Sparkles, Loader2, RefreshCw
} from 'lucide-react';
import { StripeSimulator } from '../lib/operations/stripe-simulator.js';
import { SUBSCRIPTION_TIERS } from '../lib/operations/subscription-manager.js';

export default function BillingSettings() {
  const { user } = useAuth();
  
  // Read current subscription state from user_metadata
  const currentTier = user?.user_metadata?.subscription_tier || SUBSCRIPTION_TIERS.FREE;
  const currentInterval = user?.user_metadata?.subscription_interval || 'monthly';
  const isTrial = user?.user_metadata?.subscription_is_trial || false;

  const [loading, setLoading] = useState(false);
  const [activePortal, setActivePortal] = useState(false); // Simulated Stripe customer portal overlay
  const [portalActionMsg, setPortalActionMsg] = useState('');

  // Starts Stripe Checkout session
  const handleCheckout = async (targetTier) => {
    setLoading(true);
    try {
      const res = await StripeSimulator.createCheckoutSession(user.id, targetTier, 'monthly');
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      console.error(e);
      alert("Errore nell'apertura della sessione di checkout.");
    } finally {
      setLoading(false);
    }
  };

  // Open Stripe Customer Portal
  const handleOpenPortal = async () => {
    setLoading(true);
    try {
      const res = await StripeSimulator.createPortalSession(user.id);
      if (res && res.url) {
        window.location.href = res.url;
      }
    } catch (e) {
      console.error(e);
      alert("Errore nell'apertura del portale di fatturazione.");
    } finally {
      setLoading(false);
    }
  };

  // Handle plan updates inside simulated Portal (fallback / legacy support)
  const handlePortalAction = async (action, targetTier = null) => {
    setLoading(true);
    try {
      if (action === 'cancel') {
        setPortalActionMsg('Richiesta inviata. Il piano verrà aggiornato via webhook.');
      } else if (action === 'upgrade' && targetTier) {
        setPortalActionMsg(`Richiesta di upgrade a ${targetTier.toUpperCase()} inviata.`);
      } else if (action === 'downgrade' && targetTier) {
        setPortalActionMsg(`Richiesta di downgrade a ${targetTier.toUpperCase()} inviata.`);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const closePortal = () => {
    setActivePortal(false);
    window.location.reload();
  };

  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl p-6 space-y-6">
      {/* SaaS Architecture Warning */}
      <div className="flex items-start gap-3 bg-lime-500/10 border border-lime-500/30 p-4 rounded-xl">
        <Shield className="w-5 h-5 text-lime-400 shrink-0 mt-0.5" />
        <div>
          <p className="text-xs font-bold text-lime-400">Billing UI mock / Stripe architecture prepared, not production billing.</p>
          <p className="text-[10px] text-white/50 mt-1">
            In produzione, la modifica degli abbonamenti avviene solo via webhook sul server. Questa interfaccia simula Stripe Checkout e Stripe Customer Portal integrati su Supabase.
          </p>
        </div>
      </div>

      {/* Current plan status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white/[0.02] border border-white/5 p-4 rounded-xl">
        <div>
          <span className="text-[10px] uppercase font-bold text-slate-500 tracking-wider">Abbonamento Attivo</span>
          <h3 className="text-lg font-bold text-white flex items-center gap-2 mt-1">
            NutriScan {currentTier.toUpperCase()}
            {currentTier !== SUBSCRIPTION_TIERS.FREE && (
              <span className="bg-lime-500/20 text-lime-400 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                {isTrial ? 'Trial Attiva' : 'Premium'}
              </span>
            )}
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            {currentTier === SUBSCRIPTION_TIERS.FREE 
              ? 'Hai accesso solo alle funzioni base con limiti giornalieri.' 
              : `Rinnovo automatico il ${new Date(Date.now() + 30*24*60*60*1000).toLocaleDateString()} (${currentInterval === 'annual' ? 'Annuale' : 'Mensile'})`
            }
          </p>
        </div>

        {currentTier === SUBSCRIPTION_TIERS.FREE ? (
          <a href="#pricing-options" className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black font-semibold text-xs rounded-lg transition-colors">
            Vedi Piani
          </a>
        ) : (
          <button 
            onClick={handleOpenPortal}
            className="flex items-center gap-1.5 px-4 py-2 bg-white/5 hover:bg-white/10 text-white border border-white/10 font-semibold text-xs rounded-lg transition-colors"
          >
            <CreditCard className="w-3.5 h-3.5" />
            Gestisci su Stripe
            <ExternalLink className="w-3 h-3" />
          </button>
        )}
      </div>

      {/* Pricing options (Visible to Free users to upgrade) */}
      {currentTier === SUBSCRIPTION_TIERS.FREE && (
        <div id="pricing-options" className="space-y-3">
          <h4 className="text-xs font-bold text-white ml-1">Piani Disponibili</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* PRO */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h5 className="text-sm font-bold text-white">NutriScan Pro</h5>
                <p className="text-[11px] text-slate-400 mt-1">Scansioni OCR illimitate, AI Coach illimitato e wearables abilitati.</p>
                <p className="text-sm font-extrabold text-lime-400 mt-3">€9.99 / mese</p>
              </div>
              <button
                onClick={() => handleCheckout(SUBSCRIPTION_TIERS.PRO)}
                disabled={loading}
                className="w-full mt-4 py-2 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-500/50 text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Attiva Pro (14d trial)'}
              </button>
            </div>

            {/* PREMIUM */}
            <div className="bg-white/[0.02] border border-white/10 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <h5 className="text-sm font-bold text-white flex items-center gap-1.5">
                  NutriScan Premium <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                </h5>
                <p className="text-[11px] text-slate-400 mt-1">Digital Twin in tempo reale, What-If simulator e regressioni linear forecast.</p>
                <p className="text-sm font-extrabold text-cyan-400 mt-3">€19.99 / mese</p>
              </div>
              <button
                onClick={() => handleCheckout(SUBSCRIPTION_TIERS.PREMIUM)}
                disabled={loading}
                className="w-full mt-4 py-2 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-semibold text-xs rounded-lg transition-colors flex items-center justify-center gap-1.5"
              >
                {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : 'Attiva Premium (14d trial)'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Simulated Stripe Customer Portal Overlay */}
      {activePortal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/5 pb-3">
              <h3 className="text-white font-bold text-base flex items-center gap-2">
                <Shield className="w-5 h-5 text-lime-400" />
                Stripe Customer Portal (Simulato)
              </h3>
              <button 
                onClick={closePortal}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2 py-1 rounded bg-white/5"
              >
                Chiudi Portal
              </button>
            </div>

            {portalActionMsg ? (
              <div className="p-3 bg-lime-500/10 border border-lime-500/30 rounded-xl text-lime-400 text-xs">
                {portalActionMsg}
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-xs text-slate-400 leading-relaxed">
                  Stai gestendo le informazioni di pagamento collegate all'account di **{user?.email}**. Seleziona una delle azioni disponibili su Stripe:
                </p>

                <div className="space-y-2">
                  {currentTier === SUBSCRIPTION_TIERS.PRO && (
                    <button
                      onClick={() => handlePortalAction('upgrade', SUBSCRIPTION_TIERS.PREMIUM)}
                      disabled={loading}
                      className="w-full py-3 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/50 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Passa a Premium (€19.99/mese)'}
                    </button>
                  )}
                  {currentTier === SUBSCRIPTION_TIERS.PREMIUM && (
                    <button
                      onClick={() => handlePortalAction('downgrade', SUBSCRIPTION_TIERS.PRO)}
                      disabled={loading}
                      className="w-full py-3 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-500/50 text-black font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                    >
                      {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Downgrade a Pro (€9.99/mese)'}
                    </button>
                  )}

                  <button
                    onClick={() => handlePortalAction('cancel')}
                    disabled={loading}
                    className="w-full py-3 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/30 font-semibold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5"
                  >
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Disdici Abbonamento'}
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
