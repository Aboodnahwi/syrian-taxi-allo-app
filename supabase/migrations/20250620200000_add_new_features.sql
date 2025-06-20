-- إضافة جداول الميزات الجديدة

-- جدول التقييمات
CREATE TABLE IF NOT EXISTS public.ratings (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    rater_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rated_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(trip_id, rater_id)
);

-- جدول معاملات الدفع
CREATE TABLE IF NOT EXISTS public.payment_transactions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    trip_id UUID NOT NULL REFERENCES public.trips(id) ON DELETE CASCADE,
    amount DECIMAL(10,2) NOT NULL,
    method VARCHAR(20) NOT NULL CHECK (method IN ('cash', 'card', 'wallet')),
    status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'failed', 'refunded')),
    transaction_reference VARCHAR(255),
    refund_reason TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    refunded_at TIMESTAMP WITH TIME ZONE
);

-- إضافة أعمدة جديدة لجدول المستخدمين
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS average_rating DECIMAL(3,2) DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_ratings INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS notification_preferences JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS avatar_url TEXT;

-- فهارس لتحسين الأداء
CREATE INDEX IF NOT EXISTS idx_ratings_rated_id ON public.ratings(rated_id);
CREATE INDEX IF NOT EXISTS idx_ratings_trip_id ON public.ratings(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_trip_id ON public.payment_transactions(trip_id);
CREATE INDEX IF NOT EXISTS idx_payment_transactions_status ON public.payment_transactions(status);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_is_active ON public.profiles(is_active);

-- سياسات الأمان للتقييمات
ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view ratings for their trips" 
ON public.ratings FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.trips 
        WHERE trips.id = ratings.trip_id 
        AND (trips.customer_id = auth.uid() OR trips.driver_id = auth.uid())
    )
);

CREATE POLICY "Users can create ratings for their completed trips" 
ON public.ratings FOR INSERT 
WITH CHECK (
    auth.uid() = rater_id AND
    EXISTS (
        SELECT 1 FROM public.trips 
        WHERE trips.id = trip_id 
        AND trips.status = 'completed'
        AND (
            (trips.customer_id = auth.uid() AND rated_id = trips.driver_id) OR
            (trips.driver_id = auth.uid() AND rated_id = trips.customer_id)
        )
    )
);

CREATE POLICY "Users can update their own ratings" 
ON public.ratings FOR UPDATE 
USING (auth.uid() = rater_id);

-- سياسات الأمان لمعاملات الدفع
ALTER TABLE public.payment_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view payment transactions for their trips" 
ON public.payment_transactions FOR SELECT 
USING (
    EXISTS (
        SELECT 1 FROM public.trips 
        WHERE trips.id = payment_transactions.trip_id 
        AND (trips.customer_id = auth.uid() OR trips.driver_id = auth.uid())
    )
);

CREATE POLICY "System can manage payment transactions" 
ON public.payment_transactions FOR ALL 
USING (true);

-- دالة لحساب المسافة بين نقطتين
CREATE OR REPLACE FUNCTION public.calculate_distance(lat1 FLOAT, lon1 FLOAT, lat2 FLOAT, lon2 FLOAT)
RETURNS FLOAT AS $$
DECLARE
    R FLOAT := 6371; -- نصف قطر الأرض بالكيلومتر
    dLat FLOAT;
    dLon FLOAT;
    a FLOAT;
    c FLOAT;
BEGIN
    dLat := radians(lat2 - lat1);
    dLon := radians(lon2 - lon1);
    a := sin(dLat/2) * sin(dLat/2) + cos(radians(lat1)) * cos(radians(lat2)) * sin(dLon/2) * sin(dLon/2);
    c := 2 * atan2(sqrt(a), sqrt(1-a));
    RETURN R * c;
END;
$$ LANGUAGE plpgsql;

