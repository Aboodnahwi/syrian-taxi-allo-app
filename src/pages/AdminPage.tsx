
import React, { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LogOut, Settings, Users, Car, Map as MapIcon } from 'lucide-react';
import Map from '@/components/map/Map';
import { supabase } from '@/integrations/supabase/client';

const AdminPage = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const [activeTrips, setActiveTrips] = useState([]);
  const [mapCenter] = useState<[number, number]>([33.5138, 36.2765]); // Damascus coordinates
  const [mapZoom] = useState(12);
  const [mapMarkers, setMapMarkers] = useState<any[]>([]);

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      navigate('/auth');
      return;
    }

    // Fetch active trips for the map
    const fetchActiveTrips = async () => {
      try {
        const { data: trips, error } = await supabase
          .from('trips')
          .select(`
            *,
            profiles!trips_customer_id_fkey (name, phone),
            drivers!trips_driver_id_fkey (*)
          `)
          .in('status', ['pending', 'accepted', 'in_progress']);

        if (error) {
          console.error('Error fetching trips:', error);
          return;
        }

        setActiveTrips(trips || []);

        // Create markers for active trips
        const markers = (trips || []).map((trip: any) => {
          const fromCoords = parseCoordinates(trip.from_coordinates);
          const toCoords = parseCoordinates(trip.to_coordinates);
          
          const tripMarkers = [];
          
          if (fromCoords) {
            tripMarkers.push({
              id: `trip-from-${trip.id}`,
              position: fromCoords,
              title: `نقطة الانطلاق - ${trip.profiles?.name || 'زبون'}`,
              color: trip.status === 'pending' ? 'blue' : trip.status === 'accepted' ? 'orange' : 'green'
            });
          }
          
          if (toCoords) {
            tripMarkers.push({
              id: `trip-to-${trip.id}`,
              position: toCoords,
              title: `الوجهة - ${trip.profiles?.name || 'زبون'}`,
              color: trip.status === 'pending' ? 'red' : trip.status === 'accepted' ? 'orange' : 'green'
            });
          }
          
          return tripMarkers;
        }).flat();

        setMapMarkers(markers);
      } catch (error) {
        console.error('Error in fetchActiveTrips:', error);
      }
    };

    fetchActiveTrips();

    // Subscribe to real-time updates
    const channel = supabase
      .channel('admin-trips')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'trips'
        },
        () => {
          fetchActiveTrips();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, navigate]);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  // Helper function to parse coordinates
  const parseCoordinates = (coords: unknown): [number, number] | null => {
    if (!coords) return null;
    
    if (typeof coords === 'string') {
      try {
        const match = coords.match(/\(([^,]+),([^)]+)\)/);
        if (match) {
          const lat = parseFloat(match[1]);
          const lng = parseFloat(match[2]);
          if (!isNaN(lat) && !isNaN(lng)) {
            return [lat, lng];
          }
        }
      } catch (error) {
        console.error('Error parsing coordinates:', error);
      }
    }
    
    if (Array.isArray(coords) && coords.length === 2) {
      const lat = parseFloat(coords[0]);
      const lng = parseFloat(coords[1]);
      if (!isNaN(lat) && !isNaN(lng)) {
        return [lat, lng];
      }
    }
    
    return null;
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="text-white text-center">
          <h2 className="text-2xl font-bold mb-4">جاري التحميل...</h2>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 relative">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 z-50 bg-slate-800/95 backdrop-blur-sm border-b border-slate-700">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-r from-violet-500 to-violet-600 rounded-full flex items-center justify-center">
              <Settings className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold font-cairo">لوحة الإدارة</h1>
              <p className="text-slate-300 text-sm">مرحباً {user.name}</p>
            </div>
          </div>
          
          <Button 
            onClick={handleSignOut}
            variant="outline"
            className="bg-transparent border-slate-600 text-white hover:bg-slate-700"
          >
            <LogOut className="w-4 h-4 ml-2" />
            تسجيل خروج
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="pt-20 p-4 h-screen">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 h-full">
          {/* Stats Cards */}
          <div className="lg:col-span-1 space-y-4">
            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Car className="w-4 h-4" />
                  الرحلات النشطة
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">{activeTrips.length}</div>
                <p className="text-slate-400 text-xs">رحلة نشطة حالياً</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Users className="w-4 h-4" />
                  المستخدمين
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-white">-</div>
                <p className="text-slate-400 text-xs">إجمالي المستخدمين</p>
              </CardContent>
            </Card>

            <Card className="bg-slate-800/50 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <MapIcon className="w-4 h-4" />
                  خريطة الرحلات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-300 text-xs">
                  تعرض الخريطة جميع الرحلات النشطة في الوقت الفعلي
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Interactive Map */}
          <div className="lg:col-span-3">
            <Card className="bg-slate-800/50 border-slate-700 h-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-white flex items-center gap-2">
                  <MapIcon className="w-5 h-5" />
                  خريطة الرحلات المباشرة
                </CardTitle>
              </CardHeader>
              <CardContent className="h-[calc(100%-4rem)]">
                <div className="h-full rounded-lg overflow-hidden">
                  <Map
                    className="w-full h-full"
                    center={mapCenter}
                    zoom={mapZoom}
                    markers={mapMarkers}
                    route={[]}
                    toast={(options: any) => console.log('Toast:', options)}
                  />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;
