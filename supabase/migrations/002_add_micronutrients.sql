-- ============================================
-- NutriScan AI - Add New Micronutrients
-- ============================================

ALTER TABLE public.foods
ADD COLUMN vitamin_b5_mg NUMERIC(7,3) DEFAULT 0,
ADD COLUMN vitamin_b7_mcg NUMERIC(7,3) DEFAULT 0,
ADD COLUMN copper_mg NUMERIC(7,3) DEFAULT 0,
ADD COLUMN manganese_mg NUMERIC(7,3) DEFAULT 0,
ADD COLUMN iodine_mcg NUMERIC(7,2) DEFAULT 0,
ADD COLUMN omega_3_g NUMERIC(7,3) DEFAULT 0,
ADD COLUMN omega_6_g NUMERIC(7,3) DEFAULT 0,
ADD COLUMN water_g NUMERIC(7,2) DEFAULT 0;

ALTER TABLE public.meal_entries
ADD COLUMN others_data JSONB DEFAULT '{}';

ALTER TABLE public.daily_reports
ADD COLUMN others_data JSONB DEFAULT '{}';
