import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Calendar, Utensils, Award, ArrowRight, Loader2 } from 'lucide-react';

export default function WeeklyMealPlanCard() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [activePlan, setActivePlan] = useState(null);
  const [todayMenu, setTodayMenu] = useState(null);

  useEffect(() => {
    if (!user) return;
    fetchActivePlan();
  }, [user]);

  const getMondayOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  };

  const getItalianDayName = () => {
    const days = ['Domenica', 'Lunedì', 'Martedì', 'Mercoledì', 'Giovedì', 'Venerdì', 'Sabato'];
    return days[new Date().getDay()];
  };

  const fetchActivePlan = async () => {
    try {
      setLoading(true);
      const mondayStr = getMondayOfCurrentWeek();
      
      const { data: plans, error: planError } = await supabase
        .from('meal_plans')
        .select('*')
        .eq('user_id', user.id)
        .eq('week_start', mondayStr)
        .order('created_at', { ascending: false });

      if (planError) throw planError;

      if (plans && plans.length > 0) {
        const plan = plans[0];
        setActivePlan(plan);

        // Fetch today's menu
        const todayName = getItalianDayName();
        const { data: days, error: dayError } = await supabase
          .from('meal_plan_days')
          .select('*')
          .eq('meal_plan_id', plan.id)
          .eq('day_of_week', todayName)
          .maybeSingle();

        if (dayError) throw dayError;
        setTodayMenu(days);
      }
    } catch (e) {
      console.error("Errore caricamento piano in dashboard card:", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="glass-card-static p-6 flex justify-center items-center h-48">
        <Loader2 className="w-6 h-6 text-lime-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="glass-card-static p-6 space-y-6 relative overflow-hidden animate-fade-in">
      <div className="absolute -top-12 -left-12 w-32 h-32 bg-lime-500/5 rounded-full blur-3xl pointer-events-none"></div>

      {/* Header */}
      <div className="flex items-center justify-between border-b border-white/5 pb-4">
        <div className="flex items-center gap-2">
          <Calendar className="w-5 h-5 text-lime-400" />
          <h3 className="text-sm font-semibold text-slate-200">AI Meal Plan Settimanale</h3>
        </div>
        <button 
          onClick={() => navigate('/meal-planner')}
          className="text-xs text-lime-400 hover:text-lime-300 font-medium flex items-center gap-1 transition-all group"
        >
          Apri Planner <ArrowRight className="w-3 h-3 transition-transform group-hover:translate-x-0.5" />
        </button>
      </div>

      {!activePlan ? (
        <div className="text-center py-6 space-y-4">
          <div className="w-12 h-12 bg-white/5 border border-white/10 rounded-2xl flex items-center justify-center mx-auto">
            <Utensils className="w-6 h-6 text-white/40" />
          </div>
          <div className="space-y-1">
            <p className="text-xs text-white/70 font-medium">Nessun piano attivo per questa settimana</p>
            <p className="text-[10px] text-white/40">Genera un menu personalizzato in base alla tua dieta, obiettivi ed esami.</p>
          </div>
          <button
            onClick={() => navigate('/meal-planner')}
            className="px-4 py-2 bg-lime-500 hover:bg-lime-400 text-black text-xs font-bold rounded-xl transition-all shadow-md shadow-lime-500/10"
          >
            Crea Piano Ora
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Active diet info */}
          <div className="flex items-center justify-between bg-white/[0.02] border border-white/5 p-3 rounded-2xl">
            <div className="flex items-center gap-2">
              <Award className="w-4 h-4 text-lime-400" />
              <span className="text-xs font-semibold text-white/80 capitalize">Dieta {activePlan.diet_type}</span>
            </div>
            <span className="text-[10px] font-mono text-white/40">Inizio: {activePlan.week_start}</span>
          </div>

          {/* Today menu preview */}
          {todayMenu ? (
            <div className="space-y-3">
              <div className="flex justify-between text-xs font-medium text-white/60">
                <span>Menu di Oggi ({todayMenu.day_of_week}):</span>
                <span className="text-lime-400 font-mono">{todayMenu.calories} kcal</span>
              </div>

              {/* Grid of today's meals */}
              <div className="grid grid-cols-2 gap-2 text-[10px] font-medium text-white/70">
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-white/30 block mb-0.5">Colazione</span>
                  <span className="truncate block font-semibold">{todayMenu.breakfast?.name || 'Non pianificato'}</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-white/30 block mb-0.5">Pranzo</span>
                  <span className="truncate block font-semibold">{todayMenu.lunch?.name || 'Non pianificato'}</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-white/30 block mb-0.5">Cena</span>
                  <span className="truncate block font-semibold">{todayMenu.dinner?.name || 'Non pianificato'}</span>
                </div>
                <div className="bg-white/[0.01] border border-white/5 p-2 rounded-xl">
                  <span className="text-white/30 block mb-0.5">Spuntino</span>
                  <span className="truncate block font-semibold">{todayMenu.snacks?.name || 'Non pianificato'}</span>
                </div>
              </div>

              {/* Macro Bar breakdown */}
              <div className="space-y-1.5 pt-2 border-t border-white/5">
                <div className="flex justify-between text-[9px] text-white/40 font-mono">
                  <span>P: {todayMenu.proteins}g</span>
                  <span>C: {todayMenu.carbs}g</span>
                  <span>F: {todayMenu.fats}g</span>
                </div>
                <div className="w-full bg-white/5 h-1 rounded-full overflow-hidden flex">
                  <div className="bg-cyan-400 h-full" style={{ width: `${(todayMenu.proteins * 4 / todayMenu.calories) * 100}%` }}></div>
                  <div className="bg-lime-400 h-full" style={{ width: `${(todayMenu.carbs * 4 / todayMenu.calories) * 100}%` }}></div>
                  <div className="bg-rose-400 h-full" style={{ width: `${(todayMenu.fats * 9 / todayMenu.calories) * 100}%` }}></div>
                </div>
              </div>
            </div>
          ) : (
            <div className="text-center py-4">
              <p className="text-[10px] text-white/40">Nessun pasto pianificato per oggi.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
