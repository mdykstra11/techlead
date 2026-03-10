-- ============================================================
-- Field Service Pro - Database Schema
-- Run this in your Supabase SQL editor or via Supabase CLI
-- ============================================================

-- Enable PostGIS extension for geospatial queries (optional, we use basic math)
-- CREATE EXTENSION IF NOT EXISTS postgis;

-- ============================================================
-- PROFILES
-- Extends Supabase auth.users with role and company info
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role        TEXT NOT NULL CHECK (role IN ('technician', 'office')) DEFAULT 'technician',
  company_id  UUID,
  name        TEXT NOT NULL DEFAULT '',
  email       TEXT NOT NULL DEFAULT '',
  active      BOOLEAN NOT NULL DEFAULT true,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "profiles_select_own"
  ON profiles FOR SELECT
  USING (auth.uid() = id);

-- Office users can read all profiles
CREATE POLICY "profiles_select_office"
  ON profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

-- Users can update their own profile
CREATE POLICY "profiles_update_own"
  ON profiles FOR UPDATE
  USING (auth.uid() = id);

-- Auto-create profile on user signup
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO profiles (id, email, name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'technician')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ============================================================
-- CUSTOMER SITES
-- Properties where technicians perform service
-- Can later be synced from an external CRM via an API adapter
-- ============================================================
CREATE TABLE IF NOT EXISTS customer_sites (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id      UUID,
  customer_name   TEXT NOT NULL,
  location_number TEXT,           -- External CRM / route location ID
  address_1       TEXT NOT NULL,
  city            TEXT NOT NULL,
  state           TEXT NOT NULL,
  zip             TEXT NOT NULL,
  lat             DOUBLE PRECISION NOT NULL,
  lng             DOUBLE PRECISION NOT NULL,
  active          BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE customer_sites ENABLE ROW LEVEL SECURITY;

-- All authenticated users can read active customer sites
CREATE POLICY "customer_sites_select"
  ON customer_sites FOR SELECT
  USING (auth.uid() IS NOT NULL AND active = true);

-- Office users can manage customer sites
CREATE POLICY "customer_sites_manage"
  ON customer_sites FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

-- Index for geo queries
CREATE INDEX IF NOT EXISTS customer_sites_lat_lng ON customer_sites (lat, lng);
CREATE INDEX IF NOT EXISTS customer_sites_customer_name ON customer_sites USING gin(to_tsvector('english', customer_name));

-- ============================================================
-- OPPORTUNITIES
-- Core table for upsell / new service opportunities
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunities (
  id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id                UUID,
  technician_id             UUID NOT NULL REFERENCES profiles(id),
  customer_site_id          UUID NOT NULL REFERENCES customer_sites(id),
  issue_detected            TEXT,
  suggested_service_category TEXT CHECK (
    suggested_service_category IN (
      'General Pest Control Upgrade',
      'Termite Opportunity',
      'Rodent Opportunity',
      'Mosquito Opportunity',
      'Bed Bug Opportunity',
      'Cockroach Opportunity',
      'Weed Control Opportunity',
      'Lawn Care Opportunity',
      'Inspection Recommended',
      'Other'
    )
  ),
  ai_confidence             TEXT CHECK (ai_confidence IN ('high', 'medium', 'low')),
  ai_summary                TEXT,
  technician_notes          TEXT,
  customer_mentioned_issue  BOOLEAN NOT NULL DEFAULT false,
  high_priority             BOOLEAN NOT NULL DEFAULT false,
  status                    TEXT NOT NULL DEFAULT 'submitted' CHECK (
    status IN ('submitted', 'reviewed', 'contacted', 'quoted', 'won', 'lost')
  ),
  office_notes              TEXT,
  assigned_to               TEXT,    -- Salesperson name or ID
  estimated_value           NUMERIC(10,2),
  closed_value              NUMERIC(10,2),
  created_at                TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at                TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunities ENABLE ROW LEVEL SECURITY;

-- Technicians can only see their own opportunities
CREATE POLICY "opportunities_select_own"
  ON opportunities FOR SELECT
  USING (auth.uid() = technician_id);

-- Technicians can create opportunities
CREATE POLICY "opportunities_insert"
  ON opportunities FOR INSERT
  WITH CHECK (auth.uid() = technician_id);

-- Office users can see all opportunities
CREATE POLICY "opportunities_select_office"
  ON opportunities FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

-- Office users can update any opportunity
CREATE POLICY "opportunities_update_office"
  ON opportunities FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

-- Auto-update updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER opportunities_updated_at
  BEFORE UPDATE ON opportunities
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- Indexes
CREATE INDEX IF NOT EXISTS opportunities_technician_id ON opportunities (technician_id);
CREATE INDEX IF NOT EXISTS opportunities_customer_site_id ON opportunities (customer_site_id);
CREATE INDEX IF NOT EXISTS opportunities_status ON opportunities (status);
CREATE INDEX IF NOT EXISTS opportunities_created_at ON opportunities (created_at DESC);

-- ============================================================
-- OPPORTUNITY PHOTOS
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_photos (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  photo_url       TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunity_photos ENABLE ROW LEVEL SECURITY;

-- Photo access follows opportunity access (technician sees own, office sees all)
CREATE POLICY "opportunity_photos_select_own"
  ON opportunity_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_id AND o.technician_id = auth.uid()
    )
  );

CREATE POLICY "opportunity_photos_select_office"
  ON opportunity_photos FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

CREATE POLICY "opportunity_photos_insert"
  ON opportunity_photos FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_id AND o.technician_id = auth.uid()
    )
  );

CREATE POLICY "opportunity_photos_delete"
  ON opportunity_photos FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM opportunities o
      WHERE o.id = opportunity_id AND o.technician_id = auth.uid()
    )
  );

-- ============================================================
-- OPPORTUNITY STATUS HISTORY
-- Audit trail for status changes
-- ============================================================
CREATE TABLE IF NOT EXISTS opportunity_status_history (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id  UUID NOT NULL REFERENCES opportunities(id) ON DELETE CASCADE,
  old_status      TEXT,
  new_status      TEXT NOT NULL,
  changed_by      UUID NOT NULL REFERENCES profiles(id),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE opportunity_status_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "status_history_select"
  ON opportunity_status_history FOR SELECT
  USING (
    auth.uid() IN (
      SELECT technician_id FROM opportunities WHERE id = opportunity_id
    )
    OR EXISTS (
      SELECT 1 FROM profiles p WHERE p.id = auth.uid() AND p.role = 'office'
    )
  );

CREATE POLICY "status_history_insert"
  ON opportunity_status_history FOR INSERT
  WITH CHECK (auth.uid() = changed_by);

-- ============================================================
-- STORAGE BUCKET
-- Create a bucket for opportunity photos
-- Run this separately or via Supabase dashboard:
-- ============================================================
-- INSERT INTO storage.buckets (id, name, public)
-- VALUES ('opportunity-photos', 'opportunity-photos', false);

-- Storage policy: technicians can upload to their own folder
-- CREATE POLICY "photos_insert_own"
--   ON storage.objects FOR INSERT
--   WITH CHECK (
--     bucket_id = 'opportunity-photos'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );

-- Storage policy: opportunity participants can read
-- CREATE POLICY "photos_select_own"
--   ON storage.objects FOR SELECT
--   USING (
--     bucket_id = 'opportunity-photos'
--     AND auth.uid()::text = (storage.foldername(name))[1]
--   );
