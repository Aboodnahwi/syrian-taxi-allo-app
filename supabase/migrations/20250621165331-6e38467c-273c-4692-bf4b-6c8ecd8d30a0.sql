
-- جدول لإدارة تسعير السيارات
CREATE TABLE public.vehicle_pricing (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  vehicle_type TEXT NOT NULL UNIQUE,
  base_price NUMERIC NOT NULL DEFAULT 1000,
  price_per_km NUMERIC NOT NULL DEFAULT 100,
  minimum_fare NUMERIC NOT NULL DEFAULT 500,
  surge_multiplier NUMERIC NOT NULL DEFAULT 1.0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لطلبات السائقين الجدد
CREATE TABLE public.driver_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT,
  license_number TEXT NOT NULL,
  vehicle_type TEXT NOT NULL,
  vehicle_model TEXT,
  vehicle_color TEXT,
  license_plate TEXT NOT NULL,
  id_document_url TEXT,
  license_document_url TEXT,
  vehicle_registration_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  rejection_reason TEXT,
  reviewed_by UUID REFERENCES auth.users(id),
  reviewed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- جدول لعوامل التسعير المختلفة
CREATE TABLE public.pricing_factors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  factor_name TEXT NOT NULL UNIQUE,
  factor_type TEXT NOT NULL CHECK (factor_type IN ('multiplier', 'addition', 'percentage')),
  factor_value NUMERIC NOT NULL,
  is_active BOOLEAN NOT NULL DEFAULT true,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- إدراج بيانات افتراضية للتسعير
INSERT INTO public.vehicle_pricing (vehicle_type, base_price, price_per_km, minimum_fare) VALUES
('regular', 1000, 100, 500),
('ac', 1500, 150, 750),
('public', 500, 75, 300),
('vip', 3000, 300, 1500),
('microbus', 800, 120, 600),
('bike', 700, 80, 400);

-- إدراج عوامل التسعير الافتراضية
INSERT INTO public.pricing_factors (factor_name, factor_type, factor_value, description) VALUES
('peak_hours', 'multiplier', 1.5, 'زيادة وقت الذروة'),
('night_time', 'multiplier', 1.3, 'زيادة الوقت الليلي'),
('weekend', 'multiplier', 1.2, 'زيادة نهاية الأسبوع'),
('holiday', 'multiplier', 2.0, 'زيادة العطل الرسمية'),
('distance_bonus', 'addition', 500, 'مكافأة المسافات الطويلة');

-- تمكين RLS للجداول الجديدة
ALTER TABLE public.vehicle_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.driver_applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pricing_factors ENABLE ROW LEVEL SECURITY;

-- سياسات الأمان - الإدارة فقط
CREATE POLICY "Admins can manage vehicle pricing" ON public.vehicle_pricing
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage driver applications" ON public.driver_applications
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
    OR user_id = auth.uid()
  );

CREATE POLICY "Admins can manage pricing factors" ON public.pricing_factors
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- دالة لحساب السعر مع العوامل المختلفة
CREATE OR REPLACE FUNCTION public.calculate_dynamic_price(
  p_vehicle_type TEXT,
  p_distance_km NUMERIC,
  p_is_peak_hour BOOLEAN DEFAULT false,
  p_is_night_time BOOLEAN DEFAULT false,
  p_is_weekend BOOLEAN DEFAULT false,
  p_is_holiday BOOLEAN DEFAULT false
) RETURNS NUMERIC
LANGUAGE plpgsql
AS $$
DECLARE
  base_calculation NUMERIC;
  final_price NUMERIC;
  pricing_record RECORD;
BEGIN
  -- الحصول على التسعير الأساسي
  SELECT * INTO pricing_record
  FROM public.vehicle_pricing
  WHERE vehicle_type = p_vehicle_type AND is_active = true;
  
  IF NOT FOUND THEN
    RETURN 1000; -- سعر افتراضي
  END IF;
  
  -- حساب السعر الأساسي
  base_calculation := pricing_record.base_price + (p_distance_km * pricing_record.price_per_km);
  base_calculation := GREATEST(base_calculation, pricing_record.minimum_fare);
  
  final_price := base_calculation;
  
  -- تطبيق عوامل التسعير
  IF p_is_peak_hour THEN
    final_price := final_price * (SELECT factor_value FROM public.pricing_factors 
                                  WHERE factor_name = 'peak_hours' AND is_active = true);
  END IF;
  
  IF p_is_night_time THEN
    final_price := final_price * (SELECT factor_value FROM public.pricing_factors 
                                  WHERE factor_name = 'night_time' AND is_active = true);
  END IF;
  
  IF p_is_weekend THEN
    final_price := final_price * (SELECT factor_value FROM public.pricing_factors 
                                  WHERE factor_name = 'weekend' AND is_active = true);
  END IF;
  
  IF p_is_holiday THEN
    final_price := final_price * (SELECT factor_value FROM public.pricing_factors 
                                  WHERE factor_name = 'holiday' AND is_active = true);
  END IF;
  
  -- إضافة مكافأة المسافات الطويلة
  IF p_distance_km > 10 THEN
    final_price := final_price + (SELECT factor_value FROM public.pricing_factors 
                                  WHERE factor_name = 'distance_bonus' AND is_active = true);
  END IF;
  
  RETURN ROUND(final_price);
END;
$$;
