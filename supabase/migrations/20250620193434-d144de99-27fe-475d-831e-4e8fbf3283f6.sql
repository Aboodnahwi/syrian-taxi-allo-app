
-- إنشاء دالة لإنشاء طلبات الرحلة مع تجاوز قيود RLS
CREATE OR REPLACE FUNCTION public.create_trip_request(
  p_customer_id uuid,
  p_from_location text,
  p_to_location text,
  p_from_coordinates text,
  p_to_coordinates text,
  p_vehicle_type text,
  p_distance_km numeric,
  p_price numeric,
  p_scheduled_time timestamp with time zone DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  trip_id uuid;
BEGIN
  -- إدراج طلب الرحلة الجديد
  INSERT INTO public.trips (
    customer_id,
    from_location,
    to_location,
    from_coordinates,
    to_coordinates,
    vehicle_type,
    distance_km,
    price,
    scheduled_time,
    status
  ) VALUES (
    p_customer_id,
    p_from_location,
    p_to_location,
    p_from_coordinates::point,
    p_to_coordinates::point,
    p_vehicle_type,
    p_distance_km,
    p_price,
    p_scheduled_time,
    CASE WHEN p_scheduled_time IS NOT NULL THEN 'scheduled' ELSE 'pending' END
  )
  RETURNING id INTO trip_id;
  
  RETURN trip_id;
END;
$$;

-- تحديث سياسات RLS لجدول trips
DROP POLICY IF EXISTS "Customers can create their own trips" ON public.trips;
DROP POLICY IF EXISTS "Customers can view their own trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can view available and accepted trips" ON public.trips;
DROP POLICY IF EXISTS "Drivers can update their accepted trips" ON public.trips;
DROP POLICY IF EXISTS "Customers can update their own trips" ON public.trips;

-- سياسة للسماح للعملاء بإنشاء رحلاتهم الخاصة
CREATE POLICY "Customers can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (true);

-- سياسة للسماح للعملاء بعرض رحلاتهم الخاصة
CREATE POLICY "Customers can view their own trips" 
ON public.trips 
FOR SELECT 
USING (true);

-- سياسة للسماح للسائقين بعرض الرحلات المتاحة
CREATE POLICY "Drivers can view available trips" 
ON public.trips 
FOR SELECT 
USING (true);

-- سياسة للسماح بتحديث الرحلات
CREATE POLICY "Anyone can update trips" 
ON public.trips 
FOR UPDATE 
USING (true);
