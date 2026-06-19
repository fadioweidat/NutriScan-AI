-- STEP 8 SCHEMA UPDATE: FOODS TABLE

-- Aggiunta nuove colonne per la tracciabilità e la deduplicazione
ALTER TABLE foods
ADD COLUMN IF NOT EXISTS brand TEXT,
ADD COLUMN IF NOT EXISTS category TEXT,
ADD COLUMN IF NOT EXISTS barcode TEXT,
ADD COLUMN IF NOT EXISTS source TEXT,
ADD COLUMN IF NOT EXISTS source_id TEXT,
ADD COLUMN IF NOT EXISTS verified BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS last_update TIMESTAMPTZ DEFAULT now(),
ADD COLUMN IF NOT EXISTS serving_size NUMERIC,
ADD COLUMN IF NOT EXISTS serving_unit TEXT,
ADD COLUMN IF NOT EXISTS source_priority INTEGER,
ADD COLUMN IF NOT EXISTS nutrient_completeness INTEGER;

-- Creazione Indici per la Ricerca e Performance
CREATE INDEX IF NOT EXISTS idx_foods_name ON foods USING btree (name);
CREATE INDEX IF NOT EXISTS idx_foods_barcode ON foods USING btree (barcode);
CREATE INDEX IF NOT EXISTS idx_foods_source ON foods USING btree (source);
CREATE INDEX IF NOT EXISTS idx_foods_category ON foods USING btree (category);
