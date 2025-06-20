import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { CreditCard, Wallet, Banknote, Loader2 } from 'lucide-react';
import { paymentService, PaymentMethod } from '@/services/paymentService';
import { useToast } from '@/hooks/use-toast';

interface PaymentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  tripId: string;
  amount: number;
  onPaymentSuccess?: (transactionId: string) => void;
  onPaymentError?: (error: string) => void;
}

const PaymentDialog: React.FC<PaymentDialogProps> = ({
  open,
  onOpenChange,
  tripId,
  amount,
  onPaymentSuccess,
  onPaymentError
}) => {
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedMethod, setSelectedMethod] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (open) {
      loadPaymentMethods();
    }
  }, [open]);

  const loadPaymentMethods = async () => {
    setIsLoading(true);
    try {
      const methods = await paymentService.getPaymentMethods();
      const enabledMethods = methods.filter(method => method.enabled);
      setPaymentMethods(enabledMethods);
      
      // اختيار الطريقة الأولى المتاحة تلقائياً
      if (enabledMethods.length > 0) {
        setSelectedMethod(enabledMethods[0].id);
      }
    } catch (error) {
      toast({
        title: "خطأ في تحميل طرق الدفع",
        description: "حدث خطأ أثناء تحميل طرق الدفع المتاحة",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handlePayment = async () => {
    if (!selectedMethod) {
      toast({
        title: "يرجى اختيار طريقة الدفع",
        description: "يجب اختيار طريقة دفع قبل المتابعة",
        variant: "destructive"
      });
      return;
    }

    setIsProcessing(true);
    try {
      const result = await paymentService.processPayment(tripId, amount, selectedMethod);
      
      if (result.success && result.transactionId) {
        toast({
          title: "تم الدفع بنجاح",
          description: "تمت معالجة الدفع بنجاح",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        
        onPaymentSuccess?.(result.transactionId);
        onOpenChange(false);
      } else {
        const errorMessage = result.error || 'فشل في معالجة الدفع';
        toast({
          title: "فشل في الدفع",
          description: errorMessage,
          variant: "destructive"
        });
        
        onPaymentError?.(errorMessage);
      }
    } catch (error: any) {
      const errorMessage = error.message || 'حدث خطأ أثناء معالجة الدفع';
      toast({
        title: "خطأ في النظام",
        description: errorMessage,
        variant: "destructive"
      });
      
      onPaymentError?.(errorMessage);
    } finally {
      setIsProcessing(false);
    }
  };

  const getMethodIcon = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash':
        return <Banknote className="w-6 h-6" />;
      case 'card':
        return <CreditCard className="w-6 h-6" />;
      case 'wallet':
        return <Wallet className="w-6 h-6" />;
      default:
        return <Banknote className="w-6 h-6" />;
    }
  };

  const getMethodDescription = (type: PaymentMethod['type']) => {
    switch (type) {
      case 'cash':
        return 'ادفع نقداً للسائق عند الوصول';
      case 'card':
        return 'ادفع باستخدام بطاقة الائتمان';
      case 'wallet':
        return 'ادفع من محفظتك الإلكترونية';
      default:
        return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-white">
        <DialogHeader>
          <DialogTitle className="text-center font-cairo text-xl">
            اختر طريقة الدفع
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-6 py-4">
          {/* مبلغ الدفع */}
          <div className="text-center p-4 bg-gray-50 rounded-lg">
            <p className="text-sm text-gray-600 font-tajawal">المبلغ المطلوب</p>
            <p className="text-2xl font-bold text-gray-900 font-cairo">
              {amount.toLocaleString()} ل.س
            </p>
          </div>

          {/* طرق الدفع */}
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
          ) : paymentMethods.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 font-tajawal">
                لا توجد طرق دفع متاحة حالياً
              </p>
            </div>
          ) : (
            <RadioGroup value={selectedMethod} onValueChange={setSelectedMethod}>
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div key={method.id}>
                    <Label
                      htmlFor={method.id}
                      className="cursor-pointer"
                    >
                      <Card className={`transition-colors ${
                        selectedMethod === method.id 
                          ? 'border-taxi-500 bg-taxi-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <CardContent className="flex items-center space-x-3 space-x-reverse p-4">
                          <RadioGroupItem
                            value={method.id}
                            id={method.id}
                            className="text-taxi-500"
                          />
                          
                          <div className="flex items-center space-x-3 space-x-reverse flex-1">
                            <div className={`p-2 rounded-lg ${
                              selectedMethod === method.id 
                                ? 'bg-taxi-100 text-taxi-600' 
                                : 'bg-gray-100 text-gray-600'
                            }`}>
                              {getMethodIcon(method.type)}
                            </div>
                            
                            <div className="flex-1">
                              <p className="font-semibold text-gray-900 font-tajawal">
                                {method.name}
                              </p>
                              <p className="text-sm text-gray-500 font-tajawal">
                                {getMethodDescription(method.type)}
                              </p>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Label>
                  </div>
                ))}
              </div>
            </RadioGroup>
          )}

          {/* أزرار الإجراءات */}
          <div className="flex space-x-3 space-x-reverse">
            <Button
              onClick={handlePayment}
              disabled={!selectedMethod || isProcessing || paymentMethods.length === 0}
              className="flex-1 btn-taxi"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin ml-2" />
                  جاري المعالجة...
                </>
              ) : (
                'تأكيد الدفع'
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isProcessing}
              className="flex-1"
            >
              إلغاء
            </Button>
          </div>

          {/* ملاحظة أمان */}
          <div className="text-center">
            <p className="text-xs text-gray-500 font-tajawal">
              جميع المعاملات محمية ومشفرة لضمان أمان بياناتك
            </p>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentDialog;
