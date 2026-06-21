-- Food search hardening: partial, fuzzy and full text search support.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_foods_name_lower ON public.foods (lower(name));
CREATE INDEX IF NOT EXISTS idx_foods_name_trgm ON public.foods USING gin (name gin_trgm_ops);
CREATE INDEX IF NOT EXISTS idx_foods_name_fts_it ON public.foods USING gin (to_tsvector('italian', coalesce(name, '')));

CREATE INDEX IF NOT EXISTS idx_foods_brand_trgm
ON public.foods USING gin (brand gin_trgm_ops)
WHERE brand IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_foods_category_trgm
ON public.foods USING gin (category gin_trgm_ops)
WHERE category IS NOT NULL;
