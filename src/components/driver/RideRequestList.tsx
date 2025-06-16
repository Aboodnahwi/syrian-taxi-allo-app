
import RideRequestCard from './RideRequestCard';

interface RideRequestListProps {
  rideRequests: any[];
  acceptRide: (request: any) => void;
  rejectRide: (requestId: number) => void;
}

const RideRequestList = ({ rideRequests, acceptRide, rejectRide }: RideRequestListProps) => {
  return (
    <div className="absolute bottom-0 left-0 right-0 z-30 max-h-[50vh] overflow-y-auto">
      <div className="p-4 space-y-3">
        <h3 className="text-white font-bold font-cairo text-lg bg-slate-900/80 backdrop-blur-sm rounded-lg p-2 text-center">
          طلبات الرحلات ({rideRequests.length})
        </h3>
        
        {rideRequests.map((request) => (
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
