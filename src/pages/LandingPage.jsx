import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  Leaf, ChevronDown, Check, Shield, HelpCircle, 
  BookOpen, Star, Sparkles, MessageSquare, Heart, ShieldCheck
} from 'lucide-react';
import { PRIVACY_POLICY, COOKIE_POLICY, TERMS_OF_SERVICE, FAQ_ITEMS } from '../lib/operations/legal-docs.js';

export default function LandingPage() {
  const navigate = useNavigate();
  const [activeFaq, setActiveFaq] = useState(null);
  const [billingInterval, setBillingInterval] = useState('monthly'); // 'monthly' | 'annual'
  const [legalModal, setLegalModal] = useState(null); // null | 'privacy' | 'cookies' | 'terms'

  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  const getLegalContent = () => {
    if (legalModal === 'privacy') return PRIVACY_POLICY;
    if (legalModal === 'cookies') return COOKIE_POLICY;
    if (legalModal === 'terms') return TERMS_OF_SERVICE;
    return '';
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] text-slate-100 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-lime-500/10 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[400px] h-[400px] bg-cyan-500/5 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-0 left-1/3 w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[160px] pointer-events-none" />

      {/* Header */}
      <header className="sticky top-0 z-40 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] px-4 md:px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-lime-500/20 border border-lime-500/30 flex items-center justify-center">
            <Leaf className="w-4 h-4 text-lime-400" />
          </div>
          <span className="font-bold text-lg text-white">Nutri<span className="text-lime-400">Scan</span> AI</span>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold text-slate-300 hover:text-white transition-colors"
          >
            Accedi
          </button>
          <button 
            onClick={() => navigate('/login')}
            className="px-4 py-2 text-sm font-semibold bg-lime-500 hover:bg-lime-400 text-black rounded-xl transition-all duration-300 shadow-lg shadow-lime-500/20"
          >
            Registrati
          </button>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative z-10 max-w-5xl mx-auto px-4 pt-16 pb-20 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] border border-white/[0.06] text-xs font-semibold text-lime-400 mb-6 animate-pulse">
          <Sparkles className="w-3.5 h-3.5" />
          Nutrizione Intelligente Basata sull'AI
        </div>
        <h1 className="text-4xl md:text-6xl font-extrabold text-white tracking-tight leading-[1.1] mb-6">
          Scopri cosa manca nella tua <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-lime-400 to-emerald-400">
            Alimentazione & Prevenzione
          </span>
        </h1>
        <p className="max-w-2xl mx-auto text-slate-400 text-base md:text-lg mb-8 leading-relaxed">
          NutriScan AI analizza la tua dieta, i tuoi referti medici e i tuoi wearables in tempo reale, 
          aiutandoti ad ottimizzare la bio-disponibilità nutrizionale in modo esclusivamente educativo e sicuro.
        </p>
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <button 
            onClick={() => navigate('/login')}
            className="w-full sm:w-auto px-8 py-4 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl transition-all shadow-xl shadow-lime-500/20 text-base"
          >
            Inizia Ora Gratuitamente
          </button>
          <a 
            href="#pricing"
            className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white font-semibold rounded-xl border border-white/10 transition-all text-base"
          >
            Vedi Piani & Prezzi
          </a>
        </div>

        {/* Dynamic Mockup Graphics */}
        <div className="mt-16 bg-white/[0.02] border border-white/[0.08] rounded-2xl p-4 shadow-2xl relative">
          <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0f] via-transparent to-transparent z-10" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 text-left">
            <div className="bg-white/5 border border-white/5 rounded-xl p-5">
              <MessageSquare className="w-8 h-8 text-lime-400 mb-3" />
              <h3 className="text-white font-semibold text-base mb-1">AI Health Coach</h3>
              <p className="text-slate-400 text-xs">Priorità nutrizionali generate integrando esami del sangue ed eventuali terapie in corso.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-5">
              <Heart className="w-8 h-8 text-cyan-400 mb-3" />
              <h3 className="text-white font-semibold text-base mb-1">Wearables Sync</h3>
              <p className="text-slate-400 text-xs">Importazione automatica di sonno, passi, battito cardiaco e HRV con report integrati.</p>
            </div>
            <div className="bg-white/5 border border-white/5 rounded-xl p-5">
              <ShieldCheck className="w-8 h-8 text-lime-400 mb-3" />
              <h3 className="text-white font-semibold text-base mb-1">Digital Twin Simulator</h3>
              <p className="text-slate-400 text-xs">Simulazione in memoria degli effetti di modifiche comportamentali sul tuo punteggio benessere.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="relative z-10 max-w-5xl mx-auto px-4 py-16 border-t border-white/[0.06]">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-white mb-3">Scegli il Tuo Piano SaaS</h2>
          <p className="text-slate-400 text-sm max-w-md mx-auto">
            Abbonamenti trasparenti e simulati tramite Stripe. Cambia o cancella piano quando vuoi.
          </p>

          {/* Billing Switch */}
          <div className="inline-flex bg-white/5 rounded-xl p-1 mt-6 border border-white/10">
            <button
              onClick={() => setBillingInterval('monthly')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                billingInterval === 'monthly' ? 'bg-lime-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Mensile
            </button>
            <button
              onClick={() => setBillingInterval('annual')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all flex items-center gap-1.5 ${
                billingInterval === 'annual' ? 'bg-lime-500 text-black' : 'text-slate-400 hover:text-white'
              }`}
            >
              Annuale <span className="bg-lime-900/40 text-[10px] text-lime-400 px-1.5 py-0.5 rounded-full font-bold">-20%</span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-stretch">
          {/* FREE TIER */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white">Free</h3>
              <p className="text-slate-400 text-xs mt-1">Per iniziare a comprendere il proprio benessere.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">€0</span>
                <span className="text-slate-400 text-xs"> / sempre gratis</span>
              </div>
              <ul className="space-y-3 border-t border-white/5 pt-4">
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>3 Scansioni OCR giornaliere</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>5 Richieste AI Chat al giorno</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Visualizzazione Meal Planner (1 Giorno)</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300 line-through text-slate-600">
                  <span>Integrazione Indossabili (Wearables)</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300 line-through text-slate-600">
                  <span>Digital Twin & Simulatore</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl mt-8 transition-all text-xs"
            >
              Registrati Gratis
            </button>
          </div>

          {/* PRO TIER */}
          <div className="bg-lime-500/5 border-2 border-lime-500/30 rounded-2xl p-6 flex flex-col justify-between relative shadow-xl shadow-lime-500/5">
            <div className="absolute -top-3 right-6 bg-lime-500 text-black text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
              Popolare
            </div>
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Pro <Star className="w-4 h-4 text-lime-400 fill-lime-400" />
              </h3>
              <p className="text-slate-400 text-xs mt-1">Per monitoraggio e sincronizzazione completi.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">
                  {billingInterval === 'monthly' ? '€9.99' : '€7.99'}
                </span>
                <span className="text-slate-400 text-xs"> / mese</span>
                <p className="text-[10px] text-lime-400 mt-1">Prova gratuita di 14 giorni inclusa</p>
              </div>
              <ul className="space-y-3 border-t border-lime-500/10 pt-4">
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="font-semibold text-white">Scansioni OCR illimitate</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="font-semibold text-white">AI Coach illimitato</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Meal Planner completo (7 giorni)</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="text-lime-400 font-semibold">Wearables Auto Sync</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300 line-through text-slate-600">
                  <span>Digital Twin & Simulatore</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-lime-500 hover:bg-lime-400 text-black font-bold rounded-xl mt-8 transition-all text-xs shadow-lg shadow-lime-500/20"
            >
              Inizia la Prova Pro
            </button>
          </div>

          {/* PREMIUM TIER */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                Premium <Sparkles className="w-4 h-4 text-cyan-400" />
              </h3>
              <p className="text-slate-400 text-xs mt-1">Prevenzione scientifica con Digital Twin e regressioni ematiche.</p>
              <div className="my-6">
                <span className="text-3xl font-extrabold text-white">
                  {billingInterval === 'monthly' ? '€19.99' : '€15.99'}
                </span>
                <span className="text-slate-400 text-xs"> / mese</span>
                <p className="text-[10px] text-lime-400 mt-1">Prova gratuita di 14 giorni inclusa</p>
              </div>
              <ul className="space-y-3 border-t border-white/5 pt-4">
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Tutti i vantaggi del piano Pro</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="text-cyan-400 font-semibold">Digital Twin in tempo reale</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span className="text-cyan-400 font-semibold">What-If Wellness Simulator</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Biomarker Forecast a 60 giorni</span>
                </li>
                <li className="flex items-start gap-2 text-xs text-slate-300">
                  <Check className="w-4 h-4 text-lime-400 shrink-0" />
                  <span>Deficiency risk prediction</span>
                </li>
              </ul>
            </div>
            <button 
              onClick={() => navigate('/login')}
              className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl mt-8 transition-all text-xs"
            >
              Inizia la Prova Premium
            </button>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="relative z-10 max-w-3xl mx-auto px-4 py-16 border-t border-white/[0.06]">
        <h2 className="text-2xl font-bold text-center text-white mb-8 flex items-center justify-center gap-2">
          <HelpCircle className="w-6 h-6 text-lime-400" />
          Domande Frequenti (FAQ)
        </h2>
        <div className="space-y-4">
          {FAQ_ITEMS.map((item, index) => (
            <div key={index} className="bg-white/5 border border-white/5 rounded-xl overflow-hidden transition-all">
              <button
                onClick={() => toggleFaq(index)}
                className="w-full px-5 py-4 text-left font-medium text-white flex items-center justify-between text-sm hover:bg-white/[0.02]"
                aria-expanded={activeFaq === index}
              >
                <span>{item.q}</span>
                <ChevronDown className={`w-4 h-4 text-slate-400 transition-transform duration-300 ${
                  activeFaq === index ? 'rotate-180' : ''
                }`} />
              </button>
              {activeFaq === index && (
                <div className="px-5 pb-4 text-slate-400 text-xs leading-relaxed border-t border-white/5 pt-3">
                  {item.a}
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Support & Contact Section */}
      <section className="relative z-10 max-w-md mx-auto px-4 py-16 border-t border-white/[0.06] text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Supporto Clienti</h2>
        <p className="text-slate-400 text-xs mb-6">Hai domande o riscontri problemi tecnici? Scrivici direttamente.</p>
        <form onSubmit={(e) => { e.preventDefault(); alert("Messaggio di supporto inviato con successo (Simulato)."); }} className="space-y-4">
          <input 
            type="email" 
            placeholder="La tua email" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-lime-500/50" 
          />
          <textarea 
            placeholder="Descrivi la tua richiesta" 
            rows="4" 
            required
            className="w-full bg-white/5 border border-white/10 rounded-xl py-3 px-4 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-lime-500/50"
          />
          <button 
            type="submit"
            className="w-full py-3 bg-white/10 hover:bg-white/15 text-white font-semibold rounded-xl text-xs transition-colors"
          >
            Invia Richiesta
          </button>
        </form>
      </section>

      {/* Footer */}
      <footer className="relative z-10 bg-[#07070b] border-t border-white/[0.06] py-10 px-4 text-center text-xs text-slate-500">
        <div className="max-w-3xl mx-auto space-y-4">
          <div className="flex justify-center gap-6 text-[11px] font-medium">
            <button onClick={() => setLegalModal('privacy')} className="hover:text-lime-400 transition-colors">Privacy Policy</button>
            <button onClick={() => setLegalModal('cookies')} className="hover:text-lime-400 transition-colors">Cookie Policy</button>
            <button onClick={() => setLegalModal('terms')} className="hover:text-lime-400 transition-colors">Termini di Servizio</button>
          </div>
          <div className="medical-disclaimer max-w-xl mx-auto bg-white/[0.02] border border-white/[0.04] p-3 rounded-xl flex gap-2 text-left">
            <Shield className="w-4 h-4 text-slate-600 shrink-0 mt-0.5" />
            <p className="text-[10px] text-slate-600 leading-normal">
              NutriScan AI è uno strumento digitale per la prevenzione e l'educazione alimentare. 
              Le informazioni fornite non costituiscono diagnosi medica o prescrizione farmacologica. 
              Consulta sempre il medico prima di variare le terapie in corso.
            </p>
          </div>
          <p>© 2026 NutriScan AI. Tutti i diritti riservati.</p>
        </div>
      </footer>

      {/* Legal Modal Overlay */}
      {legalModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-[#0d0d14] border border-white/10 rounded-2xl max-w-2xl w-full max-h-[80vh] flex flex-col p-6 shadow-2xl">
            <div className="flex justify-between items-center border-b border-white/5 pb-3 mb-4">
              <h3 className="text-white font-bold text-base capitalize">{legalModal} Policy</h3>
              <button 
                onClick={() => setLegalModal(null)}
                className="text-slate-400 hover:text-white text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white/5"
              >
                Chiudi
              </button>
            </div>
            <div className="overflow-y-auto text-slate-300 text-xs leading-relaxed space-y-3 pr-2 scrollbar-thin">
              {getLegalContent().split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('###')) {
                  return <h4 key={index} className="text-white font-bold text-sm mt-4 mb-2">{paragraph.replace('###', '').trim()}</h4>;
                }
                if (paragraph.startsWith('##')) {
                  return <h3 key={index} className="text-white font-bold text-base mt-5 mb-2">{paragraph.replace('##', '').trim()}</h3>;
                }
                if (paragraph.startsWith('#')) {
                  return <h2 key={index} className="text-white font-extrabold text-lg mb-4">{paragraph.replace('#', '').trim()}</h2>;
                }
                return <p key={index}>{paragraph}</p>;
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
