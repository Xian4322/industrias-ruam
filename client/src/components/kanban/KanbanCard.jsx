import { ChevronRight, AlertTriangle, Snowflake } from 'lucide-react';
import { SNACK_LABELS, PRESENTATION_LABELS } from '../../utils/calculations';
import StatusBadge from '../common/StatusBadge';

const SNACK_COLORS = {
  papa: 'bg-amber-500/20 text-amber-400',
  platano: 'bg-green-500/20 text-green-400',
  pituca: 'bg-violet-500/20 text-violet-400',
};

export default function KanbanCard({ order, stage, onAdvance }) {
  const isFrozen = order.status === 'frozen';
  const needsQC = stage === 3;

  return (
    <div className={`glass-card-hover p-4 ${isFrozen ? 'border-blue-500/30 pulse-critical' : ''}`}>
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500">{order.order_code}</span>
        {isFrozen && <span className="flex items-center gap-1 text-[10px] text-blue-400 font-bold"><Snowflake size={12} />CONGELADO</span>}
      </div>
      <p className="text-sm font-semibold text-white mb-2 truncate">{order.client_name}</p>
      <div className="flex items-center gap-2 mb-1.5 flex-wrap">
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${SNACK_COLORS[order.snack_type]}`}>
          {SNACK_LABELS[order.snack_type]}
        </span>
        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-400">
          {PRESENTATION_LABELS[order.presentation] || order.presentation}
        </span>
      </div>
      <div className="flex items-center gap-3 text-xs text-gray-400 mb-3">
        <span className="font-bold text-white">{order.units_requested} uds</span>
        <span>•</span>
        <span>{Number(order.kg_requested).toFixed(1)} kg</span>
      </div>
      {needsQC && (
        <div className="flex items-center gap-1 mb-2 text-amber-400 text-[10px]">
          <AlertTriangle size={12} /> Requiere checklist antes de avanzar
        </div>
      )}
      {stage < 5 && !isFrozen && (
        <button onClick={() => onAdvance(order.id)}
          className="w-full py-2 bg-gradient-to-r from-emerald-500 to-emerald-700 text-white text-xs font-semibold rounded-lg
                     flex items-center justify-center gap-1 transition-all hover:shadow-lg hover:shadow-emerald-500/25 active:scale-[0.98]">
          Avanzar Etapa <ChevronRight size={14} />
        </button>
      )}
      {stage === 5 && <StatusBadge status="completed" />}
    </div>
  );
}
