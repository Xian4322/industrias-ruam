import { useState, useEffect } from 'react';
import { qualityAPI, ordersAPI } from '../../services/api';
import { AlertOctagon, Clock, CheckCircle, Activity } from 'lucide-react';
import { FAILURE_LABELS } from '../../utils/calculations';

export default function MaintenanceLog() {
  const [logs, setLogs] = useState([]);
  const [metrics, setMetrics] = useState(null);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ order_id: '', failure_type: 'cuchillas_desafiladas', description: '' });
  const [loading, setLoading] = useState(false);

  const fetchData = async () => {
    try {
      const data = await qualityAPI.getMaintenanceLogs();
      setLogs(data.logs || []);
      setMetrics(data.metrics || null);
    } catch (err) { console.error(err); }
  };

  useEffect(() => {
    fetchData();
    ordersAPI.getAll().then(d => setOrders((d.orders || []).filter(o => o.status === 'active'))).catch(console.error);
  }, []);

  const handleEmergency = async () => {
    setLoading(true);
    try {
      await qualityAPI.createMaintenance(form);
      setShowForm(false);
      setForm({ order_id: '', failure_type: 'cuchillas_desafiladas', description: '' });
      fetchData();
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  const handleClose = async (id) => {
    try {
      await qualityAPI.closeMaintenance(id);
      fetchData();
    } catch (err) { console.error(err); }
  };

  const activeLogs = logs.filter(l => !l.ended_at);
  const pastLogs = logs.filter(l => l.ended_at);

  return (
    <div className="space-y-6">
      {/* Emergency Button */}
      <button onClick={() => setShowForm(!showForm)}
        className="w-full py-6 bg-gradient-to-r from-red-600 to-red-800 text-white text-xl font-bold rounded-2xl
                   flex items-center justify-center gap-3 transition-all hover:shadow-xl hover:shadow-red-500/30
                   active:scale-[0.98] pulse-critical">
        <AlertOctagon size={28} /> 🚨 REGISTRAR PARADA DE EMERGENCIA
      </button>

      {showForm && (
        <div className="glass-card p-5 space-y-4 animate-slide-up">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Orden asociada (opcional)</label>
            <select className="select-field" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}>
              <option value="">-- Sin orden asociada --</option>
              {orders.map(o => <option key={o.id} value={o.id}>{o.order_code}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Tipo de Falla</label>
            <select className="select-field" value={form.failure_type} onChange={e => setForm({ ...form, failure_type: e.target.value })}>
              {Object.entries(FAILURE_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Descripción</label>
            <textarea className="input-field" rows={3} value={form.description}
              onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Describir la falla..." />
          </div>
          <button onClick={handleEmergency} disabled={loading} className="btn-danger w-full">
            {loading ? 'Registrando...' : 'Confirmar Parada'}
          </button>
        </div>
      )}

      {/* Active Stops */}
      {activeLogs.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-red-400">⏱️ Paradas Activas</h4>
          {activeLogs.map(log => (
            <div key={log.id} className="glass-card p-4 border-red-500/30 animate-fade-in">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-bold text-white">{FAILURE_LABELS[log.failure_type]}</span>
                <Clock size={16} className="text-red-400 animate-pulse" />
              </div>
              {log.description && <p className="text-xs text-gray-400 mb-3">{log.description}</p>}
              <p className="text-xs text-gray-500 mb-3">Inicio: {new Date(log.started_at).toLocaleString('es-PE')}</p>
              <button onClick={() => handleClose(log.id)}
                className="btn-success w-full py-3 text-sm flex items-center justify-center gap-2">
                <CheckCircle size={16} /> CERRAR PARADA
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Metrics */}
      {metrics && (
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-ruam-gold flex items-center gap-2 mb-4"><Activity size={16} /> Métricas de Mantenimiento</h4>
          <div className="grid grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <p className="text-xs text-gray-500">MTBF</p>
              <p className="text-lg font-bold text-white">{metrics.mtbf_hours} hrs</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <p className="text-xs text-gray-500">MTTR</p>
              <p className="text-lg font-bold text-white">{metrics.mttr_minutes} min</p>
            </div>
            <div className={`p-3 rounded-lg text-center ${metrics.availability >= 0.95 ? 'kpi-green' : metrics.availability >= 0.85 ? 'kpi-yellow' : 'kpi-red'}`}>
              <p className="text-xs">Disponibilidad</p>
              <p className="text-lg font-bold">{(metrics.availability * 100).toFixed(1)}%</p>
            </div>
          </div>
        </div>
      )}

      {/* History */}
      {pastLogs.length > 0 && (
        <div className="glass-card p-5">
          <h4 className="text-sm font-semibold text-gray-300 mb-3">Historial de Paradas</h4>
          <div className="space-y-2">
            {pastLogs.slice(0, 10).map(log => (
              <div key={log.id} className="flex items-center justify-between py-2 border-b border-white/5">
                <div>
                  <span className="text-sm text-white">{FAILURE_LABELS[log.failure_type]}</span>
                  {log.order_code && <span className="text-xs text-gray-500 ml-2">({log.order_code})</span>}
                </div>
                <span className="text-xs text-gray-400">{log.duration_minutes?.toFixed(1)} min</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
