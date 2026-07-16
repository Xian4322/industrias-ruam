import StatusBadge from '../common/StatusBadge';
import { formatCurrency } from '../../utils/calculations';
import { useAuth } from '../../context/AuthContext';
import { changesAPI } from '../../services/api';
import { Check, X } from 'lucide-react';

export default function ChangeRequestList({ changes, onRefresh }) {
  const { isAdmin } = useAuth();

  const handleApprove = async (id) => {
    try { await changesAPI.approve(id); onRefresh?.(); } catch (err) { console.error(err); }
  };
  const handleReject = async (id) => {
    try { await changesAPI.reject(id); onRefresh?.(); } catch (err) { console.error(err); }
  };

  return (
    <div className="space-y-4">
      {(changes || []).map(cr => (
        <div key={cr.id} className="glass-card-hover p-5 animate-fade-in">
          <div className="flex items-start justify-between mb-3">
            <div>
              <span className="text-xs font-mono text-gray-500">Cambio #{cr.id}</span>
              <span className="text-xs text-gray-500 ml-3">{cr.order_code}</span>
            </div>
            <StatusBadge status={cr.status} />
          </div>
          <p className="text-sm text-white mb-2">{cr.reason}</p>
          <div className="flex gap-4 text-xs text-gray-400 mb-3">
            <span>Impacto Costo: <strong className="text-white">{formatCurrency(cr.cost_impact)}</strong></span>
            <span>Tiempo: <strong className="text-white">{cr.time_impact_days || 0} días</strong></span>
            {cr.new_kg && <span>Nuevo Kg: <strong className="text-white">{cr.new_kg}</strong></span>}
          </div>
          <p className="text-[10px] text-gray-600">Solicitado por: {cr.requested_by_name} • {new Date(cr.created_at).toLocaleString('es-PE')}</p>

          {isAdmin && cr.status === 'pending' && (
            <div className="flex gap-2 mt-4">
              <button onClick={() => handleApprove(cr.id)}
                className="flex-1 py-2 bg-emerald-500/20 text-emerald-400 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 hover:bg-emerald-500/30 transition-colors">
                <Check size={16} /> Aprobar
              </button>
              <button onClick={() => handleReject(cr.id)}
                className="flex-1 py-2 bg-red-500/20 text-red-400 rounded-lg text-sm font-semibold flex items-center justify-center gap-1 hover:bg-red-500/30 transition-colors">
                <X size={16} /> Rechazar
              </button>
            </div>
          )}
        </div>
      ))}
      {(!changes || changes.length === 0) && (
        <div className="text-center py-8 text-gray-500 text-sm">No hay solicitudes de cambio</div>
      )}
    </div>
  );
}
