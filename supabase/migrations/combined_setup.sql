-- =========================================================================
-- NUTRISCAN AI - COMPLETE DATABASE SETUP (PHASE 1 + PHASE 2A + PERMISSIONS)
-- Copy and run this entire script in the Supabase SQL Editor.
-- =========================================================================

-- ==========================================
-- PHASE 1: HEALTH PROFILES & MEDICAL SCHEMA
-- ==========================================

-- 1. HEALTH PROFILES
CREATE TABLE IF NOT EXISTS public.health_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    privacy_consent BOOLEAN NOT NULL DEFAULT false,
    privacy_consent_date TIMESTAMPTZ,
    general_health_status TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. USER CONDITIONS
CREATE TABLE IF NOT EXISTS public.user_conditions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    condition_name TEXT NOT NULL,
    diagnosed_date DATE,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, condition_name)
);

-- 3. USER ALLERGIES
CREATE TABLE IF NOT EXISTS public.user_allergies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    allergy_name TEXT NOT NULL,
    severity TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, allergy_name)
);

-- 4. USER INTOLERANCES
CREATE TABLE IF NOT EXISTS public.user_intolerances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    intolerance_name TEXT NOT NULL,
    severity TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, intolerance_name)
);

-- 5. USER MEDICATIONS
CREATE TABLE IF NOT EXISTS public.user_medications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 6. USER SUPPLEMENTS
CREATE TABLE IF NOT EXISTS public.user_supplements (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    supplement_name TEXT NOT NULL,
    dosage TEXT,
    frequency TEXT,
    start_date DATE,
    end_date DATE,
    notes TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 7. MEDICATION REMINDERS
CREATE TABLE IF NOT EXISTS public.medication_reminders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    medication_id UUID REFERENCES public.user_medications(id) ON DELETE CASCADE,
    supplement_id UUID REFERENCES public.user_supplements(id) ON DELETE CASCADE,
    reminder_time TIME NOT NULL,
    days_of_week INTEGER[] DEFAULT '{1,2,3,4,5,6,0}', -- 0=Sunday, 1=Monday...
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    CHECK (medication_id IS NOT NULL OR supplement_id IS NOT NULL)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON public.health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conditions_user_id ON public.user_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON public.user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intolerances_user_id ON public.user_intolerances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medications_user_id ON public.user_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON public.user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON public.medication_reminders(user_id);

-- ENABLE RLS (Phase 1)
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_conditions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_intolerances ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_supplements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;

-- POLICIES (Phase 1)
DROP POLICY IF EXISTS "Users can manage own health profile" ON public.health_profiles;
CREATE POLICY "Users can manage own health profile"
    ON public.health_profiles FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own conditions" ON public.user_conditions;
CREATE POLICY "Users can manage own conditions"
    ON public.user_conditions FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own allergies" ON public.user_allergies;
CREATE POLICY "Users can manage own allergies"
    ON public.user_allergies FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own intolerances" ON public.user_intolerances;
CREATE POLICY "Users can manage own intolerances"
    ON public.user_intolerances FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own medications" ON public.user_medications;
CREATE POLICY "Users can manage own medications"
    ON public.user_medications FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own supplements" ON public.user_supplements;
CREATE POLICY "Users can manage own supplements"
    ON public.user_supplements FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own reminders" ON public.medication_reminders;
CREATE POLICY "Users can manage own reminders"
    ON public.medication_reminders FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ==========================================
-- PHASE 2A: LIFESTYLE LOGS SCHEMA
-- ==========================================

-- 1. SLEEP LOGS
CREATE TABLE IF NOT EXISTS public.sleep_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    duration_hours NUMERIC(4,2) NOT NULL,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
    interruptions INTEGER DEFAULT 0,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entry_date)
);

-- 2. STRESS LOGS
CREATE TABLE IF NOT EXISTS public.stress_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    stress_level INTEGER NOT NULL CHECK (stress_level BETWEEN 1 AND 10),
    triggers TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entry_date)
);

-- 3. HYDRATION LOGS
CREATE TABLE IF NOT EXISTS public.hydration_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    water_ml INTEGER NOT NULL DEFAULT 0,
    target_reached BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entry_date)
);

