import prisma from '../utils/prisma';
import { ForecastService } from './forecastService';
import { IntelligenceEngine } from './intelligenceEngine';

export interface CopilotMessageResponse {
  message: string;
  suggestedFollowUps?: string[];
  actionButton?: {
    label: string;
    path?: string;
    actionType: 'NAVIGATE' | 'OPEN_MODAL' | 'EXECUTE_TRANSFER' | 'PREPARE_REORDER';
    payload?: any;
  } | null;
  preparedAction?: {
    actionType: 'TRANSFER' | 'RECEIPT' | 'DELIVERY' | 'ADJUSTMENT';
    title: string;
    summary: string;
    fields: Record<string, any>;
    requiresConfirmation: boolean;
  } | null;
  dataSummary?: any;
}

export class CopilotService {
  /**
   * Process Natural Language Copilot Message
   */
  static async processMessage(query: string): Promise<CopilotMessageResponse> {
    const q = query.trim().toLowerCase();

    // -------------------------------------------------------------
    // 1. ACTION PREPARATION (e.g. "Transfer 20 steel rods from Main Warehouse to Production")
    // -------------------------------------------------------------
    const transferMatch = q.match(/transfer\s+(\d+(?:\.\d+)?)\s*(?:kg|units|spools|bags|pieces)?\s+(?:of\s+)?(.+?)\s+from\s+(.+?)\s+to\s+(.+)/i);
    if (transferMatch) {
      const qty = parseFloat(transferMatch[1]);
      const prodQuery = transferMatch[2].trim();
      const fromQuery = transferMatch[3].trim();
      const toQuery = transferMatch[4].trim();

      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: prodQuery } },
            { sku: { contains: prodQuery.toUpperCase() } },
          ],
        },
        include: { stocks: { include: { warehouse: true, location: true } } },
      });

      const warehouses = await prisma.warehouse.findMany({ include: { locations: true } });
      const sourceWh = warehouses.find(w => w.name.toLowerCase().includes(fromQuery.toLowerCase()) || w.code.toLowerCase().includes(fromQuery.toLowerCase())) || warehouses[0];
      const destWh = warehouses.find(w => w.name.toLowerCase().includes(toQuery.toLowerCase()) || w.code.toLowerCase().includes(toQuery.toLowerCase())) || warehouses[1] || warehouses[0];

      if (product && sourceWh && destWh) {
        const sourceLoc = sourceWh.locations[0];
        const destLoc = destWh.locations[0];
        const availableInSource = product.stocks.find(s => s.locationId === sourceLoc.id)?.quantity || 0;

        return {
          message: `I have prepared the internal transfer for **${product.name}** (${qty} ${product.unitOfMeasure}) from **${sourceWh.name}** to **${destWh.name}**. In accordance with inventory safety rules, please review and confirm before execution.`,
          suggestedFollowUps: ['Show current stock levels', 'Check warehouse capacities'],
          preparedAction: {
            actionType: 'TRANSFER',
            title: `Transfer ${qty} ${product.unitOfMeasure} of ${product.name}`,
            summary: `Moving from ${sourceLoc.name} (${sourceWh.code}) ➔ ${destLoc.name} (${destWh.code})`,
            fields: {
              productId: product.id,
              productName: product.name,
              sku: product.sku,
              quantity: qty,
              unitOfMeasure: product.unitOfMeasure,
              sourceWarehouseId: sourceWh.id,
              sourceWarehouseName: sourceWh.name,
              sourceLocationId: sourceLoc.id,
              sourceLocationName: sourceLoc.name,
              destWarehouseId: destWh.id,
              destWarehouseName: destWh.name,
              destLocationId: destLoc.id,
              destLocationName: destLoc.name,
              availableStock: availableInSource,
            },
            requiresConfirmation: true,
          },
          actionButton: {
            label: 'Review Transfer in Form',
            path: '/transfers',
            actionType: 'NAVIGATE',
          },
        };
      }
    }

    // -------------------------------------------------------------
    // 2. APPLICATION WORKFLOWS & GUIDANCE ("How do I...")
    // -------------------------------------------------------------

    // "How do I create a receipt?"
    if (q.includes('create a receipt') || q.includes('how do i create a receipt') || q.includes('how to create receipt') || q.includes('new receipt') || q.includes('receive goods') || (q.includes('how') && q.includes('receipt'))) {
      return {
        message: `Go to **Operations ➔ Receipts** and click **New Receipt**. Select the supplier and warehouse, add the products and quantities, then save and validate the receipt upon dock arrival. When validated, stock increases and the immutable ledger updates automatically.`,
        suggestedFollowUps: [
          'How do I transfer stock?',
          'How do I create a delivery order?',
          'What was received today?',
        ],
        actionButton: {
          label: 'Open Receipts',
          path: '/receipts',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "How do I transfer stock?"
    if ((q.includes('how') && (q.includes('transfer') || q.includes('move'))) || q.includes('how to transfer') || q.includes('transfer stock instructions')) {
      return {
        message: `Go to **Operations ➔ Internal Transfers** and click **New Transfer**. Choose the Source Warehouse/Rack and the Destination Warehouse/Rack, select the product and quantity, then click **Complete Transfer**. Total system stock remains conserved while rack balances update.`,
        suggestedFollowUps: [
          'How do I create a receipt?',
          'How do I adjust inventory?',
          'Where can I see my stock ledger?',
        ],
        actionButton: {
          label: 'Open Internal Transfers',
          path: '/transfers',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "How do I adjust inventory?"
    if ((q.includes('how') && (q.includes('adjust') || q.includes('variance'))) || q.includes('how to adjust') || q.includes('count error') || q.includes('damage stock')) {
      return {
        message: `Go to **Operations ➔ Adjustments** and click **New Adjustment**. Select the product, warehouse, and rack, enter the actual physical count, and provide a mandatory reason (*Damaged, Count Error, Found, Lost*). The system will automatically reconcile the difference in the Stock Ledger.`,
        suggestedFollowUps: [
          'Where can I see my stock ledger?',
          'Show low stock items',
        ],
        actionButton: {
          label: 'Open Stock Adjustments',
          path: '/adjustments',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "Where can I see my stock ledger?" / Move history
    if (q.includes('where can i see my stock ledger') || q.includes('where is the ledger') || (q.includes('where') && q.includes('ledger')) || q.includes('move history instructions')) {
      return {
        message: `Go to **Inventory ➔ Stock Ledger** in the sidebar. The Stock Ledger is the immutable single source of truth for all inventory movements, tracking every Receipt, Delivery, Transfer, and Adjustment with before/after balances and user attribution.`,
        suggestedFollowUps: [
          'What was delivered today?',
          'What was received today?',
        ],
        actionButton: {
          label: 'Open Stock Ledger',
          path: '/ledger',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "How do I create a product?"
    if (q.includes('create a product') || q.includes('how to create a product') || q.includes('how do i create a product') || q.includes('add product')) {
      return {
        message: `Go to **Inventory ➔ Products** and click **New Product**. Enter the product Name, SKU, Category, Unit of Measure, Reorder Point, and optional initial stock with rack location. Once saved, it will be immediately active across all operations.`,
        suggestedFollowUps: [
          'Show low stock',
          'How do I create a receipt?',
        ],
        actionButton: {
          label: 'Open Products Catalog',
          path: '/products',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "Where are low-stock items?"
    if (q.includes('where are low') || q.includes('where to find low stock') || q.includes('where are low-stock items')) {
      return {
        message: `You can view low-stock items in **Inventory ➔ Products** using the *Low Stock* status filter, on the main **Dashboard** under *Action Required*, or in **Intelligence ➔ Demand Forecast**.`,
        suggestedFollowUps: ['Which products are low in stock?', 'What will run out soon?'],
        actionButton: {
          label: 'View Low Stock Items',
          path: '/products?status=LOW_STOCK',
          actionType: 'NAVIGATE',
        },
      };
    }

    // "How do I check warehouse stock?"
    if (q.includes('how do i check warehouse') || q.includes('check warehouse stock') || q.includes('warehouse capacity how')) {
      return {
        message: `Go to **Warehouses ➔ Warehouses** to inspect the 2D rack layout, location occupancy, and capacity utilization for each facility.`,
        suggestedFollowUps: ['Which warehouse has the most stock?', 'Show demand forecast'],
        actionButton: {
          label: 'Open Warehouses',
          path: '/warehouses',
          actionType: 'NAVIGATE',
        },
      };
    }

    // -------------------------------------------------------------
    // 3. NATURAL-LANGUAGE NAVIGATION
    // -------------------------------------------------------------
    if (q === 'show low stock' || q === 'show low stock items' || q === 'low stock') {
      return {
        message: 'Opening Products view filtered by Low Stock status.',
        actionButton: { label: 'Open Low Stock', path: '/products?status=LOW_STOCK', actionType: 'NAVIGATE' },
      };
    }

    if (q.includes('show pending receipts') || q === 'pending receipts') {
      return {
        message: 'Opening Receipts view filtered by pending/waiting status.',
        actionButton: { label: 'Open Pending Receipts', path: '/receipts?status=WAITING', actionType: 'NAVIGATE' },
      };
    }

    if (q.includes('show pending deliveries') || q === 'pending deliveries') {
      return {
        message: 'Opening Deliveries view filtered by pending status.',
        actionButton: { label: 'Open Pending Deliveries', path: '/deliveries?status=WAITING', actionType: 'NAVIGATE' },
      };
    }

    if (q.includes('open steel rods') || q.includes('show steel rods')) {
      const steel = await prisma.product.findFirst({
        where: { OR: [{ sku: 'SKU-STL-001' }, { name: { contains: 'Steel' } }] },
      });
      return {
        message: `Opening details for ${steel?.name || 'Steel Rods'}.`,
        actionButton: { label: 'Open Product', path: `/products?search=${encodeURIComponent(steel?.sku || 'SKU-STL-001')}`, actionType: 'NAVIGATE' },
      };
    }

    if (q.includes('show warehouse 1') || q.includes('open warehouse 1') || q.includes('main warehouse')) {
      return {
        message: 'Opening Main Central Warehouse digital twin view.',
        actionButton: { label: 'Open Warehouse', path: '/warehouses', actionType: 'NAVIGATE' },
      };
    }

    if (q.includes('show demand forecast') || q.includes('forecast page') || q.includes('open forecast') || q === 'show forecast') {
      return {
        message: 'Opening the Demand Forecast module with 90-day historical time series and trend projections.',
        actionButton: { label: 'Open Demand Forecast', path: '/forecast', actionType: 'NAVIGATE' },
      };
    }

    // -------------------------------------------------------------
    // 4. REAL DATABASE QUESTIONS (Inventory Levels, Stockout, Movements)
    // -------------------------------------------------------------

    // Q: Why do I need to reorder [Product]? / Explain reorder
    if (q.includes('why') && (q.includes('reorder') || q.includes('replenish') || q.includes('steel') || q.includes('rods'))) {
      const steelProduct = await prisma.product.findFirst({
        where: { OR: [{ sku: 'SKU-STL-001' }, { name: { contains: 'Steel' } }] },
      });

      if (steelProduct) {
        const forecast = await ForecastService.getProductForecast(steelProduct.id, 30);
        if (forecast) {
          return {
            message: `### Reorder Intelligence for ${forecast.productName} (${forecast.sku})\n\n` +
              `• **Current Stock**: ${forecast.currentStock} ${forecast.unitOfMeasure}\n` +
              `• **Average Daily Demand**: ${forecast.avgDailyDemand} ${forecast.unitOfMeasure}/day\n` +
              `• **30-Day Forecast**: ${forecast.projected30dDemand} ${forecast.unitOfMeasure}\n` +
              `• **Expected Stockout**: **${forecast.expectedStockoutDays} days**\n` +
              `• **Supplier Lead Time**: ${forecast.supplierLeadTime} days\n` +
              `• **Recommended Reorder**: **${forecast.recommendedReorderQty} ${forecast.unitOfMeasure}**\n\n` +
              `**Calculation Rationale:**\n${forecast.explanation}`,
            suggestedFollowUps: [
              'Show demand forecast',
              'What else needs reordering?',
              'How do I create a receipt?',
            ],
            actionButton: {
              label: 'Open Demand Forecast',
              path: '/forecast',
              actionType: 'NAVIGATE',
            },
          };
        }
      }
    }

    // Q: Which products are low in stock / What needs reordering?
    if (q.includes('low') || q.includes('out of stock') || q.includes('reorder') || q.includes('replenish')) {
      const recommendations = await IntelligenceEngine.getReorderAdvisor();
      const criticalOrLow = recommendations.filter(r => r.riskLevel === 'CRITICAL' || r.riskLevel === 'AT_RISK');

      if (criticalOrLow.length > 0) {
        const listText = criticalOrLow.slice(0, 5).map((r, i) =>
          `${i + 1}. **${r.productName}** (${r.sku}): Stock **${r.currentStock}** (Reorder Point: ${r.reorderPoint}) ➔ Reorder **${r.recommendedOrderQuantity} units** [${r.riskLevel}]`
        ).join('\n');

        return {
          message: `There are **${criticalOrLow.length} products** currently requiring inventory replenishment attention:\n\n${listText}`,
          suggestedFollowUps: [
            'Why do I need to reorder steel rods?',
            'Show pending deliveries',
            'Show demand forecast',
          ],
          actionButton: {
            label: 'View Low Stock Products',
            path: '/products?status=LOW_STOCK',
            actionType: 'NAVIGATE',
          },
        };
      } else {
        return {
          message: 'All inventory items are currently above safe reorder thresholds across warehouses.',
          suggestedFollowUps: ['Show demand forecast', 'Show warehouse stock'],
        };
      }
    }

    // Q: How many [Product] do we have? / Stock of [Product]
    if (q.includes('how many') || q.includes('how much') || q.includes('stock of') || q.includes('steel') || q.includes('quantity')) {
      const cleanProdQuery = q
        .replace(/how many|how much|do we have|stock of|in stock|units of|kg of|spools of/g, '')
        .trim();

      const product = await prisma.product.findFirst({
        where: {
          OR: [
            { name: { contains: cleanProdQuery || 'steel' } },
            { sku: { contains: cleanProdQuery.toUpperCase() || 'SKU-STL' } },
          ],
        },
        include: {
          category: true,
          stocks: { include: { warehouse: true, location: true } },
        },
      });

      if (product) {
        const totalStock = product.stocks.reduce((acc, s) => acc + s.quantity, 0);
        const locDetails = product.stocks.map(s => `${s.warehouse.name} (${s.location.name}): **${s.quantity} ${product.unitOfMeasure}**`).join(', ');

        return {
          message: `We currently have **${totalStock} ${product.unitOfMeasure}** of **${product.name}** (${product.sku}) in total stock.\n\n**Location Breakdown:**\n${locDetails || 'No stock assigned to locations yet.'}\n\n• Reorder Point: ${product.reorderPoint} ${product.unitOfMeasure}\n• Minimum Stock: ${product.minimumStock} ${product.unitOfMeasure}\n• Status: **${product.status.replace('_', ' ')}**`,
          suggestedFollowUps: [
            `Why do I need to reorder ${product.name}?`,
            `Show demand forecast for ${product.name}`,
            'Show low stock items',
          ],
          actionButton: {
            label: `View ${product.name}`,
            path: `/products?search=${encodeURIComponent(product.sku)}`,
            actionType: 'NAVIGATE',
          },
        };
      }
    }

    // Q: Which products will run out soon / this month?
    if (q.includes('run out') || q.includes('stockout') || q.includes('deplete') || q.includes('soon')) {
      const summaries = await ForecastService.getAllForecastSummaries();
      const urgent = summaries.filter(s => s.expectedStockoutDays <= 30);

      const itemsList = urgent.slice(0, 5).map(u =>
        `• **${u.productName}** (${u.sku}): Stockout projected in **${u.expectedStockoutDays} days** (Stock: ${u.currentStock} ${u.unitOfMeasure}, Usage: ${u.projectedDailyDemand}/day)`
      ).join('\n');

      return {
        message: `Based on 90-day demand velocity, **${urgent.length} product(s)** are projected to deplete within the next 30 days:\n\n${itemsList || 'None currently at immediate risk.'}`,
        suggestedFollowUps: ['Show demand forecast', 'What needs reordering?'],
        actionButton: {
          label: 'Open Demand Forecast',
          path: '/forecast',
          actionType: 'NAVIGATE',
        },
      };
    }

    // Q: What was received today / recently?
    if (q.includes('received') || q.includes('receipt') || q.includes('inbound')) {
      const receipts = await prisma.receipt.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { supplier: true, warehouse: true, items: { include: { product: true } } },
      });

      const listText = receipts.map(r =>
        `• **${r.receiptNumber}** from ${r.supplier.name} at ${r.warehouse.name} — Status: **${r.status}** (${r.items.length} line items)`
      ).join('\n');

      return {
        message: `Here are the most recent inbound vendor receipts:\n\n${listText || 'No recent receipts found.'}`,
        suggestedFollowUps: ['How do I create a receipt?', 'Show pending deliveries'],
        actionButton: {
          label: 'Open Receipts',
          path: '/receipts',
          actionType: 'NAVIGATE',
        },
      };
    }

    // Q: What was delivered today / recently? / Show today's deliveries
    if (q.includes('delivered') || q.includes('delivery') || q.includes('deliveries') || q.includes('outbound')) {
      const deliveries = await prisma.delivery.findMany({
        take: 4,
        orderBy: { createdAt: 'desc' },
        include: { customer: true, warehouse: true, items: { include: { product: true } } },
      });

      const listText = deliveries.map(d =>
        `• **${d.deliveryNumber}** for ${d.customer.name} from ${d.warehouse.name} — Status: **${d.status}**`
      ).join('\n');

      return {
        message: `Here are the latest customer delivery orders:\n\n${listText || 'No recent deliveries found.'}`,
        suggestedFollowUps: ['Show pending deliveries', 'What was received today?'],
        actionButton: {
          label: 'Open Deliveries',
          path: '/deliveries',
          actionType: 'NAVIGATE',
        },
      };
    }

    // Q: Which warehouse has the most stock? / Warehouse capacity
    if (q.includes('warehouse') && (q.includes('most') || q.includes('capacity') || q.includes('stock') || q.includes('list'))) {
      const warehouses = await prisma.warehouse.findMany({
        include: { locations: { include: { stocks: true } } },
      });

      const whSummary = warehouses.map(w => {
        const units = w.locations.reduce((acc, l) => acc + l.stocks.reduce((sAcc, s) => sAcc + s.quantity, 0), 0);
        const util = Math.min(100, Math.round((units / (w.totalCapacity || 1)) * 100));
        return `• **${w.name}** (${w.code}): **${units} units** stored (${util}% capacity of ${w.totalCapacity})`;
      }).join('\n');

      return {
        message: `Warehouse distribution summary across facilities:\n\n${whSummary}`,
        suggestedFollowUps: ['Show demand forecast', 'Show low stock'],
        actionButton: {
          label: 'View Warehouses & Digital Twin',
          path: '/warehouses',
          actionType: 'NAVIGATE',
        },
      };
    }

    // Q: Which products haven't moved recently? / Slow moving / Dead stock
    if (q.includes('haven\'t moved') || q.includes('not moved') || q.includes('slow moving') || q.includes('dead stock') || q.includes('stagnant')) {
      const aging = await IntelligenceEngine.getStockAgingAnalysis();
      const deadOrSlow = [...aging.buckets[2].items, ...aging.buckets[3].items];

      const listText = deadOrSlow.slice(0, 5).map(item =>
        `• **${item.name}** (${item.sku}): **${item.currentStock} ${item.unitOfMeasure}** ($${item.valuation.toLocaleString()}) — Last activity **${item.daysSinceMovement} days ago**`
      ).join('\n');

      return {
        message: `Identified **${deadOrSlow.length} slow-moving or stagnant inventory items**:\n\n${listText || 'No dead stock detected.'}`,
        suggestedFollowUps: ['Show demand forecast', 'What needs reordering?'],
        actionButton: {
          label: 'View Inventory Insights',
          path: '/intelligence',
          actionType: 'NAVIGATE',
        },
      };
    }

    // Default friendly assistant fallback
    return {
      message: `I'm **StockSense Copilot**, your intelligent assistant for warehouse operations and stock planning.\n\n` +
        `**You can ask me:**\n` +
        `• *"How many steel rods do we have?"*\n` +
        `• *"Why do I need to reorder steel rods?"*\n` +
        `• *"Which products are low in stock?"*\n` +
        `• *"What will run out soon?"*\n` +
        `• *"How do I create a receipt or transfer?"*\n` +
        `• *"Transfer 20 steel rods from Main Warehouse to Production"*\n` +
        `• *"Show today's deliveries"*`,
      suggestedFollowUps: [
        'Why do I need to reorder steel rods?',
        'Which products are low in stock?',
        'How do I create a receipt?',
        'Show demand forecast',
      ],
    };
  }
}
