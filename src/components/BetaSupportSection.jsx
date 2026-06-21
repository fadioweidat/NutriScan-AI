import { useState } from 'react';
import { 
  Sparkles, Star, MessageSquare, Send, Check, AlertCircle, HelpCircle, LifeBuoy, Activity
} from 'lucide-react';

export default function BetaSupportSection() {
  // Beta Program state
  const [betaCode, setBetaCode] = useState('');
  const [isBetaActive, setIsBetaActive] = useState(false);
  const [betaMessage, setBetaMessage] = useState('');
  const [satisfaction, setSatisfaction] = useState(0);
  const [hoverSatisfaction, setHoverSatisfaction] = useState(0);
  const [featureRequest, setFeatureRequest] = useState('');
  const [feedbackSent, setFeedbackSent] = useState(false);

  // Customer Support state
  const [supportName, setSupportName] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [ticketStatus, setTicketStatus] = useState('');
  const [checkingStatus, setCheckingStatus] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  // Handle Beta Invite Code activation
  const handleActivateBeta = (e) => {
    e.preventDefault();
    if (betaCode.trim().toUpperCase() === 'BETA2026') {
      setIsBetaActive(true);
      setBetaMessage('Codice Beta valido! Benvenuto nel programma Early Access.');
    } else {
      setBetaMessage('Codice non valido. Inserire BETA2026 per la simulazione.');
    }
  };

  // Handle Satisfaction & Feature Requests feedback submit
  const handleSubmitFeedback = (e) => {
    e.preventDefault();
    if (satisfaction === 0) {
      alert("Seleziona un punteggio di soddisfazione prima di inviare.");
      return;
    }
    setFeedbackSent(true);
    setTimeout(() => {
      setFeedbackSent(false);
      setFeatureRequest('');
      setSatisfaction(0);
    }, 3000);
  };

  // Handle Support ticket submission
  const handleSubmitTicket = (e) => {
    e.preventDefault();
    setTicketStatus('invio...');
    setTimeout(() => {
      setTicketStatus('inviato');
      setSupportMessage('');
      setSupportName('');
      setTimeout(() => setTicketStatus(''), 3000);
    }, 1500);
  };

  // Simulate Status Page check
  const handleCheckStatus = () => {
    setCheckingStatus(true);
    setStatusMessage('');
    setTimeout(() => {
      setCheckingStatus(false);
      setStatusMessage('Tutti i sistemi operativi sono ONLINE (Uptime: 99.995%).');
    }, 1000);
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
      {/* ── Beta Program Panel ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-lime-500/30 transition-all duration-300">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-lime-500/10 border border-lime-500/20 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-lime-400" />
            </div>
            <h3 className="text-white font-bold text-base">Programma Beta & Early Access</h3>
          </div>

          <p className="text-slate-400 text-xs mb-5 leading-relaxed">
            Partecipa attivamente al beta testing di NutriScan AI per testare in anteprima il rilascio v1.0.0.
          </p>

          {!isBetaActive ? (
            <form onSubmit={handleActivateBeta} className="space-y-3 mb-6">
              <div>
                <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                  Codice Invito Beta
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="E.g. BETA2026"
                    value={betaCode}
                    onChange={(e) => setBetaCode(e.target.value)}
                    className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-lime-500/50"
                  />
                  <button
                    type="submit"
                    className="bg-lime-500 hover:bg-lime-400 text-black font-bold text-xs px-4 rounded-xl transition-all"
                  >
                    Attiva
                  </button>
                </div>
              </div>
              {betaMessage && (
                <p className={`text-[10px] font-semibold ${betaMessage.includes('valido') ? 'text-lime-400' : 'text-red-400'}`}>
                  {betaMessage}
                </p>
              )}
            </form>
          ) : (
            <div className="bg-lime-500/10 border border-lime-500/20 rounded-xl p-4 mb-6">
              <div className="flex items-center gap-2 mb-1">
                <Check className="w-4 h-4 text-lime-400" />
                <span className="text-white font-semibold text-xs">Accesso Beta Attivo</span>
              </div>
              <p className="text-[10px] text-slate-400">Hai sbloccato la dashboard di telemetria beta e i test integrati.</p>
            </div>
          )}

          {/* Feedback Form (Visible when Beta is active) */}
          {isBetaActive && (
            <form onSubmit={handleSubmitFeedback} className="space-y-4 pt-2 border-t border-white/5">
              <div>
                <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-2">
                  Punteggio Soddisfazione (Satisfaction Score)
                </label>
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setSatisfaction(star)}
                      onMouseEnter={() => setHoverSatisfaction(star)}
                      onMouseLeave={() => setHoverSatisfaction(0)}
                      className="p-1 transition-transform hover:scale-110"
                    >
                      <Star 
                        className={`w-5 h-5 ${
                          star <= (hoverSatisfaction || satisfaction) 
                            ? 'text-lime-400 fill-lime-400' 
                            : 'text-slate-600'
                        }`} 
                      />
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1.5">
                  Richiesta Feature o Feedback
                </label>
                <textarea
                  placeholder="Dicci cosa possiamo migliorare o quale funzionalità desideri..."
                  value={featureRequest}
                  onChange={(e) => setFeatureRequest(e.target.value)}
                  rows="3"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-lime-500/50 resize-none"
                />
              </div>

              <button
                type="submit"
                disabled={feedbackSent}
                className="w-full py-2.5 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-500/20 text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
              >
                {feedbackSent ? (
                  <>
                    <Check className="w-4 h-4" />
                    Feedback Inviato!
                  </>
                ) : (
                  <>
                    <MessageSquare className="w-4 h-4" />
                    Invia Feedback Beta
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </div>

      {/* ── Customer Support Panel ── */}
      <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 flex flex-col justify-between hover:border-cyan-500/30 transition-all duration-300">
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center">
              <LifeBuoy className="w-4 h-4 text-cyan-400" />
            </div>
            <h3 className="text-white font-bold text-base">Help Center & Supporto</h3>
          </div>

          <p className="text-slate-400 text-xs mb-5 leading-relaxed">
            Invia un ticket di supporto per ricevere assistenza tecnica amministrativa da parte del nostro team.
          </p>

          <form onSubmit={handleSubmitTicket} className="space-y-3 mb-6">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Nome
                </label>
                <input
                  type="text"
                  placeholder="Nome"
                  value={supportName}
                  onChange={(e) => setSupportName(e.target.value)}
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
              <div>
                <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
                  Oggetto
                </label>
                <input
                  type="text"
                  placeholder="E.g. Errore Billing"
                  required
                  className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-[10px] uppercase font-bold tracking-wider mb-1">
                Messaggio
              </label>
              <textarea
                placeholder="Descrivi dettagliatamente il problema..."
                value={supportMessage}
                onChange={(e) => setSupportMessage(e.target.value)}
                rows="2"
                required
                className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2 text-white text-xs placeholder:text-white/20 focus:outline-none focus:border-cyan-500/50 resize-none"
              />
            </div>

            <button
              type="submit"
              disabled={ticketStatus === 'invio...' || ticketStatus === 'inviato'}
              className="w-full py-2.5 bg-cyan-500 hover:bg-cyan-400 disabled:bg-cyan-500/20 text-black font-bold text-xs rounded-xl transition-all flex items-center justify-center gap-1.5"
            >
              {ticketStatus === 'invio...' ? (
                'Invio in corso...'
              ) : ticketStatus === 'inviato' ? (
                <>
                  <Check className="w-4 h-4" />
                  Ticket Creato (Controlla Email)
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Apri Ticket Supporto
                </>
              )}
            </button>
          </form>

          {/* Uptime Status check */}
          <div className="pt-4 border-t border-white/5">
            <div className="flex items-center justify-between">
              <span className="text-[10px] text-slate-500 font-semibold uppercase tracking-wider">
                Stato Infrastruttura
              </span>
              <button
                onClick={handleCheckStatus}
                disabled={checkingStatus}
                className="text-[10px] text-cyan-400 hover:text-cyan-300 font-bold flex items-center gap-1 bg-cyan-500/10 px-2.5 py-1 rounded-lg"
              >
                <Activity className="w-3 h-3" />
                {checkingStatus ? 'Verifica...' : 'Verifica Stato'}
              </button>
            </div>
            {statusMessage && (
              <div className="mt-2 flex items-center gap-1.5 text-[10px] text-lime-400 bg-lime-500/10 p-2 rounded-lg border border-lime-500/20">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{statusMessage}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
