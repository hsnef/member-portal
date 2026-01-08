-- ============================================================================
-- Service Booking System with Approval Workflow
-- ============================================================================

-- ============================================================================
-- ENUMS
-- ============================================================================

-- Service category
CREATE TYPE service_category AS ENUM ('Puja', 'Other');

-- Location type for service
CREATE TYPE service_location_type AS ENUM ('Temple', 'External');

-- Booking status with approval workflow
CREATE TYPE booking_status AS ENUM (
  'Pending Approval',
  'Approved',
  'Rejected',
  'Paid',
  'Completed',
  'Cancelled'
);

-- ============================================================================
-- PUROHITS (PRIESTS) TABLE
-- ============================================================================

CREATE TABLE purohits (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  bio TEXT,
  picture_url TEXT,
  profile_url TEXT,
  phone TEXT,
  email TEXT,
  specialties TEXT,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SERVICES CATALOG TABLE
-- ============================================================================

CREATE TABLE services (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  display_name TEXT, -- Name shown on kiosk/display
  description TEXT,
  category service_category DEFAULT 'Puja',

  -- Pricing (all prices in dollars)
  price_member_temple DECIMAL(10,2),
  price_community_temple DECIMAL(10,2),
  price_member_external DECIMAL(10,2),
  price_community_external DECIMAL(10,2),

  -- Service details
  duration_minutes INTEGER, -- Estimated duration
  preparation_notes TEXT, -- What member needs to prepare

  -- Display and availability
  is_active BOOLEAN DEFAULT true,
  is_temple_only BOOLEAN DEFAULT false, -- Can only be performed in temple
  requires_appointment BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SERVICE BOOKINGS (MAIN BOOKING RECORD)
-- ============================================================================

CREATE TABLE service_bookings (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_number VARCHAR(20) UNIQUE NOT NULL, -- Format: SB-YYYYMMDD-XXXX

  -- Member information (can be null for walk-ins before member creation)
  member_id UUID REFERENCES members(id) ON DELETE SET NULL,
  membership_id TEXT,

  -- Requester contact info (always captured)
  requester_name TEXT NOT NULL,
  requester_phone TEXT NOT NULL,
  requester_email TEXT NOT NULL,

  -- Booking details
  total_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
  status booking_status DEFAULT 'Pending Approval',

  -- Approval workflow
  submitted_at TIMESTAMPTZ DEFAULT NOW(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_by_name TEXT,
  approval_notes TEXT, -- Staff notes on approval/rejection
  rejection_reason TEXT,

  -- Payment tracking
  payment_id UUID REFERENCES payments(id) ON DELETE SET NULL,
  paid_at TIMESTAMPTZ,

  -- Completion
  completed_at TIMESTAMPTZ,

  -- Additional information
  notes TEXT, -- Member's additional notes
  internal_notes TEXT, -- Staff internal notes

  -- Metadata
  is_walk_in BOOLEAN DEFAULT false, -- Created by staff for walk-in/phone booking
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- SERVICE BOOKING ITEMS (LINE ITEMS - CART)
-- ============================================================================

CREATE TABLE service_booking_items (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  booking_id UUID NOT NULL REFERENCES service_bookings(id) ON DELETE CASCADE,

  -- Service details
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  service_name TEXT NOT NULL, -- Snapshot of service name at booking time

  -- Scheduling
  service_date DATE NOT NULL,
  service_time TIME,

  -- Location
  location_type service_location_type NOT NULL,
  service_address TEXT, -- Full address if external

  -- Priest assignment
  purohit_id UUID REFERENCES purohits(id) ON DELETE SET NULL,
  purohit_name TEXT, -- Snapshot at booking time

  -- Pricing
  item_amount DECIMAL(10,2) NOT NULL,

  -- Item-specific notes
  item_notes TEXT,

  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- INDEXES
-- ============================================================================

-- Purohits indexes
CREATE INDEX idx_purohits_active ON purohits(is_active);
CREATE INDEX idx_purohits_display_order ON purohits(display_order);

-- Services indexes
CREATE INDEX idx_services_active ON services(is_active);
CREATE INDEX idx_services_category ON services(category);
CREATE INDEX idx_services_display_order ON services(display_order);

-- Service bookings indexes
CREATE INDEX idx_service_bookings_member ON service_bookings(member_id);
CREATE INDEX idx_service_bookings_status ON service_bookings(status);
CREATE INDEX idx_service_bookings_submitted ON service_bookings(submitted_at DESC);
CREATE INDEX idx_service_bookings_number ON service_bookings(booking_number);

-- Service booking items indexes
CREATE INDEX idx_service_booking_items_booking ON service_booking_items(booking_id);
CREATE INDEX idx_service_booking_items_service ON service_booking_items(service_id);
CREATE INDEX idx_service_booking_items_date ON service_booking_items(service_date);
CREATE INDEX idx_service_booking_items_purohit ON service_booking_items(purohit_id);

-- ============================================================================
-- TRIGGERS FOR UPDATED_AT
-- ============================================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_purohits_updated_at BEFORE UPDATE ON purohits
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_bookings_updated_at BEFORE UPDATE ON service_bookings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_service_booking_items_updated_at BEFORE UPDATE ON service_booking_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE purohits ENABLE ROW LEVEL SECURITY;
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_bookings ENABLE ROW LEVEL SECURITY;
ALTER TABLE service_booking_items ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- PUROHITS POLICIES
-- ============================================================================

-- Everyone can view active purohits
CREATE POLICY "Anyone can view active purohits"
  ON purohits FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Staff can view all purohits
CREATE POLICY "Staff can view all purohits"
  ON purohits FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can insert purohits
CREATE POLICY "Staff can insert purohits"
  ON purohits FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can update purohits
CREATE POLICY "Staff can update purohits"
  ON purohits FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can delete purohits
CREATE POLICY "Staff can delete purohits"
  ON purohits FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- ============================================================================
-- SERVICES POLICIES
-- ============================================================================

-- Everyone can view active services
CREATE POLICY "Anyone can view active services"
  ON services FOR SELECT
  TO authenticated
  USING (is_active = true);

-- Staff can view all services
CREATE POLICY "Staff can view all services"
  ON services FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Staff can manage services
CREATE POLICY "Staff can insert services"
  ON services FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

CREATE POLICY "Staff can update services"
  ON services FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

CREATE POLICY "Staff can delete services"
  ON services FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- ============================================================================
-- SERVICE BOOKINGS POLICIES
-- ============================================================================

-- Members can view their own bookings
CREATE POLICY "Members can view own bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can view all bookings
CREATE POLICY "Staff can view all bookings"
  ON service_bookings FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can create bookings
CREATE POLICY "Members can create bookings"
  ON service_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Staff can create any booking
CREATE POLICY "Staff can create bookings"
  ON service_bookings FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can update their own pending bookings
CREATE POLICY "Members can update own pending bookings"
  ON service_bookings FOR UPDATE
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
    AND status = 'Pending Approval'
  );

-- Staff can update any booking
CREATE POLICY "Staff can update bookings"
  ON service_bookings FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- ============================================================================
-- SERVICE BOOKING ITEMS POLICIES
-- ============================================================================

-- Members can view items for their bookings
CREATE POLICY "Members can view own booking items"
  ON service_booking_items FOR SELECT
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM service_bookings
      WHERE member_id IN (
        SELECT id FROM members WHERE auth_user_id = auth.uid()
      )
    )
  );

-- Staff can view all booking items
CREATE POLICY "Staff can view all booking items"
  ON service_booking_items FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can insert items for their pending bookings
CREATE POLICY "Members can insert own booking items"
  ON service_booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    booking_id IN (
      SELECT id FROM service_bookings
      WHERE member_id IN (
        SELECT id FROM members WHERE auth_user_id = auth.uid()
      )
      AND status = 'Pending Approval'
    )
  );

-- Staff can insert any booking items
CREATE POLICY "Staff can insert booking items"
  ON service_booking_items FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can update items for their pending bookings
CREATE POLICY "Members can update own booking items"
  ON service_booking_items FOR UPDATE
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM service_bookings
      WHERE member_id IN (
        SELECT id FROM members WHERE auth_user_id = auth.uid()
      )
      AND status = 'Pending Approval'
    )
  );

-- Staff can update any booking items
CREATE POLICY "Staff can update booking items"
  ON service_booking_items FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Members can delete items from their pending bookings
CREATE POLICY "Members can delete own booking items"
  ON service_booking_items FOR DELETE
  TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM service_bookings
      WHERE member_id IN (
        SELECT id FROM members WHERE auth_user_id = auth.uid()
      )
      AND status = 'Pending Approval'
    )
  );

-- Staff can delete any booking items
CREATE POLICY "Staff can delete booking items"
  ON service_booking_items FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- ============================================================================
-- COMMENTS
-- ============================================================================

COMMENT ON TABLE purohits IS 'Priests/purohits available for service bookings';
COMMENT ON TABLE services IS 'Service catalog with pricing for temple and external locations';
COMMENT ON TABLE service_bookings IS 'Main booking record with approval workflow';
COMMENT ON TABLE service_booking_items IS 'Line items for each booking (cart items)';

COMMENT ON COLUMN service_bookings.status IS 'Pending Approval → Approved → Paid → Completed (or Rejected/Cancelled)';
COMMENT ON COLUMN service_booking_items.location_type IS 'Temple (inside temple) or External (outside temple at member location)';
