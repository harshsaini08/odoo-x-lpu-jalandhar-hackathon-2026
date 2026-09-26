import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting StockSense comprehensive database seed...');

  // Clean existing tables in proper relational order
  await prisma.stockLedger.deleteMany({});
  await prisma.alert.deleteMany({});
  await prisma.reorderRule.deleteMany({});
  await prisma.adjustment.deleteMany({});
  await prisma.transferItem.deleteMany({});
  await prisma.transfer.deleteMany({});
  await prisma.deliveryItem.deleteMany({});
  await prisma.delivery.deleteMany({});
  await prisma.receiptItem.deleteMany({});
  await prisma.receipt.deleteMany({});
  await prisma.stock.deleteMany({});
  await prisma.product.deleteMany({});
  await prisma.customer.deleteMany({});
  await prisma.supplier.deleteMany({});
  await prisma.location.deleteMany({});
  await prisma.warehouse.deleteMany({});
  await prisma.category.deleteMany({});
  await prisma.user.deleteMany({});

  console.log('🧹 Cleaned existing database tables.');

  // 1. Seed Users
  const passwordHash = await bcrypt.hash('admin123', 10);
  const managerHash = await bcrypt.hash('manager123', 10);
  const staffHash = await bcrypt.hash('staff123', 10);

  const admin = await prisma.user.create({
    data: {
      email: 'admin@stocksense.io',
      passwordHash,
      name: 'Sarah Connor',
      role: 'ADMIN',
      department: 'Executive Operations',
      avatarUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150',
    },
  });

  const manager = await prisma.user.create({
    data: {
      email: 'manager@stocksense.io',
      passwordHash: managerHash,
      name: 'Alex Mercer',
      role: 'INVENTORY_MANAGER',
      department: 'Supply Chain & Inventory',
      avatarUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150',
    },
  });

  const staff = await prisma.user.create({
    data: {
      email: 'staff@stocksense.io',
      passwordHash: staffHash,
      name: 'David Vance',
      role: 'WAREHOUSE_STAFF',
      department: 'Warehouse Operations',
      avatarUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150',
    },
  });

  console.log('👤 Created Users: admin@stocksense.io, manager@stocksense.io, staff@stocksense.io');

  // 2. Seed Categories
  const catRaw = await prisma.category.create({
    data: { name: 'Raw Materials', code: 'RM', description: 'Primary manufacturing inputs & billets', icon: 'Box' },
  });
  const catMetals = await prisma.category.create({
    data: { name: 'Metals & Hardware', code: 'MH', description: 'Structural steel, fasteners & components', icon: 'Hammer' },
  });
  const catElec = await prisma.category.create({
    data: { name: 'Electrical & Automation', code: 'EE', description: 'Cables, breakers & components', icon: 'Zap' },
  });
  const catPipes = await prisma.category.create({
    data: { name: 'Piping & Plumbing', code: 'PP', description: 'PVC, valves & structural tubing', icon: 'Activity' },
  });
  const catSafety = await prisma.category.create({
    data: { name: 'Safety & PPE', code: 'SP', description: 'Helmets, vests, gloves & protection', icon: 'Shield' },
  });
  const catFacilities = await prisma.category.create({
    data: { name: 'Office & Facilities', code: 'OF', description: 'Workstations, seating & supplies', icon: 'Layers' },
  });

  console.log('📦 Created Categories.');

  // 3. Seed Warehouses
  const whMain = await prisma.warehouse.create({
    data: {
      name: 'Main Central Warehouse',
      code: 'WH-MAIN',
      address: 'Industrial Sector 62, Hub A',
      city: 'Chicago, IL',
      totalCapacity: 15000,
      isPrimary: true,
    },
  });

  const whProd = await prisma.warehouse.create({
    data: {
      name: 'Production & Assembly Plant',
      code: 'WH-PROD',
      address: 'Factory Zone 4, Bay B',
      city: 'Gary, IN',
      totalCapacity: 8000,
      isPrimary: false,
    },
  });

  const whStore = await prisma.warehouse.create({
    data: {
      name: 'Store Room & Spares Depot',
      code: 'WH-STORE',
      address: 'Logistics Park 12',
      city: 'Aurora, IL',
      totalCapacity: 5000,
      isPrimary: false,
    },
  });

  console.log('🏭 Created Warehouses: WH-MAIN, WH-PROD, WH-STORE');

  // 4. Seed Locations / Racks
  const locRackA = await prisma.location.create({
    data: { warehouseId: whMain.id, name: 'Rack A (Heavy Metals)', code: 'LOC-MA1', rackNumber: 'Rack A', shelfNumber: 'Tier 1-3', capacity: 3500, type: 'STORAGE' },
  });
  const locRackB = await prisma.location.create({
    data: { warehouseId: whMain.id, name: 'Rack B (Electrical & Spools)', code: 'LOC-MB1', rackNumber: 'Rack B', shelfNumber: 'Tier 1-4', capacity: 3000, type: 'STORAGE' },
  });
  const locRackC = await prisma.location.create({
    data: { warehouseId: whMain.id, name: 'Rack C (Piping & Chem)', code: 'LOC-MC1', rackNumber: 'Rack C', shelfNumber: 'Tier 1-2', capacity: 2500, type: 'STORAGE' },
  });
  const locRecBay = await prisma.location.create({
    data: { warehouseId: whMain.id, name: 'Receiving Dock Inbound', code: 'LOC-MRC', rackNumber: 'Dock 1', capacity: 3000, type: 'RECEIVING' },
  });
  const locDispBay = await prisma.location.create({
    data: { warehouseId: whMain.id, name: 'Dispatch Staging Bay', code: 'LOC-MDS', rackNumber: 'Dock 4', capacity: 3000, type: 'DISPATCH' },
  });

  const locProdP1 = await prisma.location.create({
    data: { warehouseId: whProd.id, name: 'Production Rack P1 (Active Assembly)', code: 'LOC-PP1', rackNumber: 'Rack P1', shelfNumber: 'Staging 1', capacity: 3000, type: 'PRODUCTION' },
  });
  const locProdP2 = await prisma.location.create({
    data: { warehouseId: whProd.id, name: 'Production Rack P2 (Sub-Assembly)', code: 'LOC-PP2', rackNumber: 'Rack P2', shelfNumber: 'Staging 2', capacity: 3000, type: 'PRODUCTION' },
  });
  const locScrap = await prisma.location.create({
    data: { warehouseId: whProd.id, name: 'Quality Quarantine & Scrap', code: 'LOC-PSC', rackNumber: 'Scrap Zone', capacity: 1000, type: 'SCRAP' },
  });

  const locStoreS1 = await prisma.location.create({
    data: { warehouseId: whStore.id, name: 'Store Shelf S1 (Hardware & Fasteners)', code: 'LOC-SS1', rackNumber: 'Shelf S1', capacity: 2000, type: 'STORAGE' },
  });
  const locStoreS2 = await prisma.location.create({
    data: { warehouseId: whStore.id, name: 'Store Shelf S2 (PPE & Safety Gear)', code: 'LOC-SS2', rackNumber: 'Shelf S2', capacity: 2000, type: 'STORAGE' },
  });

  console.log('📍 Created Locations & Warehouse Racks.');

  // 5. Seed Suppliers & Customers
  const supApex = await prisma.supplier.create({
    data: { name: 'Apex Steel & Alloys Corp', code: 'SUP-001', email: 'sales@apexsteel.com', phone: '+1-800-555-0199', leadTimeDays: 5, rating: 4.9 },
  });
  const supNational = await prisma.supplier.create({
    data: { name: 'National Industrial Supplies Ltd', code: 'SUP-002', email: 'orders@nationalind.com', phone: '+1-800-555-0144', leadTimeDays: 4, rating: 4.7 },
  });
  const supVoltaic = await prisma.supplier.create({
    data: { name: 'Voltaic Electricals Ltd', code: 'SUP-003', email: 'contact@voltaicelec.com', phone: '+1-800-555-0177', leadTimeDays: 3, rating: 4.8 },
  });
  const supPoly = await prisma.supplier.create({
    data: { name: 'Polymer & Piping Solutions', code: 'SUP-004', email: 'support@polypipes.com', phone: '+1-800-555-0112', leadTimeDays: 6, rating: 4.6 },
  });

  const custApexFab = await prisma.customer.create({
    data: { name: 'Apex Fabrication Ltd', code: 'CUST-001', email: 'procurement@apexfab.com', phone: '+1-312-555-0110', address: '450 Industrial Parkway, Chicago, IL' },
  });
  const custMetro = await prisma.customer.create({
    data: { name: 'Metro Infrastructure Projects', code: 'CUST-002', email: 'orders@metroinfra.org', phone: '+1-312-555-0120', address: '780 Skyview Blvd, Chicago, IL' },
  });
  const custZenith = await prisma.customer.create({
    data: { name: 'Zenith Machinery & Automation', code: 'CUST-003', email: 'supply@zenithmach.com', phone: '+1-312-555-0130', address: '120 Automation Way, Gary, IN' },
  });
  const custHorizon = await prisma.customer.create({
    data: { name: 'Horizon Construction Corp', code: 'CUST-004', email: 'site@horizonbuild.com', phone: '+1-312-555-0140', address: '990 Prairie Road, Aurora, IL' },
  });

  console.log('🤝 Created Suppliers & Customers.');

  // 6. Seed 22 Realistic Products with precise demo scenarios
  const productsData = [
    // CRITICAL LIVE DEMO PRODUCT: Steel Rods starts at 42 kg
    {
      name: 'Steel Rods (High-Tensile 12mm)',
      sku: 'SKU-STL-001',
      categoryId: catMetals.id,
      unitOfMeasure: 'kg',
      description: 'High tensile carbon steel reinforcing rods for structural framing and fabrication.',
      supplierId: supApex.id,
      costPrice: 48.5,
      sellingPrice: 72.0,
      minimumStock: 20,
      reorderPoint: 50,
      maximumStock: 200,
      leadTimeDays: 5,
      avgDailyUsage: 8.0,
      defaultLocationId: locRackA.id,
      status: 'LOW_STOCK',
      barcode: '890123450001',
      initialQty: 42,
      warehouseId: whMain.id,
      locationId: locRackA.id,
    },
    // Healthy high stock item
    {
      name: 'Portland Cement Bags 50kg',
      sku: 'SKU-CEM-002',
      categoryId: catRaw.id,
      unitOfMeasure: 'bags',
      description: 'Grade 53 high early strength Portland cement for concrete foundations.',
      supplierId: supNational.id,
      costPrice: 12.0,
      sellingPrice: 18.5,
      minimumStock: 30,
      reorderPoint: 60,
      maximumStock: 250,
      leadTimeDays: 3,
      avgDailyUsage: 6.0,
      defaultLocationId: locRackC.id,
      status: 'HEALTHY',
      barcode: '890123450002',
      initialQty: 180,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
    // Out of Stock Item
    {
      name: 'Ergonomic Mesh Office Chairs',
      sku: 'SKU-OFF-003',
      categoryId: catFacilities.id,
      unitOfMeasure: 'units',
      description: 'Executive lumbar support swivel chairs with breathable mesh and 3D armrests.',
      supplierId: supNational.id,
      costPrice: 110.0,
      sellingPrice: 195.0,
      minimumStock: 5,
      reorderPoint: 15,
      maximumStock: 50,
      leadTimeDays: 7,
      avgDailyUsage: 2.0,
      defaultLocationId: locStoreS1.id,
      status: 'OUT_OF_STOCK',
      barcode: '890123450003',
      initialQty: 0,
      warehouseId: whStore.id,
      locationId: locStoreS1.id,
    },
    // Low Stock Item
    {
      name: 'Hardwood Plywood Panels 8x4ft',
      sku: 'SKU-WOD-004',
      categoryId: catRaw.id,
      unitOfMeasure: 'sheets',
      description: 'Commercial grade moisture-resistant birch veneer plywood sheets.',
      supplierId: supNational.id,
      costPrice: 34.0,
      sellingPrice: 55.0,
      minimumStock: 10,
      reorderPoint: 25,
      maximumStock: 100,
      leadTimeDays: 4,
      avgDailyUsage: 4.0,
      defaultLocationId: locRackA.id,
      status: 'LOW_STOCK',
      barcode: '890123450004',
      initialQty: 12,
      warehouseId: whMain.id,
      locationId: locRackA.id,
    },
    // Overstocked Item
    {
      name: 'Industrial LED High Bay 150W',
      sku: 'SKU-LED-005',
      categoryId: catElec.id,
      unitOfMeasure: 'units',
      description: 'Super-bright 20000LM IP65 waterproof commercial warehouse lights.',
      supplierId: supVoltaic.id,
      costPrice: 42.0,
      sellingPrice: 75.0,
      minimumStock: 30,
      reorderPoint: 60,
      maximumStock: 150,
      leadTimeDays: 5,
      avgDailyUsage: 3.0,
      defaultLocationId: locRackB.id,
      status: 'OVERSTOCKED',
      barcode: '890123450005',
      initialQty: 240,
      warehouseId: whMain.id,
      locationId: locRackB.id,
    },
    // Healthy items
    {
      name: 'Copper Wire Spools 2.5mm 100m',
      sku: 'SKU-COP-006',
      categoryId: catElec.id,
      unitOfMeasure: 'spools',
      description: 'Pure electrolytic annealed copper insulated multicore wire.',
      supplierId: supVoltaic.id,
      costPrice: 65.0,
      sellingPrice: 98.0,
      minimumStock: 15,
      reorderPoint: 35,
      maximumStock: 120,
      leadTimeDays: 4,
      avgDailyUsage: 5.0,
      defaultLocationId: locRackB.id,
      status: 'HEALTHY',
      barcode: '890123450006',
      initialQty: 75,
      warehouseId: whMain.id,
      locationId: locRackB.id,
    },
    {
      name: 'Rigid PVC Conduit Pipes 4-inch 3m',
      sku: 'SKU-PVC-007',
      categoryId: catPipes.id,
      unitOfMeasure: 'pipes',
      description: 'Heavy duty schedule 40 electrical and drainage PVC pipes.',
      supplierId: supPoly.id,
      costPrice: 18.0,
      sellingPrice: 29.0,
      minimumStock: 20,
      reorderPoint: 45,
      maximumStock: 160,
      leadTimeDays: 6,
      avgDailyUsage: 6.0,
      defaultLocationId: locRackC.id,
      status: 'LOW_STOCK',
      barcode: '890123450007',
      initialQty: 28,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
    {
      name: 'Epoxy Floor Paint Buckets 20L',
      sku: 'SKU-PNT-008',
      categoryId: catFacilities.id,
      unitOfMeasure: 'buckets',
      description: 'Two-component heavy chemical resistant industrial floor coating.',
      supplierId: supNational.id,
      costPrice: 85.0,
      sellingPrice: 140.0,
      minimumStock: 15,
      reorderPoint: 30,
      maximumStock: 100,
      leadTimeDays: 4,
      avgDailyUsage: 3.0,
      defaultLocationId: locRackC.id,
      status: 'HEALTHY',
      barcode: '890123450008',
      initialQty: 85,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
    {
      name: 'Vented Safety Helmets (ANSI Z89.1)',
      sku: 'SKU-PPE-009',
      categoryId: catSafety.id,
      unitOfMeasure: 'units',
      description: 'Type 1 Class C industrial hard hats with 6-point suspension.',
      supplierId: supNational.id,
      costPrice: 9.5,
      sellingPrice: 18.0,
      minimumStock: 25,
      reorderPoint: 50,
      maximumStock: 150,
      leadTimeDays: 3,
      avgDailyUsage: 5.0,
      defaultLocationId: locStoreS2.id,
      status: 'HEALTHY',
      barcode: '890123450009',
      initialQty: 95,
      warehouseId: whStore.id,
      locationId: locStoreS2.id,
    },
    // Slow Moving / Dead stock scenario item
    {
      name: 'Industrial Ball Bearings 6205-2RS',
      sku: 'SKU-BRG-010',
      categoryId: catMetals.id,
      unitOfMeasure: 'units',
      description: 'Deep groove chrome steel sealed precision bearings.',
      supplierId: supApex.id,
      costPrice: 14.0,
      sellingPrice: 28.0,
      minimumStock: 20,
      reorderPoint: 40,
      maximumStock: 150,
      leadTimeDays: 5,
      avgDailyUsage: 1.0,
      defaultLocationId: locStoreS1.id,
      status: 'SLOW_MOVING',
      barcode: '890123450010',
      initialQty: 18,
      warehouseId: whStore.id,
      locationId: locStoreS1.id,
    },
    {
      name: 'Aluminum Alloy Sheets 6061-T6 2mm',
      sku: 'SKU-ALU-011',
      categoryId: catMetals.id,
      unitOfMeasure: 'sheets',
      description: 'Aerospace & structural corrosion-resistant alloy sheets.',
      supplierId: supApex.id,
      costPrice: 95.0,
      sellingPrice: 155.0,
      minimumStock: 15,
      reorderPoint: 30,
      maximumStock: 100,
      leadTimeDays: 5,
      avgDailyUsage: 4.0,
      defaultLocationId: locRackA.id,
      status: 'HEALTHY',
      barcode: '890123450011',
      initialQty: 55,
      warehouseId: whMain.id,
      locationId: locRackA.id,
    },
    {
      name: 'Kevlar Reinforced Cut-Resistant Gloves',
      sku: 'SKU-PPE-012',
      categoryId: catSafety.id,
      unitOfMeasure: 'pairs',
      description: 'ANSI Cut Level A4 nitrile coated grip industrial gloves.',
      supplierId: supNational.id,
      costPrice: 6.5,
      sellingPrice: 12.0,
      minimumStock: 40,
      reorderPoint: 80,
      maximumStock: 300,
      leadTimeDays: 3,
      avgDailyUsage: 10.0,
      defaultLocationId: locStoreS2.id,
      status: 'HEALTHY',
      barcode: '890123450012',
      initialQty: 160,
      warehouseId: whStore.id,
      locationId: locStoreS2.id,
    },
    {
      name: 'ISO VG 46 Hydraulic Oil Drum 208L',
      sku: 'SKU-LUB-013',
      categoryId: catRaw.id,
      unitOfMeasure: 'drums',
      description: 'Anti-wear premium grade hydraulic fluid for pressing & injection units.',
      supplierId: supNational.id,
      costPrice: 320.0,
      sellingPrice: 480.0,
      minimumStock: 4,
      reorderPoint: 8,
      maximumStock: 30,
      leadTimeDays: 5,
      avgDailyUsage: 1.0,
      defaultLocationId: locRackC.id,
      status: 'HEALTHY',
      barcode: '890123450013',
      initialQty: 14,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
    {
      name: 'Stainless Steel Screws M8x40 (Box of 500)',
      sku: 'SKU-SCR-014',
      categoryId: catMetals.id,
      unitOfMeasure: 'boxes',
      description: 'A2-70 grade 304 stainless steel hex head machine screws.',
      supplierId: supApex.id,
      costPrice: 22.0,
      sellingPrice: 38.0,
      minimumStock: 20,
      reorderPoint: 40,
      maximumStock: 120,
      leadTimeDays: 4,
      avgDailyUsage: 4.0,
      defaultLocationId: locStoreS1.id,
      status: 'HEALTHY',
      barcode: '890123450014',
      initialQty: 68,
      warehouseId: whStore.id,
      locationId: locStoreS1.id,
    },
    {
      name: '3-Phase Circuit Breakers 32A DIN-Rail',
      sku: 'SKU-ELE-015',
      categoryId: catElec.id,
      unitOfMeasure: 'units',
      description: '10kA thermal-magnetic tripping MCB for distribution panels.',
      supplierId: supVoltaic.id,
      costPrice: 28.0,
      sellingPrice: 48.0,
      minimumStock: 15,
      reorderPoint: 30,
      maximumStock: 100,
      leadTimeDays: 4,
      avgDailyUsage: 3.0,
      defaultLocationId: locRackB.id,
      status: 'HEALTHY',
      barcode: '890123450015',
      initialQty: 45,
      warehouseId: whMain.id,
      locationId: locRackB.id,
    },
    {
      name: 'Graphite Reinforced Flange Gaskets 2-inch',
      sku: 'SKU-GAS-016',
      categoryId: catPipes.id,
      unitOfMeasure: 'units',
      description: 'High temperature ASME B16.21 pipe sealing ring gaskets.',
      supplierId: supPoly.id,
      costPrice: 4.5,
      sellingPrice: 9.0,
      minimumStock: 50,
      reorderPoint: 100,
      maximumStock: 400,
      leadTimeDays: 5,
      avgDailyUsage: 12.0,
      defaultLocationId: locRackC.id,
      status: 'HEALTHY',
      barcode: '890123450016',
      initialQty: 210,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
    {
      name: 'E6013 Mild Steel Welding Electrodes 3.2mm',
      sku: 'SKU-WLD-018',
      categoryId: catMetals.id,
      unitOfMeasure: 'boxes',
      description: 'Rutile coated general purpose arc welding rods (5kg/box).',
      supplierId: supApex.id,
      costPrice: 16.5,
      sellingPrice: 27.0,
      minimumStock: 25,
      reorderPoint: 50,
      maximumStock: 150,
      leadTimeDays: 4,
      avgDailyUsage: 6.0,
      defaultLocationId: locProdP1.id,
      status: 'HEALTHY',
      barcode: '890123450018',
      initialQty: 80,
      warehouseId: whProd.id,
      locationId: locProdP1.id,
    },
    {
      name: 'High-Visibility Safety Vests Class 2',
      sku: 'SKU-PPE-019',
      categoryId: catSafety.id,
      unitOfMeasure: 'units',
      description: 'Fluorescent neon yellow reflective tape zipper safety vests.',
      supplierId: supNational.id,
      costPrice: 5.0,
      sellingPrice: 11.0,
      minimumStock: 30,
      reorderPoint: 60,
      maximumStock: 200,
      leadTimeDays: 3,
      avgDailyUsage: 7.0,
      defaultLocationId: locStoreS2.id,
      status: 'HEALTHY',
      barcode: '890123450019',
      initialQty: 110,
      warehouseId: whStore.id,
      locationId: locStoreS2.id,
    },
    {
      name: 'Anti-Fog Polycarbonate Safety Goggles',
      sku: 'SKU-PPE-020',
      categoryId: catSafety.id,
      unitOfMeasure: 'units',
      description: 'UV400 scratch-resistant wrap-around eye protection.',
      supplierId: supNational.id,
      costPrice: 4.2,
      sellingPrice: 8.5,
      minimumStock: 25,
      reorderPoint: 50,
      maximumStock: 180,
      leadTimeDays: 3,
      avgDailyUsage: 5.0,
      defaultLocationId: locStoreS2.id,
      status: 'HEALTHY',
      barcode: '890123450020',
      initialQty: 90,
      warehouseId: whStore.id,
      locationId: locStoreS2.id,
    },
    {
      name: 'Structural Steel I-Beams W8x10 (6m)',
      sku: 'SKU-STL-021',
      categoryId: catMetals.id,
      unitOfMeasure: 'beams',
      description: 'ASTM A992 wide-flange structural load bearing steel beams.',
      supplierId: supApex.id,
      costPrice: 180.0,
      sellingPrice: 290.0,
      minimumStock: 6,
      reorderPoint: 12,
      maximumStock: 40,
      leadTimeDays: 7,
      avgDailyUsage: 1.0,
      defaultLocationId: locRackA.id,
      status: 'HEALTHY',
      barcode: '890123450021',
      initialQty: 16,
      warehouseId: whMain.id,
      locationId: locRackA.id,
    },
    {
      name: 'Polyurethane Structural Adhesive 5L',
      sku: 'SKU-ADH-022',
      categoryId: catRaw.id,
      unitOfMeasure: 'cans',
      description: 'Fast-curing moisture resistant bond for metal-wood composites.',
      supplierId: supNational.id,
      costPrice: 45.0,
      sellingPrice: 72.0,
      minimumStock: 10,
      reorderPoint: 20,
      maximumStock: 80,
      leadTimeDays: 4,
      avgDailyUsage: 2.0,
      defaultLocationId: locRackC.id,
      status: 'HEALTHY',
      barcode: '890123450022',
      initialQty: 35,
      warehouseId: whMain.id,
      locationId: locRackC.id,
    },
  ];

  for (const pData of productsData) {
    const { initialQty, warehouseId, locationId, ...productProps } = pData;

    const product = await prisma.product.create({
      data: productProps,
    });

    if (initialQty > 0) {
      await prisma.stock.create({
        data: {
          productId: product.id,
          warehouseId,
          locationId,
          quantity: initialQty,
          lastCountDate: new Date(),
        },
      });

      // Create Initial Setup Ledger
      await prisma.stockLedger.create({
        data: {
          transactionNumber: `TXN-INIT-${Math.floor(100000 + Math.random() * 900000)}`,
          type: 'RECEIPT',
          productId: product.id,
          sku: product.sku,
          destWarehouseId: warehouseId,
          destLocationId: locationId,
          quantity: initialQty,
          beforeStock: 0,
          afterStock: initialQty,
          beforeLocationStock: 0,
          afterLocationStock: initialQty,
          userId: manager.id,
          referenceDoc: 'OPENING-STOCK-2026',
          reason: 'Initial Warehouse Catalog Setup',
        },
      });
    }

    // Auto seed reorder rule
    await prisma.reorderRule.create({
      data: {
        productId: product.id,
        warehouseId,
        minQuantity: product.minimumStock,
        maxQuantity: product.maximumStock,
        reorderPoint: product.reorderPoint,
        preferredSupplierId: product.supplierId,
        isActive: true,
      },
    });
  }

  console.log(`✨ Created ${productsData.length} Products with initial stock and reorder rules.`);

  // 7. Seed Pending Receipts, Deliveries, and Transfers for rich realistic queues!
  const steelProduct = await prisma.product.findUnique({ where: { sku: 'SKU-STL-001' } });
  const copperProduct = await prisma.product.findUnique({ where: { sku: 'SKU-COP-006' } });
  const pvcProduct = await prisma.product.findUnique({ where: { sku: 'SKU-PVC-007' } });

  // Pending Inbound Receipt
  await prisma.receipt.create({
    data: {
      receiptNumber: 'REC-2026-089',
      supplierId: supApex.id,
      warehouseId: whMain.id,
      status: 'READY',
      expectedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      notes: 'Scheduled monthly high-tensile steel shipment at dock 1',
      createdById: manager.id,
      items: {
        create: [
          {
            productId: steelProduct!.id,
            locationId: locRackA.id,
            orderedQuantity: 100,
            receivedQuantity: 0,
            unitPrice: 48.5,
          },
        ],
      },
    },
  });

  // Pending Customer Delivery
  await prisma.delivery.create({
    data: {
      deliveryNumber: 'DEL-2026-104',
      customerId: custApexFab.id,
      warehouseId: whMain.id,
      status: 'WAITING',
      scheduledDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000),
      destination: 'Apex Fabrication Plant 3, Bay 2',
      notes: 'Expedited production supply batch',
      createdById: manager.id,
      items: {
        create: [
          {
            productId: copperProduct!.id,
            locationId: locRackB.id,
            requestedQuantity: 15,
            deliveredQuantity: 0,
            unitPrice: 98.0,
          },
          {
            productId: pvcProduct!.id,
            locationId: locRackC.id,
            requestedQuantity: 8,
            deliveredQuantity: 0,
            unitPrice: 29.0,
          },
        ],
      },
    },
  });

  // Scheduled Internal Transfer
  await prisma.transfer.create({
    data: {
      transferNumber: 'TRF-2026-042',
      sourceWarehouseId: whMain.id,
      sourceLocationId: locRackB.id,
      destWarehouseId: whProd.id,
      destLocationId: locProdP1.id,
      status: 'PENDING',
      notes: 'Replenish production line wire reels',
      createdById: staff.id,
      items: {
        create: [
          {
            productId: copperProduct!.id,
            quantity: 10,
          },
        ],
      },
    },
  });

  // 8. Seed Initial Alerts
  await prisma.alert.create({
    data: {
      alertType: 'CRITICAL',
      severity: 'CRITICAL',
      title: 'Critical Stockout Risk: Steel Rods',
      message: 'Current stock is 42 kg (below 50 kg reorder threshold). Lead time is 5 days.',
      productId: steelProduct!.id,
      warehouseId: whMain.id,
      locationId: locRackA.id,
      recommendedAction: 'Validate inbound receipt REC-2026-089 or trigger urgent PO.',
      status: 'ACTIVE',
    },
  });

  await prisma.alert.create({
    data: {
      alertType: 'OUT_OF_STOCK',
      severity: 'CRITICAL',
      title: 'Out of Stock: Ergonomic Mesh Office Chairs',
      message: 'Zero inventory available across all warehouses.',
      productId: (await prisma.product.findUnique({ where: { sku: 'SKU-OFF-003' } }))!.id,
      warehouseId: whStore.id,
      recommendedAction: 'Issue purchase order of 25 units to National Industrial Supplies.',
      status: 'ACTIVE',
    },
  });

  // 9. Seed 90-Day Realistic Historical Movement for Demand Forecasting
  const { ForecastService } = await import('../src/services/forecastService');
  await ForecastService.generate90DayHistoricalData();

  console.log('✅ StockSense database seeding completed successfully with 90-day history!');
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
