import prisma from '../utils/prisma';

export interface DemandForecastResult {
  productId: string;
  productName: string;
  sku: string;
  category: string;
  unitOfMeasure: string;
  currentStock: number;
  costPrice: number;
  historicalDays: number;
  totalHistoricalDemand: number;
  avgDailyDemand: number;
  recentDailyDemand: number;
  trendPercentage: number;
  trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' | 'SEASONAL' | 'SLOW_MOVING';
  projectedDailyDemand: number;
  projected30dDemand: number;
  projected60dDemand: number;
  projected90dDemand: number;
  expectedStockoutDays: number;
  expectedStockoutDate: string | null;
  supplierLeadTime: number;
  safetyStock: number;
  reorderPoint: number;
  recommendedReorderQty: number;
  forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW';
  isLowData: boolean;
  explanation: string;
  historicalTimeline: Array<{
    date: string;
    dayLabel: string;
    actualDemand: number;
    stockLevel: number;
  }>;
  forecastTimeline: Array<{
    date: string;
    dayLabel: string;
    projectedDemand: number;
    upperBound: number;
    lowerBound: number;
    projectedStock: number;
  }>;
  preferredSupplier: {
    id: string;
    name: string;
    leadTimeDays: number;
  } | null;
  defaultLocation: {
    id: string;
    name: string;
    warehouseId: string;
    warehouseName: string;
  } | null;
}