-- دالة للحصول على إحصائيات الرحلات حسب الفترة
CREATE OR REPLACE FUNCTION public.get_trip_stats_by_period(
    period_type TEXT DEFAULT 'daily',
    days_back INTEGER DEFAULT 30
)
RETURNS TABLE(
    date TEXT,
    count BIGINT,
    revenue DECIMAL
) AS $$
BEGIN
    IF period_type = 'daily' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('day', trips.created_at), 'YYYY-MM-DD') as date,
            COUNT(*) as count,
            COALESCE(SUM(trips.price), 0) as revenue
        FROM public.trips
        WHERE trips.created_at >= NOW() - INTERVAL '1 day' * days_back
        GROUP BY DATE_TRUNC('day', trips.created_at)
        ORDER BY DATE_TRUNC('day', trips.created_at);
    ELSIF period_type = 'weekly' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('week', trips.created_at), 'YYYY-"W"WW') as date,
            COUNT(*) as count,
            COALESCE(SUM(trips.price), 0) as revenue
        FROM public.trips
        WHERE trips.created_at >= NOW() - INTERVAL '1 week' * (days_back / 7)
        GROUP BY DATE_TRUNC('week', trips.created_at)
        ORDER BY DATE_TRUNC('week', trips.created_at);
    ELSIF period_type = 'monthly' THEN
        RETURN QUERY
        SELECT 
            TO_CHAR(DATE_TRUNC('month', trips.created_at), 'YYYY-MM') as date,
            COUNT(*) as count,
            COALESCE(SUM(trips.price), 0) as revenue
        FROM public.trips
        WHERE trips.created_at >= NOW() - INTERVAL '1 month' * (days_back / 30)
        GROUP BY DATE_TRUNC('month', trips.created_at)
        ORDER BY DATE_TRUNC('month', trips.created_at);
    END IF;
END;
$$ LANGUAGE plpgsql;

-- دالة لتحديث متوسط التقييم للمستخدم
CREATE OR REPLACE FUNCTION public.update_user_rating_average()
RETURNS TRIGGER AS $$
BEGIN
    -- تحديث متوسط التقييم للمستخدم المُقيَّم
    UPDATE public.profiles 
    SET 
        average_rating = (
            SELECT ROUND(AVG(rating)::numeric, 2) 
            FROM public.ratings 
            WHERE rated_id = COALESCE(NEW.rated_id, OLD.rated_id)
        ),
        total_ratings = (
            SELECT COUNT(*) 
            FROM public.ratings 
            WHERE rated_id = COALESCE(NEW.rated_id, OLD.rated_id)
        )
    WHERE id = COALESCE(NEW.rated_id, OLD.rated_id);
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- إنشاء المشغلات
DROP TRIGGER IF EXISTS trigger_update_rating_average ON public.ratings;
CREATE TRIGGER trigger_update_rating_average
    AFTER INSERT OR UPDATE OR DELETE ON public.ratings
    FOR EACH ROW
    EXECUTE FUNCTION public.update_user_rating_average();

-- إضافة بيانات تجريبية لطرق الدفع
INSERT INTO public.app_settings (setting_key, setting_value, description) 
VALUES (
    'payment_methods',
    '[
        {"id": "cash", "type": "cash", "name": "نقداً", "icon": "💵", "enabled": true},
        {"id": "card", "type": "card", "name": "بطاقة ائتمان", "icon": "💳", "enabled": false},
        {"id": "wallet", "type": "wallet", "name": "محفظة إلكترونية", "icon": "📱", "enabled": false}
    ]',
    'طرق الدفع المتاحة في التطبيق'
) ON CONFLICT (setting_key) DO UPDATE SET 
    setting_value = EXCLUDED.setting_value,
    updated_at = NOW();

-- إضافة إعدادات التطبيق الأخرى
INSERT INTO public.app_settings (setting_key, setting_value, description) VALUES
('app_name', 'ألو تكسي', 'اسم التطبيق'),
('app_version', '1.0.0', 'إصدار التطبيق'),
('support_phone', '+963-XXX-XXXXXX', 'رقم هاتف الدعم الفني'),
('support_email', 'support@allotaxi.sy', 'بريد الدعم الفني'),
('base_fare', '500', 'التعرفة الأساسية بالليرة السورية'),
('per_km_rate', '100', 'سعر الكيلومتر الواحد'),
('waiting_time_rate', '50', 'سعر دقيقة الانتظار'),
('cancellation_fee', '200', 'رسوم الإلغاء'),
('max_search_radius', '10', 'أقصى نطاق بحث للسائقين بالكيلومتر')
ON CONFLICT (setting_key) DO NOTHING;
