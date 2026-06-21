-- Essential Italian foods for reliable first-run search results.
INSERT INTO public.foods
  (name, category, source, source_id, calories, proteins, carbs, fats, fiber, water, verified, nutrient_completeness)
VALUES
  ('Pizza Margherita', 'Piatti pronti', 'system', 'essential:pizza-margherita', 266, 11, 33, 10, 2.3, 43, true, 8),
  ('Pizza Marinara', 'Piatti pronti', 'system', 'essential:pizza-marinara', 240, 7, 38, 7, 2.5, 45, true, 8),
  ('Pizza Quattro Formaggi', 'Piatti pronti', 'system', 'essential:pizza-quattro-formaggi', 302, 13, 30, 15, 2, 39, true, 8),
  ('Pizza Prosciutto', 'Piatti pronti', 'system', 'essential:pizza-prosciutto', 275, 13, 32, 11, 2, 42, true, 8),
  ('Pizza Vegetariana', 'Piatti pronti', 'system', 'essential:pizza-vegetariana', 245, 9, 34, 8, 3, 46, true, 8),
  ('Pasta secca', 'Cereali', 'system', 'essential:pasta-secca', 353, 12, 72, 1.5, 3, 10, true, 8),
  ('Pasta cotta', 'Cereali', 'system', 'essential:pasta-cotta', 158, 5.8, 30.9, 0.9, 1.8, 62, true, 8),
  ('Riso bianco cotto', 'Cereali', 'system', 'essential:riso-bianco-cotto', 130, 2.7, 28, 0.3, 0.4, 68, true, 8),
  ('Pane comune', 'Pane', 'system', 'essential:pane-comune', 265, 9, 49, 3.2, 2.7, 36, true, 8),
  ('Pane integrale', 'Pane', 'system', 'essential:pane-integrale', 247, 9.7, 41, 4.2, 7, 38, true, 8),
  ('Mela', 'Frutta', 'system', 'essential:mela', 52, 0.3, 14, 0.2, 2.4, 86, true, 8),
  ('Banana', 'Frutta', 'system', 'essential:banana', 89, 1.1, 22.8, 0.3, 2.6, 75, true, 8),
  ('Latte intero', 'Latticini', 'system', 'essential:latte-intero', 61, 3.2, 4.8, 3.3, 0, 88, true, 8),
  ('Latte parzialmente scremato', 'Latticini', 'system', 'essential:latte-parzialmente-scremato', 46, 3.4, 4.9, 1.6, 0, 90, true, 8),
  ('Pollo petto crudo', 'Carne', 'system', 'essential:pollo-petto-crudo', 120, 22.5, 0, 2.6, 0, 74, true, 8),
  ('Piadina', 'Pane', 'system', 'essential:piadina', 330, 8.5, 52, 10, 2.2, 27, true, 8),
  ('Piselli', 'Legumi', 'system', 'essential:piselli', 81, 5.4, 14.5, 0.4, 5.1, 79, true, 8)
ON CONFLICT (source, source_id) DO UPDATE SET
  name = EXCLUDED.name,
  category = EXCLUDED.category,
  calories = EXCLUDED.calories,
  proteins = EXCLUDED.proteins,
  carbs = EXCLUDED.carbs,
  fats = EXCLUDED.fats,
  fiber = EXCLUDED.fiber,
  water = EXCLUDED.water,
  verified = EXCLUDED.verified,
  nutrient_completeness = EXCLUDED.nutrient_completeness;
