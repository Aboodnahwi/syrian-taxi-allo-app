
import RideRequestCard from './RideRequestCard';

interface RideRequestListProps {
  rideRequests: any[];
  acceptRide: (request: any) => Promise<{ success: boolean; }>;
  rejectRide: (requestId: string) => Promise<void>;
  acceptedRideId?: string;
}

const RideRequestList = ({ rideRequests, acceptRide, rejectRide, acceptedRideId }: RideRequestListProps) => {
  // إزالة الرحلة المقبولة من القائمة
  const filteredRequests = rideRequests.filter(request => request.id !== acceptedRideId);

  if (filteredRequests.length === 0) {
    return (
      <div className="absolute bottom-0 left-0 right-0 z-30">
        <div className="p-4">
          <div className="text-white font-bold font-cairo text-lg bg-slate-900/80 backdrop-blur-sm rounded-lg p-4 text-center">
            لا توجد طلبات رحلات متاحة
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[50vh] overflow-y-auto">
      <div className="p-4 space-y-3">
        <h3 className="text-white font-bold font-cairo text-lg bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 text-center">
          طلبات الرحلات ({filteredRequests.length})
        </h3>
        
        {filteredRequests.map((request) => (
          <RideRequestCard 
            key={request.id}
            request={request}
            acceptRide={acceptRide}
            rejectRide={rejectRide}
          />
        ))}
      </div>
    </div>
  );
};

export default RideRequestList;
