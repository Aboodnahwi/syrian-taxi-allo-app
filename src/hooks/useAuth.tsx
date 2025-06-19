
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, AuthContextType } from '@/types/auth';
import { authService } from '@/services/authService';
import { AuthContext } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const initAuth = async () => {
      try {
        console.log('[AuthProvider] Initializing authentication...');
        
        // التحقق من الجلسة المحفوظة محلياً
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('[AuthProvider] Found saved user:', parsedUser);
            
            // التحقق من صحة البيانات المحفوظة
            if (parsedUser.id && parsedUser.phone && parsedUser.role) {
              setUser(parsedUser);
              console.log('[AuthProvider] User restored from localStorage');
              
              // محاولة إنشاء جلسة مع Supabase إذا لم تكن موجودة
              try {
                const { data: session } = await supabase.auth.getSession();
                if (!session.session) {
                  await supabase.auth.signInAnonymously();
                  console.log('[AuthProvider] Created anonymous session for existing user');
                }
              } catch (authError) {
                console.log('[AuthProvider] Could not create auth session, continuing with local auth');
              }
            } else {
              console.log('[AuthProvider] Invalid saved user data, removing');
              localStorage.removeItem('user');
            }
          } catch (error) {
            console.error('[AuthProvider] Error parsing saved user:', error);
            localStorage.removeItem('user');
          }
        }

        // إعداد مستمع تغييرات حالة المصادقة
        const { data: { subscription } } = supabase.auth.onAuthStateChange(
          async (event, session) => {
            console.log('[AuthProvider] Auth state changed:', event, session?.user?.id);
            
            // لا نعتمد على جلسة Supabase لتحديد المستخدم
            // نحتفظ بالمستخدم المحفوظ محلياً
            if (event === 'SIGNED_OUT') {
              const savedUser = localStorage.getItem('user');
              if (!savedUser) {
                setUser(null);
              }
            }
          }
        );

        return () => {
          subscription.unsubscribe();
        };
      } catch (error) {
        console.error('[AuthProvider] Error initializing auth:', error);
      } finally {
        setLoading(false);
      }
    };

    initAuth();
  }, []);

  const signUp = async (userData: any): Promise<boolean> => {
    try {
      console.log('[AuthProvider] Starting signUp:', userData);
      return await authService.signUp(userData, toast);
    } catch (error) {
      console.error('[AuthProvider] SignUp error:', error);
      return false;
    }
  };

  const signIn = async (phone: string): Promise<{ success: boolean; user: User | null }> => {
    try {
      console.log('[AuthProvider] Starting signIn for phone:', phone);
      const result = await authService.signIn(phone, toast);
      if (result.success && result.user) {
        console.log('[AuthProvider] SignIn successful, setting user:', result.user);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    } catch (error) {
      console.error('[AuthProvider] SignIn error:', error);
      return { success: false, user: null };
    }
  };

  const verifyOtp = async (phone: string, code: string): Promise<{ success: boolean; user: User | null }> => {
    try {
      console.log('[AuthProvider] Starting verifyOtp for phone:', phone);
      const result = await authService.verifyOtp(phone, code, toast);
      if (result.success && result.user) {
        console.log('[AuthProvider] OTP verification successful, setting user:', result.user);
        setUser(result.user);
        localStorage.setItem('user', JSON.stringify(result.user));
      }
      return result;
    } catch (error) {
      console.error('[AuthProvider] VerifyOTP error:', error);
      return { success: false, user: null };
    }
  };

  const signOut = async () => {
    try {
      console.log('[AuthProvider] Signing out user');
      
      // إزالة البيانات المحلية
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('pendingRegistration');
      
      // تسجيل الخروج من Supabase
      try {
        await supabase.auth.signOut();
      } catch (error) {
        console.log('[AuthProvider] Supabase signOut failed, continuing with local signOut');
      }
      
      // إعادة التوجه إلى الصفحة الرئيسية
      window.location.href = '/';
    } catch (error) {
      console.error('[AuthProvider] SignOut error:', error);
    }
  };

  const contextValue: AuthContextType = {
    user,
    loading,
    signUp,
    signIn,
    verifyOtp,
    signOut
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

export { useAuth } from '@/contexts/AuthContext';
