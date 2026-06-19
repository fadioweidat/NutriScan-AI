-- ============================================
-- NutriScan AI - Health Profile Schema (Phase 1)
-- ============================================

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

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_health_profiles_user_id ON public.health_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_conditions_user_id ON public.user_conditions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_allergies_user_id ON public.user_allergies(user_id);
CREATE INDEX IF NOT EXISTS idx_user_intolerances_user_id ON public.user_intolerances(user_id);
CREATE INDEX IF NOT EXISTS idx_user_medications_user_id ON public.user_medications(user_id);
CREATE INDEX IF NOT EXISTS idx_user_supplements_user_id ON public.user_supplements(user_id);
CREATE INDEX IF NOT EXISTS idx_medication_reminders_user_id ON public.medication_reminders(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Health Profiles
ALTER TABLE public.health_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own health profile"
    ON public.health_profiles FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- User Conditions
ALTER TABLE public.user_conditions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own conditions"
    ON public.user_conditions FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- User Allergies
ALTER TABLE public.user_allergies ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own allergies"
    ON public.user_allergies FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- User Intolerances
ALTER TABLE public.user_intolerances ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own intolerances"
    ON public.user_intolerances FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- User Medications
ALTER TABLE public.user_medications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own medications"
    ON public.user_medications FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- User Supplements
ALTER TABLE public.user_supplements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own supplements"
    ON public.user_supplements FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Medication Reminders
ALTER TABLE public.medication_reminders ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own reminders"
    ON public.medication_reminders FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
-- Assuming update_updated_at_column() exists from 001_initial_schema.sql
CREATE TRIGGER update_health_profiles_updated_at
    BEFORE UPDATE ON public.health_profiles
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_conditions_updated_at
    BEFORE UPDATE ON public.user_conditions
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_allergies_updated_at
    BEFORE UPDATE ON public.user_allergies
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_intolerances_updated_at
    BEFORE UPDATE ON public.user_intolerances
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_medications_updated_at
    BEFORE UPDATE ON public.user_medications
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_user_supplements_updated_at
    BEFORE UPDATE ON public.user_supplements
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_medication_reminders_updated_at
    BEFORE UPDATE ON public.medication_reminders
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
