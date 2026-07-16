import { formatCurrency } from '../../utils/calculations';
import { Wheat, Droplets, Wrench } from 'lucide-react';

export default function MaterialCalculation({ materials }) {
  if (!materials) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Wheat size={18} className="text-amber-400" />
          <h4 className="text-sm font-semibold text-gray-300">Materia Prima</h4>
        </div>
        <p className="text-2xl font-bold text-white">{Number(materials.raw_material_kg).toFixed(2)} kg</p>
        <p className="text-sm text-gray-400 mt-1">{formatCurrency(materials.raw_material_cost)}</p>
      </div>
      <div className="glass-card p-4">
        <div className="flex items-center gap-2 mb-3">
          <Droplets size={18} className="text-blue-400" />
          <h4 className="text-sm font-semibold text-gray-300">Aceite</h4>
        </div>
        <p className="text-2xl font-bold text-white">{Number(materials.oil_liters).toFixed(2)} L</p>
        <p className="text-sm text-gray-400 mt-1">{formatCurrency(materials.oil_cost)}</p>
      </div>
      <div className="glass-card p-4 border-ruam-gold/20">
        <div className="flex items-center gap-2 mb-3">
          <Wrench size={18} className="text-violet-400" />
          <h4 className="text-sm font-semibold text-gray-300">Preparación</h4>
        </div>
        <p className="text-lg font-bold text-ruam-gold">{materials.prep_type}</p>
        <p className="text-sm text-gray-400 mt-1">Total: {formatCurrency(materials.total_material_cost)}</p>
      </div>
    </div>
  );
}
