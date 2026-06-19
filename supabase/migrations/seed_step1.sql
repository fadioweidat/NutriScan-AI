-- ============================================
-- NutriScan AI - Seed Data (Step 1)
-- Esegui questo script nel SQL Editor di Supabase
-- Tutti i valori nutrizionali sono per 100g
-- ============================================

-- Pulisce la tabella (opzionale) per ricominciare da zero con il seed
-- TRUNCATE TABLE public.foods CASCADE;

-- Inserimento Alimenti (Macros)
INSERT INTO public.foods (id, name, category, source, source_id, calories, proteins, fats, carbs, fiber, water, omega3, omega6) VALUES
('11111111-1111-1111-1111-111111111111', 'Uova (Intero, crudo)', 'Uova e Latticini', 'system', 'seed_eggs', 143, 12.56, 9.51, 0.72, 0, 76.15, 0.07, 1.5),
('22222222-2222-2222-2222-222222222222', 'Salmone (Atlantico, crudo)', 'Pesce', 'system', 'seed_salmon', 208, 20.42, 13.42, 0, 0, 64.89, 2.1, 0.9),
('33333333-3333-3333-3333-333333333333', 'Mandorle', 'Frutta Secca', 'system', 'seed_almonds', 579, 21.15, 49.93, 21.55, 12.5, 4.41, 0.006, 12.1),
('44444444-4444-4444-4444-444444444444', 'Banana', 'Frutta', 'system', 'seed_banana', 89, 1.09, 0.33, 22.84, 2.6, 74.91, 0.027, 0.046),
('55555555-5555-5555-5555-555555555555', 'Yogurt Greco (Intero)', 'Uova e Latticini', 'system', 'seed_greek_yogurt', 97, 9.0, 5.0, 3.98, 0, 81.3, 0.02, 0.1),
('66666666-6666-6666-6666-666666666666', 'Spinaci (Crudi)', 'Verdura', 'system', 'seed_spinach', 23, 2.86, 0.39, 3.63, 2.2, 91.4, 0.138, 0.026),
('77777777-7777-7777-7777-777777777777', 'Pollo (Petto, crudo)', 'Carne', 'system', 'seed_chicken', 120, 22.5, 2.62, 0, 0, 75.76, 0.02, 0.3),
('88888888-8888-8888-8888-888888888888', 'Riso (Bianco, cotto)', 'Cereali', 'system', 'seed_rice', 130, 2.69, 0.28, 28.17, 0.4, 68.44, 0, 0.08),
('99999999-9999-9999-9999-999999999999', 'Avocado', 'Frutta', 'system', 'seed_avocado', 160, 2.0, 14.66, 8.53, 6.7, 73.23, 0.111, 1.7),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Tonno (In scatola, naturale)', 'Pesce', 'system', 'seed_tuna', 86, 19.4, 0.96, 0, 0, 78.4, 0.23, 0.02),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'Sardine (In scatola, olio, sgocciolate)', 'Pesce', 'system', 'seed_sardines', 208, 24.6, 11.4, 0, 0, 59.6, 1.48, 3.5),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'Patate (Cotte al forno con buccia)', 'Verdura', 'system', 'seed_potato', 93, 2.5, 0.1, 21.2, 2.2, 74.9, 0.01, 0.03),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'Arancia', 'Frutta', 'system', 'seed_orange', 47, 0.94, 0.12, 11.75, 2.4, 86.75, 0.01, 0.02),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'Olio Extravergine di Oliva', 'Grassi e Oli', 'system', 'seed_olive_oil', 884, 0, 100, 0, 0, 0, 0.76, 9.7);

-- Inserimento Micronutrienti (relazionali in food_nutrients)
-- Vengono aggiunti solo valori significativi per brevità del seed (non tutti a 0)

