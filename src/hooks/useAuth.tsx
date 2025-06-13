
import { useState, useEffect, createContext, useContext } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface User {
  id: string;
  name: string;
  phone: string;
  role: string;
  governorate: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  signUp: (userData: any) => Promise<boolean>;
  signIn: (phone: string) => Promise<boolean>;
  verifyOtp: (phone: string, code: string) => Promise<boolean>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    // التحقق من المستخدم المحفوظ محلياً
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (userData: any): Promise<boolean> => {
    try {
      // إنشاء رمز OTP
      const { data: otpData, error: otpError } = await supabase
        .rpc('generate_otp', { p_phone: userData.phone });

      if (otpError) throw otpError;

      // حفظ بيانات التسجيل مؤقتاً
      localStorage.setItem('pendingRegistration', JSON.stringify(userData));
      
      toast({
        title: "تم إرسال رمز التحقق",
        description: `رمز التحقق: ${otpData} (للتجربة فقط)`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في التسجيل",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const signIn = async (phone: string): Promise<boolean> => {
    try {
      // التحقق من وجود المستخدم
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .single();

      if (profileError || !profile) {
        toast({
          title: "المستخدم غير موجود",
          description: "يرجى التسجيل أولاً",
          variant: "destructive"
        });
        return false;
      }

      // إنشاء رمز OTP
      const { data: otpData, error: otpError } = await supabase
        .rpc('generate_otp', { p_phone: phone });

      if (otpError) throw otpError;

      toast({
        title: "تم إرسال رمز التحقق",
        description: `رمز التحقق: ${otpData} (للتجربة فقط)`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<boolean> => {
    try {
      // التحقق من رمز OTP
      const { data: isValid, error: verifyError } = await supabase
        .rpc('verify_otp', { p_phone: phone, p_code: code });

      if (verifyError || !isValid) {
        toast({
          title: "رمز التحقق خاطئ",
          description: "يرجى إدخال الرمز الصحيح",
          variant: "destructive"
        });
        return false;
      }

      // التحقق من وجود تسجيل معلق
      const pendingRegistration = localStorage.getItem('pendingRegistration');
      
      if (pendingRegistration) {
        // إكمال التسجيل
        const userData = JSON.parse(pendingRegistration);
        
        const { data: profile, error: insertError } = await supabase
          .from('profiles')
          .insert([{
            name: userData.name,
            phone: userData.phone,
            role: userData.role,
            governorate: userData.governorate
          }])
          .select()
          .single();

        if (insertError) throw insertError;

        // إنشاء سجل سائق إذا كان المستخدم سائقاً
        if (userData.role === 'driver') {
          await supabase
            .from('drivers')
            .insert([{
              user_id: profile.id,
              vehicle_type: 'regular',
              license_number: 'temp-license',
              license_plate: 'temp-plate',
              vehicle_model: 'غير محدد',
              vehicle_color: 'غير محدد'
            }]);
        }

        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
        localStorage.removeItem('pendingRegistration');
      } else {
        // تسجيل دخول عادي
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', phone)
          .single();

        if (profileError) throw profileError;

        setUser(profile);
        localStorage.setItem('user', JSON.stringify(profile));
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في ألو تكسي",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return true;
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive"
      });
      return false;
    }
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('pendingRegistration');
  };

  return (
    <AuthContext.Provider value={{
      user,
      loading,
      signUp,
      signIn,
      verifyOtp,
      signOut
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
