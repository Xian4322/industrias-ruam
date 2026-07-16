import { Wifi, WifiOff, Bell } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export default function Header({ title, isOnline = true, alerts = [] }) {
  const { user } = useAuth();

  return (
    <header className="glass-card rounded-none border-t-0 border-x-0 px-6 py-4 flex items-center justify-between mb-6">
      <h1 className="text-xl font-bold text-white">{title}</h1>
      <div className="flex items-center gap-4">
        {/* Online Status */}
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${
          isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400 pulse-critical'}`}>
          {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
          {isOnline ? 'En línea' : 'Sin conexión'}
        </div>
        {/* Alerts */}
        <div className="relative">
          <Bell size={20} className="text-gray-400" />
          {alerts.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[10px] text-white flex items-center justify-center font-bold">
              {alerts.length}
            </span>
          )}
        </div>
        {/* User */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-ruam-gold/20 flex items-center justify-center">
            <span className="text-xs font-bold text-ruam-gold">{user?.display_name?.[0]}</span>
          </div>
          <span className="text-sm text-gray-300 hidden md:block">{user?.display_name}</span>
        </div>
      </div>
    </header>
  );
}
