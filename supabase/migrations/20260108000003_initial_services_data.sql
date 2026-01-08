-- ============================================================================
-- Initial Data: Purohits and Services
-- Populated from purohits.csv and Services.csv
-- ============================================================================

-- ============================================================================
-- INSERT PUROHITS
-- ============================================================================

INSERT INTO purohits (name, bio, picture_url, profile_url, is_active, display_order) VALUES
(
  'Pandit Sri Kadambi Srinathan',
  'Pandit Sri Kadambi Srinathan Ji has three master''s degrees in sanskrit, Indian culture and epigraphy, is a consummate linguist. His flawless rendering of sanskrit mantras comes with the same ease and resonance as his elaborate explanation in english. His scholarship, humility, friendly disposition and exuding enthusiasm are indeed a gift for our community.',
  'https://drive.google.com/file/d/1aN5kcus7Lid6f-FTqh8XExj-VMg_-M3G/view?usp=drive_link',
  'https://hsnef.org/about-us/head-priest/',
  true,
  1
),
(
  'Pandit Bhardwaj Bhaskaran',
  'Pandit Bharadwaj Baskaran has obtained education of over 10 years in Krishna Yajur Veda Kramantham. He has experience Working in various temples in India. He is proficient in Yajur Veda Karma Kandas. He is qualified to do all havans. He is proficient in Poorva and Apara prayoga in Aapashtamba and Drahyayanam. He speaks Tamil, English Telugu, and Kannada.',
  'https://drive.google.com/file/d/1Rqk0VFyDF-dVgOXyyXzCf7VUVLAuDaZC/view?usp=drive_link',
  'https://hsnef.org/about-us/priests/',
  true,
  2
);

-- ============================================================================
-- INSERT SERVICES
-- ============================================================================

-- Note: Prices are stored without $ sign, as DECIMAL
-- Member = Annual/Lifetime members
-- Community = Community members (non-paying members)

INSERT INTO services (name, display_name, category, price_member_temple, price_community_temple, price_member_external, price_community_external, is_active, display_order) VALUES
('Abhishekam (performed only during scheduled community temple hours)', 'Abhishekam', 'Puja', 51.00, 101.00, NULL, NULL, true, 1),
('Abhishekam (non-temple hours)', NULL, 'Puja', 501.00, 751.00, NULL, NULL, true, 2),
('Akhand Ramayan Path with Priest coming ONCE either at Start or Finish', NULL, 'Puja', NULL, NULL, 151.00, 301.00, true, 3),
('Akhand Ramayan Path with Priest coming twice at Start and Finish', NULL, 'Puja', NULL, NULL, 251.00, 301.00, true, 4),
('Annaprasanam, Chaula (hair offering) Vidya Arambha (walkin and call office only)', 'Annaprasanam', 'Puja', 31.00, 51.00, 101.00, 151.00, true, 5),
('Archana (walkin and call office only)', 'Archana', 'Puja', 11.00, 11.00, NULL, NULL, true, 6),
('Ayush/Shanti Havan', NULL, 'Puja', 251.00, 301.00, 201.00, 251.00, true, 7),
('Bhumi Pooja', NULL, 'Puja', NULL, NULL, 151.00, 201.00, true, 8),
('Chandi Havan', NULL, 'Puja', 601.00, 701.00, 501.00, 601.00, true, 9),
('Funeral Services', NULL, 'Puja', NULL, NULL, 251.00, 301.00, true, 10),
('Ganpathi Havan', NULL, 'Puja', 251.00, 301.00, 201.00, 251.00, true, 11),
('Grihaprevash/Vastu pooja', NULL, 'Puja', NULL, NULL, 175.00, 225.00, true, 12),
('Havan', NULL, 'Puja', 101.00, 151.00, NULL, NULL, true, 13),
('Hiranya Shraddha (walkin and call office only)', 'Hiranya Shraddha', 'Puja', 25.00, 51.00, NULL, NULL, true, 14),
('Mata Ki Choki', NULL, 'Puja', 51.00, 101.00, NULL, NULL, true, 15),
('Navagraha/Gayatri Havan', NULL, 'Puja', 251.00, 301.00, 201.00, 251.00, true, 16),
('Nischitartam (Engagement)', NULL, 'Puja', 101.00, 151.00, 175.00, 225.00, true, 17),
('Offering on Birthday (walkin and call office only)', 'Birthday', 'Puja', 21.00, 31.00, NULL, NULL, true, 18),
('Offering on Anniversary (walkin and call office only)', 'Anniversary', 'Puja', 21.00, 31.00, NULL, NULL, true, 19),
('Patra Pooja', NULL, 'Puja', 51.00, 101.00, 101.00, 151.00, true, 20),
('Private Pooja (non temple hours)', NULL, 'Puja', 151.00, 201.00, NULL, NULL, true, 21),
('Punyavachanam with Pooja', NULL, 'Puja', 51.00, 75.00, 101.00, 151.00, true, 22),
('Sahasranama Pooja', NULL, 'Puja', 51.00, 101.00, NULL, NULL, true, 23),
('Sahastrachandra (80 Birthday)', NULL, 'Puja', 301.00, 351.00, 251.00, 301.00, true, 24),
('Satyanarayana Vratam', NULL, 'Puja', 51.00, 151.00, 175.00, 225.00, true, 25),
('Satyanarayana Vratam (private in temple)', NULL, 'Puja', 151.00, 201.00, NULL, NULL, true, 26),
('Satyanarayan and Griha Pravesh pooja', NULL, 'Puja', NULL, NULL, 251.00, 301.00, true, 27),
('Seemantham with Havan', NULL, 'Puja', 175.00, 225.00, 201.00, 251.00, true, 28),
('Shanti Path Pooja', NULL, 'Puja', 51.00, 101.00, 101.00, 151.00, true, 29),
('Shashtipoorti (60th Birthday)', NULL, 'Puja', NULL, NULL, NULL, NULL, true, 30),
('Shraddha (1st)', NULL, 'Puja', NULL, NULL, 151.00, 201.00, true, 31),
('Sudarshana Havan', NULL, 'Puja', 401.00, 501.00, 301.00, 351.00, true, 32),
('Sundarakand Path', NULL, 'Puja', NULL, NULL, 251.00, 301.00, true, 33),
('Upanayanam', NULL, 'Puja', 301.00, 351.00, 251.00, 301.00, true, 34),
('Vadamala (walkin and call office only)', 'Vadamala', 'Puja', 31.00, 51.00, NULL, NULL, true, 35),
('Vahana Pooja (walkin and call office only)', 'Vahana Pooja', 'Puja', 31.00, 51.00, NULL, NULL, true, 36),
('Wedding Ceremony', NULL, 'Puja', 351.00, 501.00, 501.00, 701.00, true, 37);

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Verify purohits
-- SELECT COUNT(*) as purohit_count FROM purohits;

-- Verify services
-- SELECT COUNT(*) as service_count FROM services;

-- View all services with pricing
-- SELECT name, price_member_temple, price_community_temple, price_member_external, price_community_external
-- FROM services
-- ORDER BY display_order;
