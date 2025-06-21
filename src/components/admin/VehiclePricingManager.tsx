
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Edit, Save, X, Plus } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface VehiclePricing {
  id: string;
  vehicle_type: string;
  base_price: number;
  price_per_km: number;
  minimum_fare: number;
  surge_multiplier: number;
  is_active: boolean;
}

const VehiclePricingManager = () => {
  const [pricingData, setPricingData] = useState<VehiclePricing[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<VehiclePricing>>({});
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchPricingData();
  }, []);

  const fetchPricingData = async () => {
    try {
      const { data, error } = await supabase
        .from('vehicle_pricing')
        .select('*')
        .order('vehicle_type');

      if (error) throw error;
      setPricingData(data || []);
    } catch (error: any) {
      toast({
        title: "خطأ في تحميل البيانات",
        description: error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const startEdit = (item: VehiclePricing) => {
    setEditingId(item.id);
    setEditForm(item);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('vehicle_pricing')
        .update(editForm)
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث أسعار المركبة",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      fetchPricingData();
      cancelEdit();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  if (loading) {
    return <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-500 mx-auto"></div>;
  }

  return (
    <Card className="bg-slate-800 border-slate-700">
      <CardHeader>
        <CardTitle className="text-white font-cairo flex items-center gap-2">
          <Edit className="w-5 h-5 text-blue-400" />
          إدارة أسعار المركبات
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left text-slate-300 py-2">نوع المركبة</th>
                <th className="text-left text-slate-300 py-2">السعر الأساسي</th>
                <th className="text-left text-slate-300 py-2">السعر/كم</th>
                <th className="text-left text-slate-300 py-2">الحد الأدنى</th>
                <th className="text-left text-slate-300 py-2">معامل الذروة</th>
                <th className="text-left text-slate-300 py-2">الحالة</th>
                <th className="text-left text-slate-300 py-2">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {pricingData.map((item) => (
                <tr key={item.id} className="border-b border-slate-700">
                  <td className="py-3 text-white">{item.vehicle_type}</td>
                  <td className="py-3">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editForm.base_price || ''}
                        onChange={(e) => setEditForm({...editForm, base_price: Number(e.target.value)})}
                        className="w-20 bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.base_price}</span>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editForm.price_per_km || ''}
                        onChange={(e) => setEditForm({...editForm, price_per_km: Number(e.target.value)})}
                        className="w-20 bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.price_per_km}</span>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        value={editForm.minimum_fare || ''}
                        onChange={(e) => setEditForm({...editForm, minimum_fare: Number(e.target.value)})}
                        className="w-20 bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.minimum_fare}</span>
                    )}
                  </td>
                  <td className="py-3">
                    {editingId === item.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.surge_multiplier || ''}
                        onChange={(e) => setEditForm({...editForm, surge_multiplier: Number(e.target.value)})}
                        className="w-20 bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{item.surge_multiplier}</span>
                    )}
                  </td>
                  <td className="py-3">
                    <Badge className={item.is_active ? 'bg-green-500' : 'bg-red-500'}>
                      {item.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {editingId === item.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => startEdit(item)} className="bg-blue-600 hover:bg-blue-700">
                        <Edit className="w-4 h-4" />
                      </Button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default VehiclePricingManager;
