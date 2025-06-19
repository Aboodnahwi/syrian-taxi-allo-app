
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import AuthPage from './AuthPage';

const Index = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  // إعادة توجيه المستخدم المسجل مسبقاً إلى الصفحة المناسبة
  useEffect(() => {
    if (!loading && user) {
      console.log('User authenticated, redirecting...', user);
      switch (user.role) {
        case 'customer':
          navigate('/customer', { replace: true });
          break;
        case 'driver':
          navigate('/driver', { replace: true });
          break;
        case 'admin':
          navigate('/admin', { replace: true });
          break;
        default:
          navigate('/customer', { replace: true });
      }
    }
  }, [user, loading, navigate]);

  // إذا كان هناك مستخدم مسجل، لا تعرض شيئاً (سيتم إعادة التوجيه)
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-900 to-emerald-900 flex items-center justify-center">
        <div className="text-white text-xl font-tajawal">جاري التحميل...</div>
      </div>
    );
  }

  if (user) {
    return null; // سيتم إعادة التوجيه
  }

  // عرض واجهة تسجيل الدخول كصفحة رئيسية
  return <AuthPage />;
};

export default Index;
