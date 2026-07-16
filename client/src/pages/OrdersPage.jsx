import { useState, useEffect } from 'react';
import { ordersAPI } from '../services/api';
import OrderForm from '../components/orders/OrderForm';
import MaterialCalculation from '../components/orders/MaterialCalculation';
import Modal from '../components/common/Modal';
import StatusBadge from '../components/common/StatusBadge';
import { SNACK_LABELS, STAGE_NAMES, PRESENTATION_LABELS, formatCurrency } from '../utils/calculations';
import { Plus, Eye } from 'lucide-react';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [filter, setFilter] = useState('all');

  const fetchOrders = async () => {
    try { const data = await ordersAPI.getAll(); setOrders(data.orders || []); }
    catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchOrders(); }, []);

  const filtered = filter === 'all' ? orders : orders.filter(o => o.status === filter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex gap-2">
          {['all', 'active', 'frozen', 'completed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filter === f ? 'bg-ruam-gold/20 text-ruam-gold border border-ruam-gold/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {f === 'all' ? 'Todos' : f === 'active' ? 'Activos' : f === 'frozen' ? 'Congelados' : 'Completados'}
            </button>
          ))}
        </div>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nuevo Pedido
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <div className="glass-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Código</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Cliente</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Snack</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Presentación</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Unidades</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Kg</th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">Ingreso</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Etapa</th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">Estado</th>
                  <th className="text-center px-4 py-3 text-gray-400 font-medium">Ver</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o, i) => (
                  <tr key={o.id} className="border-b border-white/5 hover:bg-white/5 transition-colors animate-fade-in" style={{ animationDelay: `${i * 0.03}s` }}>
                    <td className="px-4 py-3 font-mono text-gray-300">{o.order_code}</td>
                    <td className="px-4 py-3 text-white">{o.client_name}</td>
                    <td className="px-4 py-3 text-gray-400">{SNACK_LABELS[o.snack_type]}</td>
                    <td className="px-4 py-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-400">
                        {PRESENTATION_LABELS[o.presentation] || o.presentation}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">{o.units_requested}</td>
                    <td className="px-4 py-3 text-right text-gray-400">{Number(o.kg_requested).toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-ruam-gold font-semibold">{formatCurrency(o.revenue_total)}</td>
                    <td className="px-4 py-3 text-xs text-gray-400">{STAGE_NAMES[o.kanban_stage]}</td>
                    <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
                    <td className="px-4 py-3 text-center">
                      <button onClick={() => setSelectedOrder(o)} className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-ruam-gold">
                        <Eye size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <OrderForm isOpen={showForm} onClose={() => setShowForm(false)} onCreated={fetchOrders} />

      {/* Order detail modal */}
      <Modal isOpen={!!selectedOrder} onClose={() => setSelectedOrder(null)} title={`Detalle: ${selectedOrder?.order_code}`} size="lg">
        {selectedOrder && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4 text-sm">
              <div><span className="text-gray-500">Cliente:</span> <span className="text-white ml-2">{selectedOrder.client_name}</span></div>
              <div><span className="text-gray-500">Tipo:</span> <span className="text-white ml-2">{SNACK_LABELS[selectedOrder.snack_type]}</span></div>
              <div><span className="text-gray-500">Presentación:</span> <span className="text-white ml-2">{PRESENTATION_LABELS[selectedOrder.presentation]}</span></div>
              <div><span className="text-gray-500">Unidades:</span> <span className="text-white font-bold ml-2">{selectedOrder.units_requested}</span></div>
              <div><span className="text-gray-500">Kg Terminados:</span> <span className="text-white ml-2">{Number(selectedOrder.kg_requested).toFixed(2)} kg</span></div>
              <div><span className="text-gray-500">Ingreso:</span> <span className="text-ruam-gold font-bold ml-2">{formatCurrency(selectedOrder.revenue_total)}</span></div>
              <div><span className="text-gray-500">Etapa:</span> <span className="text-white ml-2">{STAGE_NAMES[selectedOrder.kanban_stage]}</span></div>
            </div>
            <MaterialCalculation materials={selectedOrder} />
          </div>
        )}
      </Modal>
    </div>
  );
}
