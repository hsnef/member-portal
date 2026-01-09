-- Create family_members table to store Primary, Secondary, and Children
-- This allows unlimited family members per membership

-- Drop existing objects if they exist (cleanup from failed attempts)
DROP TABLE IF EXISTS family_members CASCADE;
DROP INDEX IF EXISTS idx_family_members_member_id;
DROP INDEX IF EXISTS idx_family_members_relationship;
DROP INDEX IF EXISTS idx_family_members_email;
DROP INDEX IF EXISTS idx_family_members_name;
DROP INDEX IF EXISTS unique_primary_secondary_per_member;
DROP FUNCTION IF EXISTS update_family_members_updated_at() CASCADE;

CREATE TABLE family_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,

  -- Relationship type: 'Primary', 'Secondary', 'Child'
  relationship TEXT NOT NULL CHECK (relationship IN ('Primary', 'Secondary', 'Child')),

  -- Basic information
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,

  -- Contact information
  email TEXT,
  phone TEXT, -- Normalized with country code (e.g., +19045551234)

  -- Hindu details
  nakshatra TEXT,

  -- For children: ordering (1, 2, 3, 4, etc.)
  -- NULL for Primary and Secondary
  child_order INTEGER CHECK (
    (relationship = 'Child' AND child_order IS NOT NULL AND child_order > 0) OR
    (relationship != 'Child' AND child_order IS NULL)
  ),

  -- Timestamps
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  -- Ensure unique child_order per member
  CONSTRAINT unique_child_order_per_member UNIQUE (member_id, child_order)
);

-- Create indexes for performance
CREATE INDEX idx_family_members_member_id ON family_members(member_id);
CREATE INDEX idx_family_members_relationship ON family_members(relationship);
CREATE INDEX idx_family_members_email ON family_members(email) WHERE email IS NOT NULL;
CREATE INDEX idx_family_members_name ON family_members(first_name, last_name);

-- Ensure only one Primary and one Secondary per member using partial unique index
CREATE UNIQUE INDEX unique_primary_secondary_per_member
  ON family_members(member_id, relationship)
  WHERE relationship IN ('Primary', 'Secondary');

-- Enable Row Level Security
ALTER TABLE family_members ENABLE ROW LEVEL SECURITY;

-- Policy: Staff can view all family members
CREATE POLICY "Staff can view all family members"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Admin', 'Office Manager', 'Office Staff')
    )
  );

-- Policy: Staff can insert family members
CREATE POLICY "Staff can insert family members"
  ON family_members
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Admin', 'Office Manager', 'Office Staff')
    )
  );

-- Policy: Staff can update family members
CREATE POLICY "Staff can update family members"
  ON family_members
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Admin', 'Office Manager', 'Office Staff')
    )
  );

-- Policy: Staff can delete family members
CREATE POLICY "Staff can delete family members"
  ON family_members
  FOR DELETE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Admin', 'Office Manager', 'Office Staff')
    )
  );

-- Policy: Members can view their own family members
CREATE POLICY "Members can view their own family"
  ON family_members
  FOR SELECT
  TO authenticated
  USING (
    member_id IN (
      SELECT id FROM members WHERE auth_user_id = auth.uid()
    )
  );

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_family_members_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER family_members_updated_at
  BEFORE UPDATE ON family_members
  FOR EACH ROW
  EXECUTE FUNCTION update_family_members_updated_at();

-- Add comment to table
COMMENT ON TABLE family_members IS 'Stores family member information (Primary, Secondary, and Children) for each membership';
COMMENT ON COLUMN family_members.relationship IS 'Type of family member: Primary, Secondary, or Child';
COMMENT ON COLUMN family_members.child_order IS 'Order of child (1, 2, 3, 4, etc.) - NULL for Primary/Secondary';
COMMENT ON COLUMN family_members.phone IS 'Phone number normalized with country code (e.g., +19045551234)';
