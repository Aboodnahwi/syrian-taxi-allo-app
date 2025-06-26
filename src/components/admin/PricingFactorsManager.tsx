
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Edit, Save, X, Plus, TrendingUp } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface PricingFactor {
  id: string;
  factor_name: string;
  factor_type: string;
  factor_value: number;
  is_active: boolean;
  description: string | null;
}

interface NewPricingFactor {
  factor_name?: string;
  factor_type?: string;
  factor_value?: number;
  is_active?: boolean;
  description?: string;
}

const PricingFactorsManager = () => {
  const [factors, setFactors] = useState<PricingFactor[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<Partial<PricingFactor>>({});
  const [showAddForm, setShowAddForm] = useState(false);
  const [newFactor, setNewFactor] = useState<NewPricingFactor>({
    factor_type: 'multiplier',
    is_active: true
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchFactors();
  }, []);

  const fetchFactors = async () => {
    try {
      const { data, error } = await supabase
        .from('pricing_factors')
        .select('*')
        .order('factor_name');

      if (error) throw error;
      setFactors(data || []);
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

  const startEdit = (factor: PricingFactor) => {
    setEditingId(factor.id);
    setEditForm(factor);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditForm({});
  };

  const saveEdit = async () => {
    if (!editingId || !editForm) return;

    try {
      const { error } = await supabase
        .from('pricing_factors')
        .update(editForm)
        .eq('id', editingId);

      if (error) throw error;

      toast({
        title: "تم التحديث بنجاح",
        description: "تم تحديث عامل التسعير",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      fetchFactors();
      cancelEdit();
    } catch (error: any) {
      toast({
        title: "خطأ في التحديث",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const addNewFactor = async () => {
    if (!newFactor.factor_name || !newFactor.factor_value) {
      toast({
        title: "بيانات ناقصة",
        description: "يرجى ملء جميع الحقول المطلوبة",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('pricing_factors')
        .insert([newFactor]);

      if (error) throw error;

      toast({
        title: "تمت الإضافة بنجاح",
        description: "تم إضافة عامل التسعير الجديد",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      fetchFactors();
      setShowAddForm(false);
      setNewFactor({ factor_type: 'multiplier', is_active: true });
    } catch (error: any) {
      toast({
        title: "خطأ في الإضافة",
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
        <div className="flex justify-between items-center">
          <CardTitle className="text-white font-cairo flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-orange-400" />
            إدارة عوامل التسعير
          </CardTitle>
          <Button 
            onClick={() => setShowAddForm(!showAddForm)}
            className="bg-purple-600 hover:bg-purple-700"
            size="sm"
          >
            <Plus className="w-4 h-4 mr-2" />
            إضافة عامل جديد
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {showAddForm && (
          <div className="bg-slate-700 rounded-lg p-4 mb-6 border border-slate-600">
            <h3 className="text-white font-semibold mb-4">إضافة عامل تسعير جديد</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-slate-300">اسم العامل</Label>
                <Input
                  value={newFactor.factor_name || ''}
                  onChange={(e) => setNewFactor({...newFactor, factor_name: e.target.value})}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="مثال: وقت الذروة"
                />
              </div>
              <div>
                <Label className="text-slate-300">نوع العامل</Label>
                <Select 
                  value={newFactor.factor_type} 
                  onValueChange={(value) => setNewFactor({...newFactor, factor_type: value})}
                >
                  <SelectTrigger className="bg-slate-600 border-slate-500 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="multiplier">مضاعف</SelectItem>
                    <SelectItem value="addition">إضافة</SelectItem>
                    <SelectItem value="percentage">نسبة مئوية</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-slate-300">القيمة</Label>
                <Input
                  type="number"
                  step="0.1"
                  value={newFactor.factor_value || ''}
                  onChange={(e) => setNewFactor({...newFactor, factor_value: Number(e.target.value)})}
                  className="bg-slate-600 border-slate-500 text-white"
                />
              </div>
              <div>
                <Label className="text-slate-300">الوصف</Label>
                <Input
                  value={newFactor.description || ''}
                  onChange={(e) => setNewFactor({...newFactor, description: e.target.value})}
                  className="bg-slate-600 border-slate-500 text-white"
                  placeholder="وصف العامل"
                />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={addNewFactor} className="bg-green-600 hover:bg-green-700">
                <Save className="w-4 h-4 mr-2" />
                حفظ
              </Button>
              <Button 
                onClick={() => setShowAddForm(false)} 
                variant="outline"
                className="border-slate-500 text-slate-300"
              >
                إلغاء
              </Button>
            </div>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-600">
                <th className="text-left text-slate-300 py-2">اسم العامل</th>
                <th className="text-left text-slate-300 py-2">النوع</th>
                <th className="text-left text-slate-300 py-2">القيمة</th>
                <th className="text-left text-slate-300 py-2">الوصف</th>
                <th className="text-left text-slate-300 py-2">الحالة</th>
                <th className="text-left text-slate-300 py-2">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {factors.map((factor) => (
                <tr key={factor.id} className="border-b border-slate-700">
                  <td className="py-3 text-white">{factor.factor_name}</td>
                  <td className="py-3 text-slate-300">
                    {factor.factor_type === 'multiplier' && 'مضاعف'}
                    {factor.factor_type === 'addition' && 'إضافة'}
                    {factor.factor_type === 'percentage' && 'نسبة مئوية'}
                  </td>
                  <td className="py-3">
                    {editingId === factor.id ? (
                      <Input
                        type="number"
                        step="0.1"
                        value={editForm.factor_value || ''}
                        onChange={(e) => setEditForm({...editForm, factor_value: Number(e.target.value)})}
                        className="w-20 bg-slate-700 border-slate-600 text-white"
                      />
                    ) : (
                      <span className="text-white">{factor.factor_value}</span>
                    )}
                  </td>
                  <td className="py-3 text-slate-300">{factor.description}</td>
                  <td className="py-3">
                    <Badge className={factor.is_active ? 'bg-green-500' : 'bg-red-500'}>
                      {factor.is_active ? 'نشط' : 'معطل'}
                    </Badge>
                  </td>
                  <td className="py-3">
                    {editingId === factor.id ? (
                      <div className="flex gap-2">
                        <Button size="sm" onClick={saveEdit} className="bg-green-600 hover:bg-green-700">
                          <Save className="w-4 h-4" />
                        </Button>
                        <Button size="sm" variant="outline" onClick={cancelEdit}>
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ) : (
                      <Button size="sm" onClick={() => startEdit(factor)} className="bg-blue-600 hover:bg-blue-700">
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

export default PricingFactorsManager;
