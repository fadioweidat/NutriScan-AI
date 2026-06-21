/**
 * Connected Health Connectors Manager (Phase 8)
 * Manages wearables connections, consent, data synchronization and mapping.
 * Strictly educational and private.
 */

// Simple XOR Base64 helper for token simulation encryption
function encryptToken(token, secret = 'wearable-secret-key') {
  if (!token) return '';
  const text = String(token);
  let result = '';
  for (let i = 0; i < text.length; i++) {
    const charCode = text.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
    result += String.fromCharCode(charCode);
  }
  return btoa(result);
}

function decryptToken(encrypted, secret = 'wearable-secret-key') {
  if (!encrypted) return '';
  try {
    const raw = atob(encrypted);
    let result = '';
    for (let i = 0; i < raw.length; i++) {
      const charCode = raw.charCodeAt(i) ^ secret.charCodeAt(i % secret.length);
      result += String.fromCharCode(charCode);
    }
    return result;
  } catch {
    return '';
  }
}

// Abstract/Base Wearable Provider class defining the unified interface
export class WearableProvider {
  constructor(id, name) {
    this.id = id;
    this.name = name;
  }

  async getAuthUrl() {
    return `https://auth.nutriscan.ai/oauth/${this.id}?redirect_uri=https://app.nutriscan.ai/callback`;
  }

  async exchangeCodeForTokens(code) {
    return {
      accessToken: encryptToken(`access_${this.id}_${code}`),
      refreshToken: encryptToken(`refresh_${this.id}_${code}`),
      expiresIn: 3600,
      connectedAt: Date.now()
    };
  }

  async refreshToken(encryptedRefresh) {
    const rawRefresh = decryptToken(encryptedRefresh);
    if (!rawRefresh) throw new Error("Invalid refresh token");
    return {
      accessToken: encryptToken(`access_renewed_${this.id}`),
      refreshToken: encryptedRefresh, // reuse
      expiresIn: 3600
    };
  }

  async syncMetrics(timeframeDays) {
    // Generate deterministic mock data based on dates
    const data = [];
    const today = new Date();
    for (let i = 0; i < timeframeDays; i++) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      // Standardized metrics format
      data.push({
        date: dateStr,
        steps: 8000 + Math.round(Math.sin(i) * 2000),
        weightKg: 74.5 + Math.sin(i / 5) * 0.8,
        bmi: 24.3 + Math.sin(i / 5) * 0.2,
        restingHeartRate: 62 + Math.round(Math.cos(i) * 4),
        averageHeartRate: 75 + Math.round(Math.sin(i) * 5),
        hrv: 55 + Math.round(Math.sin(i / 2) * 15),
        sleepDurationHours: 6.8 + Math.sin(i) * 1.2,
        sleepQualityScore: 72 + Math.round(Math.cos(i) * 18),
        activeCaloriesBurned: 350 + Math.round(Math.sin(i) * 150),
        vo2Max: 44.5 + Math.cos(i / 10) * 1.5,
        systolicPressure: 118 + Math.round(Math.sin(i) * 6),
        diastolicPressure: 78 + Math.round(Math.cos(i) * 4),
        bloodGlucose: 95 + Math.round(Math.sin(i) * 15), // mg/dL
        workoutsCount: Math.sin(i) > 0 ? 1 : 0
      });
    }
    return data;
  }
}

// Registry of connectors
class HealthProviderManager {
  constructor() {
    this.providers = {};
  }

  registerProvider(id, providerInstance) {
    this.providers[id] = providerInstance;
  }

  getProvider(id) {
    return this.providers[id];
  }

  getAllProviders() {
    return Object.values(this.providers);
  }

