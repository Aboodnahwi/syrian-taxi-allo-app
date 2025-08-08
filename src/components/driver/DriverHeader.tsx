
import { Button } from '@/components/ui/button';
import NotificationSystem from '@/components/NotificationSystem';
import { LogOut, Navigation } from 'lucide-react';

interface DriverHeaderProps {
  user: any;
  isOnline: boolean;
  toggleOnlineStatus: () => void;
  logout: () => void;
}

const DriverHeader = ({ user, isOnline, toggleOnlineStatus, logout }: DriverHeaderProps) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 to-emerald-900/95 backdrop-blur-sm p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-emerald-500 to-taxi-500 p-2 rounded-lg">
            <Navigation className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold font-cairo">سائق ألو تكسي</h1>
            <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user.name || 'سائق'}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <Button
            onClick={toggleOnlineStatus}
            className={`${
              isOnline 
                ? 'bg-emerald-500 hover:bg-emerald-600' 
                : 'bg-slate-500 hover:bg-slate-600'
            } text-white px-4 py-2`}
          >
            {isOnline ? 'متصل' : 'غير متصل'}
          </Button>
          
          <NotificationSystem userType="driver" />
          
          <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default DriverHeader;
