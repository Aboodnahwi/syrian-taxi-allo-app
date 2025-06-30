
-- تفعيل Row Level Security على جدول drivers
ALTER TABLE public.drivers ENABLE ROW LEVEL SECURITY;

-- سياسة للسماح للسائقين بإنشاء ملفهم الشخصي
CREATE POLICY "Users can create their own driver profile" 
  ON public.drivers 
  FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

-- سياسة للسماح للسائقين بقراءة ملفهم الشخصي
CREATE POLICY "Users can view their own driver profile" 
  ON public.drivers 
  FOR SELECT 
  USING (auth.uid() = user_id);

-- سياسة للسماح للسائقين بتحديث ملفهم الشخصي
CREATE POLICY "Users can update their own driver profile" 
  ON public.drivers 
  FOR UPDATE 
  USING (auth.uid() = user_id);

-- سياسة للسماح لجميع المستخدمين المصدقين بقراءة معلومات السائقين (للزبائن)
CREATE POLICY "Authenticated users can view driver profiles" 
  ON public.drivers 
  FOR SELECT 
  TO authenticated 
  USING (true);
