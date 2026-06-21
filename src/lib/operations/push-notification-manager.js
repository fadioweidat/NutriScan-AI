/**
 * Push Notifications Production Manager (Phase 11)
 * 
 * Manages Web Push and Firebase Cloud Messaging (FCM) subscriptions.
 * STRICT SECURITY CONSTRAINT: Notification bodies visible on the lock screen 
 * must never expose clinical terms, drug names, biomarker values, or diagnoses.
 * Use generic placeholders like "Hai un promemoria." or "Apri NutriScan AI.".
 */

export const PushNotificationManager = {
  vapidPublicKey: 'BEl62vUZG5HE8A7a7H8Z33333333333333333333333_placeholder',

  /**
   * Registers user Service Worker for push subscriptions
   */
  async registerSubscription() {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn("[Push Notification] Push messaging is not supported in this browser.");
      return null;
    }

    try {
      const reg = await navigator.serviceWorker.ready;
      let sub = await reg.pushManager.getSubscription();
      
      if (!sub) {
        // Register new subscription using VAPID keys
        sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: this.urlBase64ToUint8Array(this.vapidPublicKey)
        });
      }
      
      console.log("[Push Notification] Registered subscription endpoint:", sub.endpoint);
      return sub;
    } catch (e) {
      console.error("[Push Notification Registration Failed]", e.message);
      return null;
    }
  },

  /**
   * Triggers a push notification server-side (simulated in frontend context)
   * Sends generic texts for privacy preservation.
   */
  async sendPushNotification(type) {
    console.log(`[Push Notification Server] Triggering push event type: ${type}`);
    
    // Resolve safe generic message
    let messageBody = "Hai un promemoria.";
    if (type === 'water') {
      messageBody = "È disponibile un'attività programmata.";
    } else if (type === 'meal') {
      messageBody = "Apri NutriScan AI.";
    } else if (type === 'medication') {
      messageBody = "Hai un promemoria.";
    } else if (type === 'sync') {
      messageBody = "Apri NutriScan AI.";
    }

    // Safety check: ensure no drug name or biomarker name is leaked
    const lowerBody = messageBody.toLowerCase();
    const sensitiveTerms = [
      'metformin', 'aspirina', 'glicemia', 'ferro', 'vitamina', 
      'biomarcatore', 'medication', 'diabete', 'colesterolo', 'pasto'
    ];
    const containsSensitive = sensitiveTerms.some(term => lowerBody.includes(term));
    if (containsSensitive) {
      console.error("[Push Security Block] Push blocked: detected sensitive clinical keywords in body.");
      throw new Error("Security Violation: Push notifications cannot contain clinical data.");
    }

    // Trigger local browser notification if permission allowed
    if (Notification.permission === 'granted') {
      const reg = await navigator.serviceWorker.ready;
      reg.showNotification("NutriScan AI", {
        body: messageBody,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'nutriscan-generic-alert',
        renotify: true
      });
      return { success: true, body: messageBody };
    }
    
    return { success: true, simulated: true, body: messageBody };
  },

  urlBase64ToUint8Array(base64String) {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);
    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }
};

export default PushNotificationManager;
