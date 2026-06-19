-- ============================================
-- NutriScan AI - Initial Database Schema
-- Run this in your Supabase SQL Editor
-- ============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================
-- USER PROFILES
-- ============================================
CREATE TABLE public.user_profiles (
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

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
    INSERT INTO public.user_profiles (id, full_name)
    VALUES (
        NEW.id,
        NEW.raw_user_meta_data ->> 'full_name'
    );
    RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================
-- FOODS DATABASE
-- ============================================
CREATE TABLE public.foods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    name_it TEXT,
    category TEXT,
    calories_per_100g NUMERIC(7,2) DEFAULT 0,
    proteins_g NUMERIC(7,2) DEFAULT 0,
    fats_g NUMERIC(7,2) DEFAULT 0,
    carbs_g NUMERIC(7,2) DEFAULT 0,
    fiber_g NUMERIC(7,2) DEFAULT 0,
    -- Vitamine (per 100g)
    vitamin_a_mcg NUMERIC(7,2) DEFAULT 0,
    vitamin_c_mg NUMERIC(7,2) DEFAULT 0,
    vitamin_d_mcg NUMERIC(7,2) DEFAULT 0,
    vitamin_e_mg NUMERIC(7,2) DEFAULT 0,
    vitamin_k_mcg NUMERIC(7,2) DEFAULT 0,
    vitamin_b1_mg NUMERIC(7,3) DEFAULT 0,
    vitamin_b2_mg NUMERIC(7,3) DEFAULT 0,
    vitamin_b3_mg NUMERIC(7,2) DEFAULT 0,
    vitamin_b6_mg NUMERIC(7,3) DEFAULT 0,
    vitamin_b12_mcg NUMERIC(7,3) DEFAULT 0,
    folate_mcg NUMERIC(7,2) DEFAULT 0,
    -- Minerali (per 100g)
    calcium_mg NUMERIC(7,2) DEFAULT 0,
    iron_mg NUMERIC(7,2) DEFAULT 0,
    magnesium_mg NUMERIC(7,2) DEFAULT 0,
    phosphorus_mg NUMERIC(7,2) DEFAULT 0,
    potassium_mg NUMERIC(7,2) DEFAULT 0,
    sodium_mg NUMERIC(7,2) DEFAULT 0,
    zinc_mg NUMERIC(7,2) DEFAULT 0,
    selenium_mcg NUMERIC(7,2) DEFAULT 0,
    -- Metadata
    source TEXT DEFAULT 'local',
    usda_fdc_id INTEGER,
    is_custom BOOLEAN DEFAULT FALSE,
    created_by UUID REFERENCES auth.users(id),
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- MEAL ENTRIES
-- ============================================
CREATE TABLE public.meal_entries (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    food_id UUID REFERENCES public.foods(id),
    food_name TEXT NOT NULL,
    meal_type TEXT NOT NULL CHECK (meal_type IN ('breakfast', 'lunch', 'dinner', 'snack')),
    quantity_grams NUMERIC(7,1) NOT NULL CHECK (quantity_grams > 0),
    -- Calculated nutrients for this entry
    calories NUMERIC(8,2) DEFAULT 0,
    proteins NUMERIC(7,2) DEFAULT 0,
    fats NUMERIC(7,2) DEFAULT 0,
    carbs NUMERIC(7,2) DEFAULT 0,
    fiber NUMERIC(7,2) DEFAULT 0,
    vitamins_data JSONB DEFAULT '{}',
    minerals_data JSONB DEFAULT '{}',
    -- Optional
    photo_url TEXT,
    notes TEXT,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- DAILY REPORTS (cached calculations)
-- ============================================
CREATE TABLE public.daily_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    report_date DATE NOT NULL,
    total_calories NUMERIC(8,2) DEFAULT 0,
    total_proteins NUMERIC(7,2) DEFAULT 0,
    total_fats NUMERIC(7,2) DEFAULT 0,
    total_carbs NUMERIC(7,2) DEFAULT 0,
    total_fiber NUMERIC(7,2) DEFAULT 0,
    vitamins_data JSONB DEFAULT '{}',
    minerals_data JSONB DEFAULT '{}',
    nutrition_score INTEGER DEFAULT 0,
    nutrients_ok TEXT[] DEFAULT '{}',
    nutrients_low TEXT[] DEFAULT '{}',
    nutrients_missing TEXT[] DEFAULT '{}',
    suggestions TEXT[] DEFAULT '{}',
    summary TEXT,
    ai_report TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, report_date)
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX idx_foods_name ON public.foods USING gin(to_tsvector('italian', coalesce(name_it, name)));
CREATE INDEX idx_foods_category ON public.foods(category);
CREATE INDEX idx_meal_entries_user_date ON public.meal_entries(user_id, entry_date);
CREATE INDEX idx_meal_entries_date ON public.meal_entries(entry_date);
CREATE INDEX idx_daily_reports_user_date ON public.daily_reports(user_id, report_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Profiles: users can only read/update their own
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile"
    ON public.user_profiles FOR SELECT
    TO authenticated
    USING ((select auth.uid()) = id);

CREATE POLICY "Users can update own profile"
    ON public.user_profiles FOR UPDATE
    TO authenticated
    USING ((select auth.uid()) = id)
    WITH CHECK ((select auth.uid()) = id);

-- Foods: everyone can read, only creators can modify custom foods
ALTER TABLE public.foods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view foods"
    ON public.foods FOR SELECT
    TO authenticated
    USING (true);

CREATE POLICY "Users can create custom foods"
    ON public.foods FOR INSERT
    TO authenticated
    WITH CHECK (is_custom = TRUE AND created_by = (select auth.uid()));

CREATE POLICY "Users can update own custom foods"
    ON public.foods FOR UPDATE
    TO authenticated
    USING (is_custom = TRUE AND created_by = (select auth.uid()));

-- Meal entries: users can only manage their own
ALTER TABLE public.meal_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own meals"
    ON public.meal_entries FOR ALL
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Daily reports: users can only manage their own
ALTER TABLE public.daily_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own reports"
    ON public.daily_reports FOR ALL
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- STORAGE BUCKET
-- ============================================
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'meal-photos',
    'meal-photos',
    true,
    5242880, -- 5MB
    ARRAY['image/jpeg', 'image/png', 'image/webp']
);

-- Storage policies
CREATE POLICY "Users can upload own meal photos"
    ON storage.objects FOR INSERT
    TO authenticated
    WITH CHECK (
        bucket_id = 'meal-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

CREATE POLICY "Anyone can view meal photos"
    ON storage.objects FOR SELECT
    TO authenticated
    USING (bucket_id = 'meal-photos');

CREATE POLICY "Users can delete own photos"
    ON storage.objects FOR DELETE
    TO authenticated
    USING (
        bucket_id = 'meal-photos' AND
        (storage.foldername(name))[1] = auth.uid()::text
    );

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON public.user_profiles
    FOR EACH ROW
    EXECUTE PROCEDURE update_updated_at_column();
