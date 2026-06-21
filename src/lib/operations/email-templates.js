/**
 * Responsive HTML Email Templates (Phase 10)
 * 
 * Safe transaction-only emails containing zero clinical, biomarker, or meal data.
 */

const baseEmailStyle = `
  body { font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; background-color: #0a0a0f; color: #e2e8f0; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background-color: #0d0d14; border: 1px border: #1e1e2f; border-radius: 16px; padding: 30px; }
  .logo { text-align: center; margin-bottom: 25px; }
  .logo h1 { color: #ffffff; font-size: 24px; margin: 0; }
  .logo span { color: #84cc16; }
  h2 { color: #ffffff; font-size: 20px; border-bottom: 1px solid #1e1e2f; padding-bottom: 10px; }
  p { line-height: 1.6; color: #94a3b8; font-size: 14px; }
  .btn { display: inline-block; padding: 12px 24px; background-color: #84cc16; color: #000000; text-decoration: none; font-weight: bold; border-radius: 8px; margin: 20px 0; text-align: center; }
  .footer { margin-top: 30px; text-align: center; font-size: 11px; color: #475569; border-top: 1px solid #1e1e2f; padding-top: 15px; }
`;

export const EmailTemplates = {
  // 1. Welcome Email
  getWelcomeEmail(fullName) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>Nutri<span>Scan</span> AI</h1>
            </div>
            <h2>Benvenuto su NutriScan AI, ${fullName}!</h2>
            <p>Siamo felici di averti a bordo. NutriScan AI ti aiuta a comprendere meglio le tue abitudini alimentari e a monitorare la tua prevenzione nutrizionale in modo scientifico e intelligente.</p>
            <p>Accedi subito alla tua dashboard per iniziare a loggare i tuoi pasti e collegare i tuoi dispositivi indossabili.</p>
            <div style="text-align: center;">
              <a href="https://nutriscan-ai.pages.dev/login" class="btn">Accedi alla Dashboard</a>
            </div>
            <p class="footer">Questa è un'email automatica, si prega di non rispondere direttamente. NutriScan AI © 2026</p>
          </div>
        </body>
      </html>
    `;
  },

  // 2. Verify Email
  getVerifyEmail(fullName, verifyLink) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>Nutri<span>Scan</span> AI</h1>
            </div>
            <h2>Conferma il tuo indirizzo Email</h2>
            <p>Ciao ${fullName}, grazie per esserti registrato. Conferma la tua email cliccando sul pulsante sottostante per attivare il tuo account:</p>
            <div style="text-align: center;">
              <a href="${verifyLink}" class="btn">Verifica Email</a>
            </div>
            <p>Se il pulsante non funziona, copia e incolla questo indirizzo nel tuo browser:</p>
            <p style="word-break: break-all; font-size: 12px; color: #475569;">${verifyLink}</p>
            <p class="footer">Se non hai creato tu questo account, puoi ignorare questa email.</p>
          </div>
        </body>
      </html>
    `;
  },

  // 3. Reset Password
  getResetPasswordEmail(fullName, resetLink) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>Nutri<span>Scan</span> AI</h1>
            </div>
            <h2>Ripristino Password</h2>
            <p>Ciao ${fullName}, abbiamo ricevuto una richiesta di ripristino password per il tuo account. Clicca sul pulsante sottostante per impostare una nuova password:</p>
            <div style="text-align: center;">
              <a href="${resetLink}" class="btn">Reimposta Password</a>
            </div>
            <p>Questo link scadrà tra 24 ore. Se non hai richiesto tu il ripristino, ignora questa email e la tua password rimarrà invariata.</p>
            <p class="footer">NutriScan AI © 2026</p>
          </div>
        </body>
      </html>
    `;
  },

  // 4. Trial Ending
  getTrialEndingEmail(fullName, daysRemaining) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>Nutri<span>Scan</span> AI</h1>
            </div>
            <h2>La tua prova gratuita sta per terminare</h2>
            <p>Ciao ${fullName}, ti ricordiamo che il tuo periodo di prova Pro gratuito scadrà tra **${daysRemaining} giorni**.</p>
            <p>Per continuare ad usufruire dell'analisi dei wearables e della pianificazione avanzata senza interruzioni, non devi fare nulla: l'abbonamento mensile si attiverà automaticamente alla scadenza.</p>
            <p>Se desideri modificare o disdire il piano, puoi farlo in qualsiasi momento dalla scheda Billing del tuo profilo.</p>
            <div style="text-align: center;">
              <a href="https://nutriscan-ai.pages.dev/profile" class="btn">Gestisci Abbonamento</a>
            </div>
            <p class="footer">NutriScan AI © 2026</p>
          </div>
        </body>
      </html>
    `;
  },

  // 5. Subscription Confirmed
  getSubscriptionConfirmedEmail(fullName, tier, interval) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1>Nutri<span>Scan</span> AI</h1>
            </div>
            <h2>Abbonamento Confermato!</h2>
            <p>Ciao ${fullName}, grazie per aver completato l'abbonamento. La transazione è andata a buon fine ed il tuo account è stato aggiornato:</p>
            <div style="background-color: #161622; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #84cc16;">
              <p style="margin: 5px 0; color: #ffffff;"><strong>Piano attivo:</strong> NutriScan ${tier.toUpperCase()}</p>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Frequenza:</strong> ${interval === 'annual' ? 'Annuale' : 'Mensile'}</p>
              <p style="margin: 5px 0; color: #ffffff;"><strong>Stato:</strong> Attivo (Pagamento completato tramite Stripe)</p>
            </div>
            <p>Tutti i servizi (inclusi wearables e Digital Twin, se previsti dal piano) sono ora sbloccati sul tuo account.</p>
            <p class="footer">Grazie per sostenere NutriScan AI! © 2026</p>
          </div>
        </body>
      </html>
    `;
  },

  // 6. Payment Failed
  getPaymentFailedEmail(fullName) {
    return `
      <html>
        <head><style>${baseEmailStyle}</style></head>
        <body>
          <div class="container">
            <div class="logo">
              <h1 style="color: #ef4444;">Nutri<span>Scan</span> AI</h1>
            </div>
            <h2 style="color: #ef4444;">Pagamento Non Riuscito</h2>
            <p>Ciao ${fullName}, non siamo riusciti ad addebitare il pagamento per il rinnovo del tuo abbonamento Pro/Premium su Stripe.</p>
            <p>Il tuo account è temporaneamente tornato al piano Free. Per ripristinare il tuo accesso completo ed evitare interruzioni storiche dei grafici indotti, aggiorna il tuo metodo di pagamento:</p>
            <div style="text-align: center;">
              <a href="https://nutriscan-ai.pages.dev/profile" class="btn" style="background-color: #ef4444; color: #ffffff;">Aggiorna Metodo di Pagamento</a>
            </div>
            <p>Eseguiremo un nuovo tentativo di addebito nei prossimi giorni.</p>
            <p class="footer">NutriScan AI © 2026</p>
          </div>
        </body>
      </html>
    `;
  }
};

export default EmailTemplates;
