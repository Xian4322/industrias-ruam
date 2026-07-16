import { NavLink, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { LayoutDashboard, Package, Columns3, ShieldCheck, TrendingUp, GitBranch, LogOut, Factory, ChevronLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/orders', icon: Package, label: 'Pedidos' },
  { to: '/kanban', icon: Columns3, label: 'Kanban' },
  { to: '/quality', icon: ShieldCheck, label: 'Calidad' },
  { to: '/evm', icon: TrendingUp, label: 'Costos EVM' },
  { to: '/changes', icon: GitBranch, label: 'Cambios' },
];

export default function Sidebar() {
  const { user, logout } = useAuth();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <aside className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 ${collapsed ? 'w-20' : 'w-64'} glass-card rounded-none border-l-0 border-t-0 border-b-0 flex flex-col`}>
      {/* Brand */}
      <div className="p-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ruam-gold to-amber-600 flex items-center justify-center flex-shrink-0">
            <Factory size={20} className="text-black" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-lg font-bold bg-gradient-to-r from-ruam-gold to-amber-400 bg-clip-text text-transparent">RUAM</h1>
              <p className="text-[10px] text-gray-500 uppercase tracking-wider">Gestión MTO</p>
            </div>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto">
        {NAV_ITEMS.map(({ to, icon: Icon, label }) => (
          <NavLink key={to} to={to}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-3 rounded-xl transition-all duration-200 group ${
                isActive
                  ? 'bg-gradient-to-r from-ruam-gold/20 to-amber-600/10 text-ruam-gold border border-ruam-gold/20'
                  : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
              }`
            }>
            <Icon size={20} className="flex-shrink-0" />
            {!collapsed && <span className="text-sm font-medium">{label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse Toggle */}
      <button onClick={() => setCollapsed(!collapsed)}
        className="mx-3 mb-2 p-2 rounded-lg hover:bg-white/5 text-gray-500 flex items-center justify-center">
        {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* User Info */}
      <div className="p-4 border-t border-white/10">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-full bg-ruam-gold/20 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-bold text-ruam-gold">{user?.display_name?.[0] || 'A'}</span>
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-gray-300 truncate">{user?.display_name}</p>
              <p className="text-[10px] text-gray-500 uppercase">{user?.role}</p>
            </div>
          )}
          <button onClick={logout} className="p-2 rounded-lg hover:bg-red-500/10 text-gray-500 hover:text-red-400 flex-shrink-0" title="Cerrar sesión">
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </aside>
  );
}
