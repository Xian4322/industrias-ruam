import { useState, useEffect } from 'react';
import { evmAPI } from '../services/api';
import EVMDashboard from '../components/evm/EVMDashboard';
import CostBreakdown from '../components/evm/CostBreakdown';
import AlertBanner from '../components/common/AlertBanner';
import { useSocket } from '../hooks/useSocket';

export default function EVMPage() {
  const [selectedEVM, setSelectedEVM] = useState(null);
  const [alert, setAlert] = useState(null);
  const [records, setRecords] = useState([]);
  const { on } = useSocket();

  useEffect(() => {
    evmAPI.getAll().then(d => setRecords(d.evm_records || [])).catch(console.error);
  }, []);

  useEffect(() => {
    const unsub = on('alert:cost-overrun', (data) => {
      setAlert({ type: 'error', message: data.message });
    });
    return unsub;
  }, [on]);

  return (
    <div className="space-y-6">
      {alert && <AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} />}

      {/* Order selector for detailed view */}
      {records.length > 0 && (
        <div className="flex gap-2 flex-wrap">
          <button onClick={() => setSelectedEVM(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${!selectedEVM ? 'bg-ruam-gold/20 text-ruam-gold' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            Todos
          </button>
          {records.map(r => (
            <button key={r.id} onClick={() => setSelectedEVM(r)}
              className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${selectedEVM?.id === r.id ? 'bg-ruam-gold/20 text-ruam-gold' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {r.order_code}
            </button>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EVMDashboard />
        <CostBreakdown evm={selectedEVM} />
      </div>
    </div>
  );
}
