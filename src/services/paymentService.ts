import { supabase } from '@/integrations/supabase/client';

export interface PaymentMethod {
  id: string;
  type: 'cash' | 'card' | 'wallet';
  name: string;
  icon: string;
  enabled: boolean;
}

export interface PaymentTransaction {
  id: string;
  trip_id: string;
  amount: number;
  method: string;
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  created_at: string;
  completed_at?: string;
}

export const paymentService = {
  // الحصول على طرق الدفع المتاحة
  async getPaymentMethods(): Promise<PaymentMethod[]> {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_value')
        .eq('setting_key', 'payment_methods')
        .single();

      if (error) throw error;

      if (data?.setting_value) {
        return JSON.parse(data.setting_value);
      }

      // طرق الدفع الافتراضية
      return [
        {
          id: 'cash',
          type: 'cash',
          name: 'نقداً',
          icon: '💵',
          enabled: true
        },
        {
          id: 'card',
          type: 'card',
          name: 'بطاقة ائتمان',
          icon: '💳',
          enabled: false
        },
        {
          id: 'wallet',
          type: 'wallet',
          name: 'محفظة إلكترونية',
          icon: '📱',
          enabled: false
        }
      ];
    } catch (error) {
      console.error('Error fetching payment methods:', error);
      return [];
    }
  },

  // معالجة الدفع
  async processPayment(tripId: string, amount: number, method: string): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // إنشاء معاملة دفع
      const { data: transaction, error: transactionError } = await supabase
        .from('payment_transactions')
        .insert({
          trip_id: tripId,
          amount,
          method,
          status: 'pending'
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // معالجة الدفع حسب النوع
      switch (method) {
        case 'cash':
          // الدفع نقداً - يتم تأكيده مباشرة
          await this.completePayment(transaction.id);
          return { success: true, transactionId: transaction.id };

        case 'card':
          // معالجة الدفع بالبطاقة (محاكاة)
          const cardResult = await this.processCardPayment(transaction.id, amount);
          return cardResult;

        case 'wallet':
          // معالجة الدفع بالمحفظة الإلكترونية (محاكاة)
          const walletResult = await this.processWalletPayment(transaction.id, amount);
          return walletResult;

        default:
          throw new Error('طريقة دفع غير مدعومة');
      }
    } catch (error: any) {
      console.error('Payment processing error:', error);
      return { success: false, error: error.message };
    }
  },

  // إكمال الدفع
  async completePayment(transactionId: string): Promise<void> {
    try {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'completed',
          completed_at: new Date().toISOString()
        })
        .eq('id', transactionId);
    } catch (error) {
      console.error('Error completing payment:', error);
      throw error;
    }
  },

  // معالجة الدفع بالبطاقة (محاكاة)
  async processCardPayment(transactionId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // محاكاة معالجة الدفع بالبطاقة
      await new Promise(resolve => setTimeout(resolve, 2000));

      // محاكاة نجاح الدفع (90% نجاح)
      const success = Math.random() > 0.1;

      if (success) {
        await this.completePayment(transactionId);
        return { success: true, transactionId };
      } else {
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('id', transactionId);
        return { success: false, error: 'فشل في معالجة الدفع بالبطاقة' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // معالجة الدفع بالمحفظة الإلكترونية (محاكاة)
  async processWalletPayment(transactionId: string, amount: number): Promise<{ success: boolean; transactionId?: string; error?: string }> {
    try {
      // محاكاة معالجة الدفع بالمحفظة
      await new Promise(resolve => setTimeout(resolve, 1500));

      // محاكاة نجاح الدفع (95% نجاح)
      const success = Math.random() > 0.05;

      if (success) {
        await this.completePayment(transactionId);
        return { success: true, transactionId };
      } else {
        await supabase
          .from('payment_transactions')
          .update({ status: 'failed' })
          .eq('id', transactionId);
        return { success: false, error: 'فشل في معالجة الدفع بالمحفظة الإلكترونية' };
      }
    } catch (error: any) {
      return { success: false, error: error.message };
    }
  },

  // الحصول على تاريخ المعاملات
  async getTransactionHistory(userId: string): Promise<PaymentTransaction[]> {
    try {
      const { data, error } = await supabase
        .from('payment_transactions')
        .select(`
          *,
          trips!inner(customer_id, driver_id)
        `)
        .or(`trips.customer_id.eq.${userId},trips.driver_id.eq.${userId}`)
        .order('created_at', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching transaction history:', error);
      return [];
    }
  },

  // استرداد الدفع
  async refundPayment(transactionId: string, reason: string): Promise<{ success: boolean; error?: string }> {
    try {
      await supabase
        .from('payment_transactions')
        .update({
          status: 'refunded',
          refund_reason: reason,
          refunded_at: new Date().toISOString()
        })
        .eq('id', transactionId);

      return { success: true };
    } catch (error: any) {
      console.error('Error processing refund:', error);
      return { success: false, error: error.message };
    }
  }
};
