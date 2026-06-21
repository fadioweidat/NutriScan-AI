/**
 * Email Production Provider (Phase 11)
 * 
 * Manages sending transactional administrative emails.
 * STRICT SECURITY CONSTRAINT: Emails must never contain any clinical parameters, 
 * biomarkers, reports, meals, medications, or health data.
 */

import EmailTemplates from './email-templates.js';

export const EmailProvider = {
  /**
   * Sends a transactional email.
   * Pulls RESEND_API_KEY or SMTP parameters from server configuration.
   */
  async sendEmail(toEmail, subject, htmlContent) {
    console.log(`[Email Production] Sending email to: ${toEmail}, Subject: ${subject}`);
    
    // Safety check: verify no sensitive health parameters are leaked in the HTML content
    const lowerHtml = htmlContent.toLowerCase();
    const sensitiveTerms = [
      'metformin', 'aspirina', 'glicemia', 'ferro', 'vitamina', 
      'biomarcatore', 'medication', 'diabete', 'colesterolo', 'pasto'
    ];
    const containsSensitive = sensitiveTerms.some(term => lowerHtml.includes(term));
    if (containsSensitive) {
      console.error("[Email Security Block] Email transmittal blocked: detected sensitive health keywords in payload.");
      throw new Error("Security Violation: Cannot send emails containing clinical or private health data.");
    }

    const apiKey = (typeof globalThis !== 'undefined' && globalThis.process !== 'undefined') ? globalThis.process.env?.RESEND_API_KEY : null;
    if (!apiKey) {
      console.warn("[Email Production Fallback] RESEND_API_KEY not configured. Email logged to console.");
      return { success: true, simulated: true };
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          from: 'NutriScan AI <no-reply@nutriscan.ai>',
          to: [toEmail],
          subject: subject,
          html: htmlContent
        })
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Resend API HTTP Error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      return { success: true, id: result.id };
    } catch (e) {
      console.error("[Email Production Error] Failed to send email:", e.message);
      return { success: false, error: e.message };
    }
  },

  async sendWelcome(toEmail, userName) {
    const html = EmailTemplates.getWelcomeEmail(userName);
    return this.sendEmail(toEmail, "Benvenuto su NutriScan AI!", html);
  },

  async sendVerifyEmail(toEmail, userName, verifyUrl) {
    // Generate a simple verify email template administratively
    const html = `
      <div style="font-family: sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #0a0a0f; color: #fff;">
        <h2 style="color: #a3e635;">Conferma il tuo account</h2>
        <p>Ciao ${userName},</p>
        <p>Grazie per esserti registrato su NutriScan AI. Per attivare il tuo account, clicca sul link seguente:</p>
        <a href="${verifyUrl}" style="display: inline-block; padding: 10px 20px; background: #a3e635; color: #000; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 15px;">Conferma Email</a>
        <p style="color: #555; font-size: 10px; margin-top: 30px;">NutriScan AI — Comunicazione amministrativa. Nessun dato clinico o di salute è incluso in questa e-mail.</p>
      </div>
    `;
    return this.sendEmail(toEmail, "Verifica il tuo account NutriScan AI", html);
  },

  async sendResetPassword(toEmail, userName, resetUrl) {
    const html = EmailTemplates.getResetPasswordEmail(userName, resetUrl);
    return this.sendEmail(toEmail, "Ripristina la tua password - NutriScan AI", html);
  },

  async sendPaymentSuccess(toEmail, userName, planName) {
    const html = EmailTemplates.getSubscriptionConfirmedEmail(userName, planName, "mensile");
    return this.sendEmail(toEmail, "Abbonamento Confermato - NutriScan AI", html);
  },

  async sendPaymentFailed(toEmail, userName) {
    const html = EmailTemplates.getPaymentFailedEmail(userName);
    return this.sendEmail(toEmail, "Pagamento Fallito - Azione Richiesta - NutriScan AI", html);
  },

  async sendTrialEnding(toEmail, userName, daysLeft = 3) {
    const html = EmailTemplates.getTrialEndingEmail(userName, daysLeft);
    return this.sendEmail(toEmail, "La tua prova gratuita sta per scadere - NutriScan AI", html);
  }
};

export default EmailProvider;
