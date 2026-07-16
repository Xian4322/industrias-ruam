import { useState, useEffect } from 'react';
import { qualityAPI, ordersAPI } from '../../services/api';
import { Thermometer, Wrench, ShieldCheck } from 'lucide-react';

export default function QualityChecklist() {
  const [orders, setOrders] = useState([]);
  const [selectedOrder, setSelectedOrder] = useState('');
  const [oilTempOk, setOilTempOk] = useState(false);
  const [bladeOk, setBladeOk] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    ordersAPI.getAll().then(data => {
      setOrders((data.orders || []).filter(o => o.kanban_stage === 3 && o.status === 'active'));
    }).catch(console.error);
  }, []);

  const handleSubmit = async () => {
    if (!selectedOrder) return;
    setLoading(true);
    try {
      const data = await qualityAPI.submitChecklist({
        order_id: parseInt(selectedOrder), oil_temp_ok: oilTempOk, blade_calibration_ok: bladeOk
      });
      setResult(data.quality_check);
    } catch (err) { setResult({ error: err.message }); }
    finally { setLoading(false); }
  };

  const bothOk = oilTempOk && bladeOk;

  return (
    <div className="glass-card p-6 space-y-6">
      <h3 className="text-lg font-bold text-white flex items-center gap-2">
        <ShieldCheck className="text-ruam-gold" size={22} />
        Checklist Metrológico Pre-Fritura
      </h3>

      <div>
        <label className="block text-sm text-gray-400 mb-2">Seleccionar Orden (Etapa Preparación)</label>
        <select className="select-field" value={selectedOrder} onChange={e => setSelectedOrder(e.target.value)}>
          <option value="">-- Seleccionar --</option>
          {orders.map(o => <option key={o.id} value={o.id}>{o.order_code} - {o.client_name}</option>)}
        </select>
      </div>

      <div className="space-y-4">
        {/* Temperature Check */}
        <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all
          ${oilTempOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
          <input type="checkbox" checked={oilTempOk} onChange={e => setOilTempOk(e.target.checked)}
            className="w-6 h-6 rounded-lg accent-emerald-500" />
          <Thermometer size={28} className={oilTempOk ? 'text-emerald-400' : 'text-gray-500'} />
          <div>
            <p className="font-semibold text-white">¿Temperatura del aceite estable entre 175°C y 180°C?</p>
            <p className="text-xs text-gray-500">Verificar con termómetro industrial</p>
          </div>
        </label>

        {/* Blade Check */}
        <label className={`flex items-center gap-4 p-5 rounded-xl border-2 cursor-pointer transition-all
          ${bladeOk ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/10 hover:border-white/20'}`}>
          <input type="checkbox" checked={bladeOk} onChange={e => setBladeOk(e.target.checked)}
            className="w-6 h-6 rounded-lg accent-emerald-500" />
          <Wrench size={28} className={bladeOk ? 'text-emerald-400' : 'text-gray-500'} />
          <div>
            <p className="font-semibold text-white">¿Doble cuchilla graduable de acero calibrada a 1.3 mm?</p>
            <p className="text-xs text-gray-500">Verificar calibración con galga</p>
          </div>
        </label>
      </div>

      {bothOk && (
        <button onClick={handleSubmit} disabled={loading || !selectedOrder}
          className="btn-success w-full flex items-center justify-center gap-2 text-lg py-4">
          <ShieldCheck size={22} />
          {loading ? 'Registrando...' : '✅ Aprobar y Desbloquear Freidora'}
        </button>
      )}

      {result && !result.error && (
        <div className={`p-4 rounded-xl border ${result.is_approved ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {result.is_approved ? '✅ Freidora desbloqueada - Puede avanzar a Procesamiento Integrado' : '❌ Checklist no aprobado'}
        </div>
      )}
      {result?.error && <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400">{result.error}</div>}
    </div>
  );
}
