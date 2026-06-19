import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { getHealthCoachContext } from '../lib/engines/health-coach-engine';
import { generateWeeklyMealPlan } from '../lib/engines/meal-planner-engine';
import { getRecipeAlternatives } from '../lib/engines/food-substitution-engine';
import { generateShoppingList } from '../lib/engines/shopping-list-engine';
import { evaluateWeeklyBalance } from '../lib/engines/weekly-balance-engine';
import { 
  Calendar, Utensils, Printer, RotateCw, RefreshCw, Eye, CheckCircle2, 
  ListTodo, Info, Heart, ArrowRight, Loader2, Sparkles, ChevronDown 
} from 'lucide-react';

export default function MealPlannerPage() {
  const { user } = useAuth();
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [coachContext, setCoachContext] = useState(null);
  
  const [mealPlan, setMealPlan] = useState(null); // active meal plan record
  const [planDays, setPlanDays] = useState([]); // plan days from DB
  const [shoppingList, setShoppingList] = useState([]); // shopping items from DB
  const [shoppingListId, setShoppingListId] = useState(null);

  // Modal recipe view state
  const [activeRecipeModal, setActiveRecipeModal] = useState(null);
  // Substitution state
  const [activeSubstitution, setActiveSubstitution] = useState(null); // { dayIndex, mealKey, recipe }

  useEffect(() => {
    if (!user) return;
    loadPlannerData();
  }, [user]);

  const getMondayOfCurrentWeek = () => {
    const d = new Date();
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(d.setDate(diff));
    return mon.toISOString().split('T')[0];
  };

  async function loadPlannerData() {
    try {
      setLoading(true);
      const mondayStr = getMondayOfCurrentWeek();
      
      // Parallelize context and meal plans fetch
      const [context, plansRes] = await Promise.all([
        getHealthCoachContext(supabase, user.id),
        supabase
          .from('meal_plans')
          .select('*')
          .eq('user_id', user.id)
          .eq('week_start', mondayStr)
          .order('created_at', { ascending: false })
      ]);

      setCoachContext(context);
      if (plansRes.error) throw plansRes.error;

      const plans = plansRes.data;
      if (plans && plans.length > 0) {
        const activePlan = plans[0];
        setMealPlan(activePlan);

        // Parallelize fetching of days and shopping lists
        const [daysRes, listsRes] = await Promise.all([
          supabase
            .from('meal_plan_days')
            .select('*')
            .eq('meal_plan_id', activePlan.id)
            .order('created_at', { ascending: true }),
          supabase
            .from('shopping_lists')
            .select('id')
            .eq('meal_plan_id', activePlan.id)
            .eq('user_id', user.id)
        ]);

        if (daysRes.error) throw daysRes.error;
        setPlanDays(daysRes.data || []);

        const lists = listsRes.data || [];
        if (lists.length > 0) {
          const listId = lists[0].id;
          setShoppingListId(listId);
          const { data: items, error: itemsError } = await supabase
            .from('shopping_list_items')
            .select('*')
            .eq('shopping_list_id', listId)
            .order('categoria', { ascending: true })
            .order('alimento', { ascending: true });
          
          if (itemsError) throw itemsError;
          setShoppingList(items || []);
        }
      }
    } catch (e) {
      console.error("Errore nel caricamento dei dati del Planner:", e);
    } finally {
      setLoading(false);
    }
  }

  // Generate new weekly plan client side
  const handleGeneratePlan = () => {
    if (!coachContext) return;
    try {
      // Calculate target calories from profile or default to 2000
      const calTarget = coachContext.lifestyle?.waterMl ? 2000 : 2000; // default target
      const generated = generateWeeklyMealPlan({
        diet: coachContext.diet || 'standard',
        allergies: coachContext.allergies || [],
        intolerances: coachContext.allergie || [],
        conditions: coachContext.patologie || []
      }, calTarget);

      // Map to state days format (matching table schema)
      const mappedDays = generated.map(day => ({
        day_of_week: day.day_of_week,
        breakfast: day.breakfast,
        lunch: day.lunch,
        dinner: day.dinner,
        snacks: day.snacks,
        calories: day.calories,
        proteins: day.proteins,
        carbs: day.carbs,
        fats: day.fats
      }));

      setPlanDays(mappedDays);
      
      // Auto-compile shopping list client side
      const items = generateShoppingList(mappedDays);
      setShoppingList(items.map(item => ({ ...item, id: Math.random().toString(), mock: true })));
      setMealPlan({ mock: true });
    } catch (err) {
      alert(err.message);
    }
  };

  // Save current plan in Supabase
  const handleSavePlan = async () => {
    if (planDays.length === 0 || saving) return;
    try {
      setSaving(true);
      const mondayStr = getMondayOfCurrentWeek();
      const calTarget = 2000;
      const dietType = coachContext?.diet || 'standard';

      // 1. Delete previous weekly plan (and cascades days & lists)
      await supabase
        .from('meal_plans')
        .delete()
        .eq('user_id', user.id)
        .eq('week_start', mondayStr);

      // 2. Insert new plan
      const { data: plan, error: planError } = await supabase
        .from('meal_plans')
        .insert({
          user_id: user.id,
          week_start: mondayStr,
          diet_type: dietType,
          calories_target: calTarget
        })
        .select()
        .single();

      if (planError) throw planError;

      // 3. Insert days
      const daysRows = planDays.map(day => ({
        meal_plan_id: plan.id,
        user_id: user.id,
        day_of_week: day.day_of_week,
        breakfast: day.breakfast,
        lunch: day.lunch,
        dinner: day.dinner,
        snacks: day.snacks,
        calories: day.calories,
        proteins: day.proteins,
        carbs: day.carbs,
        fats: day.fats
      }));

      const { error: daysError } = await supabase
        .from('meal_plan_days')
        .insert(daysRows);

      if (daysError) throw daysError;

      // 4. Insert shopping list
      const { data: list, error: listError } = await supabase
        .from('shopping_lists')
        .insert({
          meal_plan_id: plan.id,
          user_id: user.id
        })
        .select()
        .single();

      if (listError) throw listError;

      const items = generateShoppingList(planDays);
      const itemsRows = items.map(item => ({
        shopping_list_id: list.id,
        user_id: user.id,
        alimento: item.alimento,
        quantita: item.quantita,
        categoria: item.categoria,
        completato: false
      }));

      const { error: itemsError } = await supabase
        .from('shopping_list_items')
        .insert(itemsRows);

      if (itemsError) throw itemsError;

      // Reload
      await loadPlannerData();
      alert("Piano alimentare settimanale salvato con successo!");
    } catch (e) {
      console.error(e);
      alert("Errore durante il salvataggio: " + e.message);
    } finally {
      setSaving(false);
    }
  };

  // Toggle shopping list item state
  const handleToggleItem = async (item) => {
    if (item.mock) {
      setShoppingList(prev => prev.map(i => i.id === item.id ? { ...i, completato: !i.completato } : i));
      return;
    }
    try {
      const { error } = await supabase
        .from('shopping_list_items')
        .update({ completato: !item.completato })
        .eq('id', item.id);

      if (error) throw error;
      setShoppingList(prev => prev.map(i => i.id === item.id ? { ...i, completato: !i.completato } : i));
    } catch (e) {
      console.error(e);
    }
  };

  // Rigenera a single meal slot randomly from compatible recipes
  const handleRigeneraMeal = (dayIndex, mealKey) => {
    if (!coachContext) return;
    try {
      const currentDay = planDays[dayIndex];
      const diet = coachContext.diet || 'standard';
      const safeRecipes = generatedSafeRecipes;

      const isBreakfast = mealKey === 'breakfast';
      const isSnack = mealKey === 'snacks';
      
      const pool = safeRecipes.filter(r => {
        if (isBreakfast) return r.id.includes('frittata') || r.id.includes('pancake') || r.id.includes('smoothie') || r.id.includes('uova');
        if (isSnack) return r.id.includes('caprese') || r.id.includes('hummus') || r.id.includes('smoothie') || r.id.includes('brodo') || r.id.includes('crema') || r.id.includes('pancake');
        // Lunch/dinner mains
        return !r.id.includes('pancake') && !r.id.includes('smoothie') && !r.id.includes('frittata');
      });

      const chosen = pool[Math.floor(Math.random() * pool.length)] || safeRecipes[0];

      setPlanDays(prev => {
        const copy = [...prev];
        copy[dayIndex] = { ...currentDay, [mealKey]: chosen };
        
        // Recompute day stats
        const d = copy[dayIndex];
        const dayCal = d.breakfast.calories + d.lunch.calories + d.dinner.calories + d.snacks.calories;
        const dayProt = d.breakfast.proteins + d.lunch.proteins + d.dinner.proteins + d.snacks.proteins;
        const dayCarb = d.breakfast.carbs + d.lunch.carbs + d.dinner.carbs + d.snacks.carbs;
        const dayFat = d.breakfast.fats + d.lunch.fats + d.dinner.fats + d.snacks.fats;
        
        copy[dayIndex] = { ...d, calories: dayCal, proteins: dayProt, carbs: dayCarb, fats: dayFat };
        
        // Auto update shopping list preview
        const items = generateShoppingList(copy);
        setShoppingList(items.map(item => ({ ...item, id: Math.random().toString(), mock: true })));
        
        return copy;
      });
      
      setMealPlan({ mock: true });
    } catch (e) {
      console.error(e);
    }
  };

  // Open substitute modal to let the user choose
  const handleOpenSubstitution = (dayIndex, mealKey, recipe) => {
    setActiveSubstitution({ dayIndex, mealKey, recipe });
  };

  const handleApplySubstitution = (alternativeRecipe) => {
    if (!activeSubstitution) return;
    const { dayIndex, mealKey } = activeSubstitution;
    const currentDay = planDays[dayIndex];

    setPlanDays(prev => {
      const copy = [...prev];
      copy[dayIndex] = { ...currentDay, [mealKey]: alternativeRecipe };
      
      const d = copy[dayIndex];
      const dayCal = d.breakfast.calories + d.lunch.calories + d.dinner.calories + d.snacks.calories;
      const dayProt = d.breakfast.proteins + d.lunch.proteins + d.dinner.proteins + d.snacks.proteins;
      const dayCarb = d.breakfast.carbs + d.lunch.carbs + d.dinner.carbs + d.snacks.carbs;
      const dayFat = d.breakfast.fats + d.lunch.fats + d.dinner.fats + d.snacks.fats;
      
      copy[dayIndex] = { ...d, calories: dayCal, proteins: dayProt, carbs: dayCarb, fats: dayFat };
      
      const items = generateShoppingList(copy);
      setShoppingList(items.map(item => ({ ...item, id: Math.random().toString(), mock: true })));

      return copy;
    });

    setMealPlan({ mock: true });
    setActiveSubstitution(null);
  };

  // Helper properties
  const generatedSafeRecipes = useMemo(() => {
    if (!coachContext) return [];
    const all = recipeEngine.RECIPES;
    return recipeEngine.filterRecipes(all, {
      allergies: coachContext.allergies || [],
      intolerances: coachContext.allergie || [],
      conditions: coachContext.patologie || []
    });
  }, [coachContext]);

  const substitutionAlternatives = useMemo(() => {
    if (!activeSubstitution) return [];
    return getRecipeAlternatives(activeSubstitution.recipe, generatedSafeRecipes);
  }, [activeSubstitution, generatedSafeRecipes]);

  const weeklyBalance = useMemo(() => {
    return evaluateWeeklyBalance(planDays, 2000);
  }, [planDays]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <Loader2 className="w-8 h-8 text-lime-400 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-6">
      
      {/* CSS print style block */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #print-section, #print-section * {
            visibility: visible;
          }
          #print-section {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            background: white !important;
            color: black !important;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      {/* Header Row */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-white/5 pb-5 no-print">
        <div>
          <h1 className="text-2xl font-bold text-white flex items-center gap-2">
            <Calendar className="w-6 h-6 text-lime-400" /> AI Meal Planner 4.0
          </h1>
          <p className="text-white/40 text-xs">Pianifica pasti settimanali calibrati su profilazione clinica, stile di vita ed esami.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={handleGeneratePlan}
            className="px-4 py-2.5 bg-white/5 hover:bg-white/10 text-white border border-white/10 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Rigenera Piano
          </button>
          <button
            onClick={handleSavePlan}
            disabled={planDays.length === 0 || saving}
            className="px-5 py-2.5 bg-lime-500 hover:bg-lime-400 disabled:opacity-50 text-black text-xs font-bold rounded-xl transition-all shadow-lg shadow-lime-500/10 flex items-center gap-2"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />} Salva Piano su Supabase
          </button>
        </div>
      </div>

      {planDays.length === 0 ? (
        <div className="bg-gradient-to-br from-surface-light to-surface border border-white/5 rounded-3xl p-12 text-center space-y-6 max-w-2xl mx-auto no-print">
          <div className="w-16 h-16 bg-lime-500/10 border border-lime-500/20 rounded-2xl flex items-center justify-center mx-auto shadow-[0_0_30px_rgba(132,204,22,0.15)]">
            <Utensils className="w-8 h-8 text-lime-400" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-bold text-white">Nessun piano settimanale generato</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              Il planner analizzerà automaticamente la dieta selezionata ({coachContext?.diet || 'standard'}), le tue {coachContext?.patologie?.length || 0} patologie registrate ed escluderà i cibi a cui sei allergico.
            </p>
          </div>
          <button
            onClick={handleGeneratePlan}
            className="px-6 py-3.5 bg-lime-500 hover:bg-lime-400 text-black text-sm font-bold rounded-xl transition-all shadow-xl shadow-lime-500/15"
          >
            Genera Ora Menu Settimanale
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* Main 7-Day Plan Grid */}
          <div className="lg:col-span-2 space-y-6 no-print">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-lime-400" /> Il tuo Piano Settimanale
            </h2>
            
            <div className="space-y-4">
              {planDays.map((day, dIdx) => (
                <div key={dIdx} className="glass-card-static p-5 space-y-4 relative">
                  {/* Day Header */}
                  <div className="flex justify-between items-center border-b border-white/5 pb-2">
                    <span className="text-sm font-bold text-white font-mono">{day.day_of_week}</span>
                    <span className="text-[10px] text-white/40 font-mono">Tot: {day.calories} kcal | P:{day.proteins}g C:{day.carbs}g F:{day.fats}g</span>
                  </div>

                  {/* Meals grid */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { key: 'breakfast', label: 'Colazione', color: 'border-cyan-500/10' },
                      { key: 'lunch', label: 'Pranzo', color: 'border-emerald-500/10' },
                      { key: 'dinner', label: 'Cena', color: 'border-indigo-500/10' },
                      { key: 'snacks', label: 'Spuntino', color: 'border-amber-500/10' }
                    ].map(mealType => {
                      const recipe = day[mealType.key];
                      return (
                        <div key={mealType.key} className={`bg-white/[0.01] border border-white/5 hover:border-white/10 p-3 rounded-2xl flex flex-col justify-between gap-3 transition-all`}>
                          <div className="space-y-1">
                            <span className="text-[9px] uppercase tracking-wider text-white/30 font-semibold">{day.day_of_week} - {mealType.label}</span>
                            <h4 className="text-xs font-semibold text-white/80 line-clamp-1">{recipe?.name || 'Non pianificato'}</h4>
                          </div>

                          <div className="flex justify-between items-center border-t border-white/5 pt-2">
                            <span className="text-[9px] font-mono text-white/40">{recipe?.calories} kcal</span>
                            <div className="flex gap-1.5">
                              <button
                                onClick={() => setActiveRecipeModal(recipe)}
                                title="Visualizza Ricetta"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
                              >
                                <Eye className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleRigeneraMeal(dIdx, mealType.key)}
                                title="Rigenera"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-lime-400 transition-colors"
                              >
                                <RotateCw className="w-3 h-3" />
                              </button>
                              <button
                                onClick={() => handleOpenSubstitution(dIdx, mealType.key, recipe)}
                                title="Sostituisci"
                                className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-cyan-400 transition-colors"
                              >
                                <RefreshCw className="w-3 h-3" />
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Sidebar: Shopping List & Weekly Report */}
          <div className="space-y-6">
            
            {/* Weekly report summary */}
            <div className="glass-card-static p-5 space-y-4 no-print">
              <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                <Heart className="w-3.5 h-3.5 text-lime-400" /> Bilanciamento Settimanale
              </h3>
              <div className="space-y-3">
                <div className="bg-lime-500/5 border border-lime-500/10 p-3 rounded-2xl text-center">
                  <span className="text-[10px] text-lime-400 block font-semibold mb-0.5">Score Equilibrio</span>
                  <span className="text-2xl font-bold text-white font-mono">{weeklyBalance.score}/100</span>
                </div>

                {weeklyBalance.warnings.length > 0 ? (
                  <div className="space-y-2">
                    {weeklyBalance.warnings.map((warn, wIdx) => (
                      <div key={wIdx} className="bg-amber-500/10 border border-amber-500/20 text-amber-400 px-3 py-2.5 rounded-xl text-[10px] flex items-start gap-1.5 leading-relaxed font-medium">
                        <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                        <span>{warn}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="bg-green-500/10 border border-green-500/20 text-green-400 p-3 rounded-2xl text-[11px] text-center font-semibold">
                    🎉 Piano perfettamente bilanciato!
                  </div>
                )}
              </div>
            </div>

            {/* Shopping List Container */}
            <div id="print-section" className="glass-card-static p-5 space-y-4 relative">
              <div className="flex items-center justify-between border-b border-white/5 pb-3">
                <h3 className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                  <ListTodo className="w-3.5 h-3.5 text-lime-400" /> Lista della Spesa
                </h3>
                <button
                  onClick={() => window.print()}
                  className="px-2.5 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-[10px] font-bold rounded-lg text-white transition-all flex items-center gap-1.5 no-print"
                >
                  <Printer className="w-3 h-3" /> Stampa / PDF
                </button>
              </div>

              {shoppingList.length === 0 ? (
                <p className="text-[10px] text-white/40 text-center py-4">La lista della spesa verrà generata dal piano.</p>
              ) : (
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1">
                  {/* Group items by category */}
                  {Object.entries(
                    shoppingList.reduce((acc, item) => {
                      if (!acc[item.categoria]) acc[item.categoria] = [];
                      acc[item.categoria].push(item);
                      return acc;
                    }, {})
                  ).map(([category, items]) => (
                    <div key={category} className="space-y-1.5">
                      <span className="text-[9px] uppercase tracking-wider text-white/30 font-bold">{category}</span>
                      <div className="space-y-1">
                        {items.map((item, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => handleToggleItem(item)}
                            className={`flex items-center justify-between p-2 rounded-xl cursor-pointer hover:bg-white/[0.02] border border-transparent hover:border-white/5 transition-all ${item.completato ? 'opacity-40 line-through' : ''}`}
                          >
                            <span className="text-[11px] text-white/80 font-medium">{item.alimento}</span>
                            <span className="text-[10px] font-mono text-white/40 font-semibold">{item.quantita}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>
      )}

      {/* MODAL 1: View Recipe Detail */}
      {activeRecipeModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-[#0f0f16] border border-white/10 rounded-3xl w-full max-w-xl max-h-[85vh] overflow-y-auto p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveRecipeModal(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="space-y-2">
              <span className="text-[10px] uppercase tracking-wider text-lime-400 font-bold">Ricetta</span>
              <h2 className="text-xl font-bold text-white">{activeRecipeModal.name}</h2>
              <div className="flex gap-2 text-[10px] text-white/40 font-mono font-medium">
                <span>⏱️ {activeRecipeModal.prep_time} min</span>
                <span>•</span>
                <span>📊 {activeRecipeModal.difficulty}</span>
                <span>•</span>
                <span>💰 {activeRecipeModal.cost}</span>
              </div>
            </div>

            {/* Nutrients pills */}
            <div className="grid grid-cols-4 gap-2 text-center bg-white/[0.02] p-3 rounded-2xl text-[10px] font-mono font-bold">
              <div>
                <span className="text-white/40 block text-[8px] uppercase">Calorie</span>
                <span className="text-white">{activeRecipeModal.calories}</span>
              </div>
              <div>
                <span className="text-cyan-400 block text-[8px] uppercase">Proteine</span>
                <span className="text-cyan-400">{activeRecipeModal.proteins}g</span>
              </div>
              <div>
                <span className="text-lime-400 block text-[8px] uppercase">Carboidrati</span>
                <span className="text-lime-400">{activeRecipeModal.carbs}g</span>
              </div>
              <div>
                <span className="text-rose-400 block text-[8px] uppercase">Grassi</span>
                <span className="text-rose-400">{activeRecipeModal.fats}g</span>
              </div>
            </div>

            {/* Ingredients */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-white">Ingredienti</h3>
              <ul className="space-y-1 text-xs text-white/70">
                {activeRecipeModal.ingredients.map((ing, iIdx) => (
                  <li key={iIdx} className="flex justify-between border-b border-white/5 py-1">
                    <span>{ing.name}</span>
                    <span className="font-mono text-white/40">{ing.amount}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Steps */}
            <div className="space-y-2 pt-2 border-t border-white/5">
              <h3 className="text-xs font-bold text-white">Procedimento</h3>
              <p className="text-xs text-white/70 leading-relaxed whitespace-pre-wrap">{activeRecipeModal.instructions}</p>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Recipe Substitution Selection */}
      {activeSubstitution && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-fade-in no-print">
          <div className="bg-[#0f0f16] border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-6 shadow-2xl relative">
            <button
              onClick={() => setActiveSubstitution(null)}
              className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-colors"
            >
              ✕
            </button>
            <div className="space-y-1">
              <span className="text-[10px] uppercase tracking-wider text-cyan-400 font-bold">Sostituzione Piatto</span>
              <h2 className="text-base font-bold text-white">Alternative per: {activeSubstitution.recipe.name}</h2>
              <p className="text-[10px] text-white/40">Seleziona una ricetta simile per calorie e distribuzione dei macronutrienti.</p>
            </div>

            <div className="space-y-3">
              {substitutionAlternatives.length === 0 ? (
                <p className="text-xs text-white/40 text-center py-4">Nessuna alternativa disponibile per questa ricetta.</p>
              ) : (
                substitutionAlternatives.map((alt, aIdx) => (
                  <div 
                    key={aIdx} 
                    onClick={() => handleApplySubstitution(alt)}
                    className="bg-white/[0.01] hover:bg-white/[0.03] border border-white/5 hover:border-cyan-500/20 p-4 rounded-2xl cursor-pointer transition-all flex justify-between items-center"
                  >
                    <div className="space-y-1">
                      <h4 className="text-xs font-semibold text-white">{alt.name}</h4>
                      <span className="text-[9px] font-mono text-white/40">{alt.calories} kcal | P:{alt.proteins}g C:{alt.carbs}g F:{alt.fats}g</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-cyan-400" />
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
