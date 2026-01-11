-- Migration: Create storage bucket and policies for event images
-- This enables image uploads for events by staff/admin users

-- Create the event-images bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('event-images', 'event-images', true)
ON CONFLICT (id) DO NOTHING;

-- Drop existing policies if they exist (for idempotency)
DROP POLICY IF EXISTS "Public read access for event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can upload event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can update event images" ON storage.objects;
DROP POLICY IF EXISTS "Staff can delete event images" ON storage.objects;

-- Policy: Anyone can view/download event images (public read)
CREATE POLICY "Public read access for event images"
ON storage.objects FOR SELECT
USING (bucket_id = 'event-images');

-- Policy: Staff/Admin can upload event images
-- Uses the existing has_any_role function from RLS policies
CREATE POLICY "Staff can upload event images"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'event-images'
  AND has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
);

-- Policy: Staff/Admin can update event images
CREATE POLICY "Staff can update event images"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
);

-- Policy: Staff/Admin can delete event images
CREATE POLICY "Staff can delete event images"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'event-images'
  AND has_any_role(ARRAY['Office Staff', 'Office Manager', 'Admin']::user_role[])
);
