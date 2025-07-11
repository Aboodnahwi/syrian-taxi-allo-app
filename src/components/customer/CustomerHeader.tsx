
import React from 'react';
import { Button } from '@/components/ui/button';
import { Car, LogOut } from 'lucide-react';
import NotificationSystem from '@/components/NotificationSystem';

interface CustomerHeaderProps {
  user: any;
  logout: () => void;
}

const CustomerHeader: React.FC<CustomerHeaderProps> = ({ user, logout }) => {
  return (
    <div className="bg-gradient-to-r from-slate-900/95 to-blue-900/95 backdrop-blur-sm p-4">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-r from-taxi-500 to-emerald-500 p-2 rounded-lg">
            <Car className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-white font-bold font-cairo">ألو تكسي</h1>
            <p className="text-slate-300 text-sm font-tajawal">مرحباً، {user?.name || 'عميل'}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <NotificationSystem userType="customer" />
          <Button variant="ghost" onClick={logout} className="text-white hover:bg-white/10">
            <LogOut className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default CustomerHeader;
