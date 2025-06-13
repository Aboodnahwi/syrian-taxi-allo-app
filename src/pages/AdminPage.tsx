
import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Users, 
  Car, 
  MapPin, 
  DollarSign, 
  BarChart3, 
  LogOut,
  Eye,
  Edit,
  Plus,
  Trash2
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

// بيانات تجريبية
const mockDrivers = [
  { id: 1, name: 'محمد أحمد', phone: '0991234567', status: 'online', balance: 45000, totalRides: 23, rating: 4.8 },
  { id: 2, name: 'خالد محمود', phone: '0987654321', status: 'offline', balance: 32000, totalRides: 18, rating: 4.6 },
  { id: 3, name: 'أحمد علي', phone: '0956789123', status: 'busy', balance: 67000, totalRides: 34, rating: 4.9 }
];

const mockCustomers = [
  { id: 1, name: 'سارة محمد', phone: '0991111111', balance: 25000, totalRides: 12, lastRide: '2024-06-13' },
  { id: 2, name: 'أحمد يوسف', phone: '0992222222', balance: 0, totalRides: 8, lastRide: '2024-06-12' },
  { id: 3, name: 'فاطمة علي', phone: '0993333333', balance: 15000, totalRides: 15, lastRide: '2024-06-13' }
];

const mockRides = [
  { id: 1, customer: 'سارة محمد', driver: 'محمد أحمد', from: 'المزة', to: 'الصالحية', price: 2500, status: 'completed', date: '2024-06-13 14:30' },
  { id: 2, customer: 'أحمد يوسف', driver: 'خالد محمود', from: 'جرمانا', to: 'باب توما', price: 3200, status: 'active', date: '2024-06-13 15:45' },
  { id: 3, customer: 'فاطمة علي', driver: 'أحمد علي', from: 'كفرسوسة', to: 'المالكي', price: 1800, status: 'completed', date: '2024-06-13 13:20' }
];

const AdminPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  
  const [user, setUser] = useState<any>(null);
  const [settings, setSettings] = useState({
    siteName: 'ألو تكسي',
    commissionRate: 15,
    apiKey: '5b3ce3597851110001cf6248e12d4b05e23f4f36be3b1b7f7c69a82a'
  });

  const [drivers] = useState(mockDrivers);
  const [customers] = useState(mockCustomers);
  const [rides] = useState(mockRides);

  // أسعار المركبات
  const [vehiclePrices, setVehiclePrices] = useState([
    { id: 'regular', name: 'سيارة عادية', basePrice: 1000, perKm: 100 },
    { id: 'ac', name: 'سيارة مكيفة', basePrice: 1500, perKm: 150 },
    { id: 'public', name: 'سيارة عامة', basePrice: 500, perKm: 50 },
    { id: 'vip', name: 'سيارة VIP', basePrice: 3000, perKm: 300 },
    { id: 'microbus', name: 'ميكرو باص', basePrice: 800, perKm: 80 },
    { id: 'bike', name: 'دراجة نارية', basePrice: 700, perKm: 70 }
  ]);

  // التحقق من تسجيل الدخول
  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth?type=admin');
      return;
    }
    const parsedUser = JSON.parse(userData);
    if (parsedUser.role !== 'admin') {
      navigate('/auth?type=admin');
      return;
    }
    setUser(parsedUser);
  }, [navigate]);

  // تهيئة الخريطة
  useEffect(() => {
    if (!mapRef.current) return;

    const L = (window as any).L;
    const map = L.map(mapRef.current).setView([33.5138, 36.2765], 11);

    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    mapInstanceRef.current = map;

    // إضافة مواقع تجريبية للسائقين
    const driverLocations = [
      { name: 'محمد أحمد', lat: 33.5138, lng: 36.2765, status: 'online' },
      { name: 'خالد محمود', lat: 33.5023, lng: 36.3012, status: 'offline' },
      { name: 'أحمد علي', lat: 33.5456, lng: 36.2234, status: 'busy' }
    ];

    driverLocations.forEach((driver) => {
      const color = driver.status === 'online' ? 'emerald' : driver.status === 'busy' ? 'orange' : 'slate';
      L.marker([driver.lat, driver.lng], {
        icon: L.divIcon({
          className: 'driver-marker',
          html: `<div class="bg-${color}-500 text-white p-2 rounded-full shadow-lg border-2 border-white">
                   <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                     <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z"/>
                     <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3z"/>
                   </svg>
                 </div>`,
          iconSize: [30, 30],
          iconAnchor: [15, 15]
        })
      }).addTo(map).bindPopup(`${driver.name} - ${driver.status}`);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
      }
    };
  }, []);

  // حفظ الإعدادات
  const saveSettings = () => {
    localStorage.setItem('adminSettings', JSON.stringify(settings));
    toast({
      title: "تم حفظ الإعدادات",
      description: "تم حفظ إعدادات الموقع بنجاح",
      className: "bg-green-50 border-green-200 text-green-800"
    });
  };

  // تحديث أسعار المركبة
  const updateVehiclePrice = (id: string, field: 'basePrice' | 'perKm', value: number) => {
    setVehiclePrices(prev => prev.map(vehicle => 
      vehicle.id === id ? { ...vehicle, [field]: value } : vehicle
    ));
  };

  // تسجيل الخروج
  const logout = () => {
    localStorage.removeItem('user');
    navigate('/');
  };

  // حساب الإحصائيات
  const totalRevenue = rides.reduce((sum, ride) => sum + ride.price, 0);
  const completedRides = rides.filter(ride => ride.status === 'completed').length;
  const activeRides = rides.filter(ride => ride.status === 'active').length;
  const onlineDrivers = drivers.filter(driver => driver.status === 'online').length;

  if (!user) return null;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-violet-900 to-blue-900">
      {/* شريط علوي */}
      <div className="bg-gradient-to-r from-slate-900/95 to-violet-900/95 backdrop-blur-sm p-4">
        <div className="container mx-auto flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="bg-gradient-to-r from-violet-500 to-blue-500 p-2 rounded-lg">
              <Settings className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold font-cairo text-xl">لوحة تحكم ألو تكسي</h1>
              <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user.name || 'مدير'}</p>
            </div>
          </div>
          <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>

      <div className="container mx-auto p-6">
        {/* بطاقات الإحصائيات */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-tajawal">إجمالي الإيرادات</p>
                  <p className="text-white text-2xl font-bold">{totalRevenue.toLocaleString()}</p>
                  <p className="text-emerald-400 text-xs">ل.س</p>
                </div>
                <div className="bg-emerald-500 p-3 rounded-full">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-tajawal">الرحلات المكتملة</p>
                  <p className="text-white text-2xl font-bold">{completedRides}</p>
                  <p className="text-blue-400 text-xs">رحلة</p>
                </div>
                <div className="bg-blue-500 p-3 rounded-full">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-tajawal">الرحلات النشطة</p>
                  <p className="text-white text-2xl font-bold">{activeRides}</p>
                  <p className="text-orange-400 text-xs">جارية</p>
                </div>
                <div className="bg-orange-500 p-3 rounded-full">
                  <Car className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white/10 backdrop-blur-lg border-white/20">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-300 text-sm font-tajawal">السائقين المتصلين</p>
                  <p className="text-white text-2xl font-bold">{onlineDrivers}</p>
                  <p className="text-emerald-400 text-xs">متاح</p>
                </div>
                <div className="bg-emerald-500 p-3 rounded-full">
                  <Users className="w-6 h-6 text-white" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* المحتوى الرئيسي */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="bg-white/10 backdrop-blur-lg border-white/20">
            <TabsTrigger value="overview" className="text-white data-[state=active]:bg-white/20">نظرة عامة</TabsTrigger>
            <TabsTrigger value="drivers" className="text-white data-[state=active]:bg-white/20">السائقين</TabsTrigger>
            <TabsTrigger value="customers" className="text-white data-[state=active]:bg-white/20">الزبائن</TabsTrigger>
            <TabsTrigger value="rides" className="text-white data-[state=active]:bg-white/20">الرحلات</TabsTrigger>
            <TabsTrigger value="pricing" className="text-white data-[state=active]:bg-white/20">التسعير</TabsTrigger>
            <TabsTrigger value="settings" className="text-white data-[state=active]:bg-white/20">الإعدادات</TabsTrigger>
          </TabsList>

          {/* نظرة عامة */}
          <TabsContent value="overview">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo flex items-center gap-2">
                  <MapPin className="w-5 h-5" />
                  خريطة الرحلات المباشرة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div ref={mapRef} className="w-full h-96 rounded-lg"></div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* السائقين */}
          <TabsContent value="drivers">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo">إدارة السائقين</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {drivers.map((driver) => (
                    <div key={driver.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-emerald-500 p-2 rounded-full">
                          <Car className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{driver.name}</h3>
                          <p className="text-slate-300 text-sm">{driver.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-emerald-400 font-semibold">{driver.balance.toLocaleString()} ل.س</p>
                          <p className="text-slate-300 text-sm">{driver.totalRides} رحلة</p>
                        </div>
                        
                        <Badge className={`${
                          driver.status === 'online' ? 'bg-emerald-500' :
                          driver.status === 'busy' ? 'bg-orange-500' : 'bg-slate-500'
                        } text-white`}>
                          {driver.status === 'online' ? 'متصل' :
                           driver.status === 'busy' ? 'مشغول' : 'غير متصل'}
                        </Badge>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الزبائن */}
          <TabsContent value="customers">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo">إدارة الزبائن</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {customers.map((customer) => (
                    <div key={customer.id} className="bg-white/5 rounded-lg p-4 flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-blue-500 p-2 rounded-full">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="text-white font-semibold">{customer.name}</h3>
                          <p className="text-slate-300 text-sm">{customer.phone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-4">
                        <div className="text-left">
                          <p className="text-blue-400 font-semibold">{customer.balance.toLocaleString()} ل.س</p>
                          <p className="text-slate-300 text-sm">{customer.totalRides} رحلة</p>
                        </div>
                        
                        <div className="flex gap-2">
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-white hover:bg-white/10">
                            <Edit className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الرحلات */}
          <TabsContent value="rides">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo">إدارة الرحلات</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {rides.map((ride) => (
                    <div key={ride.id} className="bg-white/5 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-3">
                        <div>
                          <h3 className="text-white font-semibold">#{ride.id}</h3>
                          <p className="text-slate-300 text-sm">{ride.date}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={`${
                            ride.status === 'completed' ? 'bg-emerald-500' : 'bg-orange-500'
                          } text-white`}>
                            {ride.status === 'completed' ? 'مكتملة' : 'نشطة'}
                          </Badge>
                          <span className="text-emerald-400 font-bold">{ride.price.toLocaleString()} ل.س</span>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                        <div>
                          <span className="text-slate-400">الزبون:</span>
                          <p className="text-white">{ride.customer}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">السائق:</span>
                          <p className="text-white">{ride.driver}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">من:</span>
                          <p className="text-white">{ride.from}</p>
                        </div>
                        <div>
                          <span className="text-slate-400">إلى:</span>
                          <p className="text-white">{ride.to}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* التسعير */}
          <TabsContent value="pricing">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo">إدارة التسعير</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {vehiclePrices.map((vehicle) => (
                    <div key={vehicle.id} className="bg-white/5 rounded-lg p-4">
                      <h3 className="text-white font-semibold mb-4">{vehicle.name}</h3>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-slate-300">السعر الأساسي (ل.س)</Label>
                          <Input
                            type="number"
                            value={vehicle.basePrice}
                            onChange={(e) => updateVehiclePrice(vehicle.id, 'basePrice', parseInt(e.target.value))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                        <div>
                          <Label className="text-slate-300">السعر لكل كيلومتر (ل.س)</Label>
                          <Input
                            type="number"
                            value={vehicle.perKm}
                            onChange={(e) => updateVehiclePrice(vehicle.id, 'perKm', parseInt(e.target.value))}
                            className="bg-white/10 border-white/20 text-white"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  
                  <Button className="w-full btn-taxi">
                    حفظ التسعير
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* الإعدادات */}
          <TabsContent value="settings">
            <Card className="bg-white/10 backdrop-blur-lg border-white/20">
              <CardHeader>
                <CardTitle className="text-white font-cairo">إعدادات النظام</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label className="text-slate-300">اسم الموقع</Label>
                  <Input
                    value={settings.siteName}
                    onChange={(e) => setSettings(prev => ({ ...prev, siteName: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-300">نسبة عمولة الموقع (%)</Label>
                  <Input
                    type="number"
                    value={settings.commissionRate}
                    onChange={(e) => setSettings(prev => ({ ...prev, commissionRate: parseInt(e.target.value) }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <div>
                  <Label className="text-slate-300">مفتاح API للخرائط</Label>
                  <Input
                    value={settings.apiKey}
                    onChange={(e) => setSettings(prev => ({ ...prev, apiKey: e.target.value }))}
                    className="bg-white/10 border-white/20 text-white"
                  />
                </div>
                
                <Button onClick={saveSettings} className="w-full btn-taxi">
                  حفظ الإعدادات
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AdminPage;
