// ──────────────────────────────────────────────
// Industrias RUAM – Database Seed
// ──────────────────────────────────────────────

const bcrypt = require('bcryptjs');
const { calculateBOM } = require('./services/materialCalc');

function runSeed(db) {
  // Check if already seeded
  const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get().count;
  if (userCount > 0) {
    console.log('[Seed] Base de datos ya contiene datos, omitiendo seed.');
    return;
  }

  console.log('[Seed] Insertando datos de demostración...');

  const hash = (pw) => bcrypt.hashSync(pw, 10);

  // ═══════════════════════════════════════════
  // USERS
  // ═══════════════════════════════════════════
  const insertUser = db.prepare(`
    INSERT INTO users (username, password_hash, role, display_name, daily_wage) VALUES (?, ?, ?, ?, ?)
  `);

  insertUser.run('admin', hash('admin123'), 'admin', 'Gerente RUAM', 0);
  insertUser.run('operario1', hash('op123'), 'operario', 'Carlos M. - Lavado/Pelado', 60.00);
  insertUser.run('operario2', hash('op123'), 'operario', 'Luis R. - Fritura/Corte', 70.00);
  insertUser.run('operario3', hash('op123'), 'operario', 'Ana P. - Empaque/QC', 60.00);
  insertUser.run('operario4', hash('op123'), 'operario', 'Jorge S. - Logística', 60.00);

  // ═══════════════════════════════════════════
  // BASELINE CONFIG
  // ═══════════════════════════════════════════
  const insertConfig = db.prepare(`
    INSERT INTO baseline_config (config_key, config_value, description) VALUES (?, ?, ?)
  `);

  insertConfig.run('oil_price_per_tacho', 130.00, 'Precio por tacho de aceite (20L)');
  insertConfig.run('oil_tacho_volume', 20.00, 'Volumen del tacho de aceite en litros');
  insertConfig.run('oil_factor_per_kg', 0.14, 'Litros de aceite por kg de chip terminado');
  insertConfig.run('presentation_34g_pack_price', 10.00, 'Precio de 7 bolsitas de 34g');
  insertConfig.run('presentation_34g_pack_size', 7, 'Bolsitas por paquete');
  insertConfig.run('presentation_150g_unit_price', 2.50, 'Precio por bolsa de 150g');
  insertConfig.run('kpi_availability_target', 0.95, 'Meta de disponibilidad de maquinaria');
  insertConfig.run('kpi_otif_target', 0.95, 'Meta OTIF');
  insertConfig.run('kpi_rejection_max', 0.025, 'Máximo índice de rechazo');
  insertConfig.run('kpi_cost_per_kg_max', 6.50, 'Costo máximo por kg en S/.');

  // ═══════════════════════════════════════════
  // DEMO ORDERS (por presentación/unidades)
  // ═══════════════════════════════════════════

  // ── Order 1: Papa 34g – 700 unidades (100 paquetes de 7) – Completed ──
  // 700 × 0.034kg = 23.8kg finished product
  // Revenue: 700 × (10/7) = S/.1000.00
  const bom1 = calculateBOM('papa', '34g', 700);
  db.prepare(`
    INSERT INTO orders (order_code, client_name, snack_type, presentation, units_requested, unit_price, kg_requested, revenue_total, kanban_stage, status, created_at, completed_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ORD-2026-001', 'Distribuidora Huánuco SAC', 'papa', '34g', 700, bom1.unit_price, bom1.kg_requested, bom1.revenue, 5, 'completed',
    '2026-07-01T08:00:00Z', '2026-07-03T16:00:00Z');

  db.prepare(`
    INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(1, bom1.raw_material_kg, bom1.raw_material_cost, bom1.oil_liters, bom1.oil_cost, bom1.total_material_cost, bom1.prep_type);

  // Kanban history for order 1
  const insertKH = db.prepare(`INSERT INTO kanban_history (order_id, from_stage, to_stage, changed_by, notes, created_at) VALUES (?, ?, ?, ?, ?, ?)`);
  insertKH.run(1, null, 1, 1, 'Pedido creado', '2026-07-01T08:00:00Z');
  insertKH.run(1, 1, 2, 1, 'Insumos comprados', '2026-07-01T10:00:00Z');
  insertKH.run(1, 2, 3, 2, 'Inicio preparación', '2026-07-02T08:00:00Z');
  insertKH.run(1, 3, 4, 2, 'Inicio procesamiento', '2026-07-02T11:00:00Z');
  insertKH.run(1, 4, 5, 3, 'Despachado', '2026-07-03T16:00:00Z');

  // Quality check & Packaging QC
  db.prepare(`INSERT INTO quality_checks (order_id, operator_id, oil_temp_ok, blade_calibration_ok, checked_at) VALUES (?, ?, ?, ?, ?)`).run(1, 3, 1, 1, '2026-07-02T10:45:00Z');
  db.prepare(`INSERT INTO packaging_qc (order_id, operator_id, kg_conforming, kg_waste, sealed_ok, checked_at) VALUES (?, ?, ?, ?, ?, ?)`).run(1, 4, 23.2, 0.6, 1, '2026-07-03T14:00:00Z');

  // EVM for order 1 (good performance)
  db.prepare(`
    INSERT INTO evm_records (order_id, pv, ev, ac, cv, sv, cpi, spi, labor_cost, material_cost, oil_cost_actual)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(1, bom1.revenue, bom1.revenue, bom1.revenue * 0.85, bom1.revenue * 0.15, 0, 1.176, 1.0,
    45.00, bom1.raw_material_cost, bom1.oil_cost);

  // Maintenance log
  db.prepare(`INSERT INTO maintenance_logs (order_id, operator_id, failure_type, description, started_at, ended_at, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(1, 3, 'cuchillas_desafiladas', 'Cuchillas perdieron filo durante lote de papa', '2026-07-02T13:00:00Z', '2026-07-02T13:15:00Z', 15);


  // ── Order 2: Plátano 150g – 200 unidades – In Processing ──
  // 200 × 0.150kg = 30kg finished product
  // Revenue: 200 × S/.2.50 = S/.500.00
  const bom2 = calculateBOM('platano', '150g', 200);
  db.prepare(`
    INSERT INTO orders (order_code, client_name, snack_type, presentation, units_requested, unit_price, kg_requested, revenue_total, kanban_stage, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ORD-2026-002', 'Snacks Tingo María EIRL', 'platano', '150g', 200, bom2.unit_price, bom2.kg_requested, bom2.revenue, 4, 'active',
    '2026-07-05T09:00:00Z');

  db.prepare(`
    INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(2, bom2.raw_material_kg, bom2.raw_material_cost, bom2.oil_liters, bom2.oil_cost, bom2.total_material_cost, bom2.prep_type);

  insertKH.run(2, null, 1, 1, 'Pedido creado', '2026-07-05T09:00:00Z');
  insertKH.run(2, 1, 2, 1, 'Insumos comprados', '2026-07-05T14:00:00Z');
  insertKH.run(2, 2, 3, 2, 'Inicio preparación - Pelado manual', '2026-07-06T08:00:00Z');
  insertKH.run(2, 3, 4, 2, 'Inicio procesamiento', '2026-07-06T14:00:00Z');

  db.prepare(`INSERT INTO quality_checks (order_id, operator_id, oil_temp_ok, blade_calibration_ok, checked_at) VALUES (?, ?, ?, ?, ?)`).run(2, 3, 1, 1, '2026-07-06T13:50:00Z');

  // EVM for order 2 (cost overrun - CPI < 1.0)
  const ac2 = bom2.total_material_cost + 120; // labor + overhead makes AC > EV
  const ev2 = bom2.revenue * (4 / 5);
  db.prepare(`
    INSERT INTO evm_records (order_id, pv, ev, ac, cv, sv, cpi, spi, labor_cost, material_cost, oil_cost_actual)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(2, bom2.revenue, ev2, ac2, ev2 - ac2, ev2 - bom2.revenue, ev2 / ac2, ev2 / bom2.revenue,
    120, bom2.raw_material_cost, bom2.oil_cost);

  db.prepare(`INSERT INTO maintenance_logs (order_id, operator_id, failure_type, description, started_at, ended_at, duration_minutes) VALUES (?, ?, ?, ?, ?, ?, ?)`).run(2, 3, 'caida_temperatura', 'Temperatura cayó a 160°C durante fritura de plátano', '2026-07-06T15:00:00Z', '2026-07-06T15:25:00Z', 25);


  // ── Order 3: Pituca 34g – 350 unidades (50 paquetes de 7) – Materials Purchased ──
  // 350 × 0.034kg = 11.9kg finished product
  // Revenue: 350 × (10/7) = S/.500.00
  const bom3 = calculateBOM('pituca', '34g', 350);
  db.prepare(`
    INSERT INTO orders (order_code, client_name, snack_type, presentation, units_requested, unit_price, kg_requested, revenue_total, kanban_stage, status, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run('ORD-2026-003', 'Minimarket Central Chinchao', 'pituca', '34g', 350, bom3.unit_price, bom3.kg_requested, bom3.revenue, 2, 'active',
    '2026-07-10T10:00:00Z');

  db.prepare(`
    INSERT INTO order_materials (order_id, raw_material_kg, raw_material_cost, oil_liters, oil_cost, total_material_cost, prep_type)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(3, bom3.raw_material_kg, bom3.raw_material_cost, bom3.oil_liters, bom3.oil_cost, bom3.total_material_cost, bom3.prep_type);

  insertKH.run(3, null, 1, 1, 'Pedido creado', '2026-07-10T10:00:00Z');
  insertKH.run(3, 1, 2, 1, 'Insumos comprados', '2026-07-11T09:00:00Z');

  console.log('[Seed] ✅ Datos de demostración insertados correctamente.');
  console.log('[Seed]   • 5 usuarios (1 admin + 4 operarios)');
  console.log('[Seed]   • 10 parámetros de línea base');
  console.log('[Seed]   • 3 órdenes demo por presentación (completada, en proceso, activa)');
  console.log(`[Seed]   • ORD-001: Papa 34g × 700 unidades = ${bom1.kg_requested}kg → S/.${bom1.revenue}`);
  console.log(`[Seed]   • ORD-002: Plátano 150g × 200 unidades = ${bom2.kg_requested}kg → S/.${bom2.revenue}`);
  console.log(`[Seed]   • ORD-003: Pituca 34g × 350 unidades = ${bom3.kg_requested}kg → S/.${bom3.revenue}`);
}

module.exports = runSeed;
