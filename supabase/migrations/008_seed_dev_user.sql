-- =============================================
-- 008: Seed Dev User for Local Testing
-- Creates a test user for development mode
-- =============================================

-- Fixed UUID for dev user (same as in mobile app)
-- Using a deterministic UUID so it's consistent across environments

DO $$
DECLARE
  dev_user_id UUID := '00000000-0000-0000-0000-000000000001';
BEGIN
  -- Check if dev user already exists in auth.users
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE id = dev_user_id) THEN
    -- Insert dev user into auth.users
    INSERT INTO auth.users (
      id,
      instance_id,
      aud,
      role,
      email,
      phone,
      encrypted_password,
      email_confirmed_at,
      phone_confirmed_at,
      created_at,
      updated_at,
      raw_app_meta_data,
      raw_user_meta_data
    ) VALUES (
      dev_user_id,
      '00000000-0000-0000-0000-000000000000',
      'authenticated',
      'authenticated',
      'dev@ceezaa.local',
      '+15555550100',
      '', -- No password for dev user
      NOW(),
      NOW(),
      NOW(),
      NOW(),
      '{"provider": "phone", "providers": ["phone"]}',
      '{"dev_mode": true}'
    );

    RAISE NOTICE 'Dev user created in auth.users';
  ELSE
    RAISE NOTICE 'Dev user already exists in auth.users';
  END IF;

  -- Check if profile exists
  IF NOT EXISTS (SELECT 1 FROM profiles WHERE id = dev_user_id) THEN
    INSERT INTO profiles (id, phone, display_name)
    VALUES (dev_user_id, '+15555550100', 'Dev User');

    RAISE NOTICE 'Dev user profile created';
  ELSE
    RAISE NOTICE 'Dev user profile already exists';
  END IF;
END $$;
