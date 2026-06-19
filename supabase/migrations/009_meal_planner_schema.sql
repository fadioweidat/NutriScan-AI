-- Create meal_plans table
CREATE TABLE IF NOT EXISTS public.meal_plans (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  week_start DATE NOT NULL,
  diet_type TEXT NOT NULL,
  calories_target INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create meal_plan_days table
CREATE TABLE IF NOT EXISTS public.meal_plan_days (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  day_of_week TEXT NOT NULL, -- e.g., 'Lunedì', 'Martedì', etc.
  breakfast JSONB NOT NULL,
  lunch JSONB NOT NULL,
  dinner JSONB NOT NULL,
  snacks JSONB NOT NULL,
  calories INTEGER NOT NULL,
  proteins INTEGER NOT NULL,
  carbs INTEGER NOT NULL,
  fats INTEGER NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create shopping_lists table
CREATE TABLE IF NOT EXISTS public.shopping_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  meal_plan_id UUID REFERENCES public.meal_plans(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Create shopping_list_items table
CREATE TABLE IF NOT EXISTS public.shopping_list_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  shopping_list_id UUID REFERENCES public.shopping_lists(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  alimento TEXT NOT NULL,
  quantita TEXT NOT NULL,
  categoria TEXT NOT NULL,
  completato BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Enable RLS
ALTER TABLE public.meal_plans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meal_plan_days ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shopping_list_items ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "meal_plans_owner_policy" ON public.meal_plans;
DROP POLICY IF EXISTS "meal_plan_days_owner_policy" ON public.meal_plan_days;
DROP POLICY IF EXISTS "shopping_lists_owner_policy" ON public.shopping_lists;
DROP POLICY IF EXISTS "shopping_list_items_owner_policy" ON public.shopping_list_items;

-- Create policies for owner-only access
CREATE POLICY "meal_plans_owner_policy" ON public.meal_plans
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "meal_plan_days_owner_policy" ON public.meal_plan_days
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_lists_owner_policy" ON public.shopping_lists
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE POLICY "shopping_list_items_owner_policy" ON public.shopping_list_items
  FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Revoke all on tables from public and anon
REVOKE ALL ON public.meal_plans FROM public, anon;
REVOKE ALL ON public.meal_plan_days FROM public, anon;
REVOKE ALL ON public.shopping_lists FROM public, anon;
REVOKE ALL ON public.shopping_list_items FROM public, anon;

-- Grant permissions to authenticated and service_role
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plans TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.meal_plan_days TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_lists TO authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.shopping_list_items TO authenticated, service_role;
