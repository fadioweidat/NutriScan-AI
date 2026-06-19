import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import engine from '../lib/nutrition-engine';
import healthEngine from '../lib/health-engine';
import lifestyleEngine from '../lib/lifestyle-engine';
import medicalKnowledgeEngine from '../lib/engines/medical-knowledge-engine';
import scientificNutritionEngine from '../lib/engines/scientific-nutrition-engine';
import { getHealthCoachContext } from '../lib/engines/health-coach-engine';
import { Send, Bot, User, Loader2, Sparkles, AlertTriangle } from 'lucide-react';

const QUICK_PROMPTS = [
  "Cosa mi manca oggi?",
  "Come posso aumentare il magnesio?",
  "Come posso aumentare la vitamina D?",
  "Quali sono le mie priorità nutrizionali?",
  "Cosa posso mangiare stasera?",
  "Sono in Keto, cosa devo monitorare?",
  "Sono in Carnivore, cosa devo monitorare?"
];

export default function AiChatPage() {
  const { user, profile } = useAuth();
  
  const [hasMeals, setHasMeals] = useState(null);
  const [contextData, setContextData] = useState(null);
  
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Ciao! Sono il tuo assistente nutrizionale. Posso aiutarti a capire cosa ti manca oggi o suggerirti come colmare i tuoi fabbisogni con alimenti specifici.' }
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  useEffect(() => {
    async function prepareContext() {
      // Fetch 7 days of meals
      const today = new Date();
      const sevenDaysAgo = new Date(today);
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      // Helper to fetch meal planner data concurrently
      const fetchMealPlannerContext = async (userId) => {
        const getMondayOfCurrentWeek = () => {
          const d = new Date();
          const day = d.getDay();
          const diff = d.getDate() - day + (day === 0 ? -6 : 1);
          const mon = new Date(d.setDate(diff));
          return mon.toISOString().split('T')[0];
        };
        const mondayStr = getMondayOfCurrentWeek();

        const { data: plans } = await supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', userId)
          .eq('week_start', mondayStr)
          .order('created_at', { ascending: false });

        if (plans && plans.length > 0) {
          const activePlan = plans[0];

          const [daysRes, listRes] = await Promise.all([
            supabase.from('meal_plan_days').select('*').eq('meal_plan_id', activePlan.id).order('created_at', { ascending: true }),
            supabase.from('shopping_lists').select('id').eq('meal_plan_id', activePlan.id)
          ]);

          let listItems = [];
          if (listRes.data && listRes.data.length > 0) {
            const { data: items } = await supabase
              .from('shopping_list_items')
              .select('*')
              .eq('shopping_list_id', listRes.data[0].id);
            listItems = items || [];
          }

          const days = daysRes.data || [];
          return {
            diet_type: activePlan.diet_type,
            calories_target: activePlan.calories_target,
            // Optimized: only send food names and macro aggregates to keep AI payload small
            days: days.map(d => ({
              day: d.day_of_week,
              breakfast: d.breakfast?.name || '',
              lunch: d.lunch?.name || '',
              dinner: d.dinner?.name || '',
              snacks: d.snacks?.name || '',
              macros: { Kcal: d.calories, Prot: d.proteins, Carbs: d.carbs, Fats: d.fats }
            })),
            shopping_list: listItems.map(item => ({ alimento: item.alimento, quantita: item.quantita, categoria: item.categoria, completato: item.completato }))
          };
        }
        return null;
      };

      // Parallelize baseline context fetches
      const [
        mealsRes,
        healthContext,
        lifestyleContext,
        healthCoachContext,
        mealPlannerContext
      ] = await Promise.all([
        supabase
          .from('meal_entries')
          .select(`
            *,
            foods (*, food_nutrients (*))
          `)
          .gte('entry_date', sevenDaysAgo.toISOString().split('T')[0]),
        healthEngine.getFullHealthContext(user.id).catch(e => { console.error(e); return null; }),
        lifestyleEngine.getTodayLifestyleContext(user.id).catch(e => { console.error(e); return null; }),
        getHealthCoachContext(supabase, user.id).catch(e => { console.error(e); return null; }),
        fetchMealPlannerContext(user.id).catch(e => { console.error(e); return null; })
      ]);

      const meals = mealsRes.data;
      if (!meals || meals.length === 0) {
        setHasMeals(false);
        return;
      }

      setHasMeals(true);

      // Extract today's meals
      const todayStr = today.toISOString().split('T')[0];
      const todayMeals = meals.filter(m => m.entry_date === todayStr);

      // Reconstruct meals with nutrients for engine
      const reconstructMeals = (mealEntries) => {
         return mealEntries.map(m => {
             const food = m.foods;
             const nutrients = engine.calculateMealNutrients(food, m.quantity_grams);
             return { ...m, nutrients };
         });
      };

      const todayReconstructed = reconstructMeals(todayMeals);
      const todayTotals = engine.calculateDailyTotals(todayReconstructed);
      
      const medicalContext = medicalKnowledgeEngine.generateMedicalContext(healthContext);
      const scientificContext = scientificNutritionEngine.generateScientificContext(healthContext, lifestyleContext);
      
      const rda = engine.getRDA(profile, healthContext);
      const score = engine.calculateNutritionScore(todayTotals, profile); // fixed bug: passing profile instead of rda
      const comparison = engine.compareWithRDA(todayTotals, profile);

      // Calculate priorities over 7 days
      const allReconstructed = reconstructMeals(meals);
      const daysMap = {};
      allReconstructed.forEach(m => {
        if (!daysMap[m.entry_date]) daysMap[m.entry_date] = [];
        daysMap[m.entry_date].push(m);
      });
      const daysTotals = Object.values(daysMap).map(dayMeals => engine.calculateDailyTotals(dayMeals));
      const avgTotals = engine.calculateAverageTotals(daysTotals);
      const priorities = engine.getTopNutritionalPriorities(avgTotals, rda, 3, profile);

      // Clean healthContext payload to avoid sending DB metadata, timestamps, and keys to the AI
      const cleanedHealthContext = {
        conditions: (healthContext?.conditions || []).map(c => ({ condition_name: c.condition_name, diagnosed_date: c.diagnosed_date })),
        allergies: (healthContext?.allergies || []).map(a => ({ allergy_name: a.allergy_name, severity: a.severity })),
        intolerances: (healthContext?.intolerances || []).map(i => ({ intolerance_name: i.intolerance_name, severity: i.severity })),
        medications: (healthContext?.medications || []).map(m => ({ medication_name: m.medication_name, dosage: m.dosage, frequency: m.frequency })),
        supplements: (healthContext?.supplements || []).map(s => ({ supplement_name: s.supplement_name, dosage: s.dosage, frequency: s.frequency }))
      };

      setContextData({
        diet: profile?.diet_type || 'standard',
        healthContext: cleanedHealthContext,
        lifestyleContext: {
          sleep: lifestyleContext?.sleep,
          stress: lifestyleContext?.stress,
          hydration: lifestyleContext?.hydration,
          activity: lifestyleContext?.activity,
          digestion: lifestyleContext?.digestion
        },
        medicalContext: medicalContext,
        scientificContext: scientificContext,
        healthCoachContext: healthCoachContext,
        mealPlannerContext: mealPlannerContext,
        score: score,
        todayTotals: todayTotals,
        okNutrients: comparison.ok,
        improveNutrients: comparison.low,
        missingNutrients: comparison.missing,
        sevenDayPriorities: priorities
      });
    }

    if (user) prepareContext();
  }, [user, profile]);

  const handleSend = async (text = input) => {
    if (!text.trim() || loading) return;

    const newMessages = [...messages, { role: 'user', content: text }];
    setMessages(newMessages);
    setInput('');
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('ai-nutrition-chat', {
        body: { 
          messages: newMessages.map(m => ({ role: m.role, content: m.content })),
          context: contextData
        }
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      setMessages(prev => [...prev, { role: 'assistant', content: data.reply }]);
    } catch (err) {
      console.error("Errore chat:", err);
      setMessages(prev => [...prev, { role: 'assistant', content: "Scusa, si è verificato un errore temporaneo di connessione. Riprova." }]);
    } finally {
      setLoading(false);
    }
  };

  if (hasMeals === null) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  if (hasMeals === false) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-12">
        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-amber-500/50"></div>
          <AlertTriangle className="w-12 h-12 text-amber-400 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-white mb-2">Dati Insufficienti</h2>
          <p className="text-white/60 mb-6">Aggiungi almeno un pasto per ricevere un’analisi nutrizionale.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-[140px])] min-h-[600px] flex flex-col bg-[#0a0a0f] rounded-3xl border border-white/10 overflow-hidden mt-6 shadow-2xl">
      {/* Header */}
      <div className="px-6 py-4 bg-white/5 border-b border-white/10 flex items-center gap-4 shrink-0">
        <div className="w-12 h-12 rounded-full bg-cyan-500/20 flex items-center justify-center">
          <Sparkles className="w-6 h-6 text-cyan-400" />
        </div>
        <div>
          <h1 className="text-xl font-bold text-white leading-tight">NutriScan AI</h1>
          <p className="text-cyan-400/80 text-sm font-medium">Assistente Personale</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        {messages.map((msg, idx) => (
          <div key={idx} className={`flex gap-4 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center shadow-lg ${msg.role === 'user' ? 'bg-lime-500/20 shadow-lime-500/10' : 'bg-cyan-500/20 shadow-cyan-500/10'}`}>
              {msg.role === 'user' ? <User className="w-5 h-5 text-lime-400" /> : <Bot className="w-5 h-5 text-cyan-400" />}
            </div>
            <div className={`max-w-[80%] rounded-3xl p-5 ${msg.role === 'user' ? 'bg-lime-500 text-black rounded-tr-sm' : 'bg-white/5 border border-white/10 text-white/90 rounded-tl-sm'}`}>
              <p className="text-sm whitespace-pre-wrap leading-relaxed font-medium">{msg.content}</p>
            </div>
          </div>
        ))}
        {loading && (
          <div className="flex gap-4">
            <div className="w-10 h-10 shrink-0 rounded-full bg-cyan-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="bg-white/5 border border-white/10 rounded-3xl rounded-tl-sm p-5 flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce" />
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.2s]" />
              <span className="w-2.5 h-2.5 bg-cyan-400 rounded-full animate-bounce [animation-delay:0.4s]" />
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-6 shrink-0 bg-white/5 border-t border-white/10">
        <div className="flex gap-2 overflow-x-auto pb-4 mb-2 no-scrollbar">
          {QUICK_PROMPTS.map((prompt, idx) => (
            <button
              key={idx}
              onClick={() => handleSend(prompt)}
              disabled={loading}
              className="shrink-0 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-colors whitespace-nowrap"
            >
              {prompt}
            </button>
          ))}
        </div>
        <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="relative flex items-center">
          <input
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Chiedi all'AI..."
            className="w-full bg-black/40 border border-white/10 rounded-2xl py-4 pl-5 pr-16 text-white text-base focus:outline-none focus:border-cyan-500/50 transition-all"
          />
          <button
            type="submit"
            disabled={!input.trim() || loading}
            className="absolute right-2 w-12 h-12 bg-cyan-500 hover:bg-cyan-400 disabled:bg-white/10 text-black disabled:text-white/30 rounded-xl flex items-center justify-center transition-all shadow-lg shadow-cyan-500/20 disabled:shadow-none"
          >
            <Send className="w-5 h-5" />
          </button>
        </form>
      </div>
    </div>
  );
}
