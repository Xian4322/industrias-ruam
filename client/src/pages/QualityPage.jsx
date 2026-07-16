import { useState } from 'react';
import QualityChecklist from '../components/quality/QualityChecklist';
import PackagingQC from '../components/quality/PackagingQC';
import MaintenanceLog from '../components/quality/MaintenanceLog';
import { ShieldCheck, Package, AlertOctagon } from 'lucide-react';

const TABS = [
  { id: 'checklist', label: 'Checklist Pre-Fritura', icon: ShieldCheck },
  { id: 'packaging', label: 'Control de Empaque', icon: Package },
  { id: 'maintenance', label: 'Registro de Paradas', icon: AlertOctagon },
];

export default function QualityPage() {
  const [activeTab, setActiveTab] = useState('checklist');

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {TABS.map(({ id, label, icon: Icon }) => (
          <button key={id} onClick={() => setActiveTab(id)}
            className={`flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === id ? 'bg-ruam-gold/20 text-ruam-gold border border-ruam-gold/30' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
            <Icon size={16} /> {label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="animate-fade-in" key={activeTab}>
        {activeTab === 'checklist' && <QualityChecklist />}
        {activeTab === 'packaging' && <PackagingQC />}
        {activeTab === 'maintenance' && <MaintenanceLog />}
      </div>
    </div>
  );
}
