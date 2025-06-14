
-- تحديث دالة التحقق وإنشاء المستخدم لتجنب خطأ التكرار بالبريد الإلكتروني
CREATE OR REPLACE FUNCTION public.verify_otp_and_create_user(
  p_phone text, 
  p_code text, 
  p_user_data jsonb DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  otp_record RECORD;
  user_id uuid;
  result jsonb;
  existing_user RECORD;
  temp_email text := p_phone || '@temp.com';
BEGIN
  -- التحقق من رمز OTP
  SELECT * INTO otp_record
  FROM public.otp_codes
  WHERE phone = p_phone 
    AND code = p_code 
    AND expires_at > now()
    AND is_used = false
    AND attempts < 3;
  
  IF NOT FOUND THEN
    -- زيادة عدد المحاولات الخاطئة
    UPDATE public.otp_codes 
    SET attempts = attempts + 1
    WHERE phone = p_phone AND code = p_code;
    
    RETURN jsonb_build_object('success', false, 'error', 'رمز التحقق خاطئ أو منتهي الصلاحية');
  END IF;
  
  -- تحديد الرمز كمستخدم
  UPDATE public.otp_codes 
  SET is_used = true
  WHERE id = otp_record.id;
  
  -- إذا كانت هناك بيانات مستخدم (تسجيل جديد)
  IF p_user_data IS NOT NULL THEN
    -- تحقق هل البريد موجود مسبقًا
    SELECT * INTO existing_user FROM auth.users WHERE email = temp_email;
    IF FOUND THEN
      RETURN jsonb_build_object('success', false, 'error', 'هذا الرقم مستخدم مسبقًا. يرجى تسجيل الدخول.');
    END IF;

    -- إنشاء مستخدم جديد في auth.users
    INSERT INTO auth.users (
      id,
      email,
      phone,
      raw_user_meta_data,
      email_confirmed_at,
      phone_confirmed_at
    ) VALUES (
      gen_random_uuid(),
      temp_email,
      p_phone,
      p_user_data,
      now(),
      now()
    ) RETURNING id INTO user_id;
    
    result := jsonb_build_object(
      'success', true, 
      'user_id', user_id,
      'is_new_user', true
    );
  ELSE
    -- تسجيل دخول لمستخدم موجود
    SELECT p.id INTO user_id
    FROM public.profiles p
    WHERE p.phone = p_phone;
    
    IF user_id IS NULL THEN
      RETURN jsonb_build_object('success', false, 'error', 'المستخدم غير موجود');
    END IF;
    
    result := jsonb_build_object(
      'success', true, 
      'user_id', user_id,
      'is_new_user', false
    );
  END IF;
  
  RETURN result;
END;
$$;
