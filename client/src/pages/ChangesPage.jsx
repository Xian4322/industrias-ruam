import { useState, useEffect } from 'react';
import { changesAPI, ordersAPI } from '../services/api';
import ChangeRequestForm from '../components/changes/ChangeRequestForm';
import ChangeRequestList from '../components/changes/ChangeRequestList';
import { Plus, GitBranch } from 'lucide-react';

export default function ChangesPage() {
  const [changes, setChanges] = useState([]);
  const [orders, setOrders] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try {
      const [chData, ordData] = await Promise.all([changesAPI.getAll(), ordersAPI.getAll()]);
      setChanges(chData.change_requests || []);
      setOrders(ordData.orders || []);
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  };

  useEffect(() => { fetchData(); }, []);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-500">Gestión de cambios en especificaciones y cronograma</p>
        <button onClick={() => setShowForm(true)} className="btn-primary flex items-center gap-2">
          <Plus size={18} /> Nueva Solicitud
        </button>
      </div>

      {loading ? (
        <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>
      ) : (
        <ChangeRequestList changes={changes} onRefresh={fetchData} />
      )}

      <ChangeRequestForm isOpen={showForm} onClose={() => setShowForm(false)} orders={orders} onCreated={fetchData} />
    </div>
  );
}
