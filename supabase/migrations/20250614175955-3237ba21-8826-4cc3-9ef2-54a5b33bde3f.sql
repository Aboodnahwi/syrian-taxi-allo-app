
-- تحديث سياسات RLS لجدول profiles للسماح بالتسجيل
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;

-- إنشاء سياسات جديدة تسمح بالتسجيل
CREATE POLICY "Allow profile creation during signup" ON public.profiles
FOR INSERT 
WITH CHECK (true);

CREATE POLICY "Users can view own profile" ON public.profiles
FOR SELECT 
USING (auth.uid() = id OR auth.uid() IS NULL);

CREATE POLICY "Users can update own profile" ON public.profiles
FOR UPDATE 
USING (auth.uid() = id);

-- تمكين RLS إذا لم يكن مفعلاً
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- إنشاء trigger لإنشاء ملف شخصي تلقائياً عند تسجيل مستخدم جديد
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, name, phone, role, governorate)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'name', 'مستخدم جديد'),
    COALESCE(NEW.raw_user_meta_data->>'phone', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'customer'),
    COALESCE(NEW.raw_user_meta_data->>'governorate', 'دمشق')
  );
  RETURN NEW;
END;
$$;

-- ربط الـ trigger بجدول المستخدمين في auth
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- تحديث دالة verify_otp لتعمل مع Supabase Auth
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
      p_phone || '@temp.com', -- إيميل مؤقت
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