-- 4. ACTIVITY LOGS
CREATE TABLE IF NOT EXISTS public.activity_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    activity_type TEXT NOT NULL,
    duration_minutes INTEGER NOT NULL,
    intensity TEXT CHECK (intensity IN ('bassa', 'media', 'alta')),
    calories_burned INTEGER,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 5. DIGESTION LOGS
CREATE TABLE IF NOT EXISTS public.digestion_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    entry_date DATE NOT NULL DEFAULT CURRENT_DATE,
    quality_score INTEGER CHECK (quality_score BETWEEN 1 AND 5),
    symptoms TEXT,
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(user_id, entry_date)
);

-- INDEXES
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_stress_logs_user_date ON public.stress_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON public.hydration_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_digestion_logs_user_date ON public.digestion_logs(user_id, entry_date);

-- ENABLE RLS (Phase 2A)
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.stress_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digestion_logs ENABLE ROW LEVEL SECURITY;

-- POLICIES (Phase 2A)
DROP POLICY IF EXISTS "Users can manage own sleep logs" ON public.sleep_logs;
CREATE POLICY "Users can manage own sleep logs"
    ON public.sleep_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own stress logs" ON public.stress_logs;
CREATE POLICY "Users can manage own stress logs"
    ON public.stress_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own hydration logs" ON public.hydration_logs;
CREATE POLICY "Users can manage own hydration logs"
    ON public.hydration_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own activity logs" ON public.activity_logs;
CREATE POLICY "Users can manage own activity logs"
    ON public.activity_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

DROP POLICY IF EXISTS "Users can manage own digestion logs" ON public.digestion_logs;
CREATE POLICY "Users can manage own digestion logs"
    ON public.digestion_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);


-- ==========================================
-- DATABASE TRIGGERS FOR UPDATED_AT
-- ==========================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop & recreate triggers to ensure clean setup
DROP TRIGGER IF EXISTS update_health_profiles_updated_at ON public.health_profiles;
CREATE TRIGGER update_health_profiles_updated_at
    BEFORE UPDATE ON public.health_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_conditions_updated_at ON public.user_conditions;
CREATE TRIGGER update_user_conditions_updated_at
    BEFORE UPDATE ON public.user_conditions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_allergies_updated_at ON public.user_allergies;
CREATE TRIGGER update_user_allergies_updated_at
    BEFORE UPDATE ON public.user_allergies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_intolerances_updated_at ON public.user_intolerances;
CREATE TRIGGER update_user_intolerances_updated_at
    BEFORE UPDATE ON public.user_intolerances
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_medications_updated_at ON public.user_medications;
CREATE TRIGGER update_user_medications_updated_at
    BEFORE UPDATE ON public.user_medications
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_user_supplements_updated_at ON public.user_supplements;
CREATE TRIGGER update_user_supplements_updated_at
    BEFORE UPDATE ON public.user_supplements
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_medication_reminders_updated_at ON public.medication_reminders;
CREATE TRIGGER update_medication_reminders_updated_at
    BEFORE UPDATE ON public.medication_reminders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_sleep_logs_updated_at ON public.sleep_logs;
CREATE TRIGGER update_sleep_logs_updated_at
    BEFORE UPDATE ON public.sleep_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_stress_logs_updated_at ON public.stress_logs;
CREATE TRIGGER update_stress_logs_updated_at
    BEFORE UPDATE ON public.stress_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_hydration_logs_updated_at ON public.hydration_logs;
CREATE TRIGGER update_hydration_logs_updated_at
    BEFORE UPDATE ON public.hydration_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_activity_logs_updated_at ON public.activity_logs;
CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON public.activity_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DROP TRIGGER IF EXISTS update_digestion_logs_updated_at ON public.digestion_logs;
CREATE TRIGGER update_digestion_logs_updated_at
    BEFORE UPDATE ON public.digestion_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();


-- =========================================================================
-- GRANULAR GRANTS ONLY (No general ALTER DEFAULT PRIVILEGES or GRANT ALL)
-- =========================================================================

-- Enable Schema usage
GRANT USAGE ON SCHEMA public TO authenticated, service_role;

-- Granular permissions for Phase 1 Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.health_profiles TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_conditions TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_allergies TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_intolerances TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_medications TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.user_supplements TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.medication_reminders TO authenticated, service_role;

-- Granular permissions for Phase 2A Tables
GRANT SELECT, INSERT, UPDATE, DELETE ON public.sleep_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.stress_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.hydration_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.activity_logs TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.digestion_logs TO authenticated, service_role;
