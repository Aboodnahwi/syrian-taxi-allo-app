# دليل النشر - ألو تكسي

## متطلبات النشر

### البيئة المطلوبة
- Node.js 18+ 
- npm أو yarn
- حساب Supabase
- خادم ويب (Nginx/Apache) أو منصة استضافة (Vercel/Netlify)

## خطوات النشر

### 1. إعداد قاعدة البيانات

#### إنشاء مشروع Supabase جديد
1. اذهب إلى [supabase.com](https://supabase.com)
2. أنشئ حساب جديد أو سجل دخول
3. أنشئ مشروع جديد
4. احفظ URL المشروع و API Key

#### تشغيل المهاجرات
```bash
# تثبيت Supabase CLI
npm install -g @supabase/cli

# تسجيل الدخول
supabase login

# ربط المشروع
supabase link --project-ref YOUR_PROJECT_ID

# تشغيل المهاجرات
supabase db push
```

### 2. إعداد متغيرات البيئة

أنشئ ملف `.env.local`:
```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. بناء التطبيق

```bash
# تثبيت التبعيات
npm install

# بناء التطبيق للإنتاج
npm run build

# معاينة البناء (اختياري)
npm run preview
```

### 4. النشر على Vercel

```bash
# تثبيت Vercel CLI
npm install -g vercel

# نشر التطبيق
vercel --prod
```

### 5. النشر على Netlify

```bash
# تثبيت Netlify CLI
npm install -g netlify-cli

# نشر التطبيق
netlify deploy --prod --dir=dist
```

### 6. النشر على خادم مخصص

```bash
# نسخ ملفات البناء إلى الخادم
scp -r dist/* user@server:/var/www/allotaxi/

# إعداد Nginx
sudo nano /etc/nginx/sites-available/allotaxi
```

#### إعداد Nginx
```nginx
server {
    listen 80;
    server_name allotaxi.sy www.allotaxi.sy;
    root /var/www/allotaxi;
    index index.html;

    # دعم SPA
    location / {
        try_files $uri $uri/ /index.html;
    }

    # ضغط الملفات
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    # Cache static files
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

## إعدادات الإنتاج

### 1. أمان قاعدة البيانات
- تفعيل Row Level Security على جميع الجداول
- مراجعة صلاحيات المستخدمين
- تشفير البيانات الحساسة

### 2. مراقبة الأداء
- إعداد Google Analytics
- مراقبة أخطاء JavaScript
- تتبع أداء API

### 3. النسخ الاحتياطي
- نسخ احتياطي يومي لقاعدة البيانات
- نسخ احتياطي للملفات الثابتة
- خطة استرداد الكوارث

### 4. SSL/HTTPS
```bash
# تثبيت Let's Encrypt
sudo apt install certbot python3-certbot-nginx

# الحصول على شهادة SSL
sudo certbot --nginx -d allotaxi.sy -d www.allotaxi.sy
```

## اختبار ما بعد النشر

### 1. اختبارات وظيفية
- [ ] تسجيل دخول/إنشاء حساب
- [ ] طلب رحلة (عميل)
- [ ] قبول رحلة (سائق)
- [ ] إكمال رحلة
- [ ] نظام التقييم
- [ ] نظام الدفع
- [ ] لوحة الإدارة

### 2. اختبارات الأداء
- [ ] سرعة تحميل الصفحات
- [ ] استجابة API
- [ ] تحميل الخرائط
- [ ] التحديثات المباشرة

### 3. اختبارات الأمان
- [ ] حماية البيانات الشخصية
- [ ] صلاحيات المستخدمين
- [ ] حماية من هجمات XSS/CSRF
- [ ] تشفير الاتصالات

## مراقبة النظام

### 1. مقاييس الأداء
- عدد المستخدمين النشطين
- عدد الرحلات اليومية
- متوسط وقت الاستجابة
- معدل الأخطاء

### 2. تنبيهات
- انقطاع الخدمة
- ارتفاع معدل الأخطاء
- استهلاك الموارد
- مشاكل قاعدة البيانات

### 3. سجلات النظام
```bash
# مراقبة سجلات Nginx
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# مراقبة سجلات التطبيق
pm2 logs allotaxi
```

## الصيانة

### 1. تحديثات دورية
- تحديث التبعيات الأمنية
- تحديث إصدارات المكتبات
- تحديث نظام التشغيل

### 2. تنظيف قاعدة البيانات
```sql
-- حذف الإشعارات القديمة (أكثر من 30 يوم)
DELETE FROM notifications 
WHERE created_at < NOW() - INTERVAL '30 days';

-- حذف OTP المنتهية الصلاحية
SELECT cleanup_expired_otps();
```

### 3. النسخ الاحتياطي
```bash
# نسخ احتياطي يومي
pg_dump -h db.supabase.co -U postgres -d your_db > backup_$(date +%Y%m%d).sql

# رفع النسخة الاحتياطية للتخزين السحابي
aws s3 cp backup_$(date +%Y%m%d).sql s3://allotaxi-backups/
```

## استكشاف الأخطاء

### مشاكل شائعة

#### 1. مشكلة في تحميل الخرائط
```javascript
// التحقق من مفاتيح API
console.log('Map API Key:', process.env.VITE_MAP_API_KEY);
```

#### 2. مشاكل الاتصال بقاعدة البيانات
```javascript
// اختبار الاتصال
import { supabase } from './supabase/client';
const { data, error } = await supabase.from('profiles').select('count');
```

#### 3. مشاكل المصادقة
```javascript
// التحقق من حالة المصادقة
const { data: { session } } = await supabase.auth.getSession();
console.log('Session:', session);
```

## الدعم الفني

للحصول على المساعدة:
- البريد الإلكتروني: tech@allotaxi.sy
- الهاتف: +963-XXX-XXXXXX
- التوثيق: [docs.allotaxi.sy](https://docs.allotaxi.sy)