export class ForecastService {
  /**
   * Calculate Explainable Demand Forecast for a specific product
   */
  static async getProductForecast(productId: string, horizonDays: number = 30): Promise<DemandForecastResult | null> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        category: true,
        supplier: true,
        defaultLocation: { include: { warehouse: true } },
        stocks: { include: { warehouse: true, location: true } },
      },
    });

    if (!product) return null;

    const currentStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);
    const now = new Date();
    const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);

    // Fetch historical ledger transactions for demand analysis
    const ledgerOutbound = await prisma.stockLedger.findMany({
      where: {
        productId,
        timestamp: { gte: ninetyDaysAgo },
        type: { in: ['DELIVERY', 'ADJUSTMENT'] },
      },
      orderBy: { timestamp: 'asc' },
    });

    // Group daily outbound demand
    const dailyDemandMap: Record<string, number> = {};
    for (let d = 90; d >= 0; d--) {
      const dayDate = new Date(now.getTime() - d * 24 * 60 * 60 * 1000);
      const dateStr = dayDate.toISOString().split('T')[0];
      dailyDemandMap[dateStr] = 0;
    }

    for (const entry of ledgerOutbound) {
      const dateStr = new Date(entry.timestamp).toISOString().split('T')[0];
      const qty = entry.type === 'DELIVERY' ? Math.abs(entry.quantity) : entry.quantity < 0 ? Math.abs(entry.quantity) : 0;
      if (dailyDemandMap[dateStr] !== undefined) {
        dailyDemandMap[dateStr] += qty;
      }
    }

    const dailyEntries = Object.entries(dailyDemandMap);
    const totalHistoricalDemand = dailyEntries.reduce((sum, [_, qty]) => sum + qty, 0);
    const activeDaysCount = dailyEntries.filter(([_, qty]) => qty > 0).length;

    // Check if sufficient data exists
    const hasEnoughHistory = ledgerOutbound.length >= 3 || totalHistoricalDemand > 0;
    const isLowData = ledgerOutbound.length < 5;

    // Baseline calculation
    let avgDailyDemand = 0;
    let recentDailyDemand = 0;
    const totalDaysCount = dailyEntries.length || 90;

    if (hasEnoughHistory) {
      avgDailyDemand = Number((totalHistoricalDemand / totalDaysCount).toFixed(2));
      const recent30Days = dailyEntries.slice(-30);
      const recent30Demand = recent30Days.reduce((sum, [_, qty]) => sum + qty, 0);
      recentDailyDemand = Number((recent30Demand / (recent30Days.length || 30)).toFixed(2));
    } else {
      // Fallback to configured product avgDailyUsage if freshly created item
      avgDailyDemand = product.avgDailyUsage || 5.0;
      recentDailyDemand = avgDailyDemand;
    }

    // Trend detection
    let trendPercentage = 0;
    if (avgDailyDemand > 0) {
      trendPercentage = Math.round(((recentDailyDemand - avgDailyDemand) / avgDailyDemand) * 100);
    }

    let trendDirection: 'INCREASING' | 'DECREASING' | 'STABLE' | 'SEASONAL' | 'SLOW_MOVING' = 'STABLE';
    if (avgDailyDemand < 0.2 && currentStock > 0) {
      trendDirection = 'SLOW_MOVING';
    } else if (trendPercentage >= 10) {
      trendDirection = 'INCREASING';
    } else if (trendPercentage <= -10) {
      trendDirection = 'DECREASING';
    } else {
      trendDirection = 'STABLE';
    }

    // Check for periodic seasonality variance
    const variance = dailyEntries.reduce((acc, [_, qty]) => acc + Math.pow(qty - avgDailyDemand, 2), 0) / totalDaysCount;
    const stdDev = Math.sqrt(variance) || 1.5;
    const coefficientOfVariation = avgDailyDemand > 0 ? stdDev / avgDailyDemand : 1;

    if (coefficientOfVariation > 1.2 && trendDirection !== 'SLOW_MOVING' && totalHistoricalDemand > 20) {
      trendDirection = 'SEASONAL';
    }

    // Weighted exponential forecast rate
    const projectedDailyDemand = Number(
      Math.max(0.1, recentDailyDemand * 0.6 + avgDailyDemand * 0.4).toFixed(2)
    );

    const projected30dDemand = Math.round(projectedDailyDemand * 30);
    const projected60dDemand = Math.round(projectedDailyDemand * 60);
    const projected90dDemand = Math.round(projectedDailyDemand * 90);

    // Stockout prediction
    const expectedStockoutDays = projectedDailyDemand > 0 ? Math.max(0, Math.floor(currentStock / projectedDailyDemand)) : 999;
    const expectedStockoutDate = expectedStockoutDays < 365
      ? new Date(now.getTime() + expectedStockoutDays * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
      : null;

    // Supplier & Reorder params
    const supplierLeadTime = product.supplier?.leadTimeDays || product.leadTimeDays || 5;
    const safetyStock = Math.ceil(projectedDailyDemand * Math.sqrt(supplierLeadTime));
    const reorderPoint = Math.max(product.reorderPoint, Math.ceil(projectedDailyDemand * supplierLeadTime + safetyStock));
    const recommendedReorderQty = Math.max(0, Math.ceil(product.maximumStock - currentStock));

    // Confidence Level
    let forecastConfidence: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    if (isLowData) {
      forecastConfidence = 'LOW';
    } else if (dailyEntries.length >= 60 && coefficientOfVariation < 0.9) {
      forecastConfidence = 'HIGH';
    } else if (coefficientOfVariation > 1.5) {
      forecastConfidence = 'LOW';
    }

    // Transparent Explainable Text
    let explanation = '';
    if (isLowData) {
      explanation = `Limited historical movement data is currently available for ${product.name}. Forecast is conservatively estimated using baseline usage rate (${projectedDailyDemand} ${product.unitOfMeasure}/day).`;
    } else {
      const trendText = trendPercentage > 0 ? `${trendPercentage}% higher than` : trendPercentage < 0 ? `${Math.abs(trendPercentage)}% lower than` : 'consistent with';
      explanation = `Forecast based on ${dailyEntries.length} days of outbound movement. Average daily demand is ${avgDailyDemand} ${product.unitOfMeasure}/day. Recent demand is approximately ${trendText} the baseline period. Current stock covers approximately ${expectedStockoutDays} days.`;
      if (expectedStockoutDays <= supplierLeadTime * 1.5) {
        explanation += ` Reorder of ${recommendedReorderQty} ${product.unitOfMeasure} is recommended to prevent stockout before the ${supplierLeadTime}-day replenishment lead time.`;
      }
    }

    // Build Historical Timeline Chart Data (every 3 days or weekly aggregation for clean rendering)
    const historicalTimeline: Array<{ date: string; dayLabel: string; actualDemand: number; stockLevel: number }> = [];
    let runningSimStock = Math.max(0, currentStock + totalHistoricalDemand * 0.7);

    for (let i = 0; i < dailyEntries.length; i += 3) {
      const [dStr, qty] = dailyEntries[i];
      const sumThreeDays = (dailyEntries[i]?.[1] || 0) + (dailyEntries[i + 1]?.[1] || 0) + (dailyEntries[i + 2]?.[1] || 0);
      runningSimStock = Math.max(0, runningSimStock - sumThreeDays);
      historicalTimeline.push({
        date: dStr,
        dayLabel: dStr.slice(5),
        actualDemand: Number((sumThreeDays / 3).toFixed(1)),
        stockLevel: Math.round(runningSimStock),
      });
    }

    // Build Future Forecast Timeline Chart Data
    const forecastTimeline: Array<{
      date: string;
      dayLabel: string;
      projectedDemand: number;
      upperBound: number;
      lowerBound: number;
      projectedStock: number;
    }> = [];

    let futureStock = currentStock;
    const stepDays = Math.max(1, Math.floor(horizonDays / 15));

    for (let day = 1; day <= horizonDays; day += stepDays) {
      const futureDate = new Date(now.getTime() + day * 24 * 60 * 60 * 1000);
      const dateStr = futureDate.toISOString().split('T')[0];
      const deltaStock = projectedDailyDemand * stepDays;
      futureStock = Math.max(0, futureStock - deltaStock);

      const upper = Number((projectedDailyDemand + 1.645 * (stdDev * 0.4)).toFixed(1));
      const lower = Number(Math.max(0, projectedDailyDemand - 1.645 * (stdDev * 0.4)).toFixed(1));

      forecastTimeline.push({
        date: dateStr,
        dayLabel: `+${day}d`,
        projectedDemand: projectedDailyDemand,
        upperBound: upper,
        lowerBound: lower,
        projectedStock: Math.round(futureStock),
      });
    }

    return {
      productId: product.id,
      productName: product.name,
      sku: product.sku,
      category: product.category.name,
      unitOfMeasure: product.unitOfMeasure,
      currentStock,
      costPrice: product.costPrice,
      historicalDays: dailyEntries.length,
      totalHistoricalDemand,
      avgDailyDemand,
      recentDailyDemand,
      trendPercentage,
      trendDirection,
      projectedDailyDemand,
      projected30dDemand,
      projected60dDemand,
      projected90dDemand,
      expectedStockoutDays,
      expectedStockoutDate,
      supplierLeadTime,
      safetyStock,
      reorderPoint,
      recommendedReorderQty,
      forecastConfidence,
      isLowData,
      explanation,
      historicalTimeline,
      forecastTimeline,
      preferredSupplier: product.supplier
        ? {
            id: product.supplier.id,
            name: product.supplier.name,
            leadTimeDays: product.supplier.leadTimeDays,
          }
        : null,
      defaultLocation: product.defaultLocation
        ? {
            id: product.defaultLocation.id,
            name: product.defaultLocation.name,
            warehouseId: product.defaultLocation.warehouse.id,
            warehouseName: product.defaultLocation.warehouse.name,
          }
        : null,
    };
  }

  /**
   * Get High-Level Forecast Summaries for all products
   */
  static async getAllForecastSummaries(): Promise<DemandForecastResult[]> {
    const products = await prisma.product.findMany({
      select: { id: true },
      orderBy: { name: 'asc' },
    });

    const results: DemandForecastResult[] = [];
    for (const p of products) {
      const forecast = await this.getProductForecast(p.id, 30);
      if (forecast) results.push(forecast);
    }

    // Sort: Urgent stockouts first, then increasing trends
    return results.sort((a, b) => a.expectedStockoutDays - b.expectedStockoutDays);
  }

  /**
   * Seed 90 Days of Realistic Transactional Movements for Forecasting Scenarios
   */
  static async generate90DayHistoricalData(): Promise<void> {
    const products = await prisma.product.findMany({
      include: {
        stocks: true,
        category: true,
        supplier: true,
      },
    });

    const customers = await prisma.customer.findMany();
    const users = await prisma.user.findMany();
    const warehouses = await prisma.warehouse.findMany({ include: { locations: true } });

    if (products.length === 0 || customers.length === 0 || users.length === 0) {
      return;
    }

    const defaultUser = users[0];
    const now = Date.now();

    console.log('📈 Generating 90-day realistic historical movement patterns...');

    for (const p of products) {
      // Determine simulation profile based on SKU or category
      let dailyBase = p.avgDailyUsage || 5.0;
      let pattern: 'STABLE' | 'INCREASING' | 'DECREASING' | 'SEASONAL' | 'IRREGULAR' | 'SLOW' = 'STABLE';

      if (p.sku === 'SKU-STL-001') {
        dailyBase = 8.4;
        pattern = 'STABLE'; // Steel Rods: 8.4 kg/day consistent
      } else if (p.sku === 'SKU-COP-006') {
        dailyBase = 6.0;
        pattern = 'INCREASING'; // Copper Wire: recent +27% surge
      } else if (p.sku === 'SKU-HYD-001' || p.sku === 'SKU-PVC-007') {
        dailyBase = 5.0;
        pattern = 'DECREASING'; // Decreasing demand
      } else if (p.sku === 'SKU-CHM-001' || p.sku === 'SKU-LED-005') {
        dailyBase = 4.0;
        pattern = 'SEASONAL'; // Periodic demand
      } else if (p.sku === 'SKU-ALU-011') {
        dailyBase = 3.5;
        pattern = 'IRREGULAR'; // Spiky demand
      } else if (p.sku === 'SKU-PNT-008' || p.sku === 'SKU-BRG-010') {
        dailyBase = 0.05;
        pattern = 'SLOW'; // Slow moving / dead stock
      }

      // Generate 20-30 discrete delivery shipments across the 90-day span
      const numShipments = pattern === 'SLOW' ? 2 : 24;
      const stepDays = Math.floor(88 / numShipments);

      for (let i = 0; i < numShipments; i++) {
        const daysAgo = 88 - i * stepDays;
        const txDate = new Date(now - daysAgo * 24 * 60 * 60 * 1000);

        // Calculate quantity based on pattern
        let multiplier = 1.0;
        if (pattern === 'INCREASING') {
          multiplier = 0.7 + (i / numShipments) * 0.8; // scales from 0.7 to 1.5 (+27% recent)
        } else if (pattern === 'DECREASING') {
          multiplier = 1.4 - (i / numShipments) * 0.7; // scales down
        } else if (pattern === 'SEASONAL') {
          multiplier = 1.0 + 0.6 * Math.sin((i / numShipments) * Math.PI * 4); // waves
        } else if (pattern === 'IRREGULAR') {
          multiplier = 0.4 + (i % 3 === 0 ? 1.8 : 0.3); // sharp spikes
        } else if (pattern === 'SLOW') {
          multiplier = 0.2;
        }

        const qty = Math.max(1, Math.round(dailyBase * stepDays * multiplier));
        const customer = customers[i % customers.length];
        const warehouse = warehouses[0];
        const location = warehouse.locations[0];

        // Create completed historical delivery
        const delivery = await prisma.delivery.create({
          data: {
            deliveryNumber: `DEL-HIST-${p.sku.slice(-4)}-${daysAgo}D`,
            customerId: customer.id,
            warehouseId: warehouse.id,
            status: 'DONE',
            orderDate: txDate,
            scheduledDate: txDate,
            deliveredDate: txDate,
            destination: customer.address || 'Customer Distribution Hub',
            createdById: defaultUser.id,
            validatedById: defaultUser.id,
            items: {
              create: [
                {
                  productId: p.id,
                  locationId: location.id,
                  requestedQuantity: qty,
                  deliveredQuantity: qty,
                  unitPrice: p.sellingPrice,
                },
              ],
            },
          },
        });

        // Create matching historical stock ledger record
        await prisma.stockLedger.create({
          data: {
            transactionNumber: `TXN-DEL-${p.sku.slice(-4)}-${daysAgo}D`,
            timestamp: txDate,
            type: 'DELIVERY',
            productId: p.id,
            sku: p.sku,
            sourceWarehouseId: warehouse.id,
            sourceLocationId: location.id,
            quantity: -qty,
            beforeStock: p.maximumStock,
            afterStock: p.maximumStock - qty,
            userId: defaultUser.id,
            referenceDoc: delivery.deliveryNumber,
            reason: 'Historical Customer Fulfillment',
          },
        });
      }
    }

    console.log('✅ Successfully seeded 90-day realistic historical movements!');
  }
}
