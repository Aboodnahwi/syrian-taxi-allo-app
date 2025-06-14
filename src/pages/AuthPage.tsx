
import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowLeft, Car, Users, Shield, Phone, User } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

const AuthPage = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { signUp, signIn, verifyOtp } = useAuth();
  const userType = searchParams.get('type') || 'customer';
  
  const [isLogin, setIsLogin] = useState(true);
  const [verificationMode, setVerificationMode] = useState(false);
  const [verificationCode, setVerificationCode] = useState('');
  const [currentPhone, setCurrentPhone] = useState('');
  
  // بيانات التسجيل
  const [registerData, setRegisterData] = useState({
    name: '',
    phone: '',
    role: userType,
    governorate: ''
  });
  
  // بيانات تسجيل الدخول
  const [loginPhone, setLoginPhone] = useState('');

  const governorates = [
    'دمشق', 'ريف دمشق', 'حلب', 'حمص', 'حماة', 'اللاذقية', 'طرطوس',
    'درعا', 'السويداء', 'القنيطرة', 'إدلب', 'الرقة', 'دير الزور', 'الحسكة'
  ];

  const roles = [
    { value: 'customer', label: 'زبون', icon: Users, color: 'from-taxi-500 to-taxi-600' },
    { value: 'driver', label: 'سائق', icon: Car, color: 'from-emerald-500 to-emerald-600' },
    { value: 'admin', label: 'إدارة', icon: Shield, color: 'from-violet-500 to-violet-600' }
  ];

  const currentRole = roles.find(role => role.value === userType);

  useEffect(() => {
    if (userType) {
      setRegisterData(prev => ({ ...prev, role: userType }));
    }
  }, [userType]);

  const handleRegister = async () => {
    if (!registerData.name || !registerData.phone || !registerData.governorate) {
      return;
    }

    const success = await signUp(registerData);
    if (success) {
      setCurrentPhone(registerData.phone);
      setVerificationMode(true);
    }
  };

  const handleLogin = async () => {
    if (!loginPhone) {
      return;
    }

    const success = await signIn(loginPhone);
    if (success) {
      // توجيه حسب نوع المستخدم بعد تسجيل الدخول الناجح
      switch (userType) {
        case 'customer':
          navigate('/customer');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/customer');
      }
    }
  };

  const handleVerification = async () => {
    const success = await verifyOtp(currentPhone, verificationCode);
    if (success) {
      // توجيه حسب نوع المستخدم
      switch (userType) {
        case 'customer':
          navigate('/customer');
          break;
        case 'driver':
          navigate('/driver');
          break;
        case 'admin':
          navigate('/admin');
          break;
        default:
          navigate('/customer');
      }
    }
  };

  if (verificationMode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
        <Card className="w-full max-w-md bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className={`bg-gradient-to-r ${currentRole?.color} p-4 rounded-2xl mx-auto w-fit mb-4`}>
              {currentRole?.icon && <currentRole.icon className="w-12 h-12 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold text-white font-cairo">تحقق من الهاتف</CardTitle>
            <CardDescription className="text-slate-300 font-tajawal">
              أدخل رمز التحقق المرسل إلى هاتفك
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="verification" className="text-white font-tajawal">رمز التحقق</Label>
              <Input
                id="verification"
                type="text"
                placeholder="أدخل الرمز المكون من 6 أرقام"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                className="text-center text-2xl tracking-widest bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                maxLength={6}
              />
            </div>

            <div className="space-y-3">
              <Button 
                onClick={handleVerification}
                className="w-full btn-taxi text-lg py-3"
                disabled={verificationCode.length !== 6}
              >
                تحقق ودخول
              </Button>
              
              <Button 
                variant="outline" 
                onClick={() => setVerificationMode(false)}
                className="w-full bg-transparent border-white/20 text-white hover:bg-white/10"
              >
                رجوع
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Button 
          variant="ghost" 
          onClick={() => navigate('/')}
          className="mb-6 text-white hover:bg-white/10"
        >
          <ArrowLeft className="ml-2 h-4 w-4" />
          العودة للرئيسية
        </Button>

        <Card className="bg-white/10 backdrop-blur-lg border-white/20">
          <CardHeader className="text-center">
            <div className={`bg-gradient-to-r ${currentRole?.color} p-4 rounded-2xl mx-auto w-fit mb-4`}>
              {currentRole?.icon && <currentRole.icon className="w-12 h-12 text-white" />}
            </div>
            <CardTitle className="text-2xl font-bold text-white font-cairo">
              {currentRole?.label} - ألو تكسي
            </CardTitle>
            <CardDescription className="text-slate-300 font-tajawal">
              {isLogin ? 'تسجيل الدخول' : 'إنشاء حساب جديد'}
            </CardDescription>
          </CardHeader>
          
          <CardContent>
            <Tabs value={isLogin ? 'login' : 'register'} className="space-y-6">
              <TabsList className="grid w-full grid-cols-2 bg-white/10">
                <TabsTrigger 
                  value="login" 
                  onClick={() => setIsLogin(true)}
                  className="text-white data-[state=active]:bg-white/20"
                >
                  تسجيل دخول
                </TabsTrigger>
                <TabsTrigger 
                  value="register" 
                  onClick={() => setIsLogin(false)}
                  className="text-white data-[state=active]:bg-white/20"
                >
                  تسجيل جديد
                </TabsTrigger>
              </TabsList>

              <TabsContent value="login" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-tajawal flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09XXXXXXXX"
                    value={loginPhone}
                    onChange={(e) => setLoginPhone(e.target.value)}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <Button 
                  onClick={handleLogin}
                  className="w-full btn-taxi text-lg py-3"
                >
                  تسجيل الدخول
                </Button>
              </TabsContent>

              <TabsContent value="register" className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white font-tajawal flex items-center gap-2">
                    <User className="w-4 h-4" />
                    الاسم الكامل
                  </Label>
                  <Input
                    id="name"
                    type="text"
                    placeholder="أدخل اسمك الكامل"
                    value={registerData.name}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, name: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone" className="text-white font-tajawal flex items-center gap-2">
                    <Phone className="w-4 h-4" />
                    رقم الهاتف
                  </Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="09XXXXXXXX"
                    value={registerData.phone}
                    onChange={(e) => setRegisterData(prev => ({ ...prev, phone: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white placeholder:text-slate-400"
                  />
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-tajawal">المحافظة</Label>
                  <Select value={registerData.governorate} onValueChange={(value) => setRegisterData(prev => ({ ...prev, governorate: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue placeholder="اختر المحافظة" />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {governorates.map((gov) => (
                        <SelectItem key={gov} value={gov} className="text-white hover:bg-slate-700">
                          {gov}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label className="text-white font-tajawal">نوع الحساب</Label>
                  <Select value={registerData.role} onValueChange={(value) => setRegisterData(prev => ({ ...prev, role: value }))}>
                    <SelectTrigger className="bg-white/10 border-white/20 text-white">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-800 border-slate-700">
                      {roles.map((role) => (
                        <SelectItem key={role.value} value={role.value} className="text-white hover:bg-slate-700">
                          <div className="flex items-center gap-2">
                            <role.icon className="w-4 h-4" />
                            {role.label}
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Button 
                  onClick={handleRegister}
                  className="w-full btn-taxi text-lg py-3"
                >
                  إنشاء الحساب
                </Button>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AuthPage;
