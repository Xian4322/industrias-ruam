import { useState, useEffect, useCallback } from 'react';
import { kanbanAPI } from '../../services/api';
import KanbanColumn from './KanbanColumn';
import { STAGE_NAMES } from '../../utils/calculations';
import { useSocket } from '../../hooks/useSocket';
import AlertBanner from '../common/AlertBanner';

export default function KanbanBoard() {
  const [stages, setStages] = useState({});
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);
  const { on } = useSocket();

  const fetchBoard = useCallback(async () => {
    try {
      const data = await kanbanAPI.getBoard();
      setStages(data.stages || {});
    } catch (err) { console.error(err); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { fetchBoard(); }, [fetchBoard]);

  useEffect(() => {
    const unsub1 = on('kanban:updated', () => fetchBoard());
    const unsub2 = on('order:frozen', (data) => {
      setAlert({ type: 'warning', message: data.message });
      fetchBoard();
    });
    const unsub3 = on('change:approved', (data) => {
      setAlert({ type: 'success', message: data.message });
      fetchBoard();
    });
    return () => { unsub1(); unsub2(); unsub3(); };
  }, [on, fetchBoard]);

  const handleAdvance = async (orderId) => {
    try {
      await kanbanAPI.advance(orderId);
      fetchBoard();
    } catch (err) {
      setAlert({ type: 'error', message: err.message });
    }
  };

  if (loading) return <div className="flex justify-center py-20"><div className="w-8 h-8 border-2 border-ruam-gold border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div>
      {alert && <div className="mb-4"><AlertBanner type={alert.type} message={alert.message} onDismiss={() => setAlert(null)} /></div>}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 overflow-x-auto">
        {[1, 2, 3, 4, 5].map(stage => (
          <KanbanColumn key={stage} stage={stage} name={STAGE_NAMES[stage]}
            orders={stages[stage]?.orders || []} onAdvance={handleAdvance} />
        ))}
      </div>
    </div>
  );
}
