import { supabase } from './supabase';

/**
 * Health Engine
 * Manages operations for health profiles, conditions, allergies, intolerances, medications, and supplements.
 */

// --- HEALTH PROFILE ---

export async function getHealthProfile(userId) {
  const { data, error } = await supabase
    .from('health_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error && error.code !== 'PGRST116') {
    console.error('Error fetching health profile:', error);
    return null;
  }
  return data;
}

export async function saveHealthProfile(userId, updates) {
  const { data: existing } = await supabase
    .from('health_profiles')
    .select('id')
    .eq('user_id', userId)
    .single();

  if (existing) {
    const { data, error } = await supabase
      .from('health_profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    if (error) throw error;
    return data;
  } else {
    const { data, error } = await supabase
      .from('health_profiles')
      .insert([{ user_id: userId, ...updates }])
      .select()
      .single();
    if (error) throw error;
    return data;
  }
}

// --- CONDITIONS ---

export async function getConditions(userId) {
  const { data, error } = await supabase
    .from('user_conditions')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addCondition(userId, conditionName, diagnosedDate = null, notes = '') {
  const { data, error } = await supabase
    .from('user_conditions')
    .insert([{ user_id: userId, condition_name: conditionName, diagnosed_date: diagnosedDate, notes }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeCondition(id) {
  const { error } = await supabase.from('user_conditions').delete().eq('id', id);
  if (error) throw error;
}

// --- ALLERGIES & INTOLERANCES ---

export async function getAllergies(userId) {
  const { data, error } = await supabase
    .from('user_allergies')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addAllergy(userId, allergyName, severity = 'medium') {
  const { data, error } = await supabase
    .from('user_allergies')
    .insert([{ user_id: userId, allergy_name: allergyName, severity }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeAllergy(id) {
  const { error } = await supabase.from('user_allergies').delete().eq('id', id);
  if (error) throw error;
}

export async function getIntolerances(userId) {
  const { data, error } = await supabase
    .from('user_intolerances')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addIntolerance(userId, intoleranceName, severity = 'medium') {
  const { data, error } = await supabase
    .from('user_intolerances')
    .insert([{ user_id: userId, intolerance_name: intoleranceName, severity }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeIntolerance(id) {
  const { error } = await supabase.from('user_intolerances').delete().eq('id', id);
  if (error) throw error;
}

// --- MEDICATIONS & SUPPLEMENTS ---

export async function getMedications(userId) {
  const { data, error } = await supabase
    .from('user_medications')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addMedication(userId, med) {
  const { data, error } = await supabase
    .from('user_medications')
    .insert([{ user_id: userId, ...med }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateMedication(id, updates) {
  const { data, error } = await supabase
    .from('user_medications')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeMedication(id) {
  const { error } = await supabase.from('user_medications').delete().eq('id', id);
  if (error) throw error;
}

export async function getSupplements(userId) {
  const { data, error } = await supabase
    .from('user_supplements')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data;
}

export async function addSupplement(userId, supp) {
  const { data, error } = await supabase
    .from('user_supplements')
    .insert([{ user_id: userId, ...supp }])
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function updateSupplement(id, updates) {
  const { data, error } = await supabase
    .from('user_supplements')
    .update(updates)
    .eq('id', id)
    .select()
    .single();
  if (error) throw error;
  return data;
}

export async function removeSupplement(id) {
  const { error } = await supabase.from('user_supplements').delete().eq('id', id);
  if (error) throw error;
}

// --- CONTEXT AGGREGATOR ---

export async function getFullHealthContext(userId) {
  const [profile, conditions, allergies, intolerances, medications, supplements] = await Promise.all([
    getHealthProfile(userId),
    getConditions(userId),
    getAllergies(userId),
    getIntolerances(userId),
    getMedications(userId),
    getSupplements(userId)
  ]);

  return {
    profile,
    conditions: conditions || [],
    allergies: allergies || [],
    intolerances: intolerances || [],
    medications: (medications || []).filter(m => m.is_active),
    supplements: (supplements || []).filter(s => s.is_active)
  };
}

export default {
  getHealthProfile, saveHealthProfile,
  getConditions, addCondition, removeCondition,
  getAllergies, addAllergy, removeAllergy,
  getIntolerances, addIntolerance, removeIntolerance,
  getMedications, addMedication, updateMedication, removeMedication,
  getSupplements, addSupplement, updateSupplement, removeSupplement,
  getFullHealthContext
};
