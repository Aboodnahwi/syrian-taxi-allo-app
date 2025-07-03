-- حذف الـ constraint الذي يسبب مشكلة
ALTER TABLE trips DROP CONSTRAINT IF EXISTS trips_status_check;

-- إضافة constraint جديد مع القيم الصحيحة
ALTER TABLE trips ADD CONSTRAINT trips_status_check 
CHECK (status IN ('pending', 'accepted', 'arrived', 'started', 'completed', 'cancelled', 'scheduled'));