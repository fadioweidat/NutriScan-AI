import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Leaf, Mail, Lock, User, Loader2, Eye, EyeOff } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  const { signIn, signUp, user } = useAuth();

  const [activeTab, setActiveTab] = useState('login'); // 'login' | 'register'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // Redirect if already logged in
  if (user) {
    navigate('/', { replace: true });
    return null;
  }

  const validate = () => {
    if (!email.trim()) {
      setError('Inserisci il tuo indirizzo email.');
      return false;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Indirizzo email non valido.');
      return false;
    }
    if (!password) {
      setError('Inserisci la password.');
      return false;
    }
    if (password.length < 6) {
      setError('La password deve contenere almeno 6 caratteri.');
      return false;
    }
    if (activeTab === 'register' && !fullName.trim()) {
      setError('Inserisci il tuo nome completo.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!validate()) return;

    setLoading(true);
    try {
      if (activeTab === 'login') {
        const { error: signInError } = await signIn(email, password);
        if (signInError) {
          setError(
            signInError.message === 'Invalid login credentials'
              ? 'Credenziali non valide. Controlla email e password.'
              : signInError.message || 'Errore durante l\'accesso. Riprova.'
          );
          return;
        }
      } else {
        const { error: signUpError } = await signUp(email, password, fullName.trim());
        if (signUpError) {
          setError(
            signUpError.message?.includes('already registered')
              ? 'Questo indirizzo email è già registrato.'
              : signUpError.message || 'Errore durante la registrazione. Riprova.'
          );
          return;
        }
      }
      navigate('/', { replace: true });
    } catch (err) {
      setError('Si è verificato un errore imprevisto. Riprova più tardi.');
    } finally {
      setLoading(false);
    }
  };

  const switchTab = (tab) => {
    setActiveTab(tab);
    setError('');
  };

  return (
    <div className="min-h-screen bg-[#0a0a0f] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-lime-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-cyan-500/8 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-lime-400/5 rounded-full blur-[150px] pointer-events-none" />

      <div className="w-full max-w-md relative z-10">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-lime-500/20 border border-lime-500/30 mb-4">
            <Leaf className="w-8 h-8 text-lime-400" />
          </div>
          <h1 className="text-3xl font-bold text-white tracking-tight">
            Nutri<span className="text-lime-400">Scan</span> AI
          </h1>
          <p className="text-white/50 mt-2 text-sm">
            Scopri cosa manca nella tua alimentazione
          </p>
        </div>

        {/* Card */}
        <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl">
          {/* Tabs */}
          <div className="flex bg-white/5 rounded-xl p-1 mb-6">
            <button
              type="button"
              onClick={() => switchTab('login')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeTab === 'login'
                  ? 'bg-lime-500/20 text-lime-400 shadow-lg shadow-lime-500/10'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Accedi
            </button>
            <button
              type="button"
              onClick={() => switchTab('register')}
              className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all duration-300 ${
                activeTab === 'register'
                  ? 'bg-lime-500/20 text-lime-400 shadow-lg shadow-lime-500/10'
                  : 'text-white/50 hover:text-white/70'
              }`}
            >
              Registrati
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-red-400 text-sm">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {activeTab === 'register' && (
              <div>
                <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                  Nome completo
                </label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                  <input
                    type="text"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Mario Rossi"
                    className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="mario@esempio.it"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-4 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-white/60 text-xs font-medium mb-1.5 ml-1">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-3 pl-10 pr-10 text-white placeholder:text-white/20 text-sm focus:outline-none focus:border-lime-500/50 focus:ring-1 focus:ring-lime-500/30 transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60 transition-colors"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-lime-500 hover:bg-lime-400 disabled:bg-lime-500/50 text-black font-semibold rounded-xl transition-all duration-300 flex items-center justify-center gap-2 mt-6 shadow-lg shadow-lime-500/20"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {activeTab === 'login' ? 'Accesso in corso...' : 'Registrazione in corso...'}
                </>
              ) : (
                activeTab === 'login' ? 'Accedi' : 'Crea Account'
              )}
            </button>
          </form>
        </div>

        {/* Footer text */}
        <p className="text-center text-white/30 text-xs mt-6">
          NutriScan AI non sostituisce il parere medico professionale.
        </p>
      </div>
    </div>
  );
}
