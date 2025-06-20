import { supabase } from '@/integrations/supabase/client';

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: 'trip' | 'payment' | 'rating' | 'system' | 'promotion';
  data?: any;
  read: boolean;
  created_at: string;
}

export interface NotificationPreferences {
  trip_updates: boolean;
  payment_notifications: boolean;
  rating_reminders: boolean;
  promotional_offers: boolean;
  system_announcements: boolean;
  push_notifications: boolean;
  email_notifications: boolean;
  sms_notifications: boolean;
}

export const notificationService = {
  // إرسال إشعار
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    type: Notification['type'],
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.rpc('send_notification', {
        p_user_id: userId,
        p_title: title,
        p_message: message,
        p_type: type,
        p_data: data
      });

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error sending notification:', error);
      return { success: false, error: error.message };
    }
  },

  // إرسال إشعار جماعي
  async sendBulkNotification(
    userIds: string[],
    title: string,
    message: string,
    type: Notification['type'],
    data?: any
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const notifications = userIds.map(userId => ({
        user_id: userId,
        title,
        message,
        type,
        data,
        read: false
      }));

      const { error } = await supabase
        .from('notifications')
        .insert(notifications);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error sending bulk notification:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على إشعارات المستخدم
  async getUserNotifications(userId: string, limit: number = 50): Promise<Notification[]> {
    try {
      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching notifications:', error);
      return [];
    }
  },

  // عدد الإشعارات غير المقروءة
  async getUnreadCount(userId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error fetching unread count:', error);
      return 0;
    }
  },

  // تمييز إشعار كمقروء
  async markAsRead(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error marking notification as read:', error);
      return { success: false, error: error.message };
    }
  },

  // تمييز جميع الإشعارات كمقروءة
  async markAllAsRead(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error marking all notifications as read:', error);
      return { success: false, error: error.message };
    }
  },

  // حذف إشعار
  async deleteNotification(notificationId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('id', notificationId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting notification:', error);
      return { success: false, error: error.message };
    }
  },

  // حذف جميع الإشعارات المقروءة
  async deleteReadNotifications(userId: string): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId)
        .eq('read', true);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error deleting read notifications:', error);
      return { success: false, error: error.message };
    }
  },

  // الحصول على تفضيلات الإشعارات
  async getNotificationPreferences(userId: string): Promise<NotificationPreferences> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('notification_preferences')
        .eq('id', userId)
        .single();

      if (error) throw error;

      if (data?.notification_preferences) {
        return data.notification_preferences;
      }

      // التفضيلات الافتراضية
      return {
        trip_updates: true,
        payment_notifications: true,
        rating_reminders: true,
        promotional_offers: false,
        system_announcements: true,
        push_notifications: true,
        email_notifications: false,
        sms_notifications: true
      };
    } catch (error) {
      console.error('Error fetching notification preferences:', error);
      return {
        trip_updates: true,
        payment_notifications: true,
        rating_reminders: true,
        promotional_offers: false,
        system_announcements: true,
        push_notifications: true,
        email_notifications: false,
        sms_notifications: true
      };
    }
  },

  // تحديث تفضيلات الإشعارات
  async updateNotificationPreferences(
    userId: string,
    preferences: NotificationPreferences
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ notification_preferences: preferences })
        .eq('id', userId);

      if (error) throw error;
      return { success: true };
    } catch (error: any) {
      console.error('Error updating notification preferences:', error);
      return { success: false, error: error.message };
    }
  },

  // إشعارات خاصة بالرحلات
  async sendTripNotification(
    tripId: string,
    type: 'created' | 'accepted' | 'started' | 'completed' | 'cancelled',
    customMessage?: string
  ): Promise<void> {
    try {
      // الحصول على معلومات الرحلة
      const { data: trip } = await supabase
        .from('trips')
        .select('customer_id, driver_id, from_location, to_location')
        .eq('id', tripId)
        .single();

      if (!trip) return;

      let title = '';
      let message = customMessage || '';
      let recipients: string[] = [];

      switch (type) {
        case 'created':
          title = 'طلب رحلة جديد';
          message = message || `طلب رحلة جديد من ${trip.from_location} إلى ${trip.to_location}`;
          recipients = [trip.customer_id];
          break;

        case 'accepted':
          title = 'تم قبول طلب الرحلة';
          message = message || 'تم قبول طلب رحلتك، السائق في الطريق إليك';
          recipients = [trip.customer_id];
          break;

        case 'started':
          title = 'بدأت الرحلة';
          message = message || 'بدأت رحلتك، نتمنى لك رحلة آمنة';
          recipients = [trip.customer_id];
          break;

        case 'completed':
          title = 'انتهت الرحلة';
          message = message || 'انتهت رحلتك بنجاح، شكراً لاستخدام ألو تكسي';
          recipients = [trip.customer_id, trip.driver_id].filter(Boolean);
          break;

        case 'cancelled':
          title = 'تم إلغاء الرحلة';
          message = message || 'تم إلغاء الرحلة';
          recipients = [trip.customer_id, trip.driver_id].filter(Boolean);
          break;
      }

      // إرسال الإشعارات
      for (const userId of recipients) {
        await this.sendNotification(userId, title, message, 'trip', { trip_id: tripId });
      }
    } catch (error) {
      console.error('Error sending trip notification:', error);
    }
  }
};
