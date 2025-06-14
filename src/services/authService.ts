
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
      // التأكد من وجود الملف الشخصي، مع إعادة المحاولة عند الفشل
      const fetchProfile = async () => {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('phone', phone)
          .maybeSingle();
        return { profile, profileError };
      };

      let { profile, profileError } = await fetchProfile();
      
      // إعادة المحاولة مع انتظار أطول للمستخدمين الجدد
      if (profileError || !profile) {
        await new Promise((res) => setTimeout(res, 2000));
        const retryResult = await fetchProfile();
        profile = retryResult.profile;
        profileError = retryResult.profileError;
      }

      // محاولة ثالثة للتأكد
      if (profileError || !profile) {
        await new Promise((res) => setTimeout(res, 1000));
        const finalRetry = await fetchProfile();
        profile = finalRetry.profile;
        profileError = finalRetry.profileError;
      }

      if (profileError || !profile) {
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

      const { data: result, error: verifyError } = await supabase
        .rpc('verify_otp_and_create_user', {
          p_phone: phone,
          p_code: code,
          p_user_data: userData ? JSON.stringify(userData) : null
        });

      // تأكد أن النتيجة كائن وليست نص أو نوع آخر
      const isValidObject = result !== null && typeof result === "object" && !Array.isArray(result);

      if (
        verifyError ||
        !isValidObject ||
        (Object.prototype.hasOwnProperty.call(result, 'success') && (result as any).success !== true)
      ) {
        toast({
          title: "رمز التحقق خاطئ",
          description:
            (verifyError && verifyError.message) ||
            (isValidObject && (result as any).error) ||
            "يرجى إدخال الرمز الصحيح",
          variant: "destructive"
        });
        return { success: false, user: null };
      }

      let finalUser: User | null = null;

      // جلب بيانات الملف الشخصي بعد التأكيد مع محاولات متعددة
      if (isValidObject && (result as any).user_id) {
        const userId = (result as any).user_id;
        
        const fetchUserProfile = async () => {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', userId)
            .maybeSingle();
          return { profile, profileError };
        };

        let { profile, profileError } = await fetchUserProfile();
        
        // إعادة المحاولة للمستخدمين الجدد
        if (profileError || !profile) {
          await new Promise((res) => setTimeout(res, 2000));
          const retryResult = await fetchUserProfile();
          profile = retryResult.profile;
          profileError = retryResult.profileError;
        }

        if (profileError || !profile) {
          toast({
            title: "خطأ أثناء جلب الملف الشخصي",
            description: profileError?.message || "تعذر جلب بيانات الحساب",
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        finalUser = profile;
      }

      localStorage.removeItem('pendingRegistration');

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
