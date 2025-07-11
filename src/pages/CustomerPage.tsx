
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import Map from '@/components/map/Map';
import CustomerHeader from '@/components/customer/CustomerHeader';
import RequestRideCard from '@/components/customer/RequestRideCard';
import { useMap } from '@/hooks/useMap';
import { useRideRequest } from '@/hooks/customer/useRideRequest';
import { useUserLocation } from '@/hooks/customer/useUserLocation';
import { supabase } from '@/integrations/supabase/client';
import RideStatusDisplay from '@/components/customer/RideStatusDisplay';

const CustomerPage = () => {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [user, setUser] = useState<any>(null);
  const [isRequesting, setIsRequesting] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState<{
    lat: number;
    lng: number;
    address: string;
  } | null>(null);
  const [markers, setMarkers] = useState<any[]>([]);
  const [route, setRoute] = useState<[number, number][] | undefined>(undefined);
	
  const [activeTrip, setActiveTrip] = useState<any>(null);

  const { userLocation, fetchUserLocation } = useUserLocation();
  const { requestRide, rideRequestLoading } = useRideRequest();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (!userData) {
      navigate('/auth');
      return;
    }

    try {
      const parsedUser = JSON.parse(userData);
      if (parsedUser.role !== 'customer') {
        navigate('/auth');
        return;
      }
      setUser(parsedUser);
    } catch (error) {
      console.error('Error parsing user data:', error);
      localStorage.removeItem('user');
      navigate('/auth');
    }
  }, [navigate]);

  useEffect(() => {
    if (!userLocation) {
      fetchUserLocation();
    }
  }, [userLocation, fetchUserLocation]);

  const { mapRef, mapInstanceRef, centerOnCurrentLocation } = useMap({
    center: userLocation || [33.5138, 36.2765],
    zoom: 13,
    onLocationSelect: (lat, lng, address) => {
      console.log('Selected location:', lat, lng, address);
      setSelectedLocation({ lat, lng, address });
      setMarkers([{
        id: 'selected-location',
        position: [lat, lng],
        popup: address,
        draggable: true,
        onDragEnd: (newLat, newLng, newAddress) => {
          setSelectedLocation({ lat: newLat, lng: newLng, address: newAddress });
        }
      }]);
    }
  });

  useEffect(() => {
    if (userLocation && mapInstanceRef.current) {
      centerOnCurrentLocation();
    }
  }, [userLocation, mapInstanceRef, centerOnCurrentLocation]);

  const handleRequestRide = async (destination: string) => {
    if (!selectedLocation) {
      toast({
        title: "Please select a pickup location",
        description: "Click on the map to select your current location.",
        variant: "destructive"
      });
      return;
    }

    if (!user || !user.id || !user.name || !user.phone) {
      toast({
        title: "User information missing",
        description: "Please log in again.",
        variant: "destructive"
      });
      return;
    }

    setIsRequesting(true);

    const rideRequestData = {
      from_location: selectedLocation.address,
      to_location: destination,
      from_coordinates: [selectedLocation.lat, selectedLocation.lng] as [number, number],
      customer_id: user.id,
      customer_name: user.name,
      customer_phone: user.phone
    };

    const result = await requestRide(rideRequestData);

    if (result?.success) {
      toast({
        title: "Ride Requested",
        description: "We are looking for a driver for you!",
        className: "bg-green-50 border-green-200 text-green-800"
      });
    } else {
      toast({
        title: "Request Failed",
        description: result?.error || "Failed to request ride. Please try again.",
        variant: "destructive"
      });
    }

    setIsRequesting(false);
  };

  const logout = () => {
    console.log('Logging out...');
    localStorage.removeItem('user');
    navigate('/auth');
  };

  // مراقبة الرحلات النشطة للزبون
  useEffect(() => {
    if (!user?.id) return;

    const checkActiveTrip = async () => {
      try {
        const { data: trips, error } = await supabase
          .from('trips')
          .select('*, profiles!trips_driver_id_fkey(*)')
          .eq('customer_id', user.id)
          .in('status', ['pending', 'accepted', 'arrived', 'started'])
          .order('created_at', { ascending: false })
          .limit(1);

        if (error) {
          console.error('خطأ في جلب الرحلات النشطة:', error);
          return;
        }

        if (trips && trips.length > 0) {
          setActiveTrip(trips[0]);
        } else {
          setActiveTrip(null);
        }
      } catch (error) {
        console.error('خطأ في checkActiveTrip:', error);
      }
    };

    // فحص أولي
    checkActiveTrip();

    // الاشتراك في التحديثات الفورية
    const channel = supabase
      .channel('customer-trips')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'trips',
        filter: `customer_id=eq.${user.id}`
      }, (payload) => {
        console.log('تحديث الرحلة:', payload);
        checkActiveTrip();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user?.id]);

  return (
    <div className="h-screen w-full relative overflow-hidden bg-slate-900">
      <Map
        className="absolute inset-0 w-full h-full z-0"
        markers={markers}
        route={route}
        center={userLocation || [33.5138, 36.2765]}
        zoom={13}
        toast={toast}
      />

      <div className="absolute inset-x-0 top-0 z-50">
        <CustomerHeader user={user} logout={logout} />
      </div>

      {/* عرض حالة الرحلة للزبون */}
      {activeTrip && (
        <RideStatusDisplay
          rideStatus={activeTrip.status}
          driverName={activeTrip.profiles?.name}
          driverPhone={activeTrip.profiles?.phone}
          estimatedArrival={activeTrip.estimated_duration}
          currentLocation={activeTrip.status === 'started' ? 'في الطريق إلى الوجهة' : undefined}
        />
      )}

      <div className="absolute bottom-0 left-0 right-0 p-4 z-40">
        <RequestRideCard
          onConfirm={handleRequestRide}
          isLoading={isRequesting || rideRequestLoading}
          location={selectedLocation?.address}
        />
      </div>
    </div>
  );
};

export default CustomerPage;
