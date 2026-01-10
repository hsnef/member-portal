-- Fix test account email typo: dev-msp -> dev-mp
-- All test account emails should use dev-mp+...@hsnef.org format

-- Update Test Manager
UPDATE members
SET primary_email = 'dev-mp+testmanager@hsnef.org'
WHERE primary_email = 'dev-msp+testmanager@hsnef.org';

-- Update Test Staff
UPDATE members
SET primary_email = 'dev-mp+teststaff@hsnef.org'
WHERE primary_email = 'dev-msp+teststaff@hsnef.org';

-- Update Test Lifetime
UPDATE members
SET primary_email = 'dev-mp+testlifetime@hsnef.org'
WHERE primary_email = 'dev-msp+testlifetime@hsnef.org';

-- Update Test Annual
UPDATE members
SET primary_email = 'dev-mp+testannual@hsnef.org'
WHERE primary_email = 'dev-msp+testannual@hsnef.org';

-- Update Test Community
UPDATE members
SET primary_email = 'dev-mp+testcommunity@hsnef.org'
WHERE primary_email = 'dev-msp+testcommunity@hsnef.org';

-- Update Test Admin (if it exists)
UPDATE members
SET primary_email = 'dev-mp+testadmin@hsnef.org'
WHERE primary_email = 'dev-msp+testadmin@hsnef.org';
