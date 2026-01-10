-- Fix audit log trigger to use member_profile_name instead of profile_name
-- The column was renamed in migration 20260109000006

CREATE OR REPLACE FUNCTION log_member_changes()
RETURNS TRIGGER AS $$
DECLARE
  v_user_role TEXT;
  v_user_name TEXT;
  v_changed_fields JSONB := '{}'::JSONB;
  v_field_names TEXT[] := ARRAY[]::TEXT[];
  v_has_changes BOOLEAN := FALSE;
BEGIN
  -- Get current user role
  SELECT role INTO v_user_role
  FROM user_roles
  WHERE user_id = auth.uid()
  ORDER BY granted_at DESC
  LIMIT 1;

  -- Get user name
  SELECT COALESCE(
    (SELECT raw_user_meta_data->>'full_name' FROM auth.users WHERE id = auth.uid()),
    (SELECT raw_user_meta_data->>'name' FROM auth.users WHERE id = auth.uid()),
    (SELECT email FROM auth.users WHERE id = auth.uid()),
    'System'
  ) INTO v_user_name;

  -- Check for membership ID change (special handling - separate log entry)
  IF OLD.membership_id IS DISTINCT FROM NEW.membership_id THEN
    INSERT INTO member_audit_log (
      member_id,
      action_type,
      changed_by,
      changed_by_role,
      changed_by_name,
      old_membership_id,
      new_membership_id,
      changed_at
    ) VALUES (
      NEW.id,
      'MEMBERSHIP_ID_CHANGED',
      auth.uid(),
      COALESCE(v_user_role, 'System'),
      v_user_name,
      OLD.membership_id,
      NEW.membership_id,
      NOW()
    );
  END IF;

  -- Track all other field changes (excluding membership_id, first_name, last_name)

  -- Membership class
  IF OLD.member_class IS DISTINCT FROM NEW.member_class THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('member_class', jsonb_build_object('old', OLD.member_class, 'new', NEW.member_class));
    v_field_names := array_append(v_field_names, 'member_class');
    v_has_changes := TRUE;
  END IF;

  -- Membership level
  IF OLD.current_level IS DISTINCT FROM NEW.current_level THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('current_level', jsonb_build_object('old', OLD.current_level, 'new', NEW.current_level));
    v_field_names := array_append(v_field_names, 'current_level');
    v_has_changes := TRUE;
  END IF;

  -- Founding member flag
  IF OLD.is_founding_member IS DISTINCT FROM NEW.is_founding_member THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('is_founding_member', jsonb_build_object('old', OLD.is_founding_member, 'new', NEW.is_founding_member));
    v_field_names := array_append(v_field_names, 'is_founding_member');
    v_has_changes := TRUE;
  END IF;

  -- Personal fields (excluding first_name, last_name)
  -- FIXED: Changed from profile_name to member_profile_name
  IF OLD.member_profile_name IS DISTINCT FROM NEW.member_profile_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('member_profile_name', jsonb_build_object('old', OLD.member_profile_name, 'new', NEW.member_profile_name));
    v_field_names := array_append(v_field_names, 'member_profile_name');
    v_has_changes := TRUE;
  END IF;

  IF OLD.nakshatra IS DISTINCT FROM NEW.nakshatra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('nakshatra', jsonb_build_object('old', OLD.nakshatra, 'new', NEW.nakshatra));
    v_field_names := array_append(v_field_names, 'nakshatra');
    v_has_changes := TRUE;
  END IF;

  IF OLD.family_gotra IS DISTINCT FROM NEW.family_gotra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('family_gotra', jsonb_build_object('old', OLD.family_gotra, 'new', NEW.family_gotra));
    v_field_names := array_append(v_field_names, 'family_gotra');
    v_has_changes := TRUE;
  END IF;

  -- Secondary/spouse fields
  IF OLD.secondary_first_name IS DISTINCT FROM NEW.secondary_first_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_first_name', jsonb_build_object('old', OLD.secondary_first_name, 'new', NEW.secondary_first_name));
    v_field_names := array_append(v_field_names, 'secondary_first_name');
    v_has_changes := TRUE;
  END IF;

  IF OLD.secondary_last_name IS DISTINCT FROM NEW.secondary_last_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_last_name', jsonb_build_object('old', OLD.secondary_last_name, 'new', NEW.secondary_last_name));
    v_field_names := array_append(v_field_names, 'secondary_last_name');
    v_has_changes := TRUE;
  END IF;

  IF OLD.secondary_nakshatra IS DISTINCT FROM NEW.secondary_nakshatra THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_nakshatra', jsonb_build_object('old', OLD.secondary_nakshatra, 'new', NEW.secondary_nakshatra));
    v_field_names := array_append(v_field_names, 'secondary_nakshatra');
    v_has_changes := TRUE;
  END IF;

  IF OLD.secondary_email IS DISTINCT FROM NEW.secondary_email THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_email', jsonb_build_object('old', OLD.secondary_email, 'new', NEW.secondary_email));
    v_field_names := array_append(v_field_names, 'secondary_email');
    v_has_changes := TRUE;
  END IF;

  IF OLD.secondary_phone IS DISTINCT FROM NEW.secondary_phone THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('secondary_phone', jsonb_build_object('old', OLD.secondary_phone, 'new', NEW.secondary_phone));
    v_field_names := array_append(v_field_names, 'secondary_phone');
    v_has_changes := TRUE;
  END IF;

  -- Business fields
  IF OLD.business_name IS DISTINCT FROM NEW.business_name THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('business_name', jsonb_build_object('old', OLD.business_name, 'new', NEW.business_name));
    v_field_names := array_append(v_field_names, 'business_name');
    v_has_changes := TRUE;
  END IF;

  IF OLD.business_ein IS DISTINCT FROM NEW.business_ein THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('business_ein', jsonb_build_object('old', OLD.business_ein, 'new', NEW.business_ein));
    v_field_names := array_append(v_field_names, 'business_ein');
    v_has_changes := TRUE;
  END IF;

  -- Contact fields
  IF OLD.primary_email IS DISTINCT FROM NEW.primary_email THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_email', jsonb_build_object('old', OLD.primary_email, 'new', NEW.primary_email));
    v_field_names := array_append(v_field_names, 'primary_email');
    v_has_changes := TRUE;
  END IF;

  IF OLD.primary_phone IS DISTINCT FROM NEW.primary_phone THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_phone', jsonb_build_object('old', OLD.primary_phone, 'new', NEW.primary_phone));
    v_field_names := array_append(v_field_names, 'primary_phone');
    v_has_changes := TRUE;
  END IF;

  IF OLD.primary_phone_2 IS DISTINCT FROM NEW.primary_phone_2 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('primary_phone_2', jsonb_build_object('old', OLD.primary_phone_2, 'new', NEW.primary_phone_2));
    v_field_names := array_append(v_field_names, 'primary_phone_2');
    v_has_changes := TRUE;
  END IF;

  -- Address fields
  IF OLD.address_line_1 IS DISTINCT FROM NEW.address_line_1 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('address_line_1', jsonb_build_object('old', OLD.address_line_1, 'new', NEW.address_line_1));
    v_field_names := array_append(v_field_names, 'address_line_1');
    v_has_changes := TRUE;
  END IF;

  IF OLD.address_line_2 IS DISTINCT FROM NEW.address_line_2 THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('address_line_2', jsonb_build_object('old', OLD.address_line_2, 'new', NEW.address_line_2));
    v_field_names := array_append(v_field_names, 'address_line_2');
    v_has_changes := TRUE;
  END IF;

  IF OLD.city IS DISTINCT FROM NEW.city THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('city', jsonb_build_object('old', OLD.city, 'new', NEW.city));
    v_field_names := array_append(v_field_names, 'city');
    v_has_changes := TRUE;
  END IF;

  IF OLD.state IS DISTINCT FROM NEW.state THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('state', jsonb_build_object('old', OLD.state, 'new', NEW.state));
    v_field_names := array_append(v_field_names, 'state');
    v_has_changes := TRUE;
  END IF;

  IF OLD.zip IS DISTINCT FROM NEW.zip THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('zip', jsonb_build_object('old', OLD.zip, 'new', NEW.zip));
    v_field_names := array_append(v_field_names, 'zip');
    v_has_changes := TRUE;
  END IF;

  IF OLD.country IS DISTINCT FROM NEW.country THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('country', jsonb_build_object('old', OLD.country, 'new', NEW.country));
    v_field_names := array_append(v_field_names, 'country');
    v_has_changes := TRUE;
  END IF;

  IF OLD.mailing_address IS DISTINCT FROM NEW.mailing_address THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('mailing_address', jsonb_build_object('old', OLD.mailing_address, 'new', NEW.mailing_address));
    v_field_names := array_append(v_field_names, 'mailing_address');
    v_has_changes := TRUE;
  END IF;

  -- Member since
  IF OLD.member_since IS DISTINCT FROM NEW.member_since THEN
    v_changed_fields := v_changed_fields || jsonb_build_object('member_since', jsonb_build_object('old', OLD.member_since, 'new', NEW.member_since));
    v_field_names := array_append(v_field_names, 'member_since');
    v_has_changes := TRUE;
  END IF;

  -- Only create log entry if there are actual field changes
  IF v_has_changes THEN
    INSERT INTO member_audit_log (
      member_id,
      action_type,
      changed_by,
      changed_by_role,
      changed_by_name,
      changed_fields,
      field_names,
      changed_at
    ) VALUES (
      NEW.id,
      'FIELD_UPDATED',
      auth.uid(),
      COALESCE(v_user_role, 'System'),
      v_user_name,
      v_changed_fields,
      v_field_names,
      NOW()
    );
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
