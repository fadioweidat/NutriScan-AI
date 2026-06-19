-- ============================================
-- NutriScan AI - Exact Infrastructure Schema
-- ============================================

-- 1. Tabella foods (solo macronutrienti e base)
CREATE TABLE IF NOT EXISTS public.foods_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    source TEXT,
    source_id TEXT,
    calories NUMERIC(7,2) DEFAULT 0,
    proteins NUMERIC(7,2) DEFAULT 0,
    carbs NUMERIC(7,2) DEFAULT 0,
    fats NUMERIC(7,2) DEFAULT 0,
    fiber NUMERIC(7,2) DEFAULT 0,
    water NUMERIC(7,2) DEFAULT 0,
    omega3 NUMERIC(7,3) DEFAULT 0,
    omega6 NUMERIC(7,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 2. Tabella food_nutrients (relazionale per vitamine e minerali)
CREATE TABLE IF NOT EXISTS public.food_nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.foods_v2(id) ON DELETE CASCADE,
    nutrient_key TEXT NOT NULL,
    nutrient_name TEXT NOT NULL,
    amount NUMERIC(10,3) NOT NULL,
    unit TEXT NOT NULL,
    UNIQUE(food_id, nutrient_key)
);

-- 3. Tabella meal_entries (aggiornata al nuovo foods_v2)
CREATE TABLE IF NOT EXISTS public.meal_entries_v2 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods_v2(id),
    quantity_grams NUMERIC(7,1) NOT NULL,
    meal_type TEXT NOT NULL,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 4. Tabella daily_nutrient_totals (relazionale per utente/giorno/nutriente)
CREATE TABLE IF NOT EXISTS public.daily_nutrient_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    nutrient_key TEXT NOT NULL,
    total_amount NUMERIC(10,3) DEFAULT 0,
    target_amount NUMERIC(10,3) DEFAULT 0,
    percentage NUMERIC(7,2) DEFAULT 0,
    status TEXT, -- green >= 90, orange 60-89, red < 60
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    UNIQUE(user_id, date, nutrient_key)
);

-- Indici per performance
CREATE INDEX idx_food_nutrients_food_id ON public.food_nutrients(food_id);
CREATE INDEX idx_meal_entries_v2_user_date ON public.meal_entries_v2(user_id, entry_date);
CREATE INDEX idx_daily_nutrient_totals_user_date ON public.daily_nutrient_totals(user_id, date);
