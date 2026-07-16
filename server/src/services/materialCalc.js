// ──────────────────────────────────────────────
// Industrias RUAM – Material / BOM Calculation Service
// ──────────────────────────────────────────────

/**
 * Product recipes – one entry per snack type.
 * All monetary values are in Peruvian Soles (S/.).
 */
const RECIPES = {
  papa: {
    name: 'Papa Nativa',
    price_per_kg: 2.00,
    yield_rate: 0.32,
    prep_type: 'Lavado manual',
    prep_hours_per_50kg: 1.5,
    requires_peeling: false,
  },
  platano: {
    name: 'Plátano Bellaco',
    price_per_kg: 3.00,
    yield_rate: 0.30,
    prep_type: 'Pelado manual obligatorio',
    prep_hours_per_50kg: 3.0,
    requires_peeling: true,
  },
  pituca: {
    name: 'Pituca Nativa',
    price_per_kg: 2.50,
    yield_rate: 0.35,
    prep_type: 'Lavado manual profundo',
    prep_hours_per_50kg: 2.0,
    requires_peeling: false,
  },
};

/**
 * Presentaciones de venta.
 *
 * ── 34g (Bolsita personal) ──
 *   RUAM vende al negociante: 7 bolsitas por S/.10.00
 *   Precio unitario RUAM: S/.10/7 ≈ S/.1.4286
 *   El negociante revende a S/.2.00 o S/.1.50 c/u
 *
 * ── 150g (Bolsa grande) ──
 *   RUAM vende al negociante: S/.2.50 por unidad
 */
const PRESENTATIONS = {
  '34g': {
    label: 'Bolsita 34g (7×S/.10)',
    weight_kg: 0.034,
    unit_price: 10.00 / 7,         // S/.1.4286 por unidad
    pack_size: 7,                   // se vende en paquetes de 7
    pack_price: 10.00,              // precio del paquete
    retail_prices: [2.00, 1.50],    // precios sugeridos del negociante
  },
  '150g': {
    label: 'Bolsa 150g (S/.2.50 c/u)',
    weight_kg: 0.150,
    unit_price: 2.50,               // S/.2.50 por unidad
    pack_size: 1,
    pack_price: 2.50,
    retail_prices: [2.50],
  },
};

/**
 * Oil configuration – price and consumption constants.
 */
const OIL_CONFIG = {
  price_per_tacho: 130.00,
  tacho_volume_liters: 20,
  consumption_factor: 0.14,
};

/**
 * Convert units + presentation into kg of finished product.
 */
function unitsToKg(presentation, units) {
  const pres = PRESENTATIONS[presentation];
  if (!pres) throw new Error(`Presentación desconocida: "${presentation}"`);
  return units * pres.weight_kg;
}

/**
 * Calculate revenue (PV) from units + presentation.
 */
function calculateRevenue(presentation, units) {
  const pres = PRESENTATIONS[presentation];
  if (!pres) throw new Error(`Presentación desconocida: "${presentation}"`);
  return units * pres.unit_price;
}

/**
 * Calculate the Bill of Materials (BOM) for a given snack type,
 * presentation and number of units requested.
 *
 * @param {string} snackType    – Key from RECIPES ('papa' | 'platano' | 'pituca').
 * @param {string} presentation – Key from PRESENTATIONS ('34g' | '150g').
 * @param {number} units        – Number of finished-product units.
 * @returns {Object} Detailed BOM breakdown.
 */
function calculateBOM(snackType, presentation, units) {
  const recipe = RECIPES[snackType];
  if (!recipe) {
    throw new Error(
      `Tipo de snack desconocido: "${snackType}". Tipos válidos: ${Object.keys(RECIPES).join(', ')}.`
    );
  }

  const pres = PRESENTATIONS[presentation];
  if (!pres) {
    throw new Error(
      `Presentación desconocida: "${presentation}". Válidas: ${Object.keys(PRESENTATIONS).join(', ')}.`
    );
  }

  // ── kg of finished product ────────────────
  const kgRequested = units * pres.weight_kg;

  // ── Raw material ──────────────────────────
  const raw_material_kg   = kgRequested / recipe.yield_rate;
  const raw_material_cost = raw_material_kg * recipe.price_per_kg;

  // ── Oil ───────────────────────────────────
  const oil_liters = kgRequested * OIL_CONFIG.consumption_factor;
  const oil_cost   = (oil_liters / OIL_CONFIG.tacho_volume_liters) * OIL_CONFIG.price_per_tacho;

  // ── Totals ────────────────────────────────
  const total_material_cost = raw_material_cost + oil_cost;

  // ── Revenue (what RUAM charges the client) ─
  const revenue = units * pres.unit_price;

  // ── Prep hours ────────────────────────────
  const prep_hours = recipe.prep_hours_per_50kg * (kgRequested / 50);

  return {
    snack_type: snackType,
    recipe_name: recipe.name,
    presentation,
    presentation_label: pres.label,
    units,
    unit_price: parseFloat(pres.unit_price.toFixed(4)),
    kg_requested: parseFloat(kgRequested.toFixed(4)),
    revenue: parseFloat(revenue.toFixed(2)),
    yield_rate: recipe.yield_rate,
    raw_material_kg: parseFloat(raw_material_kg.toFixed(4)),
    raw_material_cost: parseFloat(raw_material_cost.toFixed(2)),
    oil_liters: parseFloat(oil_liters.toFixed(4)),
    oil_cost: parseFloat(oil_cost.toFixed(2)),
    total_material_cost: parseFloat(total_material_cost.toFixed(2)),
    prep_hours: parseFloat(prep_hours.toFixed(4)),
    prep_type: recipe.prep_type,
    requires_peeling: recipe.requires_peeling,
  };
}

function getRecipe(snackType) {
  return RECIPES[snackType] || null;
}

function getOilConfig() {
  return OIL_CONFIG;
}

module.exports = {
  RECIPES,
  PRESENTATIONS,
  OIL_CONFIG,
  calculateBOM,
  unitsToKg,
  calculateRevenue,
  getRecipe,
  getOilConfig,
};
