-- Seed Data for CannaCultivate Demo
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)

-- First, get your user ID from auth.users or use the one from your session
-- Replace 'YOUR_USER_ID' with your actual user ID from Supabase Auth

-- Step 1: Create Organization
INSERT INTO public.organizations (id, name, license_number, license_type, license_expiry, state, address, email, phone)
VALUES (
  'org-demo-001',
  'CannaCultivate Demo',
  'LIC-2024-DEMO-001',
  'cultivation',
  (CURRENT_DATE + INTERVAL '1 year')::date,
  'CO',
  '123 Green Valley Road, Denver, CO 80202',
  'demo@cannacultivate.com',
  '(303) 555-0123'
) ON CONFLICT (id) DO NOTHING;

-- Step 2: Create Facility
INSERT INTO public.facilities (id, name, organization_id, facility_type, license_number, address, square_footage, max_plant_count, is_active)
VALUES (
  'fac-demo-001',
  'Main Cultivation Facility',
  'org-demo-001',
  'cultivation',
  'LIC-2024-001',
  '123 Green Valley Road, Denver, CO 80202',
  25000,
  2000,
  true
) ON CONFLICT (id) DO NOTHING;

-- Step 3: Create Rooms
INSERT INTO public.rooms (id, name, facility_id, room_type, allowed_stages, max_plant_capacity, current_plant_count, target_temp_f, target_humidity, target_vpd, light_schedule) VALUES
('room-clone-001', 'Clone Room', 'fac-demo-001', 'clone', ARRAY['clone', 'seedling']::growth_stage[], 500, 200, 78, 75, 0.8, '18/6'),
('room-veg-001', 'Veg Room 1', 'fac-demo-001', 'vegetative', ARRAY['vegetative', 'pre_flower']::growth_stage[], 400, 350, 76, 60, 1.0, '18/6'),
('room-veg-002', 'Veg Room 2', 'fac-demo-001', 'vegetative', ARRAY['vegetative', 'pre_flower']::growth_stage[], 400, 280, 76, 60, 1.0, '18/6'),
('room-flower-001', 'Flower Room A', 'fac-demo-001', 'flower', ARRAY['flowering']::growth_stage[], 350, 300, 75, 50, 1.2, '12/12'),
('room-flower-002', 'Flower Room B', 'fac-demo-001', 'flower', ARRAY['flowering']::growth_stage[], 350, 280, 75, 50, 1.2, '12/12'),
('room-dry-001', 'Drying Room', 'fac-demo-001', 'drying', ARRAY['drying']::growth_stage[], 200, 50, 65, 55, 0.9, '0/24')
ON CONFLICT (id) DO NOTHING;

-- Step 4: Create Genetics/Strains
INSERT INTO public.genetics (id, name, organization_id, strain_type, lineage, thc_potential, cbd_potential, flowering_time_days, avg_yield_per_plant_oz, source, notes) VALUES
('gen-001', 'Blue Dream', 'org-demo-001', 'hybrid', 'Blueberry x Haze', 24, 0.5, 65, 3.5, 'clone', 'Popular sativa-dominant hybrid with balanced effects'),
('gen-002', 'OG Kush', 'org-demo-001', 'hybrid', 'Chemdawg x Hindu Kush', 26, 0.3, 60, 3.0, 'clone', 'Classic strain with strong earthy aroma'),
('gen-003', 'Gelato', 'org-demo-001', 'hybrid', 'Sunset Sherbet x Thin Mint GSC', 25, 0.2, 58, 2.8, 'clone', 'Sweet, dessert-like flavor profile'),
('gen-004', 'Sour Diesel', 'org-demo-001', 'sativa', 'Chemdawg x Super Skunk', 22, 0.4, 70, 3.2, 'seed', 'Energizing sativa with pungent diesel aroma'),
('gen-005', 'Granddaddy Purple', 'org-demo-001', 'indica', 'Purple Urkle x Big Bud', 23, 0.1, 55, 3.0, 'clone', 'Deep purple buds with grape and berry flavors')
ON CONFLICT (id) DO NOTHING;