  // Persists connection state to Supabase auth user metadata (private server-side metadata)
  async connectProvider(supabase, id, authCode, userConsent) {
    if (!userConsent) {
      throw new Error("Consenso dell'utente obbligatorio per connettere il servizio");
    }

    const provider = this.getProvider(id);
    if (!provider) throw new Error(`Provider ${id} non supportato`);

    const tokens = await provider.exchangeCodeForTokens(authCode);

    // Get current user metadata to append
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Utente non autenticato");

    const connectedWearables = user.user_metadata?.connected_wearables || {};
    connectedWearables[id] = {
      connected: true,
      consentDate: new Date().toISOString(),
      tokens: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
        expiresAt: Date.now() + tokens.expiresIn * 1000
      }
    };

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { connected_wearables: connectedWearables }
    });

    if (updateErr) throw new Error(`Errore connessione database: ${updateErr.message}`);
    return { success: true, providerId: id };
  }

  async disconnectProvider(supabase, id) {
    const { data: { user }, error: userErr } = await supabase.auth.getUser();
    if (userErr || !user) throw new Error("Utente non autenticato");

    const connectedWearables = user.user_metadata?.connected_wearables || {};
    if (connectedWearables[id]) {
      delete connectedWearables[id];
    }

    const { error: updateErr } = await supabase.auth.updateUser({
      data: { connected_wearables: connectedWearables }
    });

    if (updateErr) throw new Error(`Errore disconnessione database: ${updateErr.message}`);
    return { success: true, providerId: id };
  }

  async isConnected(supabase, id) {
    const { data: { user } } = await supabase.auth.getUser();
    return !!user?.user_metadata?.connected_wearables?.[id]?.connected;
  }

  async getConnectedProviders(supabase) {
    const { data: { user } } = await supabase.auth.getUser();
    const list = user?.user_metadata?.connected_wearables || {};
    return Object.keys(list).filter(key => list[key].connected);
  }

  // Performs data synchronization and returns unified structured metrics
  async syncMetrics(supabase, id, timeframeDays = 30) {
    const provider = this.getProvider(id);
    if (!provider) throw new Error(`Provider ${id} non supportato`);

    const { data: { user } } = await supabase.auth.getUser();
    const config = user?.user_metadata?.connected_wearables?.[id];
    if (!config || !config.connected) {
      throw new Error(`Servizio ${id} non collegato o autorizzato`);
    }

    if (Date.now() > config.tokens.expiresAt) {
      const refreshed = await provider.refreshToken(config.tokens.refreshToken);
      config.tokens.accessToken = refreshed.accessToken;
      config.tokens.expiresAt = Date.now() + refreshed.expiresIn * 1000;
      
      // Save refreshed tokens back to server
      const connectedWearables = user.user_metadata?.connected_wearables || {};
      connectedWearables[id] = config;
      await supabase.auth.updateUser({
        data: { connected_wearables: connectedWearables }
      });
    }

    // Sync metrics from provider
    const metrics = await provider.syncMetrics(timeframeDays);

    // Deduplicate/merge workout logs and metrics in React memory
    return this.deduplicateAndMapMetrics(metrics);
  }

  deduplicateAndMapMetrics(metricsList) {
    const seenDates = new Set();
    const deduplicated = [];

    metricsList.forEach(m => {
      if (!m.date) return;
      if (seenDates.has(m.date)) return; // duplicate prevention
      seenDates.add(m.date);

      deduplicated.push({
        date: m.date,
        steps: Math.max(0, m.steps || 0),
        weightKg: m.weightKg ? Number(Number(m.weightKg).toFixed(1)) : null,
        bmi: m.bmi ? Number(Number(m.bmi).toFixed(1)) : null,
        restingHeartRate: m.restingHeartRate ? Math.round(m.restingHeartRate) : null,
        averageHeartRate: m.averageHeartRate ? Math.round(m.averageHeartRate) : null,
        hrv: m.hrv ? Math.round(m.hrv) : null,
        sleepHours: m.sleepDurationHours ? Number(Number(m.sleepDurationHours).toFixed(1)) : 0,
        sleepQuality: m.sleepQualityScore ? Math.round(m.sleepQualityScore) : 0,
        activeCalories: Math.max(0, m.activeCaloriesBurned || 0),
        vo2Max: m.vo2Max ? Number(Number(m.vo2Max).toFixed(1)) : null,
        bloodPressure: m.systolicPressure && m.diastolicPressure 
          ? `${m.systolicPressure}/${m.diastolicPressure}` 
          : null,
        bloodGlucose: m.bloodGlucose ? Math.round(m.bloodGlucose) : null,
        workouts: m.workoutsCount || 0
      });
    });

    return deduplicated.sort((a, b) => a.date.localeCompare(b.date));
  }
}

// Instanciate manager
const manager = new HealthProviderManager();

// Register the 8 support providers
manager.registerProvider('apple_health', new WearableProvider('apple_health', 'Apple Health'));
manager.registerProvider('google_health_connect', new WearableProvider('google_health_connect', 'Google Health Connect'));
manager.registerProvider('google_fit', new WearableProvider('google_fit', 'Google Fit'));
manager.registerProvider('fitbit', new WearableProvider('fitbit', 'Fitbit'));
manager.registerProvider('garmin', new WearableProvider('garmin', 'Garmin'));
manager.registerProvider('oura', new WearableProvider('oura', 'Oura'));
manager.registerProvider('withings', new WearableProvider('withings', 'Withings'));
manager.registerProvider('samsung_health', new WearableProvider('samsung_health', 'Samsung Health'));

export default manager;
export { encryptToken, decryptToken };
