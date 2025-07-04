
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types/auth';

export const authService = {
  async signUp(userData: any, toast: any): Promise<boolean> {
    try {
      const { data: otpData, error: otpError } = await supabase
        .rpc('generate_otp', { p_phone: userData.phone });

      if (otpError) throw otpError;

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

  async signIn(phone: string, toast: any): Promise<{ success: boolean; user: User | null }> {
    try {
      console.log('[authService] Starting sign in for phone:', phone);
      
      // البحث عن المستخدم في قاعدة البيانات
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('phone', phone)
        .maybeSingle();

      if (profileError) {
        console.error('[authService] Profile fetch error:', profileError);
        toast({
          title: "خطأ في النظام",
          description: "حدث خطأ أثناء التحقق من البيانات",
          variant: "destructive"
        });
        return { success: false, user: null };
      }

      if (!profile) {
        console.log('[authService] User not found');
        toast({
          title: "المستخدم غير موجود",
          description: "يرجى التسجيل أولاً",
          variant: "destructive"
        });
        return { success: false, user: null };
      }

      console.log('[authService] User found:', profile);

      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: "مرحباً بك في ألو تكسي",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      return { success: true, user: profile };
    } catch (error: any) {
      console.error('[authService] SignIn error:', error);
      toast({
        title: "خطأ في تسجيل الدخول",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, user: null };
    }
  },

  async verifyOtp(phone: string, code: string, toast: any): Promise<{ success: boolean; user: User | null }> {
    try {
      console.log('[authService] Starting OTP verification for phone:', phone);
      
      const pendingRegistration = localStorage.getItem('pendingRegistration');
      let userData = null;
      if (pendingRegistration) {
        userData = JSON.parse(pendingRegistration);
      }

      let finalUser: User | null = null;
      let isNewUser = false;

      if (userData) {
        // تسجيل مستخدم جديد
        const { data, error } = await supabase.rpc('verify_otp_and_create_user', {
          p_phone: userData.phone,
          p_code: code,
          p_user_data: userData
        });

        if (error) {
          console.error('[authService] OTP verification error:', error);
          toast({
            title: "خطأ في التحقق",
            description: error.message,
            variant: "destructive"
          });
          return { success: false, user: null };
        }

        if (typeof data === "object" && data !== null && "success" in data) {
          if ((data as any).success) {
            const userId = (data as any).user_id;
            const { data: profile, error: profileError } = await supabase
              .from('profiles')
              .select('*')
              .eq('id', userId)
              .single();

            if (profileError || !profile) {
              console.error('[authService] Profile fetch error after OTP:', profileError);
              toast({
                title: "تعذر جلب الحساب",
                description: "تم إنشاء المستخدم ولكن حدث خطأ بجلب البيانات",
                variant: "destructive"
              });
              return { success: false, user: null };
            }
            
            finalUser = profile;
            isNewUser = true;
            localStorage.removeItem('pendingRegistration');
            
          } else {
            if ("error" in data && (data as any).error && (data as any).error.includes("مستخدم مسبقًا")) {
              toast({
                title: "الرقم مستخدم من قبل",
                description: "هذا الرقم مسجّل مسبقًا. الرجاء استخدام تسجيل الدخول.",
                variant: "destructive"
              });
              localStorage.removeItem('pendingRegistration');
            } else {
              toast({
                title: "فشل التحقق",
                description: (data as any).error || "حدث خطأ أثناء إنشاء الحساب",
                variant: "destructive"
              });
            }
            return { success: false, user: null };
          }
        }
      } else {
        return { success: false, user: null };
      }

      if (isNewUser) {
        toast({
          title: "تم التسجيل بنجاح",
          description: "مرحباً بك في ألو تكسي",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }

      console.log('[authService] OTP verification successful:', finalUser);
      return { success: true, user: finalUser };
    } catch (error: any) {
      console.error('[authService] VerifyOTP error:', error);
      toast({
        title: "خطأ في التحقق",
        description: error.message,
        variant: "destructive"
      });
      return { success: false, user: null };
    }
  }
};
