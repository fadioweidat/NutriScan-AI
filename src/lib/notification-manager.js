// Notification Manager (Phase 5)
// Configures and schedules generic local PWA reminders without exposing sensitive medical data.

export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.warn("This browser does not support desktop notifications");
    return false;
  }

  const permission = await Notification.requestPermission();
  return permission === 'granted';
}

export function showLocalNotification(title, body) {
  if (!('Notification' in window) || Notification.permission !== 'granted') {
    return;
  }

  // Generic notifications security check: NEVER show diseases, biomarkers, or specific drug names on screen lock.
  const isGeneric = !body.includes('mg') && 
                    !body.includes('diabete') && 
                    !body.includes('ipertensione') && 
                    !body.includes('anemia') && 
                    !body.includes('warfarin') && 
                    !body.includes('eutirox') && 
                    !body.includes('metformina');

  const safeBody = isGeneric ? body : "Promemoria nutrizionale: apri l'app per visualizzare i dettagli.";

  // Attempt to send via service worker for proper PWA lifecycle integration
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.ready.then((registration) => {
      registration.showNotification(title, {
        body: safeBody,
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        vibrate: [100, 50, 100],
        data: {
          dateOfArrival: Date.now(),
          primaryKey: 1
        }
      });
    });
  } else {
    // Fallback if Service Worker registration is not active
    new Notification(title, { body: safeBody, icon: '/icon-192.png' });
  }
}

// Scheduled timers in memory
let hydrationInterval = null;
let mealReminderTimeout = null;

export function scheduleHydrationReminder(hours = 2) {
  if (hydrationInterval) clearInterval(hydrationInterval);

  const ms = hours * 60 * 60 * 1000;
  hydrationInterval = setInterval(() => {
    showLocalNotification(
      "Promemoria Idratazione",
      "È il momento di bere un bicchiere d'acqua per mantenere un'idratazione ottimale."
    );
  }, ms);
  console.log(`[Notification Manager] Scheduled hydration reminder every ${hours} hours.`);
}

export function scheduleMealReminder() {
  if (mealReminderTimeout) clearTimeout(mealReminderTimeout);

  // Remind user at standard times (e.g. 13:00 and 20:00) or simply schedule in-app notifications
  // For validation, we schedule a general logging reminder in 4 hours
  const ms = 4 * 60 * 60 * 1000;
  mealReminderTimeout = setTimeout(() => {
    showLocalNotification(
      "Diario Alimentare",
      "Ricordati di registrare i tuoi pasti odierni per tracciare i tuoi macronutrienti."
    );
  }, ms);
  console.log("[Notification Manager] Scheduled meal logging reminder.");
}

export default {
  requestNotificationPermission,
  showLocalNotification,
  scheduleHydrationReminder,
  scheduleMealReminder
};
