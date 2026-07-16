import KanbanCard from './KanbanCard';
import { STAGE_COLORS } from '../../utils/calculations';

export default function KanbanColumn({ stage, name, orders, onAdvance }) {
  return (
    <div className="kanban-column">
      <div className={`flex items-center justify-between px-3 py-2 rounded-xl bg-gradient-to-r ${STAGE_COLORS[stage]} mb-2`}>
        <h3 className="text-sm font-bold text-white">{name}</h3>
        <span className="w-6 h-6 rounded-full bg-white/20 text-white text-xs font-bold flex items-center justify-center">
          {orders.length}
        </span>
      </div>
      <div className="flex-1 space-y-3 overflow-y-auto">
        {orders.map((order, i) => (
          <div key={order.id} className="animate-fade-in" style={{ animationDelay: `${i * 0.05}s` }}>
            <KanbanCard order={order} stage={stage} onAdvance={onAdvance} />
          </div>
        ))}
        {orders.length === 0 && (
          <div className="flex-1 flex items-center justify-center py-8">
            <p className="text-xs text-gray-600">Sin pedidos</p>
          </div>
        )}
      </div>
    </div>
  );
}
