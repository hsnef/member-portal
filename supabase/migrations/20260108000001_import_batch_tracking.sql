-- ============================================================================
-- Import Batch Tracking System
-- Allows tracking and reverting bulk CSV imports
-- ============================================================================

-- Create import_batches table
CREATE TABLE import_batches (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  batch_number VARCHAR(20) UNIQUE NOT NULL, -- Format: IMP-YYYYMMDD-XXXX
  file_name TEXT NOT NULL,
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  imported_by_name TEXT, -- Store name for audit trail
  total_records INTEGER NOT NULL DEFAULT 0,
  successful_records INTEGER NOT NULL DEFAULT 0,
  failed_records INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'Completed', -- Completed, Reverted
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  reverted_at TIMESTAMPTZ,
  reverted_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reverted_by_name TEXT
);

-- Add import_batch_id to members table
ALTER TABLE members ADD COLUMN import_batch_id UUID REFERENCES import_batches(id) ON DELETE SET NULL;

-- Create index for faster lookups
CREATE INDEX idx_members_import_batch ON members(import_batch_id);
CREATE INDEX idx_import_batches_status ON import_batches(status);
CREATE INDEX idx_import_batches_created_at ON import_batches(created_at DESC);

-- Add comment
COMMENT ON TABLE import_batches IS 'Tracks bulk CSV imports for audit and revert capability';
COMMENT ON COLUMN members.import_batch_id IS 'Links member to import batch for bulk operations';

-- ============================================================================
-- RLS POLICIES
-- ============================================================================

-- Enable RLS
ALTER TABLE import_batches ENABLE ROW LEVEL SECURITY;

-- Office Staff, Office Manager, and Admin can view all import batches
CREATE POLICY "Staff can view import batches"
  ON import_batches
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Only Office Manager and Admin can insert import batches
CREATE POLICY "Managers can create import batches"
  ON import_batches
  FOR INSERT
  TO authenticated
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Manager', 'Admin')
    )
  );

-- Only Office Manager and Admin can update import batches (for revert)
CREATE POLICY "Managers can update import batches"
  ON import_batches
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_roles.user_id = auth.uid()
      AND user_roles.role IN ('Office Manager', 'Admin')
    )
  );
