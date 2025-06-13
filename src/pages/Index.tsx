
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Car, Users, Shield, MapPin } from 'lucide-react';

const Index = () => {
  const navigate = useNavigate();
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 relative overflow-hidden">
      {/* خلفية متحركة */}
      <div className="absolute inset-0 bg-gradient-to-r from-taxi-500/10 to-emerald-500/10 animate-pulse-slow"></div>
      
      {/* عناصر زخرفية متحركة */}
      <div className="absolute top-20 left-20 w-32 h-32 bg-taxi-400/20 rounded-full blur-xl animate-bounce-in"></div>
      <div className="absolute bottom-20 right-20 w-48 h-48 bg-emerald-400/20 rounded-full blur-xl animate-float"></div>
      <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-violet-400/10 rounded-full blur-2xl"></div>

      <div className="relative z-10 container mx-auto px-4 py-16 text-center">
        {/* الشعار والعنوان */}
        <div className={`mb-12 transition-all duration-1000 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="flex justify-center items-center mb-8">
            <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-6 rounded-3xl shadow-2xl transform hover:scale-110 transition-all duration-300">
              <Car className="w-16 h-16 text-white" />
            </div>
          </div>
          
          <h1 className="text-7xl font-bold text-white mb-6 font-cairo">
            <span className="gradient-text bg-gradient-to-r from-taxi-400 via-emerald-400 to-violet-400 bg-clip-text text-transparent">
              ألو تكسي
            </span>
          </h1>
          
          <p className="text-2xl text-slate-300 mb-8 font-tajawal max-w-2xl mx-auto leading-relaxed">
            خدمة طلب سيارات الأجرة والتوصيل الأكثر تطوراً في سوريا
          </p>
          
          <div className="text-lg text-slate-400 mb-12 font-tajawal">
            ✨ سهل • سريع • آمن • موثوق ✨
          </div>
        </div>

        {/* أزرار الدخول */}
        <div className={`grid md:grid-cols-3 gap-8 mb-16 transition-all duration-1000 delay-300 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group">
            <div className="bg-gradient-to-r from-taxi-500 to-taxi-600 p-4 rounded-2xl mb-6 mx-auto w-fit group-hover:shadow-lg group-hover:shadow-taxi-500/50 transition-all duration-300">
              <Users className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-cairo">للزبائن</h3>
            <p className="text-slate-300 mb-6 font-tajawal leading-relaxed">
              احجز رحلتك بسهولة وراحة مع خدمة التوصيل المتطورة
            </p>
            <Button 
              onClick={() => navigate('/auth?type=customer')}
              className="w-full btn-taxi text-lg py-4"
            >
              دخول الزبائن
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group">
            <div className="bg-gradient-to-r from-emerald-500 to-emerald-600 p-4 rounded-2xl mb-6 mx-auto w-fit group-hover:shadow-lg group-hover:shadow-emerald-500/50 transition-all duration-300">
              <Car className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-cairo">للسائقين</h3>
            <p className="text-slate-300 mb-6 font-tajawal leading-relaxed">
              انضم لفريق السائقين واربح مع كل رحلة تقوم بها
            </p>
            <Button 
              onClick={() => navigate('/auth?type=driver')}
              className="w-full bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              دخول السائقين
            </Button>
          </div>

          <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 hover:bg-white/20 transition-all duration-300 transform hover:scale-105 group">
            <div className="bg-gradient-to-r from-violet-500 to-violet-600 p-4 rounded-2xl mb-6 mx-auto w-fit group-hover:shadow-lg group-hover:shadow-violet-500/50 transition-all duration-300">
              <Shield className="w-12 h-12 text-white" />
            </div>
            <h3 className="text-2xl font-bold text-white mb-4 font-cairo">الإدارة</h3>
            <p className="text-slate-300 mb-6 font-tajawal leading-relaxed">
              لوحة التحكم الشاملة لإدارة النظام والمحاسبة
            </p>
            <Button 
              onClick={() => navigate('/auth?type=admin')}
              className="w-full bg-gradient-to-r from-violet-500 to-violet-600 hover:from-violet-600 hover:to-violet-700 text-white font-semibold py-4 px-6 rounded-xl transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl text-lg"
            >
              دخول الإدارة
            </Button>
          </div>
        </div>

        {/* ميزات النظام */}
        <div className={`grid md:grid-cols-4 gap-6 transition-all duration-1000 delay-500 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <div className="text-center">
            <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-3 rounded-xl w-fit mx-auto mb-3">
              <MapPin className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2 font-cairo">خرائط تفاعلية</h4>
            <p className="text-slate-400 text-sm font-tajawal">تتبع الرحلة بدقة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-emerald-500 to-violet-500 p-3 rounded-xl w-fit mx-auto mb-3">
              <Shield className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2 font-cairo">أمان عالي</h4>
            <p className="text-slate-400 text-sm font-tajawal">تحقق بالهاتف</p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-violet-500 to-taxi-500 p-3 rounded-xl w-fit mx-auto mb-3">
              <Users className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2 font-cairo">سهولة الاستخدام</h4>
            <p className="text-slate-400 text-sm font-tajawal">واجهة بسيطة</p>
          </div>
          
          <div className="text-center">
            <div className="bg-gradient-to-r from-taxi-500 to-violet-500 p-3 rounded-xl w-fit mx-auto mb-3">
              <Car className="w-8 h-8 text-white" />
            </div>
            <h4 className="text-white font-semibold mb-2 font-cairo">خدمة سريعة</h4>
            <p className="text-slate-400 text-sm font-tajawal">استجابة فورية</p>
          </div>
        </div>

        {/* معلومات إضافية */}
        <div className={`mt-16 text-center transition-all duration-1000 delay-700 ${isVisible ? 'animate-fade-in' : 'opacity-0'}`}>
          <p className="text-slate-400 font-tajawal">
            🇸🇾 خدمة سورية 100% • دعم العملة السورية • واجهة باللغة العربية
          </p>
        </div>
      </div>
    </div>
  );
};

export default Index;
