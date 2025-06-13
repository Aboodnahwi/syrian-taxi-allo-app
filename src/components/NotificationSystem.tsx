
import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Bell, X, CheckCircle, AlertCircle, Info, Car } from 'lucide-react';

interface Notification {
  id: string;
  type: 'success' | 'warning' | 'info' | 'ride';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

interface NotificationSystemProps {
  userType: 'customer' | 'driver' | 'admin';
}

const NotificationSystem = ({ userType }: NotificationSystemProps) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  // إضافة إشعارات تجريبية
  useEffect(() => {
    const mockNotifications: Record<string, Notification[]> = {
      customer: [
        {
          id: '1',
          type: 'ride',
          title: 'تم قبول طلبك',
          message: 'السائق محمد أحمد قَبِل رحلتك وهو في الطريق إليك',
          timestamp: new Date(Date.now() - 5 * 60 * 1000),
          read: false
        },
        {
          id: '2',
          type: 'success',
          title: 'تم إنهاء الرحلة',
          message: 'تمت رحلتك بنجاح. يرجى تقييم السائق',
          timestamp: new Date(Date.now() - 30 * 60 * 1000),
          read: false
        }
      ],
      driver: [
        {
          id: '3',
          type: 'ride',
          title: 'طلب رحلة جديد',
          message: 'طلب رحلة من المزة إلى الصالحية - 2500 ل.س',
          timestamp: new Date(Date.now() - 2 * 60 * 1000),
          read: false
        },
        {
          id: '4',
          type: 'info',
          title: 'تحديث أسعار الرحلات',
          message: 'تم تحديث أسعار رحلات VIP من قبل الإدارة',
          timestamp: new Date(Date.now() - 60 * 60 * 1000),
          read: true
        }
      ],
      admin: [
        {
          id: '5',
          type: 'warning',
          title: 'سائق جديد ينتظر الموافقة',
          message: 'خالد محمود قدم طلب انضمام كسائق',
          timestamp: new Date(Date.now() - 10 * 60 * 1000),
          read: false
        },
        {
          id: '6',
          type: 'success',
          title: 'زيادة في الإيرادات',
          message: 'زادت الإيرادات اليومية بنسبة 15% مقارنة بالأمس',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
          read: false
        }
      ]
    };

    setNotifications(mockNotifications[userType] || []);
  }, [userType]);

  // تحديد أيقونة الإشعار
  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle className="w-5 h-5 text-emerald-500" />;
      case 'warning':
        return <AlertCircle className="w-5 h-5 text-orange-500" />;
      case 'ride':
        return <Car className="w-5 h-5 text-taxi-500" />;
      default:
        return <Info className="w-5 h-5 text-blue-500" />;
    }
  };

  // تحديد لون الإشعار
  const getNotificationColor = (type: string) => {
    switch (type) {
      case 'success':
        return 'border-emerald-200 bg-emerald-50/50';
      case 'warning':
        return 'border-orange-200 bg-orange-50/50';
      case 'ride':
        return 'border-taxi-200 bg-taxi-50/50';
      default:
        return 'border-blue-200 bg-blue-50/50';
    }
  };

  // تنسيق الوقت
  const formatTime = (timestamp: Date) => {
    const now = new Date();
    const diff = now.getTime() - timestamp.getTime();
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));

    if (minutes < 1) return 'الآن';
    if (minutes < 60) return `منذ ${minutes} دقيقة`;
    if (hours < 24) return `منذ ${hours} ساعة`;
    return timestamp.toLocaleDateString('ar-SY');
  };

  // وضع علامة مقروء
  const markAsRead = (id: string) => {
    setNotifications(prev => 
      prev.map(notif => 
        notif.id === id ? { ...notif, read: true } : notif
      )
    );
  };

  // حذف إشعار
  const deleteNotification = (id: string) => {
    setNotifications(prev => prev.filter(notif => notif.id !== id));
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="relative">
      {/* زر الإشعارات */}
      <Button
        variant="ghost"
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative text-white hover:bg-white/10 p-2"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <Badge className="absolute -top-1 -right-1 bg-red-500 text-white text-xs min-w-[20px] h-5 flex items-center justify-center rounded-full">
            {unreadCount}
          </Badge>
        )}
      </Button>

      {/* قائمة الإشعارات */}
      {showNotifications && (
        <div className="absolute top-full left-0 mt-2 w-80 max-h-96 overflow-y-auto bg-white/95 backdrop-blur-lg rounded-lg shadow-2xl border border-white/20 z-50">
          <div className="p-4 border-b border-slate-200">
            <h3 className="font-bold text-slate-800 font-cairo">الإشعارات</h3>
            {unreadCount > 0 && (
              <p className="text-sm text-slate-600 font-tajawal">{unreadCount} إشعار جديد</p>
            )}
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="p-6 text-center">
                <Bell className="w-12 h-12 text-slate-300 mx-auto mb-2" />
                <p className="text-slate-500 font-tajawal">لا توجد إشعارات</p>
              </div>
            ) : (
              notifications.map((notification) => (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-slate-100 last:border-b-0 ${
                    !notification.read ? 'bg-blue-50/50' : ''
                  } hover:bg-slate-50 transition-colors`}
                >
                  <div className="flex items-start gap-3">
                    {getNotificationIcon(notification.type)}
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <h4 className="font-semibold text-slate-800 font-cairo text-sm">
                          {notification.title}
                        </h4>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => deleteNotification(notification.id)}
                          className="p-1 h-6 w-6 hover:bg-red-50 text-slate-400 hover:text-red-500"
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      
                      <p className="text-slate-600 text-sm font-tajawal mt-1">
                        {notification.message}
                      </p>
                      
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-slate-400 font-tajawal">
                          {formatTime(notification.timestamp)}
                        </span>
                        
                        {!notification.read && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => markAsRead(notification.id)}
                            className="text-xs text-blue-600 hover:bg-blue-50 px-2 py-1 h-6"
                          >
                            وضع علامة مقروء
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {notifications.length > 0 && (
            <div className="p-3 border-t border-slate-200 bg-slate-50">
              <Button
                variant="ghost"
                className="w-full text-sm text-slate-600 hover:bg-slate-100 font-tajawal"
                onClick={() => setNotifications(prev => prev.map(n => ({ ...n, read: true })))}
              >
                وضع علامة مقروء للكل
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default NotificationSystem;
