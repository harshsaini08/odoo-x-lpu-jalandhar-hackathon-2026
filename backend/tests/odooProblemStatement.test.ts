import request from 'supertest';
import app from '../src/app';
import prisma from '../src/utils/prisma';
import { StockEngine } from '../src/services/stockEngine';

describe('Odoo Problem Statement - StockSense Complete End-to-End Test Suite', () => {
  let managerToken: string;
  let staffToken: string;
  let managerId: string;
  let staffId: string;

  let warehouseMainId: string;
  let warehouseProdId: string;
  let locMainStoreId: string;
  let locProdRackId: string;
  let supplierId: string;
  let customerId: string;
  let categoryRawId: string;

  let docSteelProductId: string;

  beforeAll(async () => {
    // 1. Fetch or create baseline entities
    let cat = await prisma.category.findFirst({ where: { name: 'Raw Materials' } });
    if (!cat) {
      cat = await prisma.category.create({
        data: { name: 'Raw Materials', code: 'RAW', description: 'Raw metals and parts' },
      });
    }
    categoryRawId = cat.id;

    let whMain = await prisma.warehouse.findFirst({ where: { code: 'WH-MAIN' }, include: { locations: true } });
    if (!whMain) {
      whMain = await prisma.warehouse.create({
        data: {
          name: 'Main Warehouse',
          code: 'WH-MAIN',
          address: 'Building A, Central Logistics Park',
          totalCapacity: 5000,
          locations: {
            create: [{ name: 'Main Store Rack A', code: 'LOC-MAIN-A', type: 'STORAGE', capacity: 1500 }],
          },
        },
        include: { locations: true },
      });
    }
    warehouseMainId = whMain!.id;
    locMainStoreId = whMain!.locations[0].id;

    let whProd = await prisma.warehouse.findFirst({ where: { code: 'WH-PROD' }, include: { locations: true } });
    if (!whProd) {
      whProd = await prisma.warehouse.create({
        data: {
          name: 'Production Facility',
          code: 'WH-PROD',
          address: 'Building B, Industrial Zone',
          totalCapacity: 3000,
          locations: {
            create: [{ name: 'Production Rack P1', code: 'LOC-PROD-P1', type: 'PRODUCTION', capacity: 800 }],
          },
        },
        include: { locations: true },
      });
    }
    warehouseProdId = whProd!.id;
    locProdRackId = whProd!.locations[0].id;

    let sup = await prisma.supplier.findFirst();
    if (!sup) {
      sup = await prisma.supplier.create({
        data: { name: 'Apex Metal Industries', code: 'SUP-APEX', email: 'sales@apexmetal.com', leadTimeDays: 4 },
      });
    }
    supplierId = sup!.id;

    let cust = await prisma.customer.findFirst();
    if (!cust) {
      cust = await prisma.customer.create({
        data: { name: 'Titan Engineering Corp', code: 'CUST-TITAN', email: 'procurement@titaneng.com' },
      });
    }
    customerId = cust!.id;

    // 2. Create or verify Demo Product for Document Flow (Steel)
    let steel = await prisma.product.findFirst({ where: { sku: 'SKU-DOC-STEEL-100' } });
    if (!steel) {
      steel = await prisma.product.create({
        data: {
          name: 'Industrial Steel Rods 12mm',
          sku: 'SKU-DOC-STEEL-100',
          categoryId: categoryRawId,
          unitOfMeasure: 'kg',
          costPrice: 45.0,
          sellingPrice: 75.0,
          reorderPoint: 50,
          minimumStock: 20,
          maximumStock: 500,
          leadTimeDays: 4,
          avgDailyUsage: 10,
          defaultLocationId: locMainStoreId,
          supplierId: supplierId,
        },
      });
    }
    docSteelProductId = steel!.id;
  });

  afterAll(async () => {
    await prisma.$disconnect();
  });

  // ==========================================
  // SECTION 1: AUTHENTICATION & TARGET USERS
  // ==========================================
  describe('1. Authentication & Target User Personas', () => {
    test('1.1 Inventory Manager login succeeds and yields valid JWT with INVENTORY_MANAGER role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'manager@stocksense.io', password: 'manager123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('INVENTORY_MANAGER');

      managerToken = res.body.data.token;
      managerId = res.body.data.user.id;
    });

    test('1.2 Warehouse Staff login succeeds and yields valid JWT with WAREHOUSE_STAFF role', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@stocksense.io', password: 'staff123' });

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      expect(res.body.data.token).toBeDefined();
      expect(res.body.data.user.role).toBe('WAREHOUSE_STAFF');

      staffToken = res.body.data.token;
      staffId = res.body.data.user.id;
    });

    test('1.3 New User Sign Up / Registration flow creates user account', async () => {
      const testEmail = `operator_${Date.now()}@stocksense.io`;
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          name: 'Dock Operator',
          email: testEmail,
          password: 'password123',
          role: 'WAREHOUSE_STAFF',
          department: 'Receiving Dock',
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.user.email).toBe(testEmail);
      expect(res.body.data.token).toBeDefined();
    });

    test('1.4 OTP-based Password Reset: requests OTP and resets password', async () => {
      // Step A: Request OTP
      const forgotRes = await request(app)
        .post('/api/auth/forgot-password')
        .send({ email: 'staff@stocksense.io' });

      expect(forgotRes.status).toBe(200);
      expect(forgotRes.body.success).toBe(true);
      expect(forgotRes.body.demoOtp).toBe('123456');

      // Step B: Submit with invalid OTP should fail
      const badOtpRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'staff@stocksense.io',
          otp: '999999',
          newPassword: 'newpassword123',
        });
      expect(badOtpRes.status).toBe(400);

      // Step C: Submit with valid OTP resets password
      const resetRes = await request(app)
        .post('/api/auth/reset-password')
        .send({
          email: 'staff@stocksense.io',
          otp: '123456',
          newPassword: 'staff123', // restore for other tests
        });

      expect(resetRes.status).toBe(200);
      expect(resetRes.body.success).toBe(true);

      // Step D: Verify login works with the updated password
      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'staff@stocksense.io', password: 'staff123' });
      expect(loginRes.status).toBe(200);
    });
  });

  // ==========================================
  // SECTION 2: DASHBOARD VIEW & DYNAMIC KPIS
  // ==========================================
  describe('2. Dashboard View & Dynamic KPIs', () => {
    test('2.1 Dashboard endpoint returns all mandatory KPIs: Products, Low Stock, Receipts, Deliveries, Transfers', async () => {
      const res = await request(app)
        .get('/api/dashboard')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(res.status).toBe(200);
      expect(res.body.success).toBe(true);
      const kpis = res.body.data.kpis;

      expect(kpis.totalProducts).toBeGreaterThanOrEqual(1);
      expect(kpis.totalUnits).toBeGreaterThanOrEqual(0);
      expect(kpis.totalValuation).toBeGreaterThanOrEqual(0);
      expect(typeof kpis.lowStockCount).toBe('number');
      expect(typeof kpis.outOfStockCount).toBe('number');
      expect(typeof kpis.pendingReceipts).toBe('number');
      expect(typeof kpis.pendingDeliveries).toBe('number');
      expect(typeof kpis.activeTransfers).toBe('number');
      expect(kpis.healthScore).toBeGreaterThanOrEqual(0);
      expect(kpis.healthScore).toBeLessThanOrEqual(100);
    });

    test('2.2 Dynamic Filters by document type and status operate correctly', async () => {
      // Receipts filter
      const receiptsRes = await request(app).get('/api/receipts?status=ALL');
      expect(receiptsRes.status).toBe(200);
      expect(Array.isArray(receiptsRes.body.data.items)).toBe(true);

      // Deliveries filter
      const deliveriesRes = await request(app).get('/api/deliveries?status=ALL');
      expect(deliveriesRes.status).toBe(200);
      expect(Array.isArray(deliveriesRes.body.data.items)).toBe(true);

      // Transfers filter
      const transfersRes = await request(app).get('/api/transfers?status=ALL');
      expect(transfersRes.status).toBe(200);
      expect(Array.isArray(transfersRes.body.data.items)).toBe(true);

      // Adjustments filter
      const adjustmentsRes = await request(app).get('/api/adjustments?category=ALL');
      expect(adjustmentsRes.status).toBe(200);
      expect(Array.isArray(adjustmentsRes.body.data.items)).toBe(true);
    });
  });

  // ==========================================
  // SECTION 3: PRODUCT MANAGEMENT
  // ==========================================
  describe('3. Product Management & Catalog', () => {
    let createdSku = `SKU-TEST-${Date.now().toString().slice(-4)}`;
    let createdProdId: string;

    test('3.1 Create product with Name, SKU, Category, UoM, and initial stock', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Ergonomic Mesh Chair Model X',
          sku: createdSku,
          categoryId: categoryRawId,
          unitOfMeasure: 'units',
          description: 'High durability office chair frame',
          costPrice: 85.0,
          sellingPrice: 160.0,
          reorderPoint: 15,
          minimumStock: 5,
          maximumStock: 100,
          defaultLocationId: locMainStoreId,
          initialStock: 10,
        });

      expect(res.status).toBe(201);
      expect(res.body.success).toBe(true);
      expect(res.body.data.product.sku).toBe(createdSku);

      createdProdId = res.body.data.product.id;

      // Verify stock availability per location was created
      const locStock = await StockEngine.getLocationStock(createdProdId, locMainStoreId);
      expect(locStock).toBe(10);
    });

    test('3.2 Update product attributes (pricing, reordering rules)', async () => {
      const res = await request(app)
        .put(`/api/products/${createdProdId}`)
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sellingPrice: 175.0,
          reorderPoint: 20,
        });

      expect(res.status).toBe(200);
      expect(res.body.data.product.sellingPrice).toBe(175.0);
      expect(res.body.data.product.reorderPoint).toBe(20);
    });

    test('3.3 Prevent duplicate SKU creation', async () => {
      const res = await request(app)
        .post('/api/products')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          name: 'Duplicate SKU Item',
          sku: createdSku,
          categoryId: categoryRawId,
          unitOfMeasure: 'units',
        });

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    test('3.4 Search and filter products by SKU and keyword', async () => {
      const res = await request(app).get(`/api/products?search=${createdSku}`);
      expect(res.status).toBe(200);
      expect(res.body.data.items.length).toBeGreaterThanOrEqual(1);
      expect(res.body.data.items[0].sku).toBe(createdSku);
    });
  });

  // =========================================================================
  // SECTION 4: SIMPLIFIED 4-STEP INVENTORY FLOW AS PER DOCUMENT PAGES 3 & 4
  // =========================================================================
  describe('4. Simplified Example to Understand Inventory Flow (Doc Pages 3 & 4)', () => {
    let baselineStock: number;
    let initialMainStock: number;
    let initialProdStock: number;

    beforeAll(async () => {
      baselineStock = await StockEngine.getTotalProductStock(docSteelProductId);
      initialMainStock = await StockEngine.getLocationStock(docSteelProductId, locMainStoreId);
      initialProdStock = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);
    });

    // STEP 1: Receive Goods from Vendor (Receive 100 kg Steel -> Stock: +100)
    test('Step 1 : Receive Goods from Vendor (+100 kg Steel)', async () => {
      // 1. Create Receipt for 100 kg
      const createRes = await request(app)
        .post('/api/receipts')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          supplierId,
          warehouseId: warehouseMainId,
          notes: 'Doc Step 1: Inbound shipment of 100kg steel',
          items: [
            {
              productId: docSteelProductId,
              locationId: locMainStoreId,
              orderedQuantity: 100,
              receivedQuantity: 100,
              unitPrice: 45.0,
            },
          ],
        });

      expect(createRes.status).toBe(201);
      const receiptId = createRes.body.data.receipt.id;

      // 2. Validate Receipt -> Stock increases automatically
      const validateRes = await request(app)
        .post(`/api/receipts/${receiptId}/validate`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body.data.receipt.status).toBe('DONE');

      // 3. Verify stock +100
      const currentStock = await StockEngine.getTotalProductStock(docSteelProductId);
      expect(currentStock).toBe(baselineStock + 100);

      const mainStock = await StockEngine.getLocationStock(docSteelProductId, locMainStoreId);
      expect(mainStock).toBe(initialMainStock + 100);

      // 4. Verify Ledger Entry
      const ledger = await prisma.stockLedger.findFirst({
        where: { referenceDoc: validateRes.body.data.receipt.receiptNumber },
      });
      expect(ledger).toBeDefined();
      expect(ledger?.type).toBe('RECEIPT');
      expect(ledger?.quantity).toBe(100);
      expect(ledger?.afterStock).toBe(baselineStock + 100);
    });

    // STEP 2: Move to production rack (Internal transfer: Main Store -> Production Rack -> Stock unchanged in total, new location updated)
    test('Step 2 : Move to production rack (Transfer 50 kg Main Store -> Production Rack)', async () => {
      const stockBeforeTransfer = await StockEngine.getTotalProductStock(docSteelProductId);
      const mainStockBefore = await StockEngine.getLocationStock(docSteelProductId, locMainStoreId);
      const prodStockBefore = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);

      // 1. Create Internal Transfer
      const transferRes = await request(app)
        .post('/api/transfers')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          sourceWarehouseId: warehouseMainId,
          sourceLocationId: locMainStoreId,
          destWarehouseId: warehouseProdId,
          destLocationId: locProdRackId,
          notes: 'Doc Step 2: Transfer 50kg steel to Production Floor Rack',
          items: [
            {
              productId: docSteelProductId,
              quantity: 50,
            },
          ],
        });

      expect(transferRes.status).toBe(201);
      const transferId = transferRes.body.data.transfer.id;

      // 2. Complete Transfer
      const completeRes = await request(app)
        .post(`/api/transfers/${transferId}/complete`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(completeRes.status).toBe(200);
      expect(completeRes.body.data.transfer.status).toBe('COMPLETED');

      // 3. Verify: Total stock remains UNCHANGED
      const stockAfterTransfer = await StockEngine.getTotalProductStock(docSteelProductId);
      expect(stockAfterTransfer).toBe(stockBeforeTransfer);

      // 4. Verify: Source location reduced by 50, Dest location increased by 50
      const mainStockAfter = await StockEngine.getLocationStock(docSteelProductId, locMainStoreId);
      const prodStockAfter = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);

      expect(mainStockAfter).toBe(mainStockBefore - 50);
      expect(prodStockAfter).toBe(prodStockBefore + 50);

      // 5. Verify Ledger
      const transferLedger = await prisma.stockLedger.findFirst({
        where: { referenceDoc: completeRes.body.data.transfer.transferNumber },
      });
      expect(transferLedger).toBeDefined();
      expect(transferLedger?.type.startsWith('TRANSFER')).toBe(true);
      expect(Math.abs(transferLedger?.quantity || 0)).toBe(50);
    });

    // STEP 3: Deliver finished goods (Deliver 20 steel -> Stock for frames: -20)
    test('Step 3 : Deliver finished goods (Deliver 20 kg steel to customer)', async () => {
      const stockBeforeDelivery = await StockEngine.getTotalProductStock(docSteelProductId);
      const prodStockBefore = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);

      // 1. Create Delivery Order
      const deliveryRes = await request(app)
        .post('/api/deliveries')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          customerId,
          warehouseId: warehouseProdId,
          destination: 'Titan Engineering Plant 3',
          notes: 'Doc Step 3: Outbound delivery of 20kg steel',
          items: [
            {
              productId: docSteelProductId,
              locationId: locProdRackId,
              requestedQuantity: 20,
              deliveredQuantity: 20,
              unitPrice: 75.0,
            },
          ],
        });

      expect(deliveryRes.status).toBe(201);
      const deliveryId = deliveryRes.body.data.delivery.id;

      // 2. Pick & Pack workflow
      await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'PICKED' });

      await request(app)
        .patch(`/api/deliveries/${deliveryId}/status`)
        .set('Authorization', `Bearer ${staffToken}`)
        .send({ status: 'PACKED' });

      // 3. Validate Delivery -> Stock decreases automatically
      const validateRes = await request(app)
        .post(`/api/deliveries/${deliveryId}/validate`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(validateRes.status).toBe(200);
      expect(validateRes.body.data.delivery.status).toBe('DONE');

      // 4. Verify Stock -20
      const stockAfterDelivery = await StockEngine.getTotalProductStock(docSteelProductId);
      expect(stockAfterDelivery).toBe(stockBeforeDelivery - 20);

      const prodStockAfter = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);
      expect(prodStockAfter).toBe(prodStockBefore - 20);

      // 5. Verify Ledger
      const deliveryLedger = await prisma.stockLedger.findFirst({
        where: { referenceDoc: validateRes.body.data.delivery.deliveryNumber },
      });
      expect(deliveryLedger).toBeDefined();
      expect(deliveryLedger?.type).toBe('DELIVERY');
      expect(Math.abs(deliveryLedger?.quantity || 0)).toBe(20);
    });

    // STEP 4: Adjust damaged items (3 kg steel damaged -> Stock: -3)
    test('Step 4 : Adjust damaged items (3 kg steel damaged -> Stock: -3)', async () => {
      const stockBeforeAdj = await StockEngine.getTotalProductStock(docSteelProductId);
      const prodStockBefore = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);

      // Physical count shows 3kg damaged/missing from Production Rack
      const physicalCount = prodStockBefore - 3;

      const adjRes = await request(app)
        .post('/api/adjustments')
        .set('Authorization', `Bearer ${managerToken}`)
        .send({
          productId: docSteelProductId,
          warehouseId: warehouseProdId,
          locationId: locProdRackId,
          physicalQuantity: physicalCount,
          reason: 'Doc Step 4: 3 kg steel found oxidized/damaged during spot audit',
          category: 'DAMAGED',
        });

      expect(adjRes.status).toBe(201);
      expect(adjRes.body.data.adjustment.difference).toBe(-3);

      // Verify Stock is reduced by 3
      const stockAfterAdj = await StockEngine.getTotalProductStock(docSteelProductId);
      expect(stockAfterAdj).toBe(stockBeforeAdj - 3);

      const prodStockAfter = await StockEngine.getLocationStock(docSteelProductId, locProdRackId);
      expect(prodStockAfter).toBe(physicalCount);

      // Verify final mathematical net equation: Initial + 100 - 0 - 20 - 3 = Initial + 77
      expect(stockAfterAdj).toBe(baselineStock + 77);
    });

    test('4.5 Complete Move History (Stock Ledger) contains all 4 sequential transactions', async () => {
      const ledgerRes = await request(app)
        .get(`/api/products/${docSteelProductId}/movements`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(ledgerRes.status).toBe(200);
      const movements = ledgerRes.body.data.movements;
      expect(movements.length).toBeGreaterThanOrEqual(4);

      const types = movements.map((m: any) => m.type);
      expect(types).toContain('RECEIPT');
      expect(types.some((t: string) => t.startsWith('TRANSFER'))).toBe(true);
      expect(types).toContain('DELIVERY');
      expect(types).toContain('ADJUSTMENT');
    });
  });

  // =========================================================================
  // SECTION 5: ADDITIONAL FEATURES (Alerts, Multi-warehouse, Reorder, Explain)
  // =========================================================================
  describe('5. Additional Features & Intelligence', () => {
    test('5.1 Low stock alert generation and retrieval', async () => {
      const alertsRes = await request(app)
        .get('/api/alerts')
        .set('Authorization', `Bearer ${managerToken}`);

      expect(alertsRes.status).toBe(200);
      expect(Array.isArray(alertsRes.body.data.items)).toBe(true);
    });

    test('5.2 Multi-Warehouse list with rack occupancy and utilization', async () => {
      const whRes = await request(app).get('/api/warehouses');
      expect(whRes.status).toBe(200);
      expect(whRes.body.data.warehouses.length).toBeGreaterThanOrEqual(2);
      expect(whRes.body.data.warehouses[0].locations).toBeDefined();
    });

    test('5.3 "Why Did Stock Change?" mathematical reconciliation equation', async () => {
      const whyRes = await request(app)
        .get(`/api/intelligence/explain/${docSteelProductId}`)
        .set('Authorization', `Bearer ${managerToken}`);

      expect(whyRes.status).toBe(200);
      expect(whyRes.body.data.summary).toBeDefined();
      expect(whyRes.body.data.summary.totalReceipts).toBeGreaterThanOrEqual(100);
      expect(whyRes.body.data.summary.totalDeliveries).toBeGreaterThanOrEqual(20);
      expect(whyRes.body.data.summary.totalAdjustments).toBeLessThanOrEqual(-3);
    });
  });
});
