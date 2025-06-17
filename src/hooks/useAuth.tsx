
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
    // التحقق من المستخدم المحفوظ محلياً
    const savedUser = localStorage.getItem('authenticated_user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
        
        // إنشاء جلسة مؤقتة في Supabase
        const authUser = {
          id: parsedUser.id,
          email: `${parsedUser.phone}@temp.com`,
          phone: parsedUser.phone,
          user_metadata: parsedUser,
          app_metadata: {},
          aud: 'authenticated',
          created_at: parsedUser.created_at,
          role: 'authenticated'
        };
        
        // تحديث الجلسة الداخلية لـ Supabase
        supabase.auth.admin.createUser({
          email: authUser.email,
          phone: authUser.phone,
          user_metadata: authUser.user_metadata,
          email_confirm: true,
          phone_confirm: true
        }).catch(() => {
          // المستخدم موجود، تجاهل الخطأ
        });
        
      } catch (error) {
        localStorage.removeItem('authenticated_user');
        localStorage.removeItem('supabase.auth.user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (userData: any): Promise<boolean> => {
    return await authService.signUp(userData, toast);
  };

  const signIn = async (phone: string): Promise<{ success: boolean; user: User | null }> => {
    const result = await authService.signIn(phone, toast);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const verifyOtp = async (phone: string, code: string): Promise<{ success: boolean; user: User | null }> => {
    const result = await authService.verifyOtp(phone, code, toast);
    if (result.success && result.user) {
      setUser(result.user);
    }
    return result;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('authenticated_user');
    localStorage.removeItem('supabase.auth.user');
    localStorage.removeItem('pendingRegistration');
    
    // تسجيل خروج من Supabase أيضاً
    await supabase.auth.signOut();
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
