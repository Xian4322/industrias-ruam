import { useState, useEffect } from 'react';
import { kanbanAPI, ordersAPI, qualityAPI } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import { useSocket } from '../hooks/useSocket';
import QualityChecklist from '../components/quality/QualityChecklist';
import PackagingQC from '../components/quality/PackagingQC';
import MaintenanceLog from '../components/quality/MaintenanceLog';
import AlertBanner from '../components/common/AlertBanner';
import { STAGE_NAMES, SNACK_LABELS, PRESENTATION_LABELS } from '../utils/calculations';
import { ChevronRight, Wifi, WifiOff, User, ClipboardList, ShieldCheck, AlertOctagon } from 'lucide-react';

export default function OperatorView() {
  const { user } = useAuth();
  const { isOnline, pendingCount, hasBlockedSync } = useOfflineSync();
  const [orders, setOrders] = useState([]);
  const [section, setSection] = useState('tasks');
  const [alert, setAlert] = useState(null);
  const { on } = useSocket();

  const fetchOrders = async () => {
    try {
      const data = await kanbanAPI.getBoard();
      const allOrders = [];
      Object.values(data.stages || {}).forEach(s => allOrders.push(...(s.orders || [])));
      setOrders(allOrders.filter(o => o.status === 'active'));
    } catch (err) { console.error(err); }
  };

  useEffect(() => { fetchOrders(); }, []);

  useEffect(() => {
    const unsub = on('kanban:updated', fetchOrders);
    return unsub;
  }, [on]);

  const handleAdvance = async (orderId) => {
    try {
      await kanbanAPI.advance(orderId);
      setAlert({ type: 'success', message: '✅ Etapa avanzada exitosamente' });
      fetchOrders();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  return (
    <div className="min-h-screen bg-ruam-dark pb-24">
      {/* Header */}
      <div className="glass-card rounded-none border-x-0 border-t-0 p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-ruam-gold/20 flex items-center justify-center">
              <User size={20} className="text-ruam-gold" />
            </div>
            <div>
              <p className="text-sm font-bold text-white">{user?.display_name}</p>
              <p className="text-[10px] text-gray-500 uppercase">Operario de Planta</p>
            </div>
          </div>
          <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium ${
            isOnline ? 'bg-emerald-500/10 text-emerald-400' : 'bg-red-500/10 text-red-400'}`}>
            {isOnline ? <Wifi size={14} /> : <WifiOff size={14} />}
            {isOnline ? 'En línea' : 'Sin conexión'}
            {pendingCount > 0 && <span className="ml-1 bg-amber-500/20 px-1.5 rounded-full">{pendingCount}</span>}
          </div>
        </div>
      </div>

      {hasBlockedSync && (
        <div className="p-4"><AlertBanner type="error" message="🔴 Sincronización bloqueada: Se detectaron lotes No Conformes pendientes. Contacte al Administrador." /></div>
      )}

      {alert && <div className="p-4"><AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} /></div>}

      {/* Section tabs */}
      <div className="flex gap-2 p-4 overflow-x-auto">
        {[
          { id: 'tasks', icon: ClipboardList, label: 'Mis Tareas' },
          { id: 'quality', icon: ShieldCheck, label: 'Calidad' },
          { id: 'emergency', icon: AlertOctagon, label: 'Paradas' },
        ].map(({ id, icon: Icon, label }) => (
          <button key={id} onClick={() => setSection(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold whitespace-nowrap transition-all ${
              section === id ? 'bg-ruam-gold/20 text-ruam-gold border border-ruam-gold/30' : 'bg-white/5 text-gray-400'}`}>
            <Icon size={18} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="p-4">
        {section === 'tasks' && (
          <div className="space-y-4">
            <h2 className="text-lg font-bold text-white">Pedidos Activos</h2>
            {orders.length === 0 && <p className="text-center text-gray-500 py-8">No hay pedidos activos</p>}
            {orders.map(order => (
              <div key={order.id} className="glass-card p-5 animate-fade-in">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <span className="text-xs font-mono text-gray-500">{order.order_code}</span>
                    <p className="text-base font-bold text-white mt-1">{order.client_name}</p>
                  </div>
                  <span className="text-xs px-2 py-1 rounded-full bg-ruam-gold/20 text-ruam-gold font-semibold">
                    {SNACK_LABELS[order.snack_type]}
                  </span>
                </div>
                <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded-full bg-violet-500/20 text-violet-400 text-[10px] font-semibold">
                      {PRESENTATION_LABELS[order.presentation] || order.presentation}
                    </span>
                    <span className="font-bold text-white text-sm">{order.units_requested} uds</span>
                  </div>
                  <span>{Number(order.kg_requested).toFixed(1)} kg</span>
                </div>
                <div className="text-xs text-gray-400 mb-4">
                  <span className="font-medium text-white">{STAGE_NAMES[order.kanban_stage]}</span>
                </div>
                {order.kanban_stage < 5 && (
                  <button onClick={() => handleAdvance(order.id)}
                    className="btn-operator bg-gradient-to-r from-emerald-500 to-emerald-700 text-white flex items-center justify-center gap-3">
                    AVANZAR A: {STAGE_NAMES[order.kanban_stage + 1]} <ChevronRight size={24} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {section === 'quality' && (
          <div className="space-y-6">
            <QualityChecklist />
            <PackagingQC />
          </div>
        )}

        {section === 'emergency' && <MaintenanceLog />}
      </div>
    </div>
  );
}
