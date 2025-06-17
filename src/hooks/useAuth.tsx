
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
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      try {
        const parsedUser = JSON.parse(savedUser);
        setUser(parsedUser);
      } catch (error) {
        localStorage.removeItem('user');
      }
    }
    setLoading(false);
  }, []);

  const signUp = async (userData: any): Promise<boolean> => {
    return await authService.signUp(userData, toast);
  };

  const signIn = async (phone: string): Promise<{ success: boolean; user: User | null }> => {
    return await authService.signIn(phone, toast);
  };

  const verifyOtp = async (phone: string, code: string): Promise<{ success: boolean; user: User | null }> => {
    const result = await authService.verifyOtp(phone, code, toast);
    if (result.success && result.user) {
      setUser(result.user);
      localStorage.setItem('user', JSON.stringify(result.user));
    }
    return result;
  };

  const signOut = async () => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('pendingRegistration');
    // إعادة التوجيه إلى الصفحة الرئيسية بدلاً من ترك المستخدم في شاشة سوداء
    window.location.href = '/';
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
