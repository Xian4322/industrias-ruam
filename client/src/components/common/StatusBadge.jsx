export default function StatusBadge({ status, label }) {
  const styles = {
    active: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    frozen: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
    completed: 'bg-gray-500/20 text-gray-400 border-gray-500/30',
    cancelled: 'bg-red-500/20 text-red-400 border-red-500/30',
    pending: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
    approved: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    rejected: 'bg-red-500/20 text-red-400 border-red-500/30',
  };
  const labels = {
    active: 'Activo', frozen: '🧊 Congelado', completed: 'Completado',
    cancelled: 'Cancelado', pending: 'Pendiente', approved: 'Aprobado', rejected: 'Rechazado'
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${styles[status] || styles.active}`}>
      {label || labels[status] || status}
    </span>
  );
}
