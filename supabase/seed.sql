-- ============================================================
-- Seed Data for Field Service Pro
-- Run AFTER 001_schema.sql
-- Creates mock users, customer sites, and opportunities
-- ============================================================

-- NOTE: In production, users are created via Supabase Auth.
-- For seeding, we insert directly into auth.users then profiles.
-- Replace the UUIDs below with real auth user UUIDs when using Supabase dashboard.

-- ============================================================
-- SEED USERS (run via Supabase dashboard or CLI)
-- Use the Supabase Auth UI to create these users then update profiles:
-- ============================================================
-- Office users:
--   sarah.office@fieldpro.dev  / Password123!  (role: office)
--   mike.office@fieldpro.dev   / Password123!  (role: office)
-- Technician users:
--   john.tech@fieldpro.dev     / Password123!  (role: technician)
--   maria.tech@fieldpro.dev    / Password123!  (role: technician)
--   carlos.tech@fieldpro.dev   / Password123!  (role: technician)

-- After creating auth users, update their profiles:
-- UPDATE profiles SET role = 'office', name = 'Sarah Johnson' WHERE email = 'sarah.office@fieldpro.dev';
-- UPDATE profiles SET role = 'office', name = 'Mike Peters' WHERE email = 'mike.office@fieldpro.dev';
-- UPDATE profiles SET name = 'John Smith' WHERE email = 'john.tech@fieldpro.dev';
-- UPDATE profiles SET name = 'Maria Garcia' WHERE email = 'maria.tech@fieldpro.dev';
-- UPDATE profiles SET name = 'Carlos Rivera' WHERE email = 'carlos.tech@fieldpro.dev';

-- ============================================================
-- CUSTOMER SITES (25 mock sites in the Phoenix, AZ area)
-- ============================================================
INSERT INTO customer_sites (customer_name, location_number, address_1, city, state, zip, lat, lng)
VALUES
  ('Johnson Residence',        'LOC-001', '1234 N Scottsdale Rd',    'Scottsdale',  'AZ', '85251', 33.4942, -111.9261),
  ('Green Valley HOA',         'LOC-002', '5678 E Camelback Rd',     'Phoenix',     'AZ', '85018', 33.5096, -112.0200),
  ('Mesa Office Park',         'LOC-003', '910 W Main St',           'Mesa',        'AZ', '85201', 33.4152, -111.8315),
  ('Rivera Family Home',       'LOC-004', '321 S Rural Rd',          'Tempe',       'AZ', '85281', 33.3942, -111.9280),
  ('Chandler Commons',         'LOC-005', '111 N Arizona Ave',       'Chandler',    'AZ', '85225', 33.3062, -111.8413),
  ('Anderson Property',        'LOC-006', '456 E Bell Rd',           'Phoenix',     'AZ', '85022', 33.6384, -112.0274),
  ('Paradise Valley Estate',   'LOC-007', '789 N Pima Rd',           'Scottsdale',  'AZ', '85260', 33.6196, -111.8989),
  ('Gilbert Shopping Center',  'LOC-008', '2345 E Guadalupe Rd',     'Gilbert',     'AZ', '85234', 33.3527, -111.7896),
  ('Thompson Lawn',            'LOC-009', '678 W Elliot Rd',         'Chandler',    'AZ', '85225', 33.3312, -111.9140),
  ('North Phoenix Plaza',      'LOC-010', '1234 W Thunderbird Rd',   'Phoenix',     'AZ', '85023', 33.6137, -112.1133),
  ('Peoria Residences',        'LOC-011', '5678 N 83rd Ave',         'Peoria',      'AZ', '85345', 33.5806, -112.2374),
  ('Sun City Commons',         'LOC-012', '910 N Camino Del Sol',    'Sun City',    'AZ', '85373', 33.5948, -112.2876),
  ('Glendale Business Park',   'LOC-013', '321 W Olive Ave',         'Glendale',    'AZ', '85302', 33.5386, -112.1860),
  ('Tempe Town Lake HOA',      'LOC-014', '111 S Priest Dr',         'Tempe',       'AZ', '85281', 33.4151, -111.9332),
  ('Scottsdale Commons',       'LOC-015', '456 N Hayden Rd',         'Scottsdale',  'AZ', '85257', 33.4880, -111.9139),
  ('Desert Hills Residence',   'LOC-016', '789 E McDowell Rd',       'Phoenix',     'AZ', '85008', 33.4650, -112.0040),
  ('Ahwatukee Estates',        'LOC-017', '2345 E Elliot Rd',        'Phoenix',     'AZ', '85048', 33.3127, -111.9853),
  ('Avondale Community',       'LOC-018', '678 N Dysart Rd',         'Avondale',    'AZ', '85323', 33.4356, -112.3493),
  ('Goodyear HOA',             'LOC-019', '1234 N Litchfield Rd',    'Goodyear',    'AZ', '85338', 33.4353, -112.3578),
  ('Queen Creek Residence',    'LOC-020', '5678 E Riggs Rd',         'Queen Creek', 'AZ', '85142', 33.2484, -111.6341),
  ('Cave Creek Estate',        'LOC-021', '910 E Cave Creek Rd',     'Cave Creek',  'AZ', '85331', 33.8327, -111.9604),
  ('Fountain Hills HOA',       'LOC-022', '321 E Fountain Hills Blvd','Fountain Hills','AZ','85268',33.6068, -111.7178),
  ('Surprise Residential',     'LOC-023', '111 N Dysart Rd',         'Surprise',    'AZ', '85379', 33.6295, -112.3679),
  ('Gold Canyon Property',     'LOC-024', '456 S Kings Ranch Rd',    'Gold Canyon', 'AZ', '85118', 33.3793, -111.4385),
  ('Buckeye Community',        'LOC-025', '789 E Yuma Rd',           'Buckeye',     'AZ', '85326', 33.3703, -112.5838)
