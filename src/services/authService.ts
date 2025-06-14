
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export const authService = {
  async signUp(userData: any, toast: any): Promise<boolean> {
    try {
      // إرسال رمز OTP مع بيانات المستخدم
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
  },

  async signIn(phone: string, toast: any): Promise<boolean> {
    try {
      // التحقق من وجود الملف الشخصي
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (profileError) {
        console.error('Profile fetch error:', profileError);
        toast({
          title: "خطأ في النظام",
          description: "حدث خطأ أثناء التحقق من البيانات",
          variant: "destructive"
        });
        return false;
      }

      if (!profile) {
        toast({
          title: "المستخدم غير موجود",
          description: "يرجى التسجيل أولاً",
          variant: "destructive"
        });
        return false;
      }

      // إرسال رمز OTP
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
  },

  async verifyOtp(phone: string, code: string, toast: any): Promise<{ success: boolean; user: User | null }> {
    try {
      // التحقق من وجود تسجيل معلق (للتسجيل)
      const pendingRegistration = localStorage.getItem('pendingRegistration');
      let userData = null;
      if (pendingRegistration) {
        userData = JSON.parse(pendingRegistration);
      }

      let finalUser: User | null = null;

      if (userData) {
        // تسجيل مستخدم جديد باستعمال الدالة المخصصة في قاعدة البيانات
        const { data, error } = await supabase.rpc('verify_otp_and_create_user', {
          p_phone: userData.phone,
          p_code: code,
          p_user_data: userData
        });

        if (error) {
          toast({
            title: "خطأ في التحقق",
            description: error.message,
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        if (!data || !data.success) {
          toast({
            title: "فشل التحقق",
            description: data?.error || "حدث خطأ أثناء إنشاء الحساب",
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        // جلب الملف الشخصي من profiles
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', data.user_id)
          .single();

        if (profileError || !profile) {
          toast({
            title: "تعذر جلب الحساب",
            description: "تم إنشاء المستخدم ولكن حدث خطأ بجلب البيانات",
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        finalUser = profile;
        localStorage.removeItem('pendingRegistration');
      } else {
        // مستخدم حالي - تحقق رمز OTP القديم
        const { data: isValidOtp, error: otpError } = await supabase
          .rpc('verify_otp', { p_phone: phone, p_code: code });

        if (otpError || !isValidOtp) {
          toast({
            title: "رمز التحقق خاطئ",
            description: "يرجى إدخال الرمز الصحيح",
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        // جلب الملف الشخصي
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', phone)
          .single();

        if (profileError || !profile) {
          toast({
            title: "خطأ أثناء جلب الملف الشخصي",
            description: "تعذر جلب بيانات الحساب",
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        finalUser = profile;
      }

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في ألو تكسي",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return { success: true, user: finalUser };
    } catch (error: any) {
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, user: null };
    }
  }
};
