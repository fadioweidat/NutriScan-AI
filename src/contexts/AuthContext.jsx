import { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const sanitizeProfile = (p) => {
    if (!p) return null;
    let name = p.full_name;
    if (typeof name === 'object' || name === '[object Object]' || !name) {
      name = 'Utente';
    }
    return { ...p, full_name: name };
  };

  useEffect(() => {
    const initAuth = async () => {
      setLoading(true);
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUser(session.user);
        await fetchProfile(session.user.id);
      }
      
      supabase.auth.onAuthStateChange(async (_event, session) => {
        if (session?.user) {
          setUser(session.user);
          await fetchProfile(session.user.id);
        } else {
          setUser(null);
          setProfile(null);
        }
      });
      setLoading(false);
    };

    initAuth();
  }, []);

  const fetchProfile = async (userId) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Errore caricamento profilo:', error);
        return;
      }

      if (data) {
        setProfile(sanitizeProfile(data));
        return;
      }

      // Profilo non esiste: crealo automaticamente per il nuovo utente
      const { data: { user: authUser } } = await supabase.auth.getUser();
      const { data: newProfile, error: insertError } = await supabase
        .from('user_profiles')
        .insert({
          id: userId,
          full_name: authUser?.user_metadata?.full_name || authUser?.email?.split('@')[0] || 'Utente',
          diet_type: 'standard',
          activity_level: 'moderate'
        })
        .select()
        .maybeSingle();

      if (insertError) {
        console.error('Errore creazione profilo:', insertError);
        return;
      }

      if (newProfile) {
        setProfile(sanitizeProfile(newProfile));
      }
    } catch (err) {
      console.error('Errore imprevisto fetchProfile:', err);
    }
  };

  const signIn = async (email, password) => {
    return await supabase.auth.signInWithPassword({ email, password });
  };

  const signUp = async (email, password, fullName) => {
    return await supabase.auth.signUp({
      email,
      password,
      options: { 
        data: { full_name: fullName },
        emailRedirectTo: `${window.location.origin}/login`
      }
    });
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const resetPasswordForEmail = async (email) => {
    return await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`
    });
  };

  const updateUserPassword = async (newPassword) => {
    return await supabase.auth.updateUser({ password: newPassword });
  };

  const updateProfile = async (updates) => {
    const { error } = await supabase
      .from('user_profiles')
      .update(updates)
      .eq('id', user.id);
    if (!error) {
      setProfile(sanitizeProfile({ ...profile, ...updates }));
    }
    return { error };
  };

  return (
    <AuthContext.Provider value={{ 
      user, profile, loading, signIn, signUp, signOut, 
      resetPasswordForEmail, updateUserPassword, updateProfile 
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
