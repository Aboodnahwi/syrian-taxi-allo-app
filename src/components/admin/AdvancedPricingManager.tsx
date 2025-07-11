
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { Calculator, Save, RotateCcw, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PricingVariables {
  price_per_km: number;
  price_per_minute: number;
  time_multiplier_peak: number;
  time_multiplier_normal: number;
  time_multiplier_night: number;
  vehicle_multiplier_economy: number;
  vehicle_multiplier_comfort: number;
  vehicle_multiplier_luxury: number;
  demand_multiplier_low: number;
  demand_multiplier_normal: number;
  demand_multiplier_high: number;
  minimum_fare: number;
}

interface PricingExample {
  distance_km: number;
  duration_minutes: number;
  time_factor: number;
  vehicle_factor: number;
  demand_factor: number;
}

const AdvancedPricingManager = () => {
  const [variables, setVariables] = useState<PricingVariables>({
    price_per_km: 1200,
    price_per_minute: 300,
    time_multiplier_peak: 1.5,
    time_multiplier_normal: 1.0,
    time_multiplier_night: 1.3,
    vehicle_multiplier_economy: 1.0,
    vehicle_multiplier_comfort: 1.4,
    vehicle_multiplier_luxury: 2.0,
    demand_multiplier_low: 0.9,
    demand_multiplier_normal: 1.0,
    demand_multiplier_high: 2.0,
    minimum_fare: 5000
  });

  const [example, setExample] = useState<PricingExample>({
    distance_km: 10,
    duration_minutes: 20,
    time_factor: 1.0,
    vehicle_factor: 1.0,
    demand_factor: 1.0
  });

  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  // حساب السعر وفق المعادلة
  const calculatePrice = () => {
    const basePrice = (variables.price_per_km * example.distance_km) + 
                     (variables.price_per_minute * example.duration_minutes);
    
    const finalPrice = basePrice * example.time_factor * example.vehicle_factor * example.demand_factor;
    
    return Math.max(finalPrice, variables.minimum_fare);
  };

  // تحميل الإعدادات الحالية
  useEffect(() => {
    loadPricingSettings();
  }, []);

  const loadPricingSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('app_settings')
        .select('setting_key, setting_value')
        .like('setting_key', 'pricing_%');

      if (error) throw error;

      if (data && data.length > 0) {
        const settingsObj: any = {};
        data.forEach(item => {
          const key = item.setting_key.replace('pricing_', '');
          settingsObj[key] = parseFloat(item.setting_value) || 0;
        });
        
        setVariables(prev => ({ ...prev, ...settingsObj }));
      }
    } catch (error: any) {
      console.error('خطأ في تحميل إعدادات التسعير:', error);
    }
  };

  const savePricingSettings = async () => {
    setLoading(true);
    try {
      // تحضير البيانات للحفظ
      const settingsToSave = Object.entries(variables).map(([key, value]) => ({
        setting_key: `pricing_${key}`,
        setting_value: value.toString(),
        description: `متغير تسعير: ${key}`
      }));

      // حذف الإعدادات القديمة
      await supabase
        .from('app_settings')
        .delete()
        .like('setting_key', 'pricing_%');

      // إدراج الإعدادات الجديدة
      const { error } = await supabase
        .from('app_settings')
        .insert(settingsToSave);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: "تم حفظ إعدادات التسعير المتقدمة",
        className: "bg-green-50 border-green-200 text-green-800"
      });

    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const resetToDefaults = () => {
    setVariables({
      price_per_km: 1200,
      price_per_minute: 300,
      time_multiplier_peak: 1.5,
      time_multiplier_normal: 1.0,
      time_multiplier_night: 1.3,
      vehicle_multiplier_economy: 1.0,
      vehicle_multiplier_comfort: 1.4,
      vehicle_multiplier_luxury: 2.0,
      demand_multiplier_low: 0.9,
      demand_multiplier_normal: 1.0,
      demand_multiplier_high: 2.0,
      minimum_fare: 5000
    });
  };

  const handleVariableChange = (key: keyof PricingVariables, value: string) => {
    const numValue = parseFloat(value) || 0;
    setVariables(prev => ({ ...prev, [key]: numValue }));
  };

  const handleExampleChange = (key: keyof PricingExample, value: string) => {
    const numValue = parseFloat(value) || 0;
    setExample(prev => ({ ...prev, [key]: numValue }));
  };

  const calculatedPrice = calculatePrice();

  return (
    <div className="space-y-6">
      {/* العنوان الرئيسي */}
      <Card className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-cairo flex items-center gap-3">
            <Calculator className="w-8 h-8" />
            نظام التسعير المتقدم
          </CardTitle>
          <p className="text-purple-100 font-tajawal text-lg">
            السعر = [(سعر_كم × المسافة) + (سعر_دقيقة × الوقت)] × معامل_الوقت × معامل_السيارة × معامل_الطلب
          </p>
        </CardHeader>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* إعدادات المتغيرات */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white font-cairo flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-400" />
              متغيرات التسعير
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* الأسعار الأساسية */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">الأسعار الأساسية</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">سعر الكيلومتر (ل.س)</Label>
                  <Input
                    type="number"
                    value={variables.price_per_km}
                    onChange={(e) => handleVariableChange('price_per_km', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1200"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">سعر الدقيقة (ل.س)</Label>
                  <Input
                    type="number"
                    value={variables.price_per_minute}
                    onChange={(e) => handleVariableChange('price_per_minute', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="300"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* معاملات الوقت */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">معاملات الوقت</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">وقت عادي</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.time_multiplier_normal}
                    onChange={(e) => handleVariableChange('time_multiplier_normal', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">وقت الذروة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.time_multiplier_peak}
                    onChange={(e) => handleVariableChange('time_multiplier_peak', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">وقت ليلي</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.time_multiplier_night}
                    onChange={(e) => handleVariableChange('time_multiplier_night', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* معاملات السيارة */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">معاملات نوع السيارة</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">اقتصادية</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.vehicle_multiplier_economy}
                    onChange={(e) => handleVariableChange('vehicle_multiplier_economy', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">مريحة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.vehicle_multiplier_comfort}
                    onChange={(e) => handleVariableChange('vehicle_multiplier_comfort', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">فاخرة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.vehicle_multiplier_luxury}
                    onChange={(e) => handleVariableChange('vehicle_multiplier_luxury', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* معاملات الطلب */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">معاملات الطلب</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">طلب منخفض</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.demand_multiplier_low}
                    onChange={(e) => handleVariableChange('demand_multiplier_low', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">طلب عادي</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.demand_multiplier_normal}
                    onChange={(e) => handleVariableChange('demand_multiplier_normal', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">طلب عالي</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={variables.demand_multiplier_high}
                    onChange={(e) => handleVariableChange('demand_multiplier_high', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* الحد الأدنى للأجرة */}
            <div>
              <Label className="text-slate-300 font-tajawal">الحد الأدنى للأجرة (ل.س)</Label>
              <Input
                type="number"
                value={variables.minimum_fare}
                onChange={(e) => handleVariableChange('minimum_fare', e.target.value)}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="5000"
              />
            </div>

            {/* أزرار الحفظ والإعادة تعيين */}
            <div className="flex gap-3 pt-4">
              <Button 
                onClick={savePricingSettings} 
                disabled={loading}
                className="bg-green-600 hover:bg-green-700 flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                حفظ الإعدادات
              </Button>
              <Button 
                onClick={resetToDefaults} 
                variant="outline"
                className="border-slate-600 text-slate-300 flex-1"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                إعادة تعيين
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* حاسبة المثال */}
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white font-cairo flex items-center gap-2">
              <Calculator className="w-5 h-5 text-blue-400" />
              حاسبة التسعير التجريبية
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* بيانات الرحلة */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">بيانات الرحلة</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">المسافة (كم)</Label>
                  <Input
                    type="number"
                    value={example.distance_km}
                    onChange={(e) => handleExampleChange('distance_km', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="10"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">مدة الرحلة (دقيقة)</Label>
                  <Input
                    type="number"
                    value={example.duration_minutes}
                    onChange={(e) => handleExampleChange('duration_minutes', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="20"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* المعاملات */}
            <div>
              <h3 className="text-lg font-cairo text-white mb-4">المعاملات المطبقة</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-slate-300 font-tajawal">معامل الوقت</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={example.time_factor}
                    onChange={(e) => handleExampleChange('time_factor', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">معامل السيارة</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={example.vehicle_factor}
                    onChange={(e) => handleExampleChange('vehicle_factor', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <Label className="text-slate-300 font-tajawal">معامل الطلب</Label>
                  <Input
                    type="number"
                    step="0.1"
                    value={example.demand_factor}
                    onChange={(e) => handleExampleChange('demand_factor', e.target.value)}
                    className="bg-slate-700 border-slate-600 text-white"
                    placeholder="1.0"
                  />
                </div>
              </div>
            </div>

            <Separator className="bg-slate-600" />

            {/* النتيجة */}
            <div className="bg-gradient-to-r from-green-600 to-blue-600 p-6 rounded-lg text-center">
              <h3 className="text-lg font-cairo text-white mb-2">السعر المحسوب</h3>
              <div className="text-4xl font-bold text-white font-cairo mb-2">
                {calculatedPrice.toLocaleString()} ل.س
              </div>
              <div className="text-sm text-green-100 font-tajawal">
                السعر الأساسي: {((variables.price_per_km * example.distance_km) + (variables.price_per_minute * example.duration_minutes)).toLocaleString()} ل.س
              </div>
            </div>

            {/* شرح سريع للحساب */}
            <div className="bg-slate-700 p-4 rounded-lg">
              <h4 className="text-white font-cairo mb-2">تفاصيل الحساب:</h4>
              <div className="text-sm text-slate-300 font-tajawal space-y-1">
                <div>سعر المسافة: {variables.price_per_km.toLocaleString()} × {example.distance_km} = {(variables.price_per_km * example.distance_km).toLocaleString()} ل.س</div>
                <div>سعر الوقت: {variables.price_per_minute.toLocaleString()} × {example.duration_minutes} = {(variables.price_per_minute * example.duration_minutes).toLocaleString()} ل.س</div>
                <div>المعاملات: {example.time_factor} × {example.vehicle_factor} × {example.demand_factor} = {(example.time_factor * example.vehicle_factor * example.demand_factor).toFixed(2)}</div>
              </div>
            </div>

            {/* معلومات إضافية */}
            <div className="grid grid-cols-3 gap-2 text-center">
              <Badge className="bg-blue-500 text-white py-2">
                <div className="font-tajawal">
                  <div className="font-bold">{example.distance_km}</div>
                  <div className="text-xs">كم</div>
                </div>
              </Badge>
              <Badge className="bg-purple-500 text-white py-2">
                <div className="font-tajawal">
                  <div className="font-bold">{example.duration_minutes}</div>
                  <div className="text-xs">دقيقة</div>
                </div>
              </Badge>
              <Badge className="bg-orange-500 text-white py-2">
                <div className="font-tajawal">
                  <div className="font-bold">{(example.time_factor * example.vehicle_factor * example.demand_factor).toFixed(1)}</div>
                  <div className="text-xs">معامل</div>
                </div>
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdvancedPricingManager;
