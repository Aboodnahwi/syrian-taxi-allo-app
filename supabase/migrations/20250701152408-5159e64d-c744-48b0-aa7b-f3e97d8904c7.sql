
-- إضافة العمود المفقود arrived_at إلى جدول trips
ALTER TABLE public.trips ADD COLUMN IF NOT EXISTS arrived_at timestamp with time zone;

-- تحديث الفهرس للبحث السريع
CREATE INDEX IF NOT EXISTS idx_trips_status ON public.trips(status);
CREATE INDEX IF NOT EXISTS idx_trips_driver_id ON public.trips(driver_id);