ON CONFLICT DO NOTHING;

-- ============================================================
-- OPPORTUNITIES
-- These require real user UUIDs from auth.users
-- Replace the UUIDs with actual ones after creating auth users
-- ============================================================
-- Example (run after you have real user UUIDs):
--
-- WITH
--   tech1 AS (SELECT id FROM profiles WHERE email = 'john.tech@fieldpro.dev'),
--   tech2 AS (SELECT id FROM profiles WHERE email = 'maria.tech@fieldpro.dev'),
--   tech3 AS (SELECT id FROM profiles WHERE email = 'carlos.tech@fieldpro.dev'),
--   site1 AS (SELECT id FROM customer_sites WHERE location_number = 'LOC-001'),
--   site2 AS (SELECT id FROM customer_sites WHERE location_number = 'LOC-002'),
--   site3 AS (SELECT id FROM customer_sites WHERE location_number = 'LOC-003'),
--   site4 AS (SELECT id FROM customer_sites WHERE location_number = 'LOC-004'),
--   site5 AS (SELECT id FROM customer_sites WHERE location_number = 'LOC-005')
-- INSERT INTO opportunities (
--   technician_id, customer_site_id,
--   issue_detected, suggested_service_category, ai_confidence,
--   ai_summary, technician_notes, customer_mentioned_issue, high_priority, status
-- )
-- SELECT
--   (SELECT id FROM tech1),
--   (SELECT id FROM site1),
--   'Visible rodent droppings near garage door and entry points',
--   'Rodent Opportunity',
--   'high',
--   'Evidence of rodent activity detected near entry points. Multiple droppings observed near garage door threshold and landscaping gap. Customer would benefit from a rodent exclusion service.',
--   'Customer said they heard noises in walls at night.',
--   true,
--   true,
--   'reviewed'
-- UNION ALL
-- SELECT
--   (SELECT id FROM tech1),
--   (SELECT id FROM site2),
--   'Extensive weed growth along property perimeter and sidewalks',
--   'Weed Control Opportunity',
--   'high',
--   'Significant weed growth observed along hardscape edges and in landscape beds. Property appears to lack any current weed control program.',
--   'HOA will be citing them soon if not treated.',
--   false,
--   false,
--   'submitted'
-- ...
-- (Add more as needed)

-- ============================================================
-- SIMPLE SEED SCRIPT for development (no auth users required)
-- Use this to test the UI with mock data via the API routes
-- ============================================================
-- The app has a /api/seed endpoint in development mode that
-- inserts the above data using the service role key.
