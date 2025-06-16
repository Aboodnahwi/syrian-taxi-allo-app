
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
  Drawer,
  DrawerContent,
  DrawerDescription,
  DrawerHeader,
  DrawerTitle,
  DrawerTrigger,
} from '@/components/ui/drawer';
import { ChevronUp, ChevronDown } from 'lucide-react';
import RideRequestCard from './RideRequestCard';

interface RideRequestDrawerProps {
  rideRequests: any[];
  acceptRide: (request: any) => void;
  rejectRide: (requestId: string) => void;
}

const RideRequestDrawer = ({ rideRequests, acceptRide, rejectRide }: RideRequestDrawerProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (rideRequests.length === 0) return null;

  return (
    <Drawer open={isOpen} onOpenChange={setIsOpen}>
      <DrawerTrigger asChild>
        <div className="fixed bottom-0 left-0 right-0 z-50">
          <Button
            variant="ghost"
            className="w-full h-12 bg-gradient-to-r from-emerald-600 to-taxi-600 text-white rounded-none rounded-t-lg shadow-lg border-0"
          >
            <div className="flex items-center justify-center gap-2">
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
              <span className="font-semibold">طلبات الرحلات ({rideRequests.length})</span>
              {isOpen ? <ChevronDown className="w-5 h-5" /> : <ChevronUp className="w-5 h-5" />}
            </div>
          </Button>
        </div>
      </DrawerTrigger>
      <DrawerContent className="max-h-[70vh]">
        <DrawerHeader>
          <DrawerTitle className="text-center font-cairo">طلبات الرحلات الجديدة</DrawerTitle>
          <DrawerDescription className="text-center font-tajawal">
            اختر الرحلة المناسبة لك
          </DrawerDescription>
        </DrawerHeader>
        <div className="p-4 space-y-3 overflow-y-auto">
          {rideRequests.map((request) => (
            <RideRequestCard 
              key={request.id}
              request={request}
              acceptRide={acceptRide}
              rejectRide={rejectRide}
            />
          ))}
        </div>
      </DrawerContent>
    </Drawer>
  );
};

export default RideRequestDrawer;