INSERT INTO public.food_nutrients (food_id, nutrient_key, nutrient_name, amount, unit) VALUES
-- Uova
('11111111-1111-1111-1111-111111111111', 'vitamin_a', 'Vitamina A', 160, 'mcg'),
('11111111-1111-1111-1111-111111111111', 'vitamin_d', 'Vitamina D', 2.0, 'mcg'),
('11111111-1111-1111-1111-111111111111', 'vitamin_b12', 'Vitamina B12', 0.89, 'mcg'),
('11111111-1111-1111-1111-111111111111', 'iron', 'Ferro', 1.75, 'mg'),
-- Salmone
('22222222-2222-2222-2222-222222222222', 'vitamin_d', 'Vitamina D', 10.9, 'mcg'),
('22222222-2222-2222-2222-222222222222', 'vitamin_b12', 'Vitamina B12', 3.18, 'mcg'),
('22222222-2222-2222-2222-222222222222', 'selenium', 'Selenio', 36.5, 'mcg'),
('22222222-2222-2222-2222-222222222222', 'potassium', 'Potassio', 490, 'mg'),
-- Mandorle
('33333333-3333-3333-3333-333333333333', 'vitamin_e', 'Vitamina E', 25.6, 'mg'),
('33333333-3333-3333-3333-333333333333', 'magnesium', 'Magnesio', 270, 'mg'),
('33333333-3333-3333-3333-333333333333', 'calcium', 'Calcio', 269, 'mg'),
('33333333-3333-3333-3333-333333333333', 'phosphorus', 'Fosforo', 481, 'mg'),
-- Banana
('44444444-4444-4444-4444-444444444444', 'potassium', 'Potassio', 358, 'mg'),
('44444444-4444-4444-4444-444444444444', 'vitamin_b6', 'Vitamina B6', 0.367, 'mg'),
('44444444-4444-4444-4444-444444444444', 'vitamin_c', 'Vitamina C', 8.7, 'mg'),
-- Yogurt Greco
('55555555-5555-5555-5555-555555555555', 'calcium', 'Calcio', 100, 'mg'),
('55555555-5555-5555-5555-555555555555', 'vitamin_b12', 'Vitamina B12', 0.75, 'mcg'),
-- Spinaci
('66666666-6666-6666-6666-666666666666', 'vitamin_k', 'Vitamina K', 482.9, 'mcg'),
('66666666-6666-6666-6666-666666666666', 'vitamin_a', 'Vitamina A', 469, 'mcg'),
('66666666-6666-6666-6666-666666666666', 'folate', 'Acido Folico (B9)', 194, 'mcg'),
('66666666-6666-6666-6666-666666666666', 'iron', 'Ferro', 2.71, 'mg'),
-- Pollo
('77777777-7777-7777-7777-777777777777', 'vitamin_b3', 'Vitamina B3', 11.2, 'mg'),
('77777777-7777-7777-7777-777777777777', 'vitamin_b6', 'Vitamina B6', 0.6, 'mg'),
('77777777-7777-7777-7777-777777777777', 'phosphorus', 'Fosforo', 198, 'mg'),
-- Riso
('88888888-8888-8888-8888-888888888888', 'vitamin_b9', 'Vitamina B9', 58, 'mcg'),
('88888888-8888-8888-8888-888888888888', 'manganese', 'Manganese', 0.37, 'mg'),
-- Avocado
('99999999-9999-9999-9999-999999999999', 'vitamin_k', 'Vitamina K', 21, 'mcg'),
('99999999-9999-9999-9999-999999999999', 'vitamin_b9', 'Vitamina B9', 81, 'mcg'),
('99999999-9999-9999-9999-999999999999', 'potassium', 'Potassio', 485, 'mg'),
-- Tonno
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vitamin_b12', 'Vitamina B12', 2.99, 'mcg'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'selenium', 'Selenio', 80.4, 'mcg'),
('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'vitamin_b3', 'Vitamina B3', 13.3, 'mg'),
-- Sardine
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vitamin_b12', 'Vitamina B12', 8.94, 'mcg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'vitamin_d', 'Vitamina D', 4.8, 'mcg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'calcium', 'Calcio', 382, 'mg'),
('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'selenium', 'Selenio', 52.7, 'mcg'),
-- Patate
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'vitamin_c', 'Vitamina C', 9.6, 'mg'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'potassium', 'Potassio', 391, 'mg'),
('cccccccc-cccc-cccc-cccc-cccccccccccc', 'vitamin_b6', 'Vitamina B6', 0.298, 'mg'),
-- Arancia
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'vitamin_c', 'Vitamina C', 53.2, 'mg'),
('dddddddd-dddd-dddd-dddd-dddddddddddd', 'potassium', 'Potassio', 181, 'mg'),
-- Olio
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'vitamin_e', 'Vitamina E', 14.3, 'mg'),
('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', 'vitamin_k', 'Vitamina K', 60.2, 'mcg');
