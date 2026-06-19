-- ============================================
-- NutriScan AI - Step 1 Schema
-- Esegui questo script nel SQL Editor di Supabase
-- ============================================

-- Pulisce le vecchie tabelle per evitare conflitti con gli schemi precedenti
DROP TABLE IF EXISTS public.food_nutrients CASCADE;
DROP TABLE IF EXISTS public.meal_entries CASCADE;
DROP TABLE IF EXISTS public.daily_nutrient_totals CASCADE;
DROP TABLE IF EXISTS public.foods CASCADE;

-- 1. TABELLA USER PROFILES
CREATE TABLE IF NOT EXISTS public.user_profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT,
    age INTEGER CHECK (age > 0 AND age < 150),
    sex TEXT CHECK (sex IN ('male', 'female')),
    weight_kg NUMERIC(5,1) CHECK (weight_kg > 0),
    height_cm NUMERIC(5,1) CHECK (height_cm > 0),
    goal TEXT CHECK (goal IN ('lose_weight', 'maintain', 'gain_muscle', 'health')) DEFAULT 'health',
    diet_type TEXT CHECK (diet_type IN ('standard', 'keto', 'carnivore', 'intermittent_fasting')) DEFAULT 'standard',
    activity_level TEXT CHECK (activity_level IN ('sedentary', 'light', 'moderate', 'active', 'very_active')) DEFAULT 'moderate',
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. TABELLA FOODS (Solo macro base normalizzati per 100g)
CREATE TABLE IF NOT EXISTS public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    category TEXT,
    source TEXT NOT NULL, -- es. 'usda', 'system', 'user'
    source_id TEXT NOT NULL, -- es. fdcId per USDA
    calories NUMERIC(7,2) DEFAULT 0,
    proteins NUMERIC(7,2) DEFAULT 0,
    carbs NUMERIC(7,2) DEFAULT 0,
    fats NUMERIC(7,2) DEFAULT 0,
    fiber NUMERIC(7,2) DEFAULT 0,
    water NUMERIC(7,2) DEFAULT 0,
    omega3 NUMERIC(7,3) DEFAULT 0,
    omega6 NUMERIC(7,3) DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(source, source_id)
);

-- 3. TABELLA FOOD_NUTRIENTS (Tutti i micronutrienti per 100g)
CREATE TABLE IF NOT EXISTS public.food_nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    nutrient_key TEXT NOT NULL, -- es: 'vitamin_c', 'calcium'
    nutrient_name TEXT NOT NULL, -- es: 'Vitamin C', 'Calcium'
    amount NUMERIC(10,3) NOT NULL,
    unit TEXT NOT NULL, -- es: 'mg', 'mcg'
    UNIQUE(food_id, nutrient_key)
);

-- 4. TABELLA MEAL_ENTRIES
CREATE TABLE IF NOT EXISTS public.meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    food_name TEXT NOT NULL, -- Cache del nome nel caso il food_id venga eliminato
    quantity_grams NUMERIC(7,1) NOT NULL CHECK (quantity_grams > 0),
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- 5. TABELLA DAILY_NUTRIENT_TOTALS (Cache aggregata per dashboard e status)
CREATE TABLE IF NOT EXISTS public.daily_nutrient_totals (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL DEFAULT CURRENT_DATE,
    nutrient_key TEXT NOT NULL,
    total_amount NUMERIC(10,3) DEFAULT 0,
    target_amount NUMERIC(10,3) DEFAULT 0,
    percentage NUMERIC(7,2) DEFAULT 0,
    status TEXT, -- green (>=90), orange (60-89), red (<60)
    UNIQUE(user_id, date, nutrient_key)
);

-- INDEXES per performance
CREATE INDEX IF NOT EXISTS idx_foods_name ON public.foods(name);
CREATE INDEX IF NOT EXISTS idx_food_nutrients_food_id ON public.food_nutrients(food_id);
CREATE INDEX IF NOT EXISTS idx_meal_entries_user_date ON public.meal_entries(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_daily_nutrient_totals_user_date ON public.daily_nutrient_totals(user_id, date);
