import { supabase } from './supabase';

/**
 * Lifestyle Engine
 * Manages operations for sleep, stress, hydration, activity, and digestion logs.
 */

// --- HELPERS ---

const getTodayDateString = () => new Date().toISOString().split('T')[0];

async function getLogForDate(table, userId, dateString) {
  const { data, error } = await supabase
    .from(table)
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', dateString)
    .single();
  
  if (error && error.code !== 'PGRST116') {
    console.error(`Error fetching from ${table}:`, error);
    return null;
  }
  return data;
}

async function upsertLog(table, userId, dateString, payload) {
  const existing = await getLogForDate(table, userId, dateString);
  
  if (existing) {
    const { data, error } = await supabase
      .from(table)
      .update(payload)
      .eq('id', existing.id)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from(table)
      .insert([{ user_id: userId, entry_date: dateString, ...payload }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// --- SLEEP ---
export async function getSleepLog(userId, dateString = getTodayDateString()) {
  return getLogForDate('sleep_logs', userId, dateString);
}
export async function saveSleepLog(userId, payload, dateString = getTodayDateString()) {
  return upsertLog('sleep_logs', userId, dateString, payload);
}

// --- STRESS ---
export async function getStressLog(userId, dateString = getTodayDateString()) {
  return getLogForDate('stress_logs', userId, dateString);
}
export async function saveStressLog(userId, payload, dateString = getTodayDateString()) {
  return upsertLog('stress_logs', userId, dateString, payload);
}

// --- HYDRATION ---
export async function getHydrationLog(userId, dateString = getTodayDateString()) {
  return getLogForDate('hydration_logs', userId, dateString);
}
export async function saveHydrationLog(userId, payload, dateString = getTodayDateString()) {
  return upsertLog('hydration_logs', userId, dateString, payload);
}

// --- ACTIVITY ---
// Activities can be multiple per day, so we don't upsert by date, we just insert/get all for date.
export async function getActivitiesForDate(userId, dateString = getTodayDateString()) {
  const { data, error } = await supabase
    .from('activity_logs')
    .select('*')
    .eq('user_id', userId)
    .eq('entry_date', dateString)
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data;
}
export async function addActivity(userId, payload, dateString = getTodayDateString()) {
  const { data, error } = await supabase
    .from('activity_logs')
    .insert([{ user_id: userId, entry_date: dateString, ...payload }])
    .select()
    .single();
  if (error) throw error;
  return data;
}
export async function removeActivity(id) {
  const { error } = await supabase.from('activity_logs').delete().eq('id', id);
  if (error) throw error;
}

// --- DIGESTION ---
export async function getDigestionLog(userId, dateString = getTodayDateString()) {
  return getLogForDate('digestion_logs', userId, dateString);
}
export async function saveDigestionLog(userId, payload, dateString = getTodayDateString()) {
  return upsertLog('digestion_logs', userId, dateString, payload);
}

// --- FULL CONTEXT AGGREGATION ---
export async function getTodayLifestyleContext(userId) {
  const today = getTodayDateString();
  const [sleep, stress, hydration, activities, digestion] = await Promise.all([
    getSleepLog(userId, today),
    getStressLog(userId, today),
    getHydrationLog(userId, today),
    getActivitiesForDate(userId, today),
    getDigestionLog(userId, today)
  ]);

  return {
    sleep,
    stress,
    hydration,
    activities: activities || [],
    digestion
  };
}

export default {
  getSleepLog, saveSleepLog,
  getStressLog, saveStressLog,
  getHydrationLog, saveHydrationLog,
  getActivitiesForDate, addActivity, removeActivity,
  getDigestionLog, saveDigestionLog,
  getTodayLifestyleContext,
  getTodayDateString
};
