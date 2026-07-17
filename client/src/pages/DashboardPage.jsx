import { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import KPICard from '../components/common/KPICard';
import { Activity, Target, AlertTriangle, DollarSign, Package, Clock, Droplets } from 'lucide-react';
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
  if (!data) return <div className="text-center py-20" style={{ color: 'var(--text-muted)' }}>Error al cargar datos</div>;

  const kpis = data.global_kpis;
  const oil = data.oil_consumption || {};

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

      {/* Orders Summary + Oil + Maintenance */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Orders summary */}
        <div className="glass-card p-5 animate-fade-in">
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Package size={16} /> Resumen de Pedidos
          </h3>
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-lg" style={{ background: 'var(--input-bg)' }}>
              <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{data.total_orders}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Total</p>
            </div>
            <div className="p-3 rounded-lg bg-emerald-500/10">
              <p className="text-2xl font-bold text-emerald-400">{data.active_orders}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Activos</p>
            </div>
            <div className="p-3 rounded-lg bg-blue-500/10">
              <p className="text-2xl font-bold text-blue-400">{data.completed_orders}</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Completados</p>
            </div>
          </div>
        </div>

        {/* 🛢️ Oil consumption indicator */}
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.1s' }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Droplets size={16} className="text-blue-400" /> Consumo de Aceite
          </h3>
          {/* Main KPI: liters per kg */}
          <div className="text-center mb-3">
            <p className={`text-3xl font-bold ${
              (oil.liters_per_kg || 0) <= 0.14 ? 'text-emerald-400' :
              (oil.liters_per_kg || 0) <= 0.20 ? 'text-amber-400' : 'text-red-400'
            }`}>
              {oil.liters_per_kg || 0} L/kg
            </p>
            <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Litros por kg empacado</p>
            <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
              Meta: ≤ 0.14 L/kg &nbsp;|&nbsp; {oil.total_kg_packed || 0} kg empacados
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="p-2 rounded-lg text-center" style={{ background: 'var(--input-bg)' }}>
              <p className="text-sm font-bold text-blue-400">{oil.total_liters || 0} L</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Total aceite</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'var(--input-bg)' }}>
              <p className="text-sm font-bold text-amber-400">{oil.tachos_used || 0}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Tachos (20L)</p>
            </div>
            <div className="p-2 rounded-lg text-center" style={{ background: 'var(--input-bg)' }}>
              <p className="text-sm font-bold text-ruam-gold">{formatCurrency(oil.total_cost)}</p>
              <p className="text-[10px]" style={{ color: 'var(--text-muted)' }}>Costo</p>
            </div>
          </div>
        </div>

        {/* Maintenance */}
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.15s' }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Activity size={16} /> Mantenimiento
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--input-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{data.maintenance?.mtbf_hours || 0} hrs</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MTBF</p>
            </div>
            <div className="p-3 rounded-lg text-center" style={{ background: 'var(--input-bg)' }}>
              <p className="text-lg font-bold" style={{ color: 'var(--text-primary)' }}>{data.maintenance?.mttr_minutes || 0} min</p>
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>MTTR</p>
            </div>
          </div>
          <p className="text-xs text-center mt-2" style={{ color: 'var(--text-muted)' }}>Eventos: {data.maintenance?.total_events || 0}</p>
        </div>

        {/* Active orders list */}
        <div className="glass-card p-5 animate-fade-in" style={{ animationDelay: '0.2s' }}>
          <h3 className="text-sm font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
            <Clock size={16} /> Pedidos Activos
          </h3>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {(data.metrics || []).filter(m => m.Status === 'active' || m.Status === 'frozen').slice(0, 5).map(m => (
              <div key={m.ID_Pedido} className="flex items-center justify-between py-1.5" style={{ borderBottom: '1px solid var(--border-color)' }}>
                <div>
                  <span className="text-xs font-mono" style={{ color: 'var(--text-primary)' }}>{m.ID_Pedido}</span>
                  <span className="text-xs ml-2" style={{ color: 'var(--text-muted)' }}>{SNACK_LABELS[m.Tipo_Snack]}</span>
                </div>
                <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{STAGE_NAMES[m.Kanban_Stage]}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Detailed metrics table */}
      <div className="glass-card overflow-hidden animate-fade-in" style={{ animationDelay: '0.3s' }}>
        <div className="p-5" style={{ borderBottom: '1px solid var(--border-color)' }}>
          <h3 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>📊 Métricas por Pedido (Power BI Ready)</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-muted)' }}>
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
                <tr key={m.ID_Pedido} style={{ borderBottom: '1px solid var(--border-color)' }}
                  className="hover:bg-ruam-gold/5 transition-colors">
                  <td className="px-4 py-2.5 font-mono" style={{ color: 'var(--text-primary)' }}>{m.ID_Pedido}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{m.Cliente}</td>
                  <td className="px-4 py-2.5" style={{ color: 'var(--text-secondary)' }}>{SNACK_LABELS[m.Tipo_Snack]}</td>
                  <td className="px-4 py-2.5"><span className="px-1.5 py-0.5 rounded-full text-[10px] font-semibold bg-violet-500/20 text-violet-400">{PRESENTATION_LABELS[m.Presentacion] || m.Presentacion}</span></td>
                  <td className="px-4 py-2.5 text-right font-semibold" style={{ color: 'var(--text-primary)' }}>{m.Unidades}</td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>{Number(m.Kg_Solicitados).toFixed(2)}</td>
                  <td className="px-4 py-2.5 text-right text-ruam-gold">{formatCurrency(m.Revenue)}</td>
                  <td className={`px-4 py-2.5 text-right font-bold ${m.CPI >= 1 ? 'text-emerald-400' : m.CPI ? 'text-red-400' : ''}`}
                    style={!m.CPI ? { color: 'var(--text-muted)' } : {}}>
                    {m.CPI ? m.CPI.toFixed(2) : '-'}
                  </td>
                  <td className={`px-4 py-2.5 text-right font-bold ${m.SPI >= 1 ? 'text-emerald-400' : m.SPI ? 'text-amber-400' : ''}`}
                    style={!m.SPI ? { color: 'var(--text-muted)' } : {}}>
                    {m.SPI ? m.SPI.toFixed(2) : '-'}
                  </td>
                  <td className="px-4 py-2.5 text-right" style={{ color: 'var(--text-secondary)' }}>{formatPercent(m.Indice_Rechazo)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
