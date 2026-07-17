// ──────────────────────────────────────────────
// Industrias RUAM – Dashboard / Power BI Endpoint
// ──────────────────────────────────────────────

const express = require('express');
const router = express.Router();
const { evaluateKPI } = require('../services/alertEngine');
const { getMaintenanceMetrics } = require('../services/maintenanceCalc');

module.exports = router;

// GET /dashboard-metrics – Public endpoint for Power BI
router.get('/dashboard-metrics', (req, res) => {
  try {
    const db = require('../config/database');

    // Get all orders
    const allOrders = db.prepare('SELECT * FROM orders').all();
    const activeOrders = allOrders.filter(o => o.status === 'active' || o.status === 'frozen');
    const completedOrders = allOrders.filter(o => o.status === 'completed');

    // Get maintenance metrics
    const maintMetrics = getMaintenanceMetrics(db);

    // Calculate OTIF (On Time In Full) – completed orders ratio
    const otif = allOrders.length > 0 ? completedOrders.length / allOrders.length : 1.0;

    // Calculate average rejection index from packaging QC
    const packagingData = db.prepare(`
      SELECT kg_conforming, kg_waste, is_conforming FROM packaging_qc
    `).all();

    let avgRejection = 0;
    if (packagingData.length > 0) {
      const totalRejection = packagingData.reduce((sum, p) => {
        const total = p.kg_conforming + p.kg_waste;
        return sum + (total > 0 ? p.kg_waste / total : 0);
      }, 0);
      avgRejection = totalRejection / packagingData.length;
    }

    // Calculate average cost per kg from EVM
    const evmRecords = db.prepare(`
      SELECT e.*, o.kg_requested FROM evm_records e
      JOIN orders o ON o.id = e.order_id
    `).all();

    let avgCostPerKg = 0;
    if (evmRecords.length > 0) {
      const totalCost = evmRecords.reduce((sum, e) => sum + e.ac, 0);
      const totalKg = evmRecords.reduce((sum, e) => sum + e.material_cost, 0);
      const totalKgRequested = evmRecords.reduce((sum, e) => sum + (e.ac / (e.cpi || 1)), 0);
      avgCostPerKg = totalKg > 0
        ? totalCost / evmRecords.reduce((s, e) => s + db.prepare('SELECT kg_requested FROM orders WHERE id = ?').get(e.order_id).kg_requested, 0)
        : 0;
    }

    // Build per-order metrics
    const metrics = allOrders.map(order => {
      const evm = db.prepare('SELECT * FROM evm_records WHERE order_id = ?').get(order.id);
      const pqc = db.prepare('SELECT * FROM packaging_qc WHERE order_id = ? ORDER BY checked_at DESC LIMIT 1').get(order.id);

      let rejectionIndex = 0;
      if (pqc) {
        const total = pqc.kg_conforming + pqc.kg_waste;
        rejectionIndex = total > 0 ? pqc.kg_waste / total : 0;
      }

      return {
        ID_Pedido: order.order_code,
        Cliente: order.client_name,
        Tipo_Snack: order.snack_type,
        Presentacion: order.presentation,
        Unidades: order.units_requested,
        Kg_Solicitados: order.kg_requested,
        Revenue: order.revenue_total,
        Kanban_Stage: order.kanban_stage,
        Status: order.status,
        Disponibilidad_Maquinaria: maintMetrics.availability,
        OTIF: order.status === 'completed' ? 1.0 : 0.0,
        CV: evm ? evm.cv : null,
        SV: evm ? evm.sv : null,
        CPI: evm ? evm.cpi : null,
        SPI: evm ? evm.spi : null,
        Indice_Rechazo: parseFloat(rejectionIndex.toFixed(4)),
        Costo_Material: evm ? evm.material_cost : null,
        Costo_Mano_Obra: evm ? evm.labor_cost : null,
        Costo_Total: evm ? evm.ac : null
      };
    });

    // Calculate oil consumption across all orders
    const oilData = db.prepare(`
      SELECT SUM(oil_liters) as total_liters, SUM(oil_cost) as total_cost,
             COUNT(*) as orders_with_oil
      FROM order_materials
    `).get();

    const oilConfig = db.prepare(
      "SELECT config_value FROM baseline_config WHERE config_key = 'oil_price_per_tacho'"
    ).get();
    const tachoPrice = oilConfig ? oilConfig.config_value : 130.00;
    const tachoVolume = 20; // liters

    const totalOilLiters = oilData?.total_liters || 0;
    const totalOilCost = oilData?.total_cost || 0;
    const tachosUsed = totalOilLiters / tachoVolume;

    res.json({
      generated_at: new Date().toISOString(),
      total_orders: allOrders.length,
      active_orders: activeOrders.length,
      completed_orders: completedOrders.length,
      global_kpis: {
        availability: {
          value: parseFloat(maintMetrics.availability.toFixed(4)),
          status: evaluateKPI('availability', maintMetrics.availability)
        },
        otif: {
          value: parseFloat(otif.toFixed(4)),
          status: evaluateKPI('otif', otif)
        },
        avg_rejection_index: {
          value: parseFloat(avgRejection.toFixed(4)),
          status: evaluateKPI('rejection', avgRejection)
        },
        avg_cost_per_kg: {
          value: parseFloat(avgCostPerKg.toFixed(2)),
          status: evaluateKPI('cost_per_kg', avgCostPerKg)
        }
      },
      oil_consumption: {
        total_liters: parseFloat(totalOilLiters.toFixed(2)),
        total_cost: parseFloat(totalOilCost.toFixed(2)),
        tachos_used: parseFloat(tachosUsed.toFixed(2)),
        tacho_price: tachoPrice,
        tacho_volume: tachoVolume
      },
      maintenance: {
        mtbf_hours: maintMetrics.mtbf_hours,
        mttr_minutes: maintMetrics.mttr_minutes,
        total_events: maintMetrics.total_events,
        failure_breakdown: maintMetrics.failure_breakdown
      },
      metrics
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
