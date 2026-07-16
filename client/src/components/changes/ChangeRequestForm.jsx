import { useState } from 'react';
import Modal from '../common/Modal';
import { changesAPI } from '../../services/api';
import { AlertTriangle } from 'lucide-react';
import { SNACK_LABELS, PRESENTATIONS } from '../../utils/calculations';

export default function ChangeRequestForm({ isOpen, onClose, orders, onCreated }) {
  const [form, setForm] = useState({ order_id: '', reason: '', cost_impact: '', time_impact_days: '', new_units: '', new_presentation: '', new_snack_type: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.order_id || !form.reason) return setError('Seleccione una orden y describa el motivo');
    setLoading(true); setError('');
    try {
      await changesAPI.create({
        ...form, order_id: parseInt(form.order_id),
        cost_impact: parseFloat(form.cost_impact) || 0,
        time_impact_days: parseFloat(form.time_impact_days) || 0,
        new_units: form.new_units ? parseInt(form.new_units) : null,
        new_presentation: form.new_presentation || null,
        new_snack_type: form.new_snack_type || null
      });
      onCreated?.();
      onClose();
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Solicitud de Cambio" size="md">
      <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400 text-sm mb-5 flex items-center gap-2">
        <AlertTriangle size={16} />
        <span>La orden será <strong>CONGELADA</strong> hasta que se resuelva esta solicitud.</span>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="p-3 rounded-xl bg-red-500/10 text-red-400 text-sm">{error}</div>}

        <div>
          <label className="block text-sm text-gray-400 mb-2">Orden</label>
          <select className="select-field" value={form.order_id} onChange={e => setForm({ ...form, order_id: e.target.value })}>
            <option value="">-- Seleccionar --</option>
            {(orders || []).filter(o => o.status === 'active').map(o =>
              <option key={o.id} value={o.id}>{o.order_code} - {o.client_name} ({o.units_requested} uds {o.presentation})</option>)}
          </select>
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Motivo del Cambio</label>
          <textarea className="input-field" rows={3} value={form.reason}
            onChange={e => setForm({ ...form, reason: e.target.value })} placeholder="Describir el motivo..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Impacto en Costo (S/.)</label>
            <input type="number" className="input-field" step="0.01" value={form.cost_impact}
              onChange={e => setForm({ ...form, cost_impact: e.target.value })} />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Impacto en Tiempo (días)</label>
            <input type="number" className="input-field" step="0.5" value={form.time_impact_days}
              onChange={e => setForm({ ...form, time_impact_days: e.target.value })} />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nuevas Unidades</label>
            <input type="number" className="input-field" step="1" min="1" value={form.new_units}
              onChange={e => setForm({ ...form, new_units: e.target.value })} placeholder="Opcional" />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nueva Presentación</label>
            <select className="select-field" value={form.new_presentation} onChange={e => setForm({ ...form, new_presentation: e.target.value })}>
              <option value="">Sin cambio</option>
              {Object.entries(PRESENTATIONS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Nuevo Tipo</label>
            <select className="select-field" value={form.new_snack_type} onChange={e => setForm({ ...form, new_snack_type: e.target.value })}>
              <option value="">Sin cambio</option>
              {Object.entries(SNACK_LABELS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-danger flex-1">
            {loading ? 'Enviando...' : 'Enviar y Congelar Orden'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
