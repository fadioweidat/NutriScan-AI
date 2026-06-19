-- ============================================
-- NutriScan AI - Lifestyle Schema (Phase 2A)
-- ============================================

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

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_sleep_logs_user_date ON public.sleep_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_stress_logs_user_date ON public.stress_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_hydration_logs_user_date ON public.hydration_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user_date ON public.activity_logs(user_id, entry_date);
CREATE INDEX IF NOT EXISTS idx_digestion_logs_user_date ON public.digestion_logs(user_id, entry_date);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Sleep Logs
ALTER TABLE public.sleep_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own sleep logs"
    ON public.sleep_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Stress Logs
ALTER TABLE public.stress_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own stress logs"
    ON public.stress_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Hydration Logs
ALTER TABLE public.hydration_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own hydration logs"
    ON public.hydration_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Activity Logs
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own activity logs"
    ON public.activity_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Digestion Logs
ALTER TABLE public.digestion_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own digestion logs"
    ON public.digestion_logs FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_sleep_logs_updated_at
    BEFORE UPDATE ON public.sleep_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_stress_logs_updated_at
    BEFORE UPDATE ON public.stress_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_hydration_logs_updated_at
    BEFORE UPDATE ON public.hydration_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_activity_logs_updated_at
    BEFORE UPDATE ON public.activity_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

CREATE TRIGGER update_digestion_logs_updated_at
    BEFORE UPDATE ON public.digestion_logs
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
