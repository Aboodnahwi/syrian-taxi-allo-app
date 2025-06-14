
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car, LogOut } from 'lucide-react';
import NotificationSystem from '@/components/NotificationSystem';

interface CustomerPageHeaderProps {
  userName: string;
  onSignOut: () => void;
}

const CustomerPageHeader: React.FC<CustomerPageHeaderProps> = ({
  userName,
  onSignOut
}) => {
  return (
    <div className="absolute top-0 left-0 right-0 z-30 bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-sm p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-2 rounded-lg">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold font-cairo">ألو تكسي</h1>
            <p className="text-slate-300 text-sm font-tajawal">مرحباً، {userName}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationSystem userType="customer" />
          <Button variant="ghost" onClick={onSignOut} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerPageHeader;
