-- ============================================================================
-- Terms of Use System
-- ============================================================================
-- This system manages portal terms content and tracks user acceptances with
-- versioning, timestamps, and IP addresses for legal compliance.

-- Create terms content table
CREATE TABLE IF NOT EXISTS terms_content (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Version control
  version VARCHAR(20) NOT NULL UNIQUE,
  title TEXT NOT NULL DEFAULT 'HSNEF Membership Portal - Terms of Use',

  -- Content
  content TEXT NOT NULL,
  content_format TEXT NOT NULL DEFAULT 'markdown' CHECK (content_format IN ('markdown', 'html', 'plain')),

  -- Status
  is_active BOOLEAN NOT NULL DEFAULT false,
  effective_date DATE NOT NULL,

  -- Metadata
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  -- Only one active version at a time
  CONSTRAINT only_one_active_version EXCLUDE (is_active WITH =) WHERE (is_active = true)
);

-- Create terms acceptances table
CREATE TABLE IF NOT EXISTS terms_acceptances (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),

  -- Who accepted
  member_id UUID REFERENCES members(id) ON DELETE CASCADE,
  auth_user_id UUID REFERENCES auth.users(id),

  -- What they accepted
  terms_version VARCHAR(20) NOT NULL,
  terms_content_id UUID REFERENCES terms_content(id),

  -- When and where
  accepted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT,

  -- Context
  acceptance_method TEXT CHECK (acceptance_method IN ('registration', 'first_login', 'forced_update')),

  -- Prevent duplicate acceptances
  CONSTRAINT unique_member_version UNIQUE (member_id, terms_version)
);

-- Create indexes
CREATE INDEX idx_terms_content_version ON terms_content(version);
CREATE INDEX idx_terms_content_active ON terms_content(is_active) WHERE is_active = true;
CREATE INDEX idx_terms_acceptances_member ON terms_acceptances(member_id);
CREATE INDEX idx_terms_acceptances_auth_user ON terms_acceptances(auth_user_id);
CREATE INDEX idx_terms_acceptances_version ON terms_acceptances(terms_version);
CREATE INDEX idx_terms_acceptances_date ON terms_acceptances(accepted_at DESC);

-- Create updated_at triggers
CREATE TRIGGER update_terms_content_updated_at
  BEFORE UPDATE ON terms_content
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Add RLS policies
ALTER TABLE terms_content ENABLE ROW LEVEL SECURITY;
ALTER TABLE terms_acceptances ENABLE ROW LEVEL SECURITY;

-- Anyone can view active terms
CREATE POLICY "Anyone can view active terms"
  ON terms_content
  FOR SELECT
  TO public
  USING (is_active = true);

-- Admins can manage terms content
CREATE POLICY "Admins can manage terms"
  ON terms_content
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Admin', 'Office Manager')
    )
  );

-- Users can insert their own acceptance
CREATE POLICY "Users can insert own acceptance"
  ON terms_acceptances
  FOR INSERT
  TO authenticated
  WITH CHECK (auth_user_id = auth.uid());

-- Users can view their own acceptances
CREATE POLICY "Users can view own acceptances"
  ON terms_acceptances
  FOR SELECT
  TO authenticated
  USING (auth_user_id = auth.uid());

-- Staff can view all acceptances
CREATE POLICY "Staff can view all acceptances"
  ON terms_acceptances
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM user_roles
      WHERE user_id = auth.uid()
      AND role IN ('Office Staff', 'Office Manager', 'Admin')
    )
  );

