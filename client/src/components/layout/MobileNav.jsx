import { NavLink } from 'react-router-dom';
import { ClipboardList, ShieldCheck, AlertOctagon, Info } from 'lucide-react';

const TABS = [
  { to: '/operator', icon: ClipboardList, label: 'Tareas', end: true },
  { to: '/operator/quality', icon: ShieldCheck, label: 'Calidad' },
  { to: '/operator/maintenance', icon: AlertOctagon, label: 'Paradas' },
  { to: '/operator/info', icon: Info, label: 'Info' },
];

export default function MobileNav() {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 glass-card rounded-none border-b-0 border-x-0 px-2 py-2 flex justify-around">
      {TABS.map(({ to, icon: Icon, label, end }) => (
        <NavLink key={to} to={to} end={end}
          className={({ isActive }) =>
            `flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-all ${
              isActive ? 'text-ruam-gold bg-ruam-gold/10' : 'text-gray-500'}`}>
          <Icon size={22} />
          <span className="text-[10px] font-medium">{label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
