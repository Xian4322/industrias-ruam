import { formatCurrency } from '../../utils/calculations';

export default function CostBreakdown({ evm }) {
  if (!evm) return <div className="glass-card p-6 text-center text-gray-500">Seleccione una orden para ver el desglose</div>;

  const maxVal = Math.max(evm.pv, evm.ev, evm.ac, 1);
  const bars = [
    { label: 'PV (Planificado)', value: evm.pv, color: 'from-blue-500 to-blue-700' },
    { label: 'EV (Ganado)', value: evm.ev, color: 'from-emerald-500 to-emerald-700' },
    { label: 'AC (Costo Real)', value: evm.ac, color: evm.ac > evm.ev ? 'from-red-500 to-red-700' : 'from-amber-500 to-amber-700' },
  ];

  return (
    <div className="glass-card p-6 space-y-6">
      <h4 className="text-sm font-semibold text-gray-300">Desglose de Costos - {evm.order_code}</h4>

      {/* Bar chart */}
      <div className="space-y-3">
        {bars.map(b => (
          <div key={b.label}>
            <div className="flex justify-between text-xs text-gray-400 mb-1">
              <span>{b.label}</span><span>{formatCurrency(b.value)}</span>
            </div>
            <div className="h-6 bg-white/5 rounded-full overflow-hidden">
              <div className={`h-full bg-gradient-to-r ${b.color} rounded-full transition-all duration-700`}
                style={{ width: `${(b.value / maxVal) * 100}%` }} />
            </div>
          </div>
        ))}
      </div>

      {/* Cost composition */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <p className="text-xs text-gray-500">Material</p>
          <p className="text-sm font-bold text-white">{formatCurrency(evm.material_cost)}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <p className="text-xs text-gray-500">Aceite</p>
          <p className="text-sm font-bold text-white">{formatCurrency(evm.oil_cost_actual)}</p>
        </div>
        <div className="p-3 rounded-lg bg-white/5 text-center">
          <p className="text-xs text-gray-500">Mano de Obra</p>
          <p className="text-sm font-bold text-white">{formatCurrency(evm.labor_cost)}</p>
        </div>
      </div>

      {/* Variance indicators */}
      <div className="grid grid-cols-2 gap-3">
        <div className={`p-3 rounded-lg text-center ${evm.cv >= 0 ? 'kpi-green' : 'kpi-red'}`}>
          <p className="text-xs">CV (Variación Costo)</p>
          <p className="text-lg font-bold">{evm.cv >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(evm.cv))}</p>
        </div>
        <div className={`p-3 rounded-lg text-center ${evm.sv >= 0 ? 'kpi-green' : 'kpi-yellow'}`}>
          <p className="text-xs">SV (Variación Cronograma)</p>
          <p className="text-lg font-bold">{evm.sv >= 0 ? '▲' : '▼'} {formatCurrency(Math.abs(evm.sv))}</p>
        </div>
      </div>
    </div>
  );
}
