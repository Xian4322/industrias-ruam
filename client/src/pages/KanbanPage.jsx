import KanbanBoard from '../components/kanban/KanbanBoard';

export default function KanbanPage() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Mueve los pedidos a través de las etapas de producción</p>
      </div>
      <KanbanBoard />
    </div>
  );
}
