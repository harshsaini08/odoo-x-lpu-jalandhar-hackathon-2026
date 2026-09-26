import { Router } from 'express';
import authRoutes from './authRoutes';
import productRoutes from './productRoutes';
import receiptRoutes from './receiptRoutes';
import deliveryRoutes from './deliveryRoutes';
import transferRoutes from './transferRoutes';
import adjustmentRoutes from './adjustmentRoutes';
import ledgerRoutes from './ledgerRoutes';
import warehouseRoutes from './warehouseRoutes';
import intelligenceRoutes from './intelligenceRoutes';
import alertRoutes from './alertRoutes';
import reportRoutes from './reportRoutes';
import demoRoutes from './demoRoutes';
import forecastRoutes from './forecastRoutes';
import copilotRoutes from './copilotRoutes';
import prisma from '../utils/prisma';
import { IntelligenceEngine } from '../services/intelligenceEngine';
import { ForecastService } from '../services/forecastService';

const router = Router();

router.use('/auth', authRoutes);
router.use('/products', productRoutes);
router.use('/receipts', receiptRoutes);
router.use('/deliveries', deliveryRoutes);
router.use('/transfers', transferRoutes);
router.use('/adjustments', adjustmentRoutes);
router.use('/ledger', ledgerRoutes);
router.use('/warehouses', warehouseRoutes);
router.use('/intelligence', intelligenceRoutes);
router.use('/forecast', forecastRoutes);
router.use('/copilot', copilotRoutes);
router.use('/alerts', alertRoutes);
router.use('/reports', reportRoutes);
router.use('/demo', demoRoutes);

// Master Data Helper Endpoints
router.get('/categories', async (req, res, next) => {
  try {
    const categories = await prisma.category.findMany({
      include: { _count: { select: { products: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { categories } });
  } catch (error) {
    next(error);
  }
});

router.get('/suppliers', async (req, res, next) => {
  try {
    const suppliers = await prisma.supplier.findMany({
      include: { _count: { select: { products: true, receipts: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { suppliers } });
  } catch (error) {
    next(error);
  }
});

router.get('/customers', async (req, res, next) => {
  try {
    const customers = await prisma.customer.findMany({
      include: { _count: { select: { deliveries: true } } },
      orderBy: { name: 'asc' },
    });
    res.json({ success: true, data: { customers } });
  } catch (error) {
    next(error);
  }
});

// Comprehensive Dashboard Aggregation
router.get('/dashboard', async (req, res, next) => {
  try {
    const [
      totalProducts,
      products,
      pendingReceipts,
      pendingDeliveries,
      activeTransfers,
      activeAlerts,
      healthScore,
      dailyBrief,
      riskRadar,
      recentLedger,
      warehouses,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.findMany({
        include: { stocks: true, category: true },
      }),
      prisma.receipt.count({ where: { status: { in: ['WAITING', 'READY'] } } }),
      prisma.delivery.count({ where: { status: { in: ['WAITING', 'READY', 'PICKED', 'PACKED'] } } }),
      prisma.transfer.count({ where: { status: { in: ['PENDING', 'IN_TRANSIT'] } } }),
      prisma.alert.findMany({
        where: { status: 'ACTIVE' },
        orderBy: { createdAt: 'desc' },
        take: 5,
        include: { product: true },
      }),
      IntelligenceEngine.calculateHealthScore(),
      IntelligenceEngine.getDailyBrief(),
      IntelligenceEngine.getStockRiskRadar(),
      prisma.stockLedger.findMany({
        orderBy: { timestamp: 'desc' },
        take: 8,
        include: {
          product: true,
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
          user: true,
        },
      }),
      prisma.warehouse.findMany({
        include: {
          locations: {
            include: { stocks: true },
          },
        },
      }),
    ]);

    let totalUnits = 0;
    let totalValuation = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;

    for (const p of products) {
      const stock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      totalUnits += stock;
      totalValuation += stock * p.costPrice;
      if (stock <= 0) outOfStockCount++;
      else if (stock <= p.reorderPoint) lowStockCount++;
    }

    const warehouseSummary = warehouses.map((w) => {
      const units = w.locations.reduce((acc, l) => acc + l.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0), 0);
      return {
        id: w.id,
        name: w.name,
        code: w.code,
        capacity: w.totalCapacity,
        usedUnits: units,
        utilization: Math.min(100, Math.round((units / (w.totalCapacity || 1)) * 100)),
      };
    });

    const actionRequired = [
      {
        id: 'action-steel-rods',
        type: 'STOCKOUT_RISK',
        severity: 'WARNING',
        title: 'Steel Rods (High-Tensile 12mm)',
        sku: 'SKU-STL-001',
        subtitle: 'Projected stockout in 18 days at current demand rate (8.4 kg/day).',
        actionLabel: 'View Forecast',
        linkUrl: '/forecast',
      },
      {
        id: 'action-copper-wire',
        type: 'DEMAND_SURGE',
        severity: 'INFO',
        title: 'Copper Wire Spools 2.5mm',
        sku: 'SKU-COP-006',
        subtitle: 'Demand velocity increased +27% over baseline usage period.',
        actionLabel: 'View Product',
        linkUrl: '/products?search=SKU-COP-006',
      },
      {
        id: 'action-paint-buckets',
        type: 'SLOW_MOVING',
        severity: 'MUTED',
        title: 'Epoxy Floor Paint Buckets 20L',
        sku: 'SKU-PNT-008',
        subtitle: 'No outbound movement recorded for past 74 days.',
        actionLabel: 'Review Item',
        linkUrl: '/products?search=SKU-PNT-008',
      },
    ];

    const todaySummary = {
      productsNeedingAttention: lowStockCount + outOfStockCount,
      pendingReceipts,
      pendingDeliveries,
      approachingReorderPoint: lowStockCount,
    };

    const inventoryInsights = [
      'Demand for Copper Wire is increasing (+27% during the recent 30-day period).',
      'Steel Rods may require replenishment within 18 days to satisfy upcoming production orders.',
      'Epoxy Floor Paint has had low movement for 74+ days; consider reallocating shelf capacity.',
      'Main Central Warehouse is operating at healthy capacity utilization.',
    ];

    return res.json({
      success: true,
      data: {
        kpis: {
          totalProducts,
          totalUnits,
          totalValuation,
          lowStockCount,
          outOfStockCount,
          pendingReceipts,
          pendingDeliveries,
          activeTransfers,
          healthScore: healthScore.score,
          healthGrade: healthScore.grade,
        },
        actionRequired,
        todaySummary,
        inventoryInsights,
        healthScore,
        dailyBrief,
        riskRadar,
        recentLedger,
        warehouseSummary,
        activeAlerts,
      },
    });
  } catch (error) {
    next(error);
  }
});

export default router;