-- Insert initial terms content
INSERT INTO terms_content (
  version,
  title,
  content,
  content_format,
  is_active,
  effective_date
) VALUES (
  '1.0',
  'HSNEF Membership Portal - Terms of Use',
  '# Terms of Use and Member Portal Disclaimer

**Hindu Society of North East Florida (HSNEF) – Membership Portal**
Last updated: ' || CURRENT_DATE || '

## 1. Acceptance of Terms

By accessing or using the HSNEF membership portal located at `https://portal.hsnef.org` (the "Portal"), you agree to be bound by these Terms of Use ("Terms").
If you do not agree to these Terms, you must not use the Portal.

## 2. Purpose of the Portal

The Portal is provided for the convenience of HSNEF members, potential members, donors, and authorized staff to:

- Manage membership information and renewals.
- Register for events and services.
- Make donations and related payments.
- Access HSNEF membership-related communications and records.

The Portal does **not** replace hsnef.org for general temple information (e.g., hours, priests, deities, bylaws, announcements). For such information, please refer to the main HSNEF website.

## 3. Eligibility and Account Security

- You must be at least 18 years old or have a parent/guardian manage your account to use the Portal for membership and payments.
- You are responsible for maintaining the confidentiality of your login credentials and for all activity under your account.
- You agree to:
    - Use accurate and up-to-date information when registering.
    - Notify HSNEF promptly if you believe your account has been accessed without authorization.

HSNEF may disable or restrict access to your account if suspicious or abusive activity is detected.

## 4. Acceptable Use

You agree **not** to:

- Use the Portal for any unlawful, fraudulent, or abusive purpose.
- Attempt to gain unauthorized access to other members'' data, restricted areas, or HSNEF systems.
- Interfere with the operation or security of the Portal (including attempts to bypass security controls).
- Upload or transmit any content that is harmful, offensive, or violates applicable law.

HSNEF reserves the right to suspend or terminate access to the Portal for any use that violates these Terms or threatens HSNEF systems or users.

## 5. Membership Information and Accuracy

- You are responsible for keeping your personal and family information accurate and current (e.g., contact details, family members).
- HSNEF staff may update certain fields to correct errors or complete records in support of membership administration.
- HSNEF relies on the information you provide to process membership, donations, and event registrations; inaccurate information may delay or affect services.

## 6. Payments, Donations, and Receipts

- Online payments made through the Portal are processed by third-party payment processors (such as Stripe). HSNEF does not store full card numbers on its own systems.
- By submitting a payment, you authorize HSNEF and its payment processor to charge the amount you specify, along with any applicable fees disclosed at checkout.
- All payment confirmations, receipts, and donation acknowledgments will be provided electronically through the Portal and/or by email.
- Any refunds, corrections, or adjustments are subject to HSNEF policies and applicable law.

## 7. Privacy and Data Protection

- HSNEF collects and uses personal information for legitimate temple purposes, including membership administration, event management, donation tracking, and communication with members.
- HSNEF takes reasonable technical and organizational measures to protect your data; however, no system can be guaranteed 100% secure.
- For additional details on how information is collected, used, and shared, please refer to the HSNEF Privacy Notice (if published) or contact HSNEF directly.

## 8. Third-Party Services

The Portal may integrate with or link to third-party services (e.g., payment processors, email services, or sign-in providers such as Google).

- HSNEF is not responsible for the content, security, or privacy practices of those third parties.
- Your use of such services is subject to the third party''s own terms and policies.

## 9. Disclaimer of Warranties

The Portal and all content and services made available through it are provided on an "AS IS" and "AS AVAILABLE" basis, without warranties of any kind, whether express or implied.
To the maximum extent permitted by law, HSNEF disclaims all warranties, including but not limited to implied warranties of merchantability, fitness for a particular purpose, and non-infringement.

HSNEF does not warrant that:

- The Portal will be uninterrupted, error-free, or free from security vulnerabilities.
- Any defects will be corrected within a particular timeframe.
- The information available through the Portal is always complete, current, or error-free, though reasonable efforts will be made to keep it accurate.

## 10. Limitation of Liability

To the maximum extent permitted by law, HSNEF, its officers, volunteers, employees, and agents shall not be liable for any indirect, incidental, consequential, special, or punitive damages, or any loss of data, revenue, or goodwill arising out of or related to your use of, or inability to use, the Portal.

Where liability cannot be excluded, HSNEF''s total liability in connection with the Portal is limited to the amount you have paid to HSNEF through the Portal during the twelve (12) months preceding the event giving rise to the claim.

## 11. Indemnification

You agree to indemnify and hold harmless HSNEF, its officers, volunteers, employees, and agents from any claims, damages, losses, liabilities, and expenses (including reasonable attorneys'' fees) arising out of:

- Your use of the Portal.
- Your violation of these Terms or any applicable law.
- Your infringement of any third-party rights.

## 12. Changes to the Portal and to These Terms

- HSNEF may modify, suspend, or discontinue any part of the Portal at any time, with or without notice, for maintenance, upgrades, or other reasons.
- HSNEF may update these Terms from time to time. The "Last updated" date at the top will indicate the current version.
- Continued use of the Portal after changes are posted constitutes your acceptance of the updated Terms.

## 13. Termination of Access

HSNEF may suspend or terminate your access to the Portal at any time, with or without notice, if:

- You violate these Terms or applicable laws.
- Your account is inactive for an extended period under HSNEF policies.
- HSNEF deems it necessary to protect the Portal, other users, or HSNEF''s interests.

Upon termination, some information (e.g., payment records, donation history, audit logs) may be retained as required by law or for legitimate temple administrative purposes.

## 14. Governing Law and Dispute Resolution

These Terms and your use of the Portal are governed by the laws of the State of Florida, without regard to its conflict of law principles.
Any dispute arising out of or relating to these Terms or the Portal shall be subject to the exclusive jurisdiction of the state and federal courts located in Florida, unless HSNEF and you agree to another form of resolution.

## 15. Contact Information

For questions about these Terms or the Portal, please contact:

Hindu Society of North East Florida (HSNEF)
Email: info@hsnef.org
Website: https://hsnef.org',
  'markdown',
  true,
  CURRENT_DATE
) ON CONFLICT (version) DO NOTHING;

-- Comments
COMMENT ON TABLE terms_content IS 'Stores versioned terms of use content';
COMMENT ON TABLE terms_acceptances IS 'Tracks when users accept terms, with version, timestamp, and IP for legal compliance';
COMMENT ON COLUMN terms_content.is_active IS 'Only one version can be active at a time';
COMMENT ON COLUMN terms_acceptances.acceptance_method IS 'How user accepted: registration, first_login, or forced_update';
COMMENT ON COLUMN terms_acceptances.ip_address IS 'IP address at time of acceptance for legal record';
