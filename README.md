# ألو تكسي - تطبيق طلب التكسي السوري

## نظرة عامة

**ألو تكسي** هو تطبيق ويب متطور لطلب سيارات الأجرة في سوريا، مصمم خصيصاً للسوق السوري مع دعم كامل للغة العربية والعملة المحلية.

**URL**: https://lovable.dev/projects/23b3f5d7-f38c-469e-a235-afed623fa5cc

## الميزات الرئيسية

### 🚗 للعملاء
- **طلب الرحلات**: طلب سيارة أجرة بسهولة مع تحديد نقطة الانطلاق والوجهة
- **تتبع مباشر**: متابعة موقع السائق في الوقت الفعلي
- **تقدير الأسعار**: حساب تلقائي لتكلفة الرحلة قبل التأكيد
- **جدولة الرحلات**: إمكانية حجز رحلات مستقبلية
- **أنواع المركبات**: اختيار من بين أنواع مختلفة من المركبات
- **نظام التقييم**: تقييم السائقين وترك تعليقات
- **طرق دفع متعددة**: نقداً، بطاقة ائتمان، محفظة إلكترونية
- **الإشعارات**: تحديثات فورية حول حالة الرحلة

### 🚕 للسائقين
- **قبول الطلبات**: استقبال وقبول طلبات الرحلات
- **التنقل**: توجيهات GPS للوصول للعميل والوجهة
- **إدارة الحالة**: تحديث حالة الرحلة (وصل، بدأ، انتهى)
- **تتبع الأرباح**: مراقبة الأرباح اليومية والشهرية
- **نظام التقييم**: تقييم العملاء
- **الوضع المتصل/غير متصل**: التحكم في توفر استقبال الطلبات

### 👨‍💼 للإدارة
- **لوحة تحكم شاملة**: إحصائيات مفصلة عن الرحلات والإيرادات
- **إدارة المستخدمين**: مراقبة السائقين والعملاء
- **التقارير والتحليلات**: رسوم بيانية وتقارير مفصلة
- **خريطة تفاعلية**: عرض جميع الرحلات على الخريطة
- **إعدادات النظام**: تخصيص أسعار وإعدادات التطبيق

## How can I edit this code?

There are several ways of editing your application.

**Use Lovable**

Simply visit the [Lovable Project](https://lovable.dev/projects/23b3f5d7-f38c-469e-a235-afed623fa5cc) and start prompting.

Changes made via Lovable will be committed automatically to this repo.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## التقنيات المستخدمة

### Frontend
- **React 18** - مكتبة واجهة المستخدم
- **TypeScript** - للكتابة الآمنة
- **Vite** - أداة البناء السريعة
- **Tailwind CSS** - إطار عمل CSS
- **shadcn/ui** - مكونات واجهة المستخدم
- **React Router** - للتنقل بين الصفحات
- **React Query** - لإدارة حالة الخادم
- **Leaflet** - للخرائط التفاعلية
- **Recharts** - للرسوم البيانية

### Backend
- **Supabase** - قاعدة البيانات والمصادقة
- **PostgreSQL** - قاعدة البيانات
- **Row Level Security** - أمان البيانات
- **Real-time subscriptions** - التحديثات المباشرة

### الميزات التقنية
- **PWA Ready** - يمكن تثبيته كتطبيق
- **Responsive Design** - متوافق مع جميع الأجهزة
- **RTL Support** - دعم كامل للغة العربية
- **Real-time Updates** - تحديثات فورية
- **Offline Support** - عمل جزئي بدون إنترنت

## How can I deploy this project?

Simply open [Lovable](https://lovable.dev/projects/23b3f5d7-f38c-469e-a235-afed623fa5cc) and click on Share -> Publish.

## Can I connect a custom domain to my Lovable project?

Yes, you can!

To connect a domain, navigate to Project > Settings > Domains and click Connect Domain.

Read more here: [Setting up a custom domain](https://docs.lovable.dev/tips-tricks/custom-domain#step-by-step-guide)

## بنية المشروع

```
src/
├── components/          # مكونات واجهة المستخدم
│   ├── ui/             # مكونات أساسية (shadcn/ui)
│   ├── customer/       # مكونات خاصة بالعملاء
│   ├── driver/         # مكونات خاصة بالسائقين
│   ├── admin/          # مكونات خاصة بالإدارة
│   ├── map/            # مكونات الخريطة
│   ├── rating/         # مكونات التقييم
│   ├── payment/        # مكونات الدفع
│   └── notifications/  # مكونات الإشعارات
├── pages/              # صفحات التطبيق
├── hooks/              # React Hooks مخصصة
├── services/           # خدمات API
├── contexts/           # React Contexts
├── types/              # تعريفات TypeScript
├── utils/              # دوال مساعدة
└── integrations/       # تكاملات خارجية (Supabase)
```

## قاعدة البيانات

### الجداول الرئيسية
- **profiles** - معلومات المستخدمين (عملاء، سائقين، إدارة)
- **trips** - بيانات الرحلات
- **ratings** - تقييمات المستخدمين
- **payment_transactions** - معاملات الدفع
- **notifications** - الإشعارات
- **app_settings** - إعدادات التطبيق

### الدوال المخصصة
- **generate_otp** - توليد رمز التحقق
- **verify_otp** - التحقق من رمز OTP
- **calculate_distance** - حساب المسافة بين نقطتين
- **get_trip_stats_by_period** - إحصائيات الرحلات حسب الفترة

## الأمان

- **Row Level Security (RLS)** - حماية البيانات على مستوى الصفوف
- **JWT Authentication** - مصادقة آمنة
- **API Rate Limiting** - تحديد معدل الطلبات
- **Data Encryption** - تشفير البيانات الحساسة
- **Input Validation** - التحقق من صحة المدخلات

## المساهمة

1. Fork المشروع
2. إنشاء فرع للميزة الجديدة (`git checkout -b feature/AmazingFeature`)
3. Commit التغييرات (`git commit -m 'Add some AmazingFeature'`)
4. Push للفرع (`git push origin feature/AmazingFeature`)
5. فتح Pull Request

## الترخيص

هذا المشروع مرخص تحت رخصة MIT - راجع ملف [LICENSE](LICENSE) للتفاصيل.

## الدعم

للحصول على الدعم، يرجى التواصل عبر:
- البريد الإلكتروني: support@allotaxi.sy
- الهاتف: +963-XXX-XXXXXX

## الإصدارات القادمة

- [ ] تطبيق موبايل (React Native)
- [ ] دفع إلكتروني متقدم
- [ ] ذكاء اصطناعي لتحسين المسارات
- [ ] نظام ولاء العملاء
- [ ] تكامل مع خدمات التوصيل
