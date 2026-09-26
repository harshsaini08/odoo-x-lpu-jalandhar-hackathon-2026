import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { IntelligenceEngine } from '../services/intelligenceEngine';

export const getInventorySummaryReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        stocks: { include: { warehouse: true } },
      },
    });

    let totalProducts = products.length;
    let totalUnits = 0;
    let totalValuation = 0;
    let totalRetailValue = 0;
    const categoryStats: Record<string, { count: number; units: number; valuation: number }> = {};

    for (const p of products) {
      const stock = p.stocks.reduce((acc, s) => acc + s.quantity, 0);
      const val = stock * p.costPrice;
      const retail = stock * p.sellingPrice;

      totalUnits += stock;
      totalValuation += val;
      totalRetailValue += retail;

      if (!categoryStats[p.category.name]) {
        categoryStats[p.category.name] = { count: 0, units: 0, valuation: 0 };
      }
      categoryStats[p.category.name].count += 1;
      categoryStats[p.category.name].units += stock;
      categoryStats[p.category.name].valuation += val;
    }

    const categoryBreakdown = Object.entries(categoryStats).map(([name, stats]) => ({
      category: name,
      productCount: stats.count,
      units: stats.units,
      valuation: stats.valuation,
      valuationPercent: totalValuation > 0 ? (stats.valuation / totalValuation) * 100 : 0,
    }));

    return res.json({
      success: true,
      data: {
        summary: {
          totalProducts,
          totalUnits,
          totalValuation,
          totalRetailValue,
          potentialGrossProfit: totalRetailValue - totalValuation,
          averageUnitCost: totalUnits > 0 ? totalValuation / totalUnits : 0,
        },
        categoryBreakdown,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getMovementReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { days = '30' } = req.query;
    const daysNum = parseInt(days as string, 10) || 30;
    const startDate = new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000);

    const ledgerEntries = await prisma.stockLedger.findMany({
      where: {
        timestamp: { gte: startDate },
      },
      include: { product: true },
      orderBy: { timestamp: 'asc' },
    });

    const timelineMap: Record<string, { date: string; receipts: number; deliveries: number; adjustments: number; transfers: number }> = {};

    for (const entry of ledgerEntries) {
      const dateKey = new Date(entry.timestamp).toISOString().split('T')[0];
      if (!timelineMap[dateKey]) {
        timelineMap[dateKey] = { date: dateKey, receipts: 0, deliveries: 0, adjustments: 0, transfers: 0 };
      }

      if (entry.type === 'RECEIPT') timelineMap[dateKey].receipts += entry.quantity;
      else if (entry.type === 'DELIVERY') timelineMap[dateKey].deliveries += Math.abs(entry.quantity);
      else if (entry.type === 'ADJUSTMENT') timelineMap[dateKey].adjustments += Math.abs(entry.quantity);
      else if (entry.type.startsWith('TRANSFER')) timelineMap[dateKey].transfers += entry.quantity;
    }

    const movementTimeline = Object.values(timelineMap).sort((a, b) => a.date.localeCompare(b.date));

    return res.json({
      success: true,
      data: {
        movementTimeline,
        totalEvents: ledgerEntries.length,
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseUtilizationReport = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            stocks: { include: { product: true } },
          },
        },
      },
    });

    const report = warehouses.map((w) => {
      let totalUnits = 0;
      let totalValue = 0;

      const locationsData = w.locations.map((loc) => {
        const units = loc.stocks.reduce((acc, s) => acc + s.quantity, 0);
        const val = loc.stocks.reduce((acc, s) => acc + s.quantity * s.product.costPrice, 0);
        totalUnits += units;
        totalValue += val;

        return {
          id: loc.id,
          name: loc.name,
          code: loc.code,
          type: loc.type,
          capacity: loc.capacity,
          usedCapacity: units,
          utilizationPercent: Math.min(100, Math.round((units / (loc.capacity || 1)) * 100)),
          valuation: val,
        };
      });

      return {
        id: w.id,
        name: w.name,
        code: w.code,
        totalCapacity: w.totalCapacity,
        usedCapacity: totalUnits,
        utilizationPercent: Math.min(100, Math.round((totalUnits / (w.totalCapacity || 1)) * 100)),
        totalValuation: totalValue,
        locations: locationsData,
      };
    });

    return res.json({
      success: true,
      data: { warehouses: report },
    });
  } catch (error) {
    next(error);
  }
};
