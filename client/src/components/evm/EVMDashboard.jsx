import { useState, useEffect } from 'react';
import { evmAPI } from '../../services/api';
import { formatCurrency } from '../../utils/calculations';
import { TrendingUp, AlertTriangle, RefreshCw } from 'lucide-react';

export default function EVMDashboard() {
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const data = await evmAPI.getAll();
      setRecords(data.evm_records || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  const handleRecalculate = async (orderId) => {
    try {
      await evmAPI.calculate(orderId);
      fetchData();
    } catch (err) { console.error(err); }
  };

  if (loading) return <div className="flex justify-center py-10"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="glass-card overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3 text-gray-400 font-medium">Orden</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">PV</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">EV</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">AC</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">CV</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">SV</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">CPI</th>
                <th className="text-right px-4 py-3 text-gray-400 font-medium">SPI</th>
                <th className="text-center px-4 py-3 text-gray-400 font-medium">Acción</th>
              </tr>
            </thead>
            <tbody>
              {records.map(r => {
                const cpiAlert = r.cpi > 0 && r.cpi < 1.0;
                return (
                  <tr key={r.id} className={`border-b border-white/5 transition-colors hover:bg-white/5 ${cpiAlert ? 'bg-red-500/5' : ''}`}>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        {cpiAlert && <AlertTriangle size={14} className="text-red-400" />}
                        <span className="font-mono text-gray-300">{r.order_code}</span>
                      </div>
                    </td>
                    <td className="text-right px-4 py-3 text-gray-300">{formatCurrency(r.pv)}</td>
                    <td className="text-right px-4 py-3 text-gray-300">{formatCurrency(r.ev)}</td>
                    <td className="text-right px-4 py-3 text-gray-300">{formatCurrency(r.ac)}</td>
                    <td className={`text-right px-4 py-3 font-semibold ${r.cv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(r.cv)}
                    </td>
                    <td className={`text-right px-4 py-3 font-semibold ${r.sv >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {formatCurrency(r.sv)}
                    </td>
                    <td className={`text-right px-4 py-3 font-bold ${r.cpi >= 1 ? 'text-emerald-400' : 'text-red-400'}`}>
                      {Number(r.cpi).toFixed(4)}
                    </td>
                    <td className={`text-right px-4 py-3 font-bold ${r.spi >= 1 ? 'text-emerald-400' : 'text-amber-400'}`}>
                      {Number(r.spi).toFixed(4)}
                    </td>
                    <td className="text-center px-4 py-3">
                      <button onClick={() => handleRecalculate(r.order_id)}
                        className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-ruam-gold transition-colors" title="Recalcular">
                        <RefreshCw size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {records.length === 0 && (
                <tr><td colSpan={9} className="text-center py-8 text-gray-500">No hay registros EVM aún</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
