-- The terms of use (seeded in 20260108000008) name the portal as
-- https://portal.hsnef.org. That address is the email sending domain and
-- serves no site; the portal is https://member.hsnef.org.
--
-- Corrects the address in place. It is a wrong URL, not a change to what a
-- member agrees to, so no new terms version is created and no one is asked
-- to accept again. Safe to run more than once.
UPDATE terms_content
SET content = replace(content, 'https://portal.hsnef.org', 'https://member.hsnef.org'),
    updated_at = now()
WHERE content LIKE '%https://portal.hsnef.org%';
