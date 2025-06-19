
-- إضافة سياسات Row Level Security لجدول trips
ALTER TABLE public.trips ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للعملاء بإنشاء رحلاتهم الخاصة
CREATE POLICY "Customers can create their own trips" 
ON public.trips 
FOR INSERT 
WITH CHECK (auth.uid() = customer_id);

-- سياسة للسماح للعملاء بعرض رحلاتهم الخاصة
CREATE POLICY "Customers can view their own trips" 
ON public.trips 
FOR SELECT 
USING (auth.uid() = customer_id);

-- سياسة للسماح للسائقين بعرض الرحلات المتاحة والمقبولة منهم
CREATE POLICY "Drivers can view available and accepted trips" 
ON public.trips 
FOR SELECT 
USING (
  status IN ('pending', 'scheduled') OR 
  (driver_id IS NOT NULL AND auth.uid() = driver_id)
);

-- سياسة للسماح للسائقين بتحديث الرحلات المقبولة منهم
CREATE POLICY "Drivers can update their accepted trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = driver_id);

-- سياسة للسماح للعملاء بتحديث رحلاتهم (للإلغاء مثلاً)
CREATE POLICY "Customers can update their own trips" 
ON public.trips 
FOR UPDATE 
USING (auth.uid() = customer_id);

-- إنشاء فهرس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_trips_customer_id ON public.trips(customer_id);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_scheduled_time ON public.trips(scheduled_time);
