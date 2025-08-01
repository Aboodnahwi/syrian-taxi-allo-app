
import React from 'react';
import { DollarSign, Clock, MapPin, Square } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';

interface LiveFareCounterProps {
  currentFare: number;
  startTime: Date;
  distance: number;
}

const LiveFareCounter: React.FC<LiveFareCounterProps> = ({
  currentFare,
  startTime,
  distance
}) => {
  const [elapsedTime, setElapsedTime] = React.useState(0);

  React.useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000);
      setElapsedTime(elapsed);
    }, 1000);

    return () => clearInterval(interval);
  }, [startTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="bg-gradient-to-r from-green-600 to-blue-600 text-white">
      <CardContent className="p-4">
        <div className="grid grid-cols-3 gap-4 text-center">
          <div>
            <DollarSign className="w-6 h-6 mx-auto mb-2" />
            <div className="text-2xl font-bold">{currentFare.toLocaleString()}</div>
            <div className="text-xs opacity-90">ل.س</div>
          </div>
          
          <div>
            <Clock className="w-6 h-6 mx-auto mb-2" />
            <div className="text-lg font-bold">{formatTime(elapsedTime)}</div>
            <div className="text-xs opacity-90">الوقت المنقضي</div>
          </div>
          
          <div>
            <MapPin className="w-6 h-6 mx-auto mb-2" />
            <div className="text-lg font-bold">{distance.toFixed(1)}</div>
            <div className="text-xs opacity-90">كم</div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-center">
          <Square className="w-4 h-4 mr-2 text-red-400" />
          <span className="text-sm">رحلة جارية</span>
        </div>
      </CardContent>
    </Card>
  );
};

export default LiveFareCounter;
