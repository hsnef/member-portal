-- Migration: Add short_description column to events table
-- This column stores a brief summary (max 200 chars) for event cards
-- The full description field now supports HTML content for the detail page

-- Add short_description column to events table
ALTER TABLE events
ADD COLUMN IF NOT EXISTS short_description TEXT;

-- Add a comment to document the column
COMMENT ON COLUMN events.short_description IS 'Brief summary for event cards (max 200 characters). Full HTML description uses the description column.';

-- Create index for potential filtering/searching on short_description
CREATE INDEX IF NOT EXISTS idx_events_short_description ON events(short_description) WHERE short_description IS NOT NULL;
