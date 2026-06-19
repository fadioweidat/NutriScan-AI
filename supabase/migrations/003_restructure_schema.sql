-- ============================================
-- NutriScan AI - Restructure Schema (Step 1)
-- ============================================

-- 1. Create food_nutrients table for relational nutrient data
CREATE TABLE IF NOT EXISTS public.food_nutrients (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    food_id UUID NOT NULL REFERENCES public.foods(id) ON DELETE CASCADE,
    nutrient_key TEXT NOT NULL,
    amount NUMERIC(10,3) NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(food_id, nutrient_key)
);

CREATE INDEX IF NOT EXISTS idx_food_nutrients_food_id ON public.food_nutrients(food_id);

-- Enable RLS for food_nutrients
ALTER TABLE public.food_nutrients ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view food nutrients"
    ON public.food_nutrients FOR SELECT
    TO authenticated
    USING (true);

-- 2. Rename daily_reports to daily_nutrient_totals to match requested schema
ALTER TABLE public.daily_reports RENAME TO daily_nutrient_totals;

-- Update the index name for clarity
ALTER INDEX IF EXISTS idx_daily_reports_user_date RENAME TO idx_daily_nutrient_totals_user_date;

-- Ensure RLS policies are updated if needed (they apply to the table OID, so renaming doesn't drop them, but let's be safe)
DROP POLICY IF EXISTS "Users can manage own reports" ON public.daily_nutrient_totals;
CREATE POLICY "Users can manage own daily totals"
    ON public.daily_nutrient_totals FOR ALL
    TO authenticated
    USING ((select auth.uid()) = user_id)
    WITH CHECK ((select auth.uid()) = user_id);
