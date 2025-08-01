
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { 
  Plus, 
  Edit2, 
  Trash2, 
  Save, 
  X,
  Car,
  DollarSign,
  Settings,
  AlertCircle
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VehicleType {
  id: string;
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  surge_multiplier: number;
  is_active: boolean;
  description?: string;
  icon?: string;
  color?: string;
}

interface NewVehicleForm {
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  surge_multiplier: number;
  description: string;
  icon: string;
  color: string;
}

const EnhancedVehiclePricingManager = () => {
  const [vehicleTypes, setVehicleTypes] = useState<VehicleType[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newVehicle, setNewVehicle] = useState<NewVehicleForm>({
    vehicle_type: '',
    base_price: 1000,
    price_per_km: 100,
    minimum_fare: 500,
    surge_multiplier: 1.0,
    description: '',
    icon: '🚗',
    color: 'bg-blue-500'
  });

  const { toast } = useToast();

  const vehicleIcons = ['🚗', '🚙', '🚐', '🏍️', '🚌', '🚕', '🚖', '🛺'];
  const vehicleColors = [
    'bg-blue-500', 'bg-green-500', 'bg-red-500', 'bg-yellow-500',
    'bg-purple-500', 'bg-cyan-500', 'bg-orange-500', 'bg-pink-500'
  ];

  useEffect(() => {
    loadVehicleTypes();
  }, []);

  const loadVehicleTypes = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('vehicle_pricing')
        .select('*')
        .order('vehicle_type');

      if (error) throw error;

      setVehicleTypes(data || []);
    } catch (error: any) {
      console.error('Error loading vehicle types:', error);
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async (vehicleType: VehicleType) => {
    try {
      const { error } = await supabase
        .from('vehicle_pricing')
        .update({
          base_price: vehicleType.base_price,
          price_per_km: vehicleType.price_per_km,
          minimum_fare: vehicleType.minimum_fare,
          surge_multiplier: vehicleType.surge_multiplier,
          is_active: vehicleType.is_active,
          updated_at: new Date().toISOString()
        })
        .eq('id', vehicleType.id);

      if (error) throw error;

      toast({
        title: "تم الحفظ بنجاح",
        description: `تم تحديث تسعير ${vehicleType.vehicle_type}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      setEditingId(null);
      loadVehicleTypes();
    } catch (error: any) {
      toast({
        title: "خطأ في الحفظ",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleAddVehicle = async () => {
    try {
      const { error } = await supabase
        .from('vehicle_pricing')
        .insert([{
          vehicle_type: newVehicle.vehicle_type,
          base_price: newVehicle.base_price,
          price_per_km: newVehicle.price_per_km,
          minimum_fare: newVehicle.minimum_fare,
          surge_multiplier: newVehicle.surge_multiplier,
          is_active: true
        }]);

      if (error) throw error;

      toast({
        title: "تم الإضافة بنجاح",
        description: `تم إضافة وسيلة النقل ${newVehicle.vehicle_type}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      setShowAddForm(false);
      setNewVehicle({
        vehicle_type: '',
        base_price: 1000,
        price_per_km: 100,
        minimum_fare: 500,
        surge_multiplier: 1.0,
        description: '',
        icon: '🚗',
        color: 'bg-blue-500'
      });
      loadVehicleTypes();
    } catch (error: any) {
      toast({
        title: "خطأ في الإضافة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const handleDelete = async (id: string, vehicleType: string) => {
    if (!confirm(`هل أنت متأكد من حذف وسيلة النقل "${vehicleType}"؟`)) return;

    try {
      const { error } = await supabase
        .from('vehicle_pricing')
        .delete()
        .eq('id', id);

      if (error) throw error;

      toast({
        title: "تم الحذف بنجاح",
        description: `تم حذف وسيلة النقل ${vehicleType}`,
        className: "bg-green-50 border-green-200 text-green-800"
      });

      loadVehicleTypes();
    } catch (error: any) {
      toast({
        title: "خطأ في الحذف",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const updateVehicleType = (id: string, field: string, value: any) => {
    setVehicleTypes(prev => prev.map(vehicle => 
      vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
    ));
  };

  if (loading) {
    return <div className="text-center text-white">جاري التحميل...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <CardHeader>
          <CardTitle className="text-2xl font-cairo flex items-center gap-3">
            <Car className="w-8 h-8" />
            إدارة تسعير وسائل النقل المتقدمة
          </CardTitle>
          <p className="text-blue-100 font-tajawal text-lg">
            إدارة شاملة لجميع أنواع وسائل النقل وتسعيرها
          </p>
        </CardHeader>
        <CardContent>
          <Button
            onClick={() => setShowAddForm(true)}
            className="bg-white/20 hover:bg-white/30 border-white/30"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة وسيلة نقل جديدة
          </Button>
        </CardContent>
      </Card>

      {/* Add New Vehicle Form */}
      {showAddForm && (
        <Card className="bg-slate-800 border-slate-700">
          <CardHeader>
            <CardTitle className="text-white font-cairo flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Plus className="w-5 h-5 text-green-400" />
                إضافة وسيلة نقل جديدة
              </span>
              <Button
                onClick={() => setShowAddForm(false)}
                variant="ghost"
                size="sm"
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div>
                <Label className="text-slate-300 font-tajawal">اسم وسيلة النقل</Label>
                <Input
                  value={newVehicle.vehicle_type}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, vehicle_type: e.target.value }))}
                  className="bg-slate-700 border-slate-600 text-white"
                  placeholder="مثال: سيارة عادية"
                />
              </div>

              <div>
                <Label className="text-slate-300 font-tajawal">السعر الأساسي (ل.س)</Label>
                <Input
                  type="number"
                  value={newVehicle.base_price}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, base_price: Number(e.target.value) }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 font-tajawal">سعر الكيلومتر (ل.س)</Label>
                <Input
                  type="number"
                  value={newVehicle.price_per_km}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, price_per_km: Number(e.target.value) }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 font-tajawal">الحد الأدنى للأجرة (ل.س)</Label>
                <Input
                  type="number"
                  value={newVehicle.minimum_fare}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, minimum_fare: Number(e.target.value) }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 font-tajawal">معامل الطلب العالي</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newVehicle.surge_multiplier}
                  onChange={(e) => setNewVehicle(prev => ({ ...prev, surge_multiplier: Number(e.target.value) }))}
                  className="bg-slate-700 border-slate-600 text-white"
                />
              </div>

              <div>
                <Label className="text-slate-300 font-tajawal">الرمز</Label>
                <div className="flex gap-2 mt-2">
                  {vehicleIcons.map(icon => (
                    <Button
                      key={icon}
                      onClick={() => setNewVehicle(prev => ({ ...prev, icon }))}
                      variant={newVehicle.icon === icon ? "default" : "outline"}
                      size="sm"
                      className="p-2"
                    >
                      {icon}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <Label className="text-slate-300 font-tajawal">الوصف</Label>
              <Textarea
                value={newVehicle.description}
                onChange={(e) => setNewVehicle(prev => ({ ...prev, description: e.target.value }))}
                className="bg-slate-700 border-slate-600 text-white"
                placeholder="وصف وسيلة النقل..."
                rows={3}
              />
            </div>

            <div className="flex gap-3">
              <Button onClick={handleAddVehicle} className="bg-green-600 hover:bg-green-700">
                <Plus className="w-4 h-4 mr-2" />
                إضافة وسيلة النقل
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="outline"
                className="border-slate-600 text-slate-300"
              >
                إلغاء
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Vehicle Types List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {vehicleTypes.map((vehicle) => (
          <Card key={vehicle.id} className="bg-slate-800 border-slate-700">
            <CardHeader>
              <CardTitle className="text-white font-cairo flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-xl">
                    🚗
                  </div>
                  <div>
                    <h3 className="text-lg">{vehicle.vehicle_type}</h3>
                    <Badge className={vehicle.is_active ? "bg-green-500" : "bg-red-500"}>
                      {vehicle.is_active ? "نشط" : "غير نشط"}
                    </Badge>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button
                    onClick={() => setEditingId(editingId === vehicle.id ? null : vehicle.id)}
                    size="sm"
                    variant="outline"
                    className="border-slate-600 text-slate-300"
                  >
                    <Edit2 className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => handleDelete(vehicle.id, vehicle.vehicle_type)}
                    size="sm"
                    variant="outline"
                    className="border-red-600 text-red-400 hover:bg-red-600/20"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {editingId === vehicle.id ? (
                // Edit Mode
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label className="text-slate-300 font-tajawal">السعر الأساسي (ل.س)</Label>
                      <Input
                        type="number"
                        value={vehicle.base_price}
                        onChange={(e) => updateVehicleType(vehicle.id, 'base_price', Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-tajawal">سعر الكيلومتر (ل.س)</Label>
                      <Input
                        type="number"
                        value={vehicle.price_per_km}
                        onChange={(e) => updateVehicleType(vehicle.id, 'price_per_km', Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-tajawal">الحد الأدنى للأجرة (ل.س)</Label>
                      <Input
                        type="number"
                        value={vehicle.minimum_fare}
                        onChange={(e) => updateVehicleType(vehicle.id, 'minimum_fare', Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                    <div>
                      <Label className="text-slate-300 font-tajawal">معامل الطلب العالي</Label>
                      <Input
                        type="number"
                        step="0.1"
                        value={vehicle.surge_multiplier}
                        onChange={(e) => updateVehicleType(vehicle.id, 'surge_multiplier', Number(e.target.value))}
                        className="bg-slate-700 border-slate-600 text-white"
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <Switch
                      checked={vehicle.is_active}
                      onCheckedChange={(checked) => updateVehicleType(vehicle.id, 'is_active', checked)}
                    />
                    <Label className="text-slate-300 font-tajawal">وسيلة نقل نشطة</Label>
                  </div>

                  <div className="flex gap-3">
                    <Button onClick={() => handleSave(vehicle)} className="bg-green-600 hover:bg-green-700">
                      <Save className="w-4 h-4 mr-2" />
                      حفظ التغييرات
                    </Button>
                    <Button 
                      onClick={() => setEditingId(null)} 
                      variant="outline"
                      className="border-slate-600 text-slate-300"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              ) : (
                // View Mode
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <DollarSign className="w-4 h-4 text-green-400" />
                    <span className="text-slate-400 font-tajawal">السعر الأساسي:</span>
                    <span className="text-green-400 font-bold">{vehicle.base_price.toLocaleString()} ل.س</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-blue-400" />
                    <span className="text-slate-400 font-tajawal">سعر الكم:</span>
                    <span className="text-blue-400 font-bold">{vehicle.price_per_km.toLocaleString()} ل.س</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-yellow-400" />
                    <span className="text-slate-400 font-tajawal">الحد الأدنى:</span>
                    <span className="text-yellow-400 font-bold">{vehicle.minimum_fare.toLocaleString()} ل.س</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Car className="w-4 h-4 text-purple-400" />
                    <span className="text-slate-400 font-tajawal">معامل الطلب:</span>
                    <span className="text-purple-400 font-bold">×{vehicle.surge_multiplier}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {vehicleTypes.length === 0 && (
        <Card className="bg-slate-800 border-slate-700">
          <CardContent className="text-center py-12">
            <Car className="w-12 h-12 mx-auto mb-4 text-slate-400" />
            <h3 className="text-xl font-cairo text-white mb-2">لا توجد وسائل نقل</h3>
            <p className="text-slate-400 font-tajawal mb-4">قم بإضافة وسائل النقل المختلفة لبدء استخدام التطبيق</p>
            <Button onClick={() => setShowAddForm(true)} className="bg-blue-600 hover:bg-blue-700">
              <Plus className="w-4 h-4 mr-2" />
              إضافة وسيلة نقل جديدة
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default EnhancedVehiclePricingManager;
