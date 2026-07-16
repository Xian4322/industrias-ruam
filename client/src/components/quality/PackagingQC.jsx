import { useState, useEffect } from 'react';
import { qualityAPI, ordersAPI } from '../../services/api';
import { Package, Scale, Stamp } from 'lucide-react';

export default function PackagingQC() {
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({ order_id: '', kg_conforming: '', kg_waste: '', sealed_ok: false });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    ordersAPI.getAll().then(data => {
      setOrders((data.orders || []).filter(o => o.kanban_stage >= 4 && o.status === 'active'));
    }).catch(console.error);
  }, []);

  const kgC = parseFloat(form.kg_conforming) || 0;
  const kgW = parseFloat(form.kg_waste) || 0;
  const total = kgC + kgW;
  const rejectionIndex = total > 0 ? kgW / total : 0;
  const isConforming = form.sealed_ok && rejectionIndex <= 0.025;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const data = await qualityAPI.submitPackaging({
        order_id: parseInt(form.order_id), kg_conforming: kgC, kg_waste: kgW, sealed_ok: form.sealed_ok
      });
      setResult(data);
    } catch (err) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  };

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <Package className="text-ruam-gold" size={22} /> Control de Calidad - Empaque
      </h3>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm text-gray-400 mb-2">Orden</label>
          <select className="select-field" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}>
            <option value="">-- Seleccionar --</option>
            {orders.map(o => <option key={o.id} value={o.id}>{o.order_code} - {o.client_name}</option>)}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2 flex items-center gap-1"><Scale size={14} /> Kg Conformes</label>
            <input type="number" className="input-field" step="0.1" min="0" value={form.kg_conforming}
              onChange={e => setForm({ ...form, kg_conforming: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Kg Merma/Rechazo</label>
            <input type="number" className="input-field" step="0.1" min="0" value={form.kg_waste}
              onChange={e => setForm({ ...form, kg_waste: e.target.value })} />
          </div>
        </div>

        <label className={`flex items-center gap-4 p-4 rounded-xl border-2 cursor-pointer transition-all
          ${form.sealed_ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10'}`}>
          <input type="checkbox" checked={form.sealed_ok} onChange={e => setForm({ ...form, sealed_ok: e.target.checked })}
            className="w-6 h-6 accent-emerald-500" />
          <Stamp size={22} className={form.sealed_ok ? 'text-emerald-400' : 'text-gray-500'} />
          <span className="font-medium text-white">Bolsa sellada herméticamente</span>
        </label>

        {total > 0 && (
          <div className={`p-4 rounded-xl border ${isConforming ? 'kpi-green' : 'kpi-red pulse-critical'}`}>
            <p className="text-sm font-semibold">
              Índice de Rechazo: {(rejectionIndex * 100).toFixed(2)}%
              {isConforming ? ' ✅ CONFORME' : ' 🔴 NO CONFORME'}
            </p>
          </div>
        )}

        <button type="submit" disabled={loading || !form.order_id} className="btn-primary w-full">
          {loading ? 'Registrando...' : 'Registrar Control de Empaque'}
        </button>
      </form>

      {result?.error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{result.error}</div>}
      {result?.packaging_qc && <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-sm">✅ Control registrado exitosamente</div>}
    </div>
  );
}
