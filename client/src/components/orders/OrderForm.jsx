import { useState } from 'react';
import Modal from '../common/Modal';
import { ordersAPI } from '../../services/api';
import { calculateMaterials, formatCurrency, SNACK_LABELS, PRESENTATIONS } from '../../utils/calculations';
import { Wheat, Droplets, Clock, Calculator, Package, DollarSign, TrendingUp, ShoppingBag } from 'lucide-react';

export default function OrderForm({ isOpen, onClose, onCreated }) {
  const [form, setForm] = useState({ client_name: '', snack_type: 'papa', presentation: '34g', units_requested: 70 });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const units = parseInt(form.units_requested) || 0;
  const preview = form.snack_type && form.presentation && units > 0
    ? calculateMaterials(form.snack_type, form.presentation, units) : null;

  const pres = PRESENTATIONS[form.presentation];

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.client_name.trim()) return setError('Ingrese el nombre del cliente');
    if (units <= 0) return setError('Ingrese la cantidad de unidades');
    setLoading(true);
    setError('');
    try {
      await ordersAPI.create({
        client_name: form.client_name,
        snack_type: form.snack_type,
        presentation: form.presentation,
        units_requested: units,
      });
      onCreated?.();
      onClose();
      setForm({ client_name: '', snack_type: 'papa', presentation: '34g', units_requested: 70 });
    } catch (err) { setError(err.message); }
    finally { setLoading(false); }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Nuevo Pedido MTO" size="lg">
      <form onSubmit={handleSubmit} className="space-y-5">
        {error && <div className="p-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-sm">{error}</div>}

        <div>
          <label className="block text-sm text-gray-400 mb-2">Cliente / Negociante</label>
          <input className="input-field" placeholder="Nombre del negociante" value={form.client_name}
            onChange={(e) => setForm({ ...form, client_name: e.target.value })} />
        </div>

        <div>
          <label className="block text-sm text-gray-400 mb-2">Tipo de Snack</label>
          <div className="grid grid-cols-3 gap-3">
            {Object.entries(SNACK_LABELS).map(([key, label]) => (
              <button type="button" key={key}
                onClick={() => setForm({ ...form, snack_type: key })}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  form.snack_type === key
                    ? 'border-ruam-gold bg-ruam-gold/10 text-ruam-gold'
                    : 'border-white/10 bg-white/5 text-gray-400 hover:border-white/20'}`}>
                <span className="text-2xl block mb-1">{key === 'papa' ? '🥔' : key === 'platano' ? '🍌' : '🟤'}</span>
                <span className="text-sm font-semibold">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Presentation selector */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">Presentación</label>
          <div className="grid grid-cols-2 gap-3">
            {Object.entries(PRESENTATIONS).map(([key, p]) => (
              <button type="button" key={key}
                onClick={() => setForm({ ...form, presentation: key, units_requested: key === '34g' ? 70 : 20 })}
                className={`p-4 rounded-xl border-2 text-left transition-all ${
                  form.presentation === key
                    ? 'border-ruam-gold bg-ruam-gold/10'
                    : 'border-white/10 bg-white/5 hover:border-white/20'}`}>
                <div className="flex items-center gap-2 mb-1">
                  <ShoppingBag size={18} className={form.presentation === key ? 'text-ruam-gold' : 'text-gray-500'} />
                  <span className={`font-bold ${form.presentation === key ? 'text-ruam-gold' : 'text-white'}`}>{p.label}</span>
                </div>
                <p className="text-xs text-gray-400">{p.sublabel}</p>
                <p className="text-[10px] text-gray-500 mt-1">{p.retail_note}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Units input */}
        <div>
          <label className="block text-sm text-gray-400 mb-2">
            Cantidad de Unidades
            {pres && pres.pack_size > 1 && (
              <span className="ml-2 text-xs text-ruam-gold">
                (se venden en paquetes de {pres.pack_size} = S/.{pres.pack_price.toFixed(2)})
              </span>
            )}
          </label>
          <input type="number" className="input-field text-2xl font-bold text-center" min="1" step="1"
            value={form.units_requested}
            onChange={(e) => setForm({ ...form, units_requested: e.target.value })} />
          {preview && pres?.pack_size > 1 && (
            <p className="text-xs text-gray-500 mt-1 text-center">
              = {Math.ceil(units / pres.pack_size)} paquetes de {pres.pack_size} unidades
            </p>
          )}
        </div>

        {/* Live material calculation preview */}
        {preview && (
          <div className="mt-4 p-5 rounded-xl bg-ruam-navy/50 border border-white/5 space-y-4 animate-fade-in">
            <h3 className="text-sm font-semibold text-ruam-gold flex items-center gap-2">
              <Calculator size={16} /> Cálculo Automático
            </h3>

            {/* Revenue & margin */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-gradient-to-br from-ruam-gold/10 to-amber-500/5 border border-ruam-gold/20">
                <DollarSign size={16} className="text-ruam-gold mb-1" />
                <p className="text-xs text-gray-500">Ingreso (PV)</p>
                <p className="text-2xl font-bold text-ruam-gold">{formatCurrency(preview.revenue)}</p>
                <p className="text-[10px] text-gray-500">{preview.packInfo}</p>
              </div>
              <div className={`p-3 rounded-lg border ${preview.margin > 0 ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-red-500/10 border-red-500/20'}`}>
                <TrendingUp size={16} className={preview.margin > 0 ? 'text-emerald-400' : 'text-red-400'} />
                <p className="text-xs text-gray-500">Margen Bruto</p>
                <p className={`text-2xl font-bold ${preview.margin > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                  {formatCurrency(preview.margin)}
                </p>
                <p className="text-[10px] text-gray-500">{preview.marginPct}% del ingreso</p>
              </div>
            </div>

            {/* BOM details */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div className="p-3 rounded-lg bg-white/5">
                <Package size={14} className="text-violet-400 mb-1" />
                <p className="text-xs text-gray-500">Producto Terminado</p>
                <p className="text-lg font-bold text-white">{preview.kgRequested} kg</p>
                <p className="text-[10px] text-gray-500">{preview.units} × {form.presentation}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <Wheat size={14} className="text-amber-400 mb-1" />
                <p className="text-xs text-gray-500">Materia Prima</p>
                <p className="text-lg font-bold text-white">{preview.rawKg} kg</p>
                <p className="text-xs text-gray-400">{formatCurrency(preview.rawCost)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <Droplets size={14} className="text-blue-400 mb-1" />
                <p className="text-xs text-gray-500">Aceite</p>
                <p className="text-lg font-bold text-white">{preview.oilLiters} L</p>
                <p className="text-xs text-gray-400">{formatCurrency(preview.oilCost)}</p>
              </div>
              <div className="p-3 rounded-lg bg-white/5">
                <Clock size={14} className="text-violet-400 mb-1" />
                <p className="text-xs text-gray-500">{preview.prepType}</p>
                <p className="text-lg font-bold text-white">{preview.prepHours} hrs</p>
                <p className="text-xs text-gray-400">Rend: {(preview.yieldRate * 100)}%</p>
              </div>
            </div>

            <div className="text-center p-2 rounded-lg bg-white/5">
              <span className="text-xs text-gray-500">Costo Total Material: </span>
              <span className="text-sm font-bold text-white">{formatCurrency(preview.totalCost)}</span>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button type="button" onClick={onClose} className="btn-secondary flex-1">Cancelar</button>
          <button type="submit" disabled={loading} className="btn-primary flex-1">
            {loading ? 'Creando...' : 'Crear Pedido'}
          </button>
        </div>
      </form>
    </Modal>
  );
}
