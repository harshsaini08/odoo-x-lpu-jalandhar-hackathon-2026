import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';
import { StockEngine } from '../services/stockEngine';

export const runDemoScenarioStep = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { step = 1 } = req.body;
    const stepNum = Number(step);

    // Find Steel Rods product
    const steelRods = await prisma.product.findFirst({
      where: { name: { contains: 'Steel Rods' } },
      include: { stocks: { include: { warehouse: true, location: true } } },
    });

    if (!steelRods) {
      return res.status(404).json({ success: false, message: 'Steel Rods product not found. Please re-seed data.' });
    }

    const mainWarehouse = await prisma.warehouse.findFirst({
      where: { code: 'WH-MAIN' },
      include: { locations: true },
    });

    const prodWarehouse = await prisma.warehouse.findFirst({
      where: { code: 'WH-PROD' },
      include: { locations: true },
    });

    const supplier = await prisma.supplier.findFirst({
      where: { name: { contains: 'Apex' } },
    });

    const customer = await prisma.customer.findFirst({
      where: { name: { contains: 'Apex' } },
    });

    const rackA = mainWarehouse?.locations.find((l) => l.code.includes('A1') || l.rackNumber === 'Rack A') || mainWarehouse?.locations[0];
    const rackP1 = prodWarehouse?.locations.find((l) => l.code.includes('P1')) || prodWarehouse?.locations[0];

    let resultMessage = '';
    let updatedStep = stepNum;

    if (stepNum === 1) {
      // Step 1: Inbound Receipt of 100 kg Steel Rods
      const receiptNumber = `REC-DEMO-${Date.now().toString().slice(-4)}`;
      const receipt = await prisma.receipt.create({
        data: {
          receiptNumber,
          supplierId: supplier?.id || (await prisma.supplier.findFirst())!.id,
          warehouseId: mainWarehouse!.id,
          status: 'READY',
          notes: 'Hackathon Demo: Inbound raw materials shipment',
          items: {
            create: [
              {
                productId: steelRods.id,
                locationId: rackA?.id,
                orderedQuantity: 100,
                receivedQuantity: 100,
                unitPrice: steelRods.costPrice,
              },
            ],
          },
        },
      });

      const validated = await StockEngine.validateReceipt(receipt.id);
      await StockEngine.recalculateProductStatus(steelRods.id);
      const newStock = await StockEngine.getTotalProductStock(steelRods.id);

      resultMessage = `Step 1 Complete: Received 100 kg Steel Rods from ${supplier?.name}. Total stock increased to ${newStock} kg.`;
      updatedStep = 2;
    } else if (stepNum === 2) {
      // Step 2: Internal Transfer of 50 kg to Production Floor
      const transferNumber = `TRF-DEMO-${Date.now().toString().slice(-4)}`;
      const transfer = await prisma.transfer.create({
        data: {
          transferNumber,
          sourceWarehouseId: mainWarehouse!.id,
          sourceLocationId: rackA!.id,
          destWarehouseId: prodWarehouse!.id,
          destLocationId: rackP1!.id,
          status: 'PENDING',
          notes: 'Hackathon Demo: Raw materials transfer to production staging',
          items: {
            create: [
              {
                productId: steelRods.id,
                quantity: 50,
              },
            ],
          },
        },
      });

      await StockEngine.completeTransfer(transfer.id);
      const newStock = await StockEngine.getTotalProductStock(steelRods.id);

      resultMessage = `Step 2 Complete: Transferred 50 kg from ${rackA?.name} to ${rackP1?.name}. Total stock conserved at ${newStock} kg.`;
      updatedStep = 3;
    } else if (stepNum === 3) {
      // Step 3: Delivery of 20 kg to Customer
      const deliveryNumber = `DEL-DEMO-${Date.now().toString().slice(-4)}`;
      const delivery = await prisma.delivery.create({
        data: {
          deliveryNumber,
          customerId: customer?.id || (await prisma.customer.findFirst())!.id,
          warehouseId: prodWarehouse!.id,
          destination: 'Apex Fabrication Plant 3',
          status: 'PACKED',
          notes: 'Hackathon Demo: Customer expedited delivery',
          items: {
            create: [
              {
                productId: steelRods.id,
                locationId: rackP1?.id,
                requestedQuantity: 20,
                deliveredQuantity: 20,
                unitPrice: steelRods.sellingPrice,
              },
            ],
          },
        },
      });

      await StockEngine.validateDelivery(delivery.id);
      await StockEngine.recalculateProductStatus(steelRods.id);
      const newStock = await StockEngine.getTotalProductStock(steelRods.id);

      resultMessage = `Step 3 Complete: Dispatched 20 kg to ${customer?.name}. Total stock is now ${newStock} kg.`;
      updatedStep = 4;
    } else if (stepNum === 4) {
      // Step 4: Adjustment of -3 kg Damaged
      const currentLocStock = await StockEngine.getLocationStock(steelRods.id, rackP1!.id);
      const physicalQuantity = Math.max(0, currentLocStock - 3);

      const adjustment = await StockEngine.recordAdjustment({
        productId: steelRods.id,
        warehouseId: prodWarehouse!.id,
        locationId: rackP1!.id,
        physicalQuantity,
        reason: '3 kg damaged during bending inspection (Quality Reject)',
        category: 'DAMAGED',
        notes: 'Hackathon Live Demo Inspection Correction',
      });

      await StockEngine.recalculateProductStatus(steelRods.id);
      const newStock = await StockEngine.getTotalProductStock(steelRods.id);

      resultMessage = `Step 4 Complete: Logged -3 kg damage adjustment. Final stock is now exactly ${newStock} kg.`;
      updatedStep = 5;
    }

    const currentStock = await StockEngine.getTotalProductStock(steelRods.id);
    const explanation = await prisma.stockLedger.findMany({
      where: { productId: steelRods.id },
      orderBy: { timestamp: 'desc' },
      take: 10,
    });

    return res.json({
      success: true,
      message: resultMessage,
      data: {
        step: updatedStep,
        currentStock,
        product: steelRods.name,
        recentLedger: explanation,
      },
    });
  } catch (error) {
    next(error);
  }
};
