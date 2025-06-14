
import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { User, AuthContextType } from '@/types/auth';
import { authService } from '@/services/authService';
import { AuthContext } from '@/contexts/AuthContext';

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
    return await authService.signUp(userData, toast);
  };

  const signIn = async (phone: string): Promise<boolean> => {
    const result = await authService.signIn(phone, toast);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
      toast({
        title: "تم تسجيل الدخول بنجاح",
        description: `مرحباً بك مجدداً, ${result.user.name}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });
    }
    return result.success;
  };

  const verifyOtp = async (phone: string, code: string): Promise<boolean> => {
    const result = await authService.verifyOtp(phone, code, toast);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result.success;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('pendingRegistration');
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
