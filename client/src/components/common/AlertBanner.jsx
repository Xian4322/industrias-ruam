import { useEffect, useState } from 'react';
import { X, AlertTriangle, CheckCircle, Info, AlertOctagon } from 'lucide-react';

export default function AlertBanner({ type = 'info', message, onDismiss }) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (type !== 'error') {
      const timer = setTimeout(() => { setVisible(false); onDismiss?.(); }, 10000);
      return () => clearTimeout(timer);
    }
  }, [type, onDismiss]);

  if (!visible) return null;

  const styles = {
    success: { bg: 'bg-emerald-500/10 border-emerald-500/30', icon: CheckCircle, color: 'text-emerald-400' },
    warning: { bg: 'bg-amber-500/10 border-amber-500/30', icon: AlertTriangle, color: 'text-amber-400' },
    error: { bg: 'bg-red-500/10 border-red-500/30 pulse-critical', icon: AlertOctagon, color: 'text-red-400' },
    info: { bg: 'bg-blue-500/10 border-blue-500/30', icon: Info, color: 'text-blue-400' },
  };
  const s = styles[type];
  const Icon = s.icon;

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${s.bg} animate-slide-up`}>
      <Icon size={20} className={s.color} />
      <p className={`flex-1 text-sm font-medium ${s.color}`}>{message}</p>
      <button onClick={() => { setVisible(false); onDismiss?.(); }}
        className="p-1 rounded-lg hover:bg-white/10"><X size={16} className="text-gray-400" /></button>
    </div>
  );
}
