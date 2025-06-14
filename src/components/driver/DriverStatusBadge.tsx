
import { Badge } from '@/components/ui/badge';

interface DriverStatusBadgeProps {
  isOnline: boolean;
}

const DriverStatusBadge = ({ isOnline }: DriverStatusBadgeProps) => {
  return (
    <div className="absolute top-20 right-4 z-30">
      <Badge 
        className={`${
          isOnline ? 'bg-emerald-500' : 'bg-slate-500'
        } text-white px-3 py-2 text-sm font-tajawal`}
      >
        {isOnline ? '🟢 متاح للعمل' : '🔴 غير متاح'}
      </Badge>
    </div>
  );
};

export default DriverStatusBadge;
