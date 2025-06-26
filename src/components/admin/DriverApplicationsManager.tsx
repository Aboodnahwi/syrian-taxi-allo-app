
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { UserCheck, UserX, Clock, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface DriverApplication {
  id: string;
  full_name: string;
  phone: string;
  email: string | null;
  license_number: string;
  vehicle_type: string;
  vehicle_model: string | null;
  vehicle_color: string | null;
  license_plate: string;
  status: string;
  rejection_reason?: string | null;
  created_at: string;
}

const DriverApplicationsManager = () => {
  const [applications, setApplications] = useState<DriverApplication[]>([]);
  const [selectedApp, setSelectedApp] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      const { data, error } = await supabase
        .from('driver_applications')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setApplications(data || []);
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

  const approveApplication = async (applicationId: string) => {
    try {
      const { error } = await supabase
        .from('driver_applications')
        .update({ 
          status: 'approved', 
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "تم قبول الطلب",
        description: "تم قبول طلب السائق بنجاح",
        className: "bg-green-50 border-green-200 text-green-800"
      });

      fetchApplications();
    } catch (error: any) {
      toast({
        title: "خطأ في الموافقة",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  const rejectApplication = async (applicationId: string) => {
    if (!rejectionReason.trim()) {
      toast({
        title: "مطلوب سبب الرفض",
        description: "يرجى إدخال سبب رفض الطلب",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('driver_applications')
        .update({ 
          status: 'rejected', 
          rejection_reason: rejectionReason,
          reviewed_at: new Date().toISOString()
        })
        .eq('id', applicationId);

      if (error) throw error;

      toast({
        title: "تم رفض الطلب",
        description: "تم رفض طلب السائق",
        className: "bg-red-50 border-red-200 text-red-800"
      });

      setSelectedApp(null);
      setRejectionReason('');
      fetchApplications();
    } catch (error: any) {
      toast({
        title: "خطأ في الرفض",
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
          <UserCheck className="w-5 h-5 text-green-400" />
          إدارة طلبات السائقين
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {applications.map((app) => (
            <div key={app.id} className="bg-slate-700 rounded-lg p-4 border border-slate-600">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <h3 className="text-white font-semibold text-lg">{app.full_name}</h3>
                  <p className="text-slate-300 text-sm">{app.phone} • {app.email}</p>
                </div>
                <Badge 
                  className={`
                    ${app.status === 'pending' ? 'bg-yellow-500' : ''}
                    ${app.status === 'approved' ? 'bg-green-500' : ''}
                    ${app.status === 'rejected' ? 'bg-red-500' : ''}
                  `}
                >
                  {app.status === 'pending' && 'قيد المراجعة'}
                  {app.status === 'approved' && 'مقبول'}
                  {app.status === 'rejected' && 'مرفوض'}
                </Badge>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                <div>
                  <span className="text-slate-400">رقم الرخصة:</span>
                  <p className="text-white">{app.license_number}</p>
                </div>
                <div>
                  <span className="text-slate-400">نوع المركبة:</span>
                  <p className="text-white">{app.vehicle_type}</p>
                </div>
                <div>
                  <span className="text-slate-400">موديل المركبة:</span>
                  <p className="text-white">{app.vehicle_model}</p>
                </div>
                <div>
                  <span className="text-slate-400">رقم اللوحة:</span>
                  <p className="text-white">{app.license_plate}</p>
                </div>
              </div>

              {app.status === 'rejected' && app.rejection_reason && (
                <div className="bg-red-900/30 border border-red-500 rounded p-3 mb-4">
                  <p className="text-red-300 text-sm">سبب الرفض: {app.rejection_reason}</p>
                </div>
              )}

              {app.status === 'pending' && (
                <div className="flex gap-2">
                  <Button 
                    onClick={() => approveApplication(app.id)}
                    className="bg-green-600 hover:bg-green-700"
                    size="sm"
                  >
                    <UserCheck className="w-4 h-4 mr-2" />
                    قبول
                  </Button>
                  <Button 
                    onClick={() => setSelectedApp(selectedApp === app.id ? null : app.id)}
                    variant="outline" 
                    className="border-red-500 text-red-400 hover:bg-red-900/20"
                    size="sm"
                  >
                    <UserX className="w-4 h-4 mr-2" />
                    رفض
                  </Button>
                </div>
              )}

              {selectedApp === app.id && (
                <div className="mt-4 p-3 bg-slate-600 rounded border">
                  <label className="block text-sm text-slate-300 mb-2">سبب الرفض:</label>
                  <Textarea
                    value={rejectionReason}
                    onChange={(e) => setRejectionReason(e.target.value)}
                    placeholder="اكتب سبب رفض الطلب..."
                    className="bg-slate-700 border-slate-500 text-white mb-3"
                  />
                  <div className="flex gap-2">
                    <Button 
                      onClick={() => rejectApplication(app.id)}
                      className="bg-red-600 hover:bg-red-700"
                      size="sm"
                    >
                      تأكيد الرفض
                    </Button>
                    <Button 
                      onClick={() => {
                        setSelectedApp(null);
                        setRejectionReason('');
                      }}
                      variant="outline"
                      size="sm"
                    >
                      إلغاء
                    </Button>
                  </div>
                </div>
              )}
            </div>
          ))}

          {applications.length === 0 && (
            <div className="text-center py-8">
              <Clock className="w-12 h-12 text-slate-500 mx-auto mb-4" />
              <p className="text-slate-400">لا توجد طلبات سائقين حالياً</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default DriverApplicationsManager;
