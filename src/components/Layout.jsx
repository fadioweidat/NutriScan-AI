import { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import {
  LayoutDashboard,
  UtensilsCrossed,
  BookOpen,
  BarChart3,
  User,
  Settings,
  Menu,
  X,
  LogOut,
  Leaf,
  AlertTriangle,
  BrainCircuit,
  CalendarDays
} from 'lucide-react';

const NAV_ITEMS = [
  { to: '/',               label: 'Dashboard',          icon: LayoutDashboard },
  { to: '/add-meal',       label: 'Aggiungi Pasto',     icon: UtensilsCrossed },
  { to: '/diary',          label: 'Diario',             icon: BookOpen },
  { to: '/nutrient-map',   label: 'Mappa Nutrienti',    icon: CalendarDays },
  { to: '/report',         label: 'Report Settimanale', icon: BarChart3 },
  { to: '/ai-analysis',    label: 'Analisi AI',         icon: BrainCircuit },
  { to: '/lifestyle',      label: 'Lifestyle',          icon: User },
  { to: '/health-profile', label: 'Profilo Salute',     icon: AlertTriangle },
  { to: '/medications',    label: 'Farmaci & Int.',     icon: BookOpen },
  { to: '/profile',        label: 'Profilo Utente',     icon: User },
  { to: '/diet-settings',  label: 'Impostazioni Dieta', icon: Settings },
];

export default function Layout({ children }) {
  const { profile, signOut } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();

  // Close mobile sidebar on route change
  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    document.body.style.overflow = sidebarOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [sidebarOpen]);

  return (
    <div className="flex min-h-dvh bg-[#0a0a0f]">
      {/* ── Mobile overlay ── */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden animate-fade-in"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* ── Sidebar ── */}
      <aside
        className={`
          fixed z-50 top-0 left-0 h-dvh w-[260px] flex flex-col
          bg-[#0d0d14]/80 backdrop-blur-2xl
          border-r border-white/[0.06]
          transition-transform duration-300 ease-out
          md:translate-x-0 md:static md:z-auto
          ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        `}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-6 border-b border-white/[0.06]">
          <div className="flex items-center justify-center w-9 h-9 rounded-xl bg-accent/10">
            <Leaf className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h1 className="text-[15px] font-bold gradient-text leading-tight">NutriScan AI</h1>
            <p className="text-[10px] text-slate-500 font-medium tracking-wide uppercase">
              Nutrizione Intelligente
            </p>
          </div>
          {/* Mobile close */}
          <button
            onClick={() => setSidebarOpen(false)}
            className="ml-auto p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-white/[0.04] md:hidden"
            aria-label="Chiudi menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto">
          {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === '/'}
              className={({ isActive }) =>
                `nav-link ${isActive ? 'active' : ''}`
              }
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span>{label}</span>
            </NavLink>
          ))}
        </nav>

        {/* User footer */}
        <div className="px-3 py-4 border-t border-white/[0.06]">
          <div className="flex items-center gap-3 px-3 py-2">
            <div className="w-8 h-8 rounded-full bg-accent/20 flex items-center justify-center">
              <User className="w-4 h-4 text-accent" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-slate-200 truncate">{profile?.full_name || 'Utente'}</p>
              <p className="text-[11px] text-slate-500 truncate">Account attivo</p>
            </div>
            <button
              onClick={() => signOut()}
              className="p-1.5 rounded-lg text-slate-500 hover:text-red-400 hover:bg-red-400/10 transition-colors"
              title="Esci"
              aria-label="Esci"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="flex-1 flex flex-col min-h-dvh min-w-0">
        {/* Mobile header */}
        <header className="sticky top-0 z-30 flex items-center gap-3 px-4 py-3 bg-[#0a0a0f]/80 backdrop-blur-xl border-b border-white/[0.06] md:hidden">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-white/[0.04]"
            aria-label="Apri menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex items-center gap-2">
            <Leaf className="w-5 h-5 text-accent" />
            <span className="text-sm font-bold gradient-text">NutriScan AI</span>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 p-4 md:p-8 page-enter">
          {children}
        </main>

        {/* Footer with medical disclaimer */}
        <footer className="px-4 md:px-8 py-4 border-t border-white/[0.06]">
          <div className="medical-disclaimer max-w-3xl mx-auto">
            <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
            <p>
              Le informazioni fornite da NutriScan AI sono a scopo educativo e
              informativo. Non sostituiscono il parere di un medico o
              nutrizionista qualificato. Consulta sempre un professionista
              sanitario prima di apportare modifiche alla tua dieta.
            </p>
          </div>
        </footer>
      </div>
    </div>
  );
}
