import prisma from '../utils/prisma';
import { InventoryHealthScoreBreakdown, ReorderRecommendation } from '../types';

export class IntelligenceEngine {
  /**
   * INVENTORY HEALTH SCORE (0-100)
   * With transparent, explainable scoring breakdown.
   */
  static async calculateHealthScore(): Promise<InventoryHealthScoreBreakdown> {
    const products = await prisma.product.findMany({
      include: {
        stocks: true,
        adjustments: {
          where: {
            createdAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
            },
          },
        },
      },
    });

    const pendingReceipts = await prisma.receipt.count({
      where: { status: { in: ['WAITING', 'READY'] } },
    });

    const pendingDeliveries = await prisma.delivery.count({
      where: { status: { in: ['WAITING', 'READY', 'PICKED'] } },
    });

    const totalProducts = products.length || 1;
    let healthyCount = 0;
    let lowStockCount = 0;
    let outOfStockCount = 0;
    let overstockedCount = 0;

    for (const p of products) {
      const totalStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      if (totalStock <= 0) {
        outOfStockCount++;
      } else if (totalStock <= p.reorderPoint) {
        lowStockCount++;
      } else if (totalStock > p.maximumStock) {
        overstockedCount++;
      } else {
        healthyCount++;
      }
    }

    // 1. Stock Availability Factor (Max +35)
    const availabilityRatio = healthyCount / totalProducts;
    const stockAvailabilityScore = Math.round(availabilityRatio * 35);

    // 2. Low-Stock Penalty (Max -15)
    const lowStockRatio = lowStockCount / totalProducts;
    const lowStockPenalty = Math.min(15, Math.round(lowStockRatio * 30));

    // 3. Out-of-Stock Penalty (Max -20)
    const outOfStockRatio = outOfStockCount / totalProducts;
    const outOfStockPenalty = Math.min(20, Math.round(outOfStockRatio * 40));

    // 4. Pending Operations Bottleneck (Max -10)
    const pendingCount = pendingReceipts + pendingDeliveries;
    const pendingPenalty = Math.min(10, Math.round(pendingCount * 1.5));

    // 5. Adjustment Anomalies (Max -10)
    const recentAdjustments = products.reduce((acc, p) => acc + p.adjustments.length, 0);
    const adjustmentPenalty = Math.min(10, recentAdjustments * 2);

    // 6. Slow Moving / Overstock Penalty (Max -10)
    const overstockPenalty = Math.min(10, Math.round((overstockedCount / totalProducts) * 15));

    // Base score calculation: 100 - penalties + bonuses
    let finalScore = 35 + stockAvailabilityScore - lowStockPenalty - outOfStockPenalty - pendingPenalty - adjustmentPenalty - overstockPenalty;
    finalScore = Math.max(0, Math.min(100, Math.round(finalScore)));

    let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'B';
    if (finalScore >= 90) grade = 'A+';
    else if (finalScore >= 80) grade = 'A';
    else if (finalScore >= 70) grade = 'B';
    else if (finalScore >= 60) grade = 'C';
    else if (finalScore >= 50) grade = 'D';
    else grade = 'F';

    const actionableInsights: string[] = [];
    if (outOfStockCount > 0) {
      actionableInsights.push(`Urgent: ${outOfStockCount} product(s) are completely out of stock. Fulfill inbound receipts immediately.`);
    }
    if (lowStockCount > 0) {
      actionableInsights.push(`${lowStockCount} product(s) breached their reorder threshold. Trigger purchase orders.`);
    }
    if (pendingDeliveries > 0) {
      actionableInsights.push(`${pendingDeliveries} customer deliveries are waiting for fulfillment.`);
    }
    if (recentAdjustments > 0) {
      actionableInsights.push(`${recentAdjustments} manual inventory adjustments logged this week. Review variance reasons.`);
    }
    if (actionableInsights.length === 0) {
      actionableInsights.push('Inventory is operating at peak efficiency across all warehouses.');
    }

