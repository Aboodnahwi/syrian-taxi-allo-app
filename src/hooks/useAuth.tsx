
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
    const initAuth = async () => {
      try {
        const savedUser = localStorage.getItem('user');
        if (savedUser) {
          try {
            const parsedUser = JSON.parse(savedUser);
            console.log('[AuthProvider] Found saved user:', parsedUser);
            setUser(parsedUser);
          } catch (error) {
            console.error('[AuthProvider] Error parsing saved user:', error);
            localStorage.removeItem('user');
          }
        }
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
      return await authService.signUp(userData, toast);
    } catch (error) {
      console.error('[AuthProvider] SignUp error:', error);
      return false;
    }
  };

  const signIn = async (phone: string): Promise<{ success: boolean; user: User | null }> => {
    try {
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
      setUser(null);
      localStorage.removeItem('user');
      localStorage.removeItem('pendingRegistration');
      
      // استخدام window.location.href بدلاً من replace لضمان التنقل الصحيح
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