-- Step 5: Create Plant Batches
INSERT INTO public.plant_batches (id, batch_number, organization_id, facility_id, genetic_id, batch_type, start_date, current_stage, current_room_id, initial_count, current_count, status, expected_harvest_date, created_by) VALUES
('batch-001', 'B-2024-001', 'org-demo-001', 'fac-demo-001', 'gen-001', 'clone', CURRENT_DATE - INTERVAL '42 days', 'flowering', 'room-flower-001', 150, 148, 'active', CURRENT_DATE + INTERVAL '23 days', (SELECT id FROM auth.users LIMIT 1)),
('batch-002', 'B-2024-002', 'org-demo-001', 'fac-demo-001', 'gen-002', 'clone', CURRENT_DATE - INTERVAL '28 days', 'vegetative', 'room-veg-001', 200, 198, 'active', CURRENT_DATE + INTERVAL '46 days', (SELECT id FROM auth.users LIMIT 1)),
('batch-003', 'B-2024-003', 'org-demo-001', 'fac-demo-001', 'gen-003', 'clone', CURRENT_DATE - INTERVAL '14 days', 'clone', 'room-clone-001', 100, 95, 'active', CURRENT_DATE + INTERVAL '72 days', (SELECT id FROM auth.users LIMIT 1)),
('batch-004', 'B-2024-004', 'org-demo-001', 'fac-demo-001', 'gen-004', 'seed', CURRENT_DATE - INTERVAL '56 days', 'flowering', 'room-flower-002', 120, 115, 'active', CURRENT_DATE + INTERVAL '14 days', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Step 6: Create Plants
INSERT INTO public.plants (id, plant_tag, batch_id, current_stage, current_room_id, planted_date, status, health_score, height_inches, created_by) VALUES
-- Batch 1 plants (flowering)
('plant-001', 'PLT-001-001', 'batch-001', 'flowering', 'room-flower-001', CURRENT_DATE - INTERVAL '42 days', 'active', 95, 48, (SELECT id FROM auth.users LIMIT 1)),
('plant-002', 'PLT-001-002', 'batch-001', 'flowering', 'room-flower-001', CURRENT_DATE - INTERVAL '42 days', 'active', 92, 45, (SELECT id FROM auth.users LIMIT 1)),
('plant-003', 'PLT-001-003', 'batch-001', 'flowering', 'room-flower-001', CURRENT_DATE - INTERVAL '42 days', 'active', 88, 52, (SELECT id FROM auth.users LIMIT 1)),
('plant-004', 'PLT-001-004', 'batch-001', 'flowering', 'room-flower-001', CURRENT_DATE - INTERVAL '42 days', 'quarantine', 65, 40, (SELECT id FROM auth.users LIMIT 1)),
('plant-005', 'PLT-001-005', 'batch-001', 'flowering', 'room-flower-001', CURRENT_DATE - INTERVAL '42 days', 'active', 90, 46, (SELECT id FROM auth.users LIMIT 1)),
-- Batch 2 plants (vegetative)
('plant-006', 'PLT-002-001', 'batch-002', 'vegetative', 'room-veg-001', CURRENT_DATE - INTERVAL '28 days', 'active', 97, 24, (SELECT id FROM auth.users LIMIT 1)),
('plant-007', 'PLT-002-002', 'batch-002', 'vegetative', 'room-veg-001', CURRENT_DATE - INTERVAL '28 days', 'active', 95, 22, (SELECT id FROM auth.users LIMIT 1)),
('plant-008', 'PLT-002-003', 'batch-002', 'vegetative', 'room-veg-001', CURRENT_DATE - INTERVAL '28 days', 'active', 93, 26, (SELECT id FROM auth.users LIMIT 1)),
('plant-009', 'PLT-002-004', 'batch-002', 'vegetative', 'room-veg-001', CURRENT_DATE - INTERVAL '28 days', 'active', 94, 23, (SELECT id FROM auth.users LIMIT 1)),
('plant-010', 'PLT-002-005', 'batch-002', 'vegetative', 'room-veg-001', CURRENT_DATE - INTERVAL '28 days', 'active', 96, 25, (SELECT id FROM auth.users LIMIT 1)),
-- Batch 3 plants (clone)
('plant-011', 'PLT-003-001', 'batch-003', 'clone', 'room-clone-001', CURRENT_DATE - INTERVAL '14 days', 'active', 85, 6, (SELECT id FROM auth.users LIMIT 1)),
('plant-012', 'PLT-003-002', 'batch-003', 'clone', 'room-clone-001', CURRENT_DATE - INTERVAL '14 days', 'active', 82, 5, (SELECT id FROM auth.users LIMIT 1)),
('plant-013', 'PLT-003-003', 'batch-003', 'clone', 'room-clone-001', CURRENT_DATE - INTERVAL '14 days', 'active', 88, 7, (SELECT id FROM auth.users LIMIT 1)),
('plant-014', 'PLT-003-004', 'batch-003', 'clone', 'room-clone-001', CURRENT_DATE - INTERVAL '14 days', 'active', 84, 6, (SELECT id FROM auth.users LIMIT 1)),
('plant-015', 'PLT-003-005', 'batch-003', 'clone', 'room-clone-001', CURRENT_DATE - INTERVAL '14 days', 'active', 86, 5, (SELECT id FROM auth.users LIMIT 1)),
-- Batch 4 plants (flowering)
('plant-016', 'PLT-004-001', 'batch-004', 'flowering', 'room-flower-002', CURRENT_DATE - INTERVAL '56 days', 'active', 90, 56, (SELECT id FROM auth.users LIMIT 1)),
('plant-017', 'PLT-004-002', 'batch-004', 'flowering', 'room-flower-002', CURRENT_DATE - INTERVAL '56 days', 'active', 88, 54, (SELECT id FROM auth.users LIMIT 1)),
('plant-018', 'PLT-004-003', 'batch-004', 'flowering', 'room-flower-002', CURRENT_DATE - INTERVAL '56 days', 'active', 92, 58, (SELECT id FROM auth.users LIMIT 1)),
('plant-019', 'PLT-004-004', 'batch-004', 'flowering', 'room-flower-002', CURRENT_DATE - INTERVAL '56 days', 'active', 89, 55, (SELECT id FROM auth.users LIMIT 1)),
('plant-020', 'PLT-004-005', 'batch-004', 'flowering', 'room-flower-002', CURRENT_DATE - INTERVAL '56 days', 'active', 91, 57, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Step 7: Create Tasks
INSERT INTO public.tasks (id, title, description, organization_id, facility_id, room_id, batch_id, due_date, priority, status, created_by) VALUES
('task-001', 'Daily Environmental Check - Flower Room A', 'Record temperature, humidity, CO2, and VPD readings', 'org-demo-001', 'fac-demo-001', 'room-flower-001', 'batch-001', CURRENT_DATE, 'high', 'pending', (SELECT id FROM auth.users LIMIT 1)),
('task-002', 'Nutrient Feed - Veg Room 1', 'Apply Veg A+B solution at 1200 PPM', 'org-demo-001', 'fac-demo-001', 'room-veg-001', 'batch-002', CURRENT_DATE, 'medium', 'in_progress', (SELECT id FROM auth.users LIMIT 1)),
('task-003', 'Defoliation - Flower Room B', 'Remove lower fan leaves for better airflow', 'org-demo-001', 'fac-demo-001', 'room-flower-002', 'batch-004', CURRENT_DATE + INTERVAL '2 days', 'medium', 'pending', (SELECT id FROM auth.users LIMIT 1)),
('task-004', 'Clone Transplant', 'Move rooted clones to Veg Room 2', 'org-demo-001', 'fac-demo-001', 'room-clone-001', 'batch-003', CURRENT_DATE + INTERVAL '5 days', 'high', 'pending', (SELECT id FROM auth.users LIMIT 1)),
('task-005', 'Harvest Preparation - Batch B-2024-004', 'Prepare drying room and harvest equipment', 'org-demo-001', 'fac-demo-001', 'room-flower-002', 'batch-004', CURRENT_DATE + INTERVAL '12 days', 'critical', 'pending', (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Step 8: Create Inventory Lots
INSERT INTO public.inventory_lots (id, lot_number, organization_id, genetic_id, inventory_type, production_date, initial_weight_lbs, current_weight_lbs, thc_percent, cbd_percent, moisture_percent, qa_status, is_available, created_by) VALUES
('inv-001', 'INV-2024-001', 'org-demo-001', 'gen-005', 'flower', CURRENT_DATE - INTERVAL '30 days', 45.5, 38.2, 23.5, 0.12, 12.5, 'approved', true, (SELECT id FROM auth.users LIMIT 1)),
('inv-002', 'INV-2024-002', 'org-demo-001', 'gen-001', 'flower', CURRENT_DATE - INTERVAL '45 days', 52.0, 12.5, 24.2, 0.45, 11.8, 'approved', true, (SELECT id FROM auth.users LIMIT 1)),
('inv-003', 'INV-2024-003', 'org-demo-001', 'gen-002', 'trim', CURRENT_DATE - INTERVAL '30 days', 15.0, 15.0, 12.5, 0.3, 13.0, 'pending', false, (SELECT id FROM auth.users LIMIT 1))
ON CONFLICT (id) DO NOTHING;

-- Step 9: Update user profile with organization (run this separately if needed)
-- UPDATE public.profiles SET organization_id = 'org-demo-001' WHERE id = 'YOUR_USER_ID';

-- Step 10: Create user role
-- INSERT INTO public.user_roles (user_id, role) VALUES ('YOUR_USER_ID', 'admin') ON CONFLICT DO NOTHING;

SELECT 'Seed data inserted successfully!' as result;