    return {
      score: finalScore,
      grade,
      factors: {
        stockAvailability: {
          score: stockAvailabilityScore,
          max: 35,
          label: 'Catalog Availability',
          details: `${healthyCount} of ${totalProducts} products have optimal inventory levels.`,
        },
        lowStockPenalty: {
          score: -lowStockPenalty,
          max: -15,
          label: 'Low Stock Risk',
          details: `${lowStockCount} products are below safe reorder thresholds.`,
        },
        outOfStockPenalty: {
          score: -outOfStockPenalty,
          max: -20,
          label: 'Stockout Impact',
          details: `${outOfStockCount} products have zero stock available.`,
        },
        pendingOperationsImpact: {
          score: -pendingPenalty,
          max: -10,
          label: 'Pending Queue Friction',
          details: `${pendingReceipts} pending receipts, ${pendingDeliveries} pending deliveries.`,
        },
        adjustmentAnomalies: {
          score: -adjustmentPenalty,
          max: -10,
          label: 'Adjustment Variance',
          details: `${recentAdjustments} physical inventory adjustments recorded in past 7 days.`,
        },
        slowMovingPenalty: {
          score: -overstockPenalty,
          max: -10,
          label: 'Excess / Overstock',
          details: `${overstockedCount} products are exceeding warehouse maximum storage.`,
        },
      },
      summary: `Inventory Health is rated ${finalScore}/100 (Grade ${grade}) based on real-time stock levels, demand velocity, and operational queues.`,
      actionableInsights,
    };
  }

  /**
   * SMART REORDER ADVISOR
   * Transparent mathematical recommendation without fake AI.
   */
  static async getReorderAdvisor(): Promise<ReorderRecommendation[]> {
    const products = await prisma.product.findMany({
      include: {
        category: true,
        supplier: true,
        stocks: true,
      },
      orderBy: { name: 'asc' },
    });

    const recommendations: ReorderRecommendation[] = [];

    for (const p of products) {
      const currentStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      const avgDailyUsage = p.avgDailyUsage > 0 ? p.avgDailyUsage : 5;
      const leadTimeDays = p.leadTimeDays > 0 ? p.leadTimeDays : 5;

      // Deterministic inventory math:
      // Safety Stock = Ceil(Daily Usage * Sqrt(Lead Time))
      const safetyStock = Math.ceil(avgDailyUsage * Math.sqrt(leadTimeDays));

      // Reorder Point = (Daily Usage * Lead Time) + Safety Stock
      const calculatedReorderPoint = Math.max(p.reorderPoint, (avgDailyUsage * leadTimeDays) + safetyStock);

      // Estimated days until complete stockout
      const estimatedStockoutDays = avgDailyUsage > 0 ? Math.max(0, currentStock / avgDailyUsage) : 999;

      // Recommended Order Quantity to replenish to maxStock
      const recommendedOrderQuantity = Math.max(0, Math.ceil(p.maximumStock - currentStock));

      let riskLevel: 'SAFE' | 'WATCH' | 'AT_RISK' | 'CRITICAL' = 'SAFE';
      let reason = 'Stock is within optimal operating range.';

      if (currentStock <= 0) {
        riskLevel = 'CRITICAL';
        reason = `CRITICAL: Item is completely stocked out! Reorder ${recommendedOrderQuantity} ${p.unitOfMeasure} immediately.`;
      } else if (currentStock <= p.minimumStock || estimatedStockoutDays <= leadTimeDays) {
        riskLevel = 'CRITICAL';
        reason = `CRITICAL: Stock will deplete in ${estimatedStockoutDays.toFixed(1)} days, which is less than supplier lead time (${leadTimeDays} days). Reorder ${recommendedOrderQuantity} ${p.unitOfMeasure} today.`;
      } else if (currentStock <= calculatedReorderPoint || estimatedStockoutDays <= leadTimeDays * 1.5) {
        riskLevel = 'AT_RISK';
        reason = `AT RISK: Stock (${currentStock} ${p.unitOfMeasure}) is below reorder point (${calculatedReorderPoint} ${p.unitOfMeasure}). Reorder recommended within ${Math.max(1, Math.floor(estimatedStockoutDays - leadTimeDays))} day(s).`;
      } else if (currentStock <= calculatedReorderPoint * 1.25) {
        riskLevel = 'WATCH';
        reason = `WATCH: Stock level is healthy but approaching reorder threshold. Estimated coverage: ${estimatedStockoutDays.toFixed(1)} days.`;
      } else if (currentStock > p.maximumStock) {
        riskLevel = 'SAFE';
        reason = `OVERSTOCKED: Stock exceeds maximum holding capacity (${p.maximumStock} ${p.unitOfMeasure}). Pause reorders.`;
      }

      const calculationFormula = `Reorder Point = (Daily Usage [${avgDailyUsage}] × Lead Time [${leadTimeDays}d]) + Safety Stock [${safetyStock}] = ${calculatedReorderPoint} ${p.unitOfMeasure}. Current Stock: ${currentStock} ${p.unitOfMeasure}.`;

      recommendations.push({
        productId: p.id,
        productName: p.name,
        sku: p.sku,
        category: p.category.name,
        currentStock,
        minimumStock: p.minimumStock,
        reorderPoint: calculatedReorderPoint,
        maximumStock: p.maximumStock,
        avgDailyUsage,
        leadTimeDays,
        safetyStock,
        recommendedOrderQuantity,
        riskLevel,
        estimatedStockoutDays: Number(estimatedStockoutDays.toFixed(1)),
        reason,
        calculationFormula,
        preferredSupplier: p.supplier
          ? {
              id: p.supplier.id,
              name: p.supplier.name,
              leadTimeDays: p.supplier.leadTimeDays,
            }
          : null,
      });
    }

    // Sort: CRITICAL first, then AT_RISK, then WATCH, then SAFE
    const priorityMap = { CRITICAL: 0, AT_RISK: 1, WATCH: 2, SAFE: 3 };
    return recommendations.sort((a, b) => priorityMap[a.riskLevel] - priorityMap[b.riskLevel]);
  }

  /**
   * STOCK RISK RADAR
   * Multi-dimensional risk matrix
   */
  static async getStockRiskRadar() {
    const recommendations = await this.getReorderAdvisor();
    
    const pendingReceiptItems = await prisma.receiptItem.findMany({
      where: { receipt: { status: { in: ['WAITING', 'READY'] } } },
      select: { productId: true, orderedQuantity: true },
    });

    const pendingDeliveryItems = await prisma.deliveryItem.findMany({
      where: { delivery: { status: { in: ['WAITING', 'READY', 'PICKED'] } } },
      select: { productId: true, requestedQuantity: true },
    });

    const inboundMap: Record<string, number> = {};
    for (const item of pendingReceiptItems) {
      inboundMap[item.productId] = (inboundMap[item.productId] || 0) + item.orderedQuantity;
    }

    const outboundMap: Record<string, number> = {};
    for (const item of pendingDeliveryItems) {
      outboundMap[item.productId] = (outboundMap[item.productId] || 0) + item.requestedQuantity;
    }

    const criticalItems = recommendations.filter(r => r.riskLevel === 'CRITICAL');
    const atRiskItems = recommendations.filter(r => r.riskLevel === 'AT_RISK');
    const watchItems = recommendations.filter(r => r.riskLevel === 'WATCH');
    const safeItems = recommendations.filter(r => r.riskLevel === 'SAFE');
    const overstockedItems = recommendations.filter(r => r.currentStock > r.maximumStock);

    const radarItems = recommendations.map(r => ({
      id: r.productId,
      name: r.productName,
      sku: r.sku,
      category: r.category,
      currentStock: r.currentStock,
      reorderPoint: r.reorderPoint,
      maximumStock: r.maximumStock,
      riskLevel: r.riskLevel,
      stockoutDays: r.estimatedStockoutDays,
      pendingInbound: inboundMap[r.productId] || 0,
      pendingOutbound: outboundMap[r.productId] || 0,
      stockUtilizationPercent: Math.min(150, Math.round((r.currentStock / (r.maximumStock || 1)) * 100)),
      reason: r.reason,
    }));

    return {
      summary: {
        criticalCount: criticalItems.length,
        atRiskCount: atRiskItems.length,
        watchCount: watchItems.length,
        safeCount: safeItems.length,
        overstockedCount: overstockedItems.length,
        totalTracked: recommendations.length,
      },
      items: radarItems,
    };
  }

  /**
   * STOCK AGING ANALYSIS
   * 0-30, 31-60, 61-90, 90+ days categorization
   */
  static async getStockAgingAnalysis() {
    const products = await prisma.product.findMany({
      include: {
        stocks: true,
        ledgerEntries: {
          orderBy: { timestamp: 'desc' },
          take: 1,
        },
      },
    });

    const now = Date.now();
    const buckets = {
      fresh: { label: 'Fresh (0–30 days)', minDays: 0, maxDays: 30, items: [] as any[], totalValue: 0, totalUnits: 0 },
      aging: { label: 'Aging (31–60 days)', minDays: 31, maxDays: 60, items: [] as any[], totalValue: 0, totalUnits: 0 },
      slowMoving: { label: 'Slow Moving (61–90 days)', minDays: 61, maxDays: 90, items: [] as any[], totalValue: 0, totalUnits: 0 },
      deadStock: { label: 'Dead Stock (90+ days)', minDays: 91, maxDays: 9999, items: [] as any[], totalValue: 0, totalUnits: 0 },
    };

    for (const p of products) {
      const currentStock = p.stocks.reduce((sum, s) => sum + s.quantity, 0);
      if (currentStock <= 0) continue;

      const lastActivityDate = p.ledgerEntries[0]?.timestamp || p.createdAt;
      const daysSinceMovement = Math.floor((now - new Date(lastActivityDate).getTime()) / (1000 * 60 * 60 * 24));
      const valuation = currentStock * p.costPrice;

      const itemData = {
        id: p.id,
        name: p.name,
        sku: p.sku,
        currentStock,
        unitOfMeasure: p.unitOfMeasure,
        costPrice: p.costPrice,
        valuation,
        daysSinceMovement,
        lastActivityDate,
      };

      if (daysSinceMovement <= 30) {
        buckets.fresh.items.push(itemData);
        buckets.fresh.totalUnits += currentStock;
        buckets.fresh.totalValue += valuation;
      } else if (daysSinceMovement <= 60) {
        buckets.aging.items.push(itemData);
        buckets.aging.totalUnits += currentStock;
        buckets.aging.totalValue += valuation;
      } else if (daysSinceMovement <= 90) {
        buckets.slowMoving.items.push(itemData);
        buckets.slowMoving.totalUnits += currentStock;
        buckets.slowMoving.totalValue += valuation;
      } else {
        buckets.deadStock.items.push(itemData);
        buckets.deadStock.totalUnits += currentStock;
        buckets.deadStock.totalValue += valuation;
      }
    }

    const grandTotalValue = buckets.fresh.totalValue + buckets.aging.totalValue + buckets.slowMoving.totalValue + buckets.deadStock.totalValue;

    return {
      grandTotalValue,
      buckets: [
        { ...buckets.fresh, key: 'fresh', percentageOfCapital: grandTotalValue > 0 ? (buckets.fresh.totalValue / grandTotalValue) * 100 : 0 },
        { ...buckets.aging, key: 'aging', percentageOfCapital: grandTotalValue > 0 ? (buckets.aging.totalValue / grandTotalValue) * 100 : 0 },
        { ...buckets.slowMoving, key: 'slowMoving', percentageOfCapital: grandTotalValue > 0 ? (buckets.slowMoving.totalValue / grandTotalValue) * 100 : 0 },
        { ...buckets.deadStock, key: 'deadStock', percentageOfCapital: grandTotalValue > 0 ? (buckets.deadStock.totalValue / grandTotalValue) * 100 : 0 },
      ],
    };
  }

  /**
   * RULE-BASED ANOMALY DETECTION
   */
  static async getAnomalyDetections() {
    const anomalies: Array<{
      id: string;
      severity: 'WARNING' | 'CRITICAL' | 'INFO';
      title: string;
      description: string;
      productName?: string;
      sku?: string;
      timestamp: Date;
      metric: string;
      action: string;
    }> = [];

    // 1. High-variance adjustments in the last 14 days
    const recentAdjustments = await prisma.adjustment.findMany({
      where: {
        createdAt: { gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000) },
        status: 'CONFIRMED',
      },
      include: { product: true, location: true },
      orderBy: { createdAt: 'desc' },
    });

    for (const adj of recentAdjustments) {
      if (Math.abs(adj.difference) >= 5) {
        const percentChange = adj.systemQuantity > 0 ? Math.round((Math.abs(adj.difference) / adj.systemQuantity) * 100) : 100;
        anomalies.push({
          id: `anomaly-adj-${adj.id}`,
          severity: Math.abs(adj.difference) > 10 ? 'CRITICAL' : 'WARNING',
          title: `Unusual Inventory Correction: ${adj.product.name}`,
          description: `Adjustment of ${adj.difference > 0 ? '+' : ''}${adj.difference} ${adj.product.unitOfMeasure} (${percentChange}% shift) at ${adj.location.name}. Reason: ${adj.reason}`,
          productName: adj.product.name,
          sku: adj.product.sku,
          timestamp: adj.createdAt,
          metric: `${adj.difference > 0 ? '+' : ''}${adj.difference} units variance`,
          action: 'Perform physical count recount and check security footage or batch slip logs.',
        });
      }
    }

    // 2. High delivery demand anomaly
    const deliveriesToday = await prisma.deliveryItem.findMany({
      where: {
        delivery: {
          status: 'DONE',
          deliveredDate: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
        },
      },
      include: { product: true },
    });

    for (const item of deliveriesToday) {
      if (item.deliveredQuantity >= item.product.avgDailyUsage * 2.5) {
        anomalies.push({
          id: `anomaly-del-${item.id}`,
          severity: 'INFO',
          title: `Demand Surge Detected: ${item.product.name}`,
          description: `Outbound shipment of ${item.deliveredQuantity} ${item.product.unitOfMeasure} is ${(item.deliveredQuantity / item.product.avgDailyUsage).toFixed(1)}x higher than average daily velocity (${item.product.avgDailyUsage}/day).`,
          productName: item.product.name,
          sku: item.product.sku,
          timestamp: new Date(),
          metric: `${(item.deliveredQuantity / item.product.avgDailyUsage).toFixed(1)}x Daily Rate`,
          action: 'Adjust dynamic safety stock buffer to prevent sudden stockout.',
        });
      }
    }

    // 3. Negative stock attempts from alert logs
    const negativeStockAlerts = await prisma.alert.findMany({
      where: { alertType: 'NEGATIVE_STOCK_ATTEMPT', status: 'ACTIVE' },
      include: { product: true },
      take: 5,
    });

    for (const nAlert of negativeStockAlerts) {
      anomalies.push({
        id: `anomaly-neg-${nAlert.id}`,
        severity: 'CRITICAL',
        title: nAlert.title,
        description: nAlert.message,
        productName: nAlert.product?.name,
        sku: nAlert.product?.sku,
        timestamp: nAlert.createdAt,
        metric: 'Blocked Negative Stock Attempt',
        action: nAlert.recommendedAction || 'Replenish stock immediately.',
      });
    }

    return anomalies;
  }

  /**
   * SMART DAILY BRIEF
   */
  static async getDailyBrief() {
    const health = await this.calculateHealthScore();
    const recommendations = await this.getReorderAdvisor();
    
    const pendingReceipts = await prisma.receipt.count({ where: { status: { in: ['WAITING', 'READY'] } } });
    const pendingDeliveries = await prisma.delivery.count({ where: { status: { in: ['WAITING', 'READY', 'PICKED'] } } });
    const scheduledTransfers = await prisma.transfer.count({ where: { status: { in: ['DRAFT', 'PENDING', 'IN_TRANSIT'] } } });

    const criticalReorders = recommendations.filter(r => r.riskLevel === 'CRITICAL');
    const atRiskReorders = recommendations.filter(r => r.riskLevel === 'AT_RISK');

    const topActions: Array<{
      id: string;
      title: string;
      description: string;
      actionType: 'REORDER' | 'RECEIPT' | 'DELIVERY' | 'ADJUSTMENT' | 'TRANSFER';
      priority: 'HIGH' | 'MEDIUM' | 'LOW';
      linkUrl: string;
    }> = [];

    // Add top reorder actions
    if (criticalReorders.length > 0) {
      const top = criticalReorders[0];
      topActions.push({
        id: `action-reorder-${top.productId}`,
        title: `Reorder ${top.productName} (${top.sku})`,
        description: `Current stock (${top.currentStock}) is critical. Recommended order: ${top.recommendedOrderQuantity} units.`,
        actionType: 'REORDER',
        priority: 'HIGH',
        linkUrl: `/products?search=${top.sku}`,
      });
    }

    if (pendingDeliveries > 0) {
      topActions.push({
        id: 'action-deliveries',
        title: `Fulfill ${pendingDeliveries} Pending Delivery Orders`,
        description: 'Orders are awaiting pick & pack execution to meet customer SLA.',
        actionType: 'DELIVERY',
        priority: 'HIGH',
        linkUrl: '/deliveries?status=WAITING',
      });
    }

    if (pendingReceipts > 0) {
      topActions.push({
        id: 'action-receipts',
        title: `Validate ${pendingReceipts} Inbound Shipments`,
        description: 'Receiving dock has vendor deliveries awaiting inspection and stock intake.',
        actionType: 'RECEIPT',
        priority: 'MEDIUM',
        linkUrl: '/receipts?status=READY',
      });
    }

    if (scheduledTransfers > 0) {
      topActions.push({
        id: 'action-transfers',
        title: `Process ${scheduledTransfers} Scheduled Internal Transfers`,
        description: 'Rebalance stock between warehouse storage and production floor.',
        actionType: 'TRANSFER',
        priority: 'MEDIUM',
        linkUrl: '/transfers',
      });
    }

    return {
      greeting: 'GOOD MORNING, INVENTORY MANAGER',
      healthScore: health.score,
      healthGrade: health.grade,
      counters: {
        productsNeedingAttention: criticalReorders.length + atRiskReorders.length,
        pendingReceipts,
        pendingDeliveries,
        scheduledTransfers,
        stockoutRiskProducts: criticalReorders.length,
      },
      topActions,
      briefMessage: `Today's inventory operations: ${criticalReorders.length} product(s) require urgent replenishment, with ${pendingDeliveries} delivery orders queued for dispatch.`,
    };
  }

  /**
   * "WHY DID STOCK CHANGE?" EXPLANATION ENGINE
   * Complete transparent mathematical ledger reconciliation for any product.
   */
  static async explainStockChanges(productId: string) {
    const product = await prisma.product.findUnique({
      where: { id: productId },
      include: {
        stocks: { include: { warehouse: true, location: true } },
      },
    });

    if (!product) {
      return null;
    }

    const currentStock = product.stocks.reduce((sum, s) => sum + s.quantity, 0);

    const ledgerEntries = await prisma.stockLedger.findMany({
      where: { productId },
      orderBy: { timestamp: 'desc' },
      take: 50,
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        user: true,
      },
    });

    let totalReceipts = 0;
    let totalDeliveries = 0;
    let totalAdjustments = 0;
    let receiptCount = 0;
    let deliveryCount = 0;
    let adjustmentCount = 0;
    let transferCount = 0;

    for (const entry of ledgerEntries) {
      if (entry.type === 'RECEIPT') {
        totalReceipts += entry.quantity;
        receiptCount++;
      } else if (entry.type === 'DELIVERY') {
        totalDeliveries += Math.abs(entry.quantity);
        deliveryCount++;
      } else if (entry.type === 'ADJUSTMENT') {
        totalAdjustments += entry.quantity;
        adjustmentCount++;
      } else if (entry.type === 'TRANSFER_IN' || entry.type === 'TRANSFER_OUT') {
        transferCount++;
      }
    }

    const netChange = totalReceipts - totalDeliveries + totalAdjustments;
    const initialEstimatedStock = Math.max(0, currentStock - netChange);

    const breakdownItems = [
      {
        type: 'RECEIPTS',
        label: 'Vendor Receipts',
        count: receiptCount,
        quantity: totalReceipts,
        displayQty: `+${totalReceipts} ${product.unitOfMeasure}`,
        impact: 'POSITIVE',
        description: `Total stock added from ${receiptCount} approved vendor shipment(s).`,
      },
      {
        type: 'DELIVERIES',
        label: 'Customer Deliveries',
        count: deliveryCount,
        quantity: totalDeliveries,
        displayQty: `-${totalDeliveries} ${product.unitOfMeasure}`,
        impact: 'NEGATIVE',
        description: `Total stock dispatched across ${deliveryCount} customer order(s).`,
      },
      {
        type: 'ADJUSTMENTS',
        label: 'Inventory Adjustments',
        count: adjustmentCount,
        quantity: totalAdjustments,
        displayQty: `${totalAdjustments >= 0 ? '+' : ''}${totalAdjustments} ${product.unitOfMeasure}`,
        impact: totalAdjustments >= 0 ? 'POSITIVE' : 'NEGATIVE',
        description: `Physical count variance corrections across ${adjustmentCount} logged event(s).`,
      },
      {
        type: 'TRANSFERS',
        label: 'Internal Movements',
        count: transferCount,
        quantity: 0,
        displayQty: `±0 ${product.unitOfMeasure}`,
        impact: 'NEUTRAL',
        description: `${transferCount} internal rack/warehouse transfer(s) (total stock conserved).`,
      },
    ];

    return {
      product: {
        id: product.id,
        name: product.name,
        sku: product.sku,
        unitOfMeasure: product.unitOfMeasure,
        currentStock,
        minimumStock: product.minimumStock,
        reorderPoint: product.reorderPoint,
        maximumStock: product.maximumStock,
      },
      summary: {
        initialEstimatedStock,
        totalReceipts,
        totalDeliveries,
        totalAdjustments,
        netChange,
        currentStock,
        formula: `${initialEstimatedStock} (Baseline) + ${totalReceipts} (Receipts) - ${totalDeliveries} (Deliveries) ${totalAdjustments >= 0 ? '+' : '-'} ${Math.abs(totalAdjustments)} (Adjustments) = ${currentStock} ${product.unitOfMeasure}`,
      },
      breakdownItems,
      recentMovements: ledgerEntries.slice(0, 10).map(entry => ({
        id: entry.id,
        transactionNumber: entry.transactionNumber,
        timestamp: entry.timestamp,
        type: entry.type,
        quantity: entry.quantity,
        beforeStock: entry.beforeStock,
        afterStock: entry.afterStock,
        referenceDoc: entry.referenceDoc,
        reason: entry.reason,
        source: entry.sourceLocation ? `${entry.sourceWarehouse?.name} / ${entry.sourceLocation?.name}` : null,
        destination: entry.destLocation ? `${entry.destWarehouse?.name} / ${entry.destLocation?.name}` : null,
        user: entry.user?.name || 'System Operator',
      })),
    };
  }
}
