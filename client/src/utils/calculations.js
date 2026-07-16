export const RECIPES = {
  papa: { name: 'Papa Nativa', price: 2.00, yield: 0.32, prep: 'Lavado manual', prepHours: 1.5, peeling: false },
  platano: { name: 'Plátano Bellaco', price: 3.00, yield: 0.30, prep: 'Pelado manual obligatorio', prepHours: 3.0, peeling: true },
  pituca: { name: 'Pituca Nativa', price: 2.50, yield: 0.35, prep: 'Lavado manual profundo', prepHours: 2.0, peeling: false },
};

export const PRESENTATIONS = {
  '34g': {
    label: 'Bolsita 34g',
    sublabel: '7 × S/.10.00',
    weight_kg: 0.034,
    unit_price: 10.00 / 7,
    pack_size: 7,
    pack_price: 10.00,
    retail_note: 'El negociante revende a S/.2.00 o S/.1.50 c/u',
  },
  '150g': {
    label: 'Bolsa 150g',
    sublabel: 'S/.2.50 c/u',
    weight_kg: 0.150,
    unit_price: 2.50,
    pack_size: 1,
    pack_price: 2.50,
    retail_note: 'Venta directa al negociante',
  },
};

export const OIL = { price: 130.00, volume: 20, factor: 0.14 };

/**
 * Calculate materials from presentation + units (not raw kg).
 */
export function calculateMaterials(snackType, presentation, units) {
  const r = RECIPES[snackType];
  const p = PRESENTATIONS[presentation];
  if (!r || !p) return null;

  const kgRequested = units * p.weight_kg;
  const rawKg = kgRequested / r.yield;
  const rawCost = rawKg * r.price;
  const oilLiters = kgRequested * OIL.factor;
  const oilCost = (oilLiters / OIL.volume) * OIL.price;
  const revenue = units * p.unit_price;

  return {
    recipeName: r.name, presentationLabel: p.label,
    units, unitPrice: +p.unit_price.toFixed(4),
    kgRequested: +kgRequested.toFixed(4),
    rawKg: +rawKg.toFixed(2), rawCost: +rawCost.toFixed(2),
    oilLiters: +oilLiters.toFixed(2), oilCost: +oilCost.toFixed(2),
    totalCost: +(rawCost + oilCost).toFixed(2),
    revenue: +revenue.toFixed(2),
    margin: +(revenue - rawCost - oilCost).toFixed(2),
    marginPct: revenue > 0 ? +((revenue - rawCost - oilCost) / revenue * 100).toFixed(1) : 0,
    prepType: r.prep,
    prepHours: +(r.prepHours * (kgRequested / 50)).toFixed(2),
    requiresPeeling: r.peeling, yieldRate: r.yield,
    packInfo: p.pack_size > 1
      ? `${Math.ceil(units / p.pack_size)} paquetes de ${p.pack_size} (${p.pack_size}×S/.${p.pack_price.toFixed(2)})`
      : `${units} unidades individuales`,
    retailNote: p.retail_note,
  };
}

export function getKPIStatus(metric, value) {
  const thresholds = {
    availability: { green: 0.95, yellow: 0.85, inverse: false },
    otif: { green: 0.95, yellow: 0.85, inverse: false },
    rejection: { green: 0.025, yellow: 0.05, inverse: true },
    cost_per_kg: { green: 6.50, yellow: 8.00, inverse: true },
  };
  const t = thresholds[metric];
  if (!t) return 'yellow';
  if (t.inverse) {
    if (value <= t.green) return 'green';
    if (value <= t.yellow) return 'yellow';
    return 'red';
  }
  if (value >= t.green) return 'green';
  if (value >= t.yellow) return 'yellow';
  return 'red';
}

export const formatCurrency = (val) => `S/. ${Number(val || 0).toFixed(2)}`;
export const formatPercent = (val) => `${(Number(val || 0) * 100).toFixed(1)}%`;
export const formatNumber = (val, dec = 2) => Number(val || 0).toFixed(dec);

export const STAGE_NAMES = {
  1: 'Pedido Confirmado', 2: 'Insumos Comprados', 3: 'Preparación',
  4: 'Procesamiento Integrado', 5: 'Despachado / Listo'
};

export const SNACK_LABELS = { papa: 'Papa Nativa', platano: 'Plátano Bellaco', pituca: 'Pituca Nativa' };

export const PRESENTATION_LABELS = { '34g': 'Bolsita 34g', '150g': 'Bolsa 150g' };

export const STAGE_COLORS = {
  1: 'from-blue-500 to-blue-700', 2: 'from-violet-500 to-violet-700',
  3: 'from-amber-500 to-amber-700', 4: 'from-orange-500 to-red-600',
  5: 'from-emerald-500 to-emerald-700'
};

export const FAILURE_LABELS = {
  brazo_presion: 'Brazo de presión trabado', cuchillas_desafiladas: 'Cuchillas desafiladas',
  caida_temperatura: 'Caída de temperatura', otro: 'Otro'
};
