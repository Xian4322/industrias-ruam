export default function KPICard({ title, value, unit, status = 'green', icon: Icon, subtitle }) {
  const colors = {
    green: { border: 'border-l-emerald-500', bg: 'bg-emerald-500/10', text: 'text-emerald-400', dot: 'bg-emerald-500' },
    yellow: { border: 'border-l-amber-500', bg: 'bg-amber-500/10', text: 'text-amber-400', dot: 'bg-amber-500' },
    red: { border: 'border-l-red-500', bg: 'bg-red-500/10', text: 'text-red-400', dot: 'bg-red-500 pulse-critical' },
  };
  const c = colors[status] || colors.green;

  return (
    <div className={`glass-card p-5 border-l-4 ${c.border} animate-fade-in`}>
      <div className="flex items-start justify-between">
        <div>
          <p className="text-sm text-gray-400 font-medium mb-1">{title}</p>
          <div className="flex items-baseline gap-1.5">
            <span className={`text-3xl font-bold ${c.text}`}>{value}</span>
            {unit && <span className="text-sm text-gray-500">{unit}</span>}
          </div>
          {subtitle && <p className="text-xs text-gray-500 mt-1">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-3 h-3 rounded-full ${c.dot}`} />
          {Icon && <div className={`p-2 rounded-xl ${c.bg}`}><Icon size={20} className={c.text} /></div>}
        </div>
      </div>
    </div>
  );
}
