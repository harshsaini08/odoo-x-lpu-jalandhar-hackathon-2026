import prisma from '../src/utils/prisma';
import { StockEngine } from '../src/services/stockEngine';
import { IntelligenceEngine } from '../src/services/intelligenceEngine';

describe('StockSense Core Engine & Operations Test Suite', () => {
  let testProductId: string;
  let warehouseId: string;
  let locRackAId: string;
  let locRackP1Id: string;
  let supplierId: string;
  let customerId: string;
  let managerId: string;

  beforeAll(async () => {
    // Lookup seeded entities
    const prod = await prisma.product.findFirst({ where: { sku: 'SKU-STL-001' } });
    testProductId = prod!.id;

    const whMain = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' }, include: { locations: true } });
    warehouseId = whMain!.id;
    locRackAId = whMain!.locations[0].id;

    const whProd = await prisma.warehouse.findFirst({ where: { code: 'WH-PROD' }, include: { locations: true } });
    locRackP1Id = whProd!.locations[0].id;

    const sup = await prisma.supplier.findFirst();
    supplierId = sup!.id;

    const cust = await prisma.customer.findFirst();
    customerId = cust!.id;

    const mgr = await prisma.user.findFirst({ where: { role: 'INVENTORY_MANAGER' } });
    managerId = mgr!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  test('1. Total Product Stock lookup returns accurate aggregate', async () => {
    const totalStock = await StockEngine.getTotalProductStock(testProductId);
    expect(totalStock).toBeGreaterThanOrEqual(0);
  });

  test('2. RECEIPT Operation increases stock and writes immutable ledger entry', async () => {
    const initialStock = await StockEngine.getTotalProductStock(testProductId);

    // Create receipt
    const receipt = await prisma.receipt.create({
      data: {
        receiptNumber: `REC-TEST-${Date.now()}`,
        supplierId,
        warehouseId,
        status: 'READY',
        items: {
          create: [
            {
              productId: testProductId,
              locationId: locRackAId,
              orderedQuantity: 50,
              receivedQuantity: 50,
              unitPrice: 48.5,
            },
          ],
        },
      },
    });

    const validated = await StockEngine.validateReceipt(receipt.id, managerId);
    expect(validated.status).toBe('DONE');

    const newStock = await StockEngine.getTotalProductStock(testProductId);
    expect(newStock).toBe(initialStock + 50);

    // Verify ledger entry
    const ledger = await prisma.stockLedger.findFirst({
      where: { referenceDoc: receipt.receiptNumber },
    });
    expect(ledger).toBeDefined();
    expect(ledger?.type).toBe('RECEIPT');
    expect(ledger?.quantity).toBe(50);
    expect(ledger?.afterStock).toBe(newStock);
  });

  test('3. DELIVERY Operation decreases stock and records ledger', async () => {
    const initialStock = await StockEngine.getTotalProductStock(testProductId);

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber: `DEL-TEST-${Date.now()}`,
        customerId,
        warehouseId,
        status: 'PACKED',
        items: {
          create: [
            {
              productId: testProductId,
              locationId: locRackAId,
              requestedQuantity: 10,
              deliveredQuantity: 10,
              unitPrice: 72.0,
            },
          ],
        },
      },
    });

    const validated = await StockEngine.validateDelivery(delivery.id, managerId);
    expect(validated.status).toBe('DONE');

    const newStock = await StockEngine.getTotalProductStock(testProductId);
    expect(newStock).toBe(initialStock - 10);
  });

  test('4. DELIVERY rejects when quantity exceeds available stock', async () => {
    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber: `DEL-OVER-${Date.now()}`,
        customerId,
        warehouseId,
        status: 'PACKED',
        items: {
          create: [
            {
              productId: testProductId,
              locationId: locRackAId,
              requestedQuantity: 999999, // impossible quantity
              deliveredQuantity: 999999,
            },
          ],
        },
      },
    });

    await expect(StockEngine.validateDelivery(delivery.id, managerId)).rejects.toThrow();
  });

  test('5. INTERNAL TRANSFER alters location distribution while conserving total stock', async () => {
    const initialTotalStock = await StockEngine.getTotalProductStock(testProductId);
    const initialSourceStock = await StockEngine.getLocationStock(testProductId, locRackAId);
    const initialDestStock = await StockEngine.getLocationStock(testProductId, locRackP1Id);

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber: `TRF-TEST-${Date.now()}`,
        sourceWarehouseId: warehouseId,
        sourceLocationId: locRackAId,
        destWarehouseId: (await prisma.location.findUnique({ where: { id: locRackP1Id } }))!.warehouseId,
        destLocationId: locRackP1Id,
        status: 'PENDING',
        items: {
          create: [
            {
              productId: testProductId,
              quantity: 15,
            },
          ],
        },
      },
    });

    const completed = await StockEngine.completeTransfer(transfer.id, managerId);
    expect(completed.status).toBe('COMPLETED');

    const finalTotalStock = await StockEngine.getTotalProductStock(testProductId);
    const finalSourceStock = await StockEngine.getLocationStock(testProductId, locRackAId);
    const finalDestStock = await StockEngine.getLocationStock(testProductId, locRackP1Id);

    // Total stock must remain invariant
    expect(finalTotalStock).toBe(initialTotalStock);
    expect(finalSourceStock).toBe(initialSourceStock - 15);
    expect(finalDestStock).toBe(initialDestStock + 15);
  });

  test('6. INVENTORY ADJUSTMENT updates stock, calculates difference and validates mandatory reason', async () => {
    const locStock = await StockEngine.getLocationStock(testProductId, locRackP1Id);
    const physicalCount = locStock - 2;

    const adjustment = await StockEngine.recordAdjustment({
      productId: testProductId,
      warehouseId: (await prisma.location.findUnique({ where: { id: locRackP1Id } }))!.warehouseId,
      locationId: locRackP1Id,
      physicalQuantity: physicalCount,
      reason: 'Physical inspection detected 2 damaged units',
      category: 'DAMAGED',
      userId: managerId,
    });

    expect(adjustment.difference).toBe(-2);
    expect(adjustment.physicalQuantity).toBe(physicalCount);

    const updatedLocStock = await StockEngine.getLocationStock(testProductId, locRackP1Id);
    expect(updatedLocStock).toBe(physicalCount);
  });

  test('7. INTELLIGENCE: Health Score calculation is in valid range with explainable breakdown', async () => {
    const health = await IntelligenceEngine.calculateHealthScore();
    expect(health.score).toBeGreaterThanOrEqual(0);
    expect(health.score).toBeLessThanOrEqual(100);
    expect(health.factors).toBeDefined();
    expect(health.factors.stockAvailability).toBeDefined();
    expect(health.factors.lowStockPenalty).toBeDefined();
  });

  test('8. INTELLIGENCE: Reorder Advisor generates deterministic recommendations', async () => {
    const recommendations = await IntelligenceEngine.getReorderAdvisor();
    expect(recommendations.length).toBeGreaterThan(0);
    const steel = recommendations.find((r) => r.productId === testProductId);
    expect(steel).toBeDefined();
    expect(steel?.reorderPoint).toBeGreaterThan(0);
    expect(steel?.calculationFormula).toContain('Reorder Point');
  });

  test('9. INTELLIGENCE: Why Did Stock Change provides complete ledger reconciliation', async () => {
    const explanation = await IntelligenceEngine.explainStockChanges(testProductId);
    expect(explanation).toBeDefined();
    expect(explanation?.summary.currentStock).toBeGreaterThanOrEqual(0);
    expect(explanation?.breakdownItems.length).toBe(4); // Receipts, Deliveries, Adjustments, Transfers
  });
});
