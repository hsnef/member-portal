-- Theme switching was removed from the app on 2026-11-12: the palette is
-- app/globals.css alone, so dev and production always look the same.
-- Nothing reads these any more. Undo: 20260112000001_theme_system.sql.

DELETE FROM portal_settings WHERE setting_key = 'active_theme';
DROP TABLE IF EXISTS theme_definitions;
