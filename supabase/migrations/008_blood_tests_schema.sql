-- ============================================
-- NutriScan AI - Blood Tests Schema (Phase 2B)
-- ============================================

-- 1. BLOOD TEST REPORTS
CREATE TABLE IF NOT EXISTS public.blood_test_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    file_path TEXT NOT NULL,
    test_date DATE NOT NULL,
    notes TEXT,
    status TEXT NOT NULL DEFAULT 'completed', -- 'processing', 'completed', 'failed'
    created_at TIMESTAMPTZ DEFAULT now(),
    updated_at TIMESTAMPTZ DEFAULT now()
);

-- 2. BLOOD TEST BIOMARKERS
CREATE TABLE IF NOT EXISTS public.blood_test_biomarkers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    report_id UUID REFERENCES public.blood_test_reports(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    biomarker_name TEXT NOT NULL,
    value NUMERIC NOT NULL,
    unit TEXT NOT NULL,
    min_range NUMERIC,
    max_range NUMERIC,
    status TEXT NOT NULL, -- 'low', 'normal', 'high', 'unknown'
    created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_blood_test_reports_user ON public.blood_test_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_blood_test_biomarkers_report ON public.blood_test_biomarkers(report_id);
CREATE INDEX IF NOT EXISTS idx_blood_test_biomarkers_user ON public.blood_test_biomarkers(user_id);

-- ============================================
-- ROW LEVEL SECURITY
-- ============================================

-- Blood Test Reports
ALTER TABLE public.blood_test_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blood test reports"
    ON public.blood_test_reports FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- Blood Test Biomarkers
ALTER TABLE public.blood_test_biomarkers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can manage own blood test biomarkers"
    ON public.blood_test_biomarkers FOR ALL TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);

-- ============================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================
CREATE TRIGGER update_blood_test_reports_updated_at
    BEFORE UPDATE ON public.blood_test_reports
    FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- ============================================
-- STORAGE BUCKET CONFIGURATION
-- ============================================

-- Create bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('medical-documents', 'medical-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage Policies (authenticated own folder)
CREATE POLICY "Allow authenticated insert own documents" ON storage.objects
    FOR INSERT TO authenticated
    WITH CHECK (bucket_id = 'medical-documents' AND split_part(name, '/', 1) = (select auth.uid())::text);

CREATE POLICY "Allow authenticated select own documents" ON storage.objects
    FOR SELECT TO authenticated
    USING (bucket_id = 'medical-documents' AND split_part(name, '/', 1) = (select auth.uid())::text);

CREATE POLICY "Allow authenticated delete own documents" ON storage.objects
    FOR DELETE TO authenticated
    USING (bucket_id = 'medical-documents' AND split_part(name, '/', 1) = (select auth.uid())::text);

-- ============================================
-- PRIVILEGES AND GRANTS
-- ============================================
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_test_reports TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_test_reports TO service_role;

GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_test_biomarkers TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.blood_test_biomarkers TO service_role;

