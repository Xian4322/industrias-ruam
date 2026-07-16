import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import KPICard from '../components/common/KPICard';
import { Activity, Target, AlertTriangle, DollarSign, Package, Clock } from 'lucide-react';
import { formatCurrency, formatPercent, STAGE_NAMES, SNACK_LABELS, PRESENTATION_LABELS } from '../utils/calculations';

export default function DashboardPage() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    dashboardAPI.getMetrics()
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>;
  if (!data) return <div className="text-center py-20 text-gray-500">Error al cargar datos</div>;

  const kpis = data.global_kpis;

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <KPICard title="Disponibilidad Maquinaria" value={formatPercent(kpis.availability?.value)}
          status={kpis.availability?.status} icon={Activity} subtitle="Meta: ≥ 95%" />
        <KPICard title="Nivel OTIF" value={formatPercent(kpis.otif?.value)}
          status={kpis.otif?.status} icon={Target} subtitle="Meta: ≥ 95%" />
        <KPICard title="Índice de Rechazo" value={formatPercent(kpis.avg_rejection_index?.value)}
          status={kpis.avg_rejection_index?.status} icon={AlertTriangle} subtitle="Meta: ≤ 2.5%" />
        <KPICard title="Costo por Kg" value={formatCurrency(kpis.avg_cost_per_kg?.value)}
          status={kpis.avg_cost_per_kg?.status} icon={DollarSign} subtitle="Meta: ≤ S/.6.50" />
      </div>

      {/* Orders Summary */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="glass-card p-5 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><Package size={16} /> Resumen de Pedidos</h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-white">{data.total_orders}</p>
              <p className="text-xs text-gray-500">Total</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-400">{data.active_orders}</p>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <p className="text-2xl font-bold text-blue-400">{data.completed_orders}</p>
              <p className="text-xs text-gray-500">Completados</p>
            </div>
          </div>
        </div>

        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><Activity size={16} /> Mantenimiento</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <p className="text-lg font-bold text-white">{data.maintenance?.mtbf_hours || 0} hrs</p>
              <p className="text-xs text-gray-500">MTBF</p>
            </div>
            <div className="p-3 rounded-lg bg-white/5 text-center">
              <p className="text-lg font-bold text-white">{data.maintenance?.mttr_minutes || 0} min</p>
              <p className="text-xs text-gray-500">MTTR</p>
            </div>
          </div>
          <p className="text-xs text-gray-600 mt-2 text-center">Eventos: {data.maintenance?.total_events || 0}</p>
        </div>

        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold text-gray-400 mb-4 flex items-center gap-2"><Clock size={16} /> Pedidos Activos</h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(data.metrics || []).filter(m => m.Status === 'active' || m.Status === 'frozen').slice(0, 5).map(m => (
              <div key={m.ID_Pedido} className="flex items-center justify-between py-1.5 border-b border-white/5">
                <div>
                  <span className="text-xs font-mono text-gray-300">{m.ID_Pedido}</span>
                  <span className="text-xs text-gray-500 ml-2">{SNACK_LABELS[m.Tipo_Snack]}</span>
                </div>
                <span className="text-xs text-gray-400">{STAGE_NAMES[m.Kanban_Stage]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed metrics table */}
      <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="p-5 border-b border-white/10">
          <h3 className="text-sm font-semibold text-gray-300">📊 Métricas por Pedido (Power BI Ready)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10 text-gray-500">
                <th className="text-left px-4 py-3">Pedido</th>
                <th className="text-left px-4 py-3">Cliente</th>
                <th className="text-left px-4 py-3">Snack</th>
                <th className="text-left px-4 py-3">Pres.</th>
                <th className="text-right px-4 py-3">Uds</th>
                <th className="text-right px-4 py-3">Kg</th>
                <th className="text-right px-4 py-3">Ingreso</th>
                <th className="text-right px-4 py-3">CPI</th>
                <th className="text-right px-4 py-3">SPI</th>
                <th className="text-right px-4 py-3">Rechazo</th>
              </tr>
            </thead>
            <tbody>
              {(data.metrics || []).map(m => (
                <tr key={m.ID_Pedido} className="border-b border-white/5 hover:bg-white/5">
                  <td className="px-4 py-2.5 font-mono text-gray-300">{m.ID_Pedido}</td>
                  <td className="px-4 py-2.5 text-gray-400">{m.Cliente}</td>
                  <td className="px-4 py-2.5 text-gray-400">{SNACK_LABELS[m.Tipo_Snack]}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-400">{PRESENTATION_LABELS[m.Presentacion] || m.Presentacion}</span></td>
                  <td className="px-4 py-2.5 text-right text-white font-semibold">{m.Unidades}</td>
                  <td className="px-4 py-2.5 text-right text-gray-300">{Number(m.Kg_Solicitados).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-ruam-gold">{formatCurrency(m.Revenue)}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${m.CPI >= 1 ? 'text-emerald-400' : m.CPI ? 'text-red-400' : 'text-gray-600'}`}>
                    {m.CPI ? m.CPI.toFixed(2) : '-'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold ${m.SPI >= 1 ? 'text-emerald-400' : m.SPI ? 'text-amber-400' : 'text-gray-600'}`}>
                    {m.SPI ? m.SPI.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right text-gray-400">{formatPercent(m.Indice_Rechazo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
