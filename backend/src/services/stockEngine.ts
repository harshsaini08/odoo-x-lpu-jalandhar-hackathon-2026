import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

export class StockEngine {
  /**
   * Helper to get total global stock for a product across all locations
   */
  static async getTotalProductStock(productId: string): Promise<number> {
    const aggregate = await prisma.stock.aggregate({
      where: { productId },
      _sum: { quantity: true },
    });
    return aggregate._sum.quantity || 0;
  }

  /**
   * Helper to get stock at a specific location
   */
  static async getLocationStock(productId: string, locationId: string): Promise<number> {
    const stock = await prisma.stock.findUnique({
      where: {
        productId_locationId: { productId, locationId },
      },
    });
    return stock?.quantity || 0;
  }

  /**
   * Recalculates product status and updates product table
   */
  static async recalculateProductStatus(productId: string): Promise<string> {
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) return 'HEALTHY';

    const totalStock = await this.getTotalProductStock(productId);

    let status = 'HEALTHY';
    if (totalStock <= 0) {
      status = 'OUT_OF_STOCK';
    } else if (totalStock <= product.reorderPoint) {
      status = 'LOW_STOCK';
    } else if (totalStock > product.maximumStock) {
      status = 'OVERSTOCKED';
    }

    await prisma.product.update({
      where: { id: productId },
      data: { status },
    });

    await this.evaluateStockAlerts(productId, totalStock, product);

    return status;
  }

  /**
   * Evaluates and updates alerts for a product
   */
  static async evaluateStockAlerts(productId: string, currentStock: number, product: any) {
    if (currentStock <= 0) {
      // Create or ensure OUT_OF_STOCK alert
      const existing = await prisma.alert.findFirst({
        where: { productId, alertType: 'OUT_OF_STOCK', status: 'ACTIVE' },
      });
      if (!existing) {
        await prisma.alert.create({
          data: {
            alertType: 'OUT_OF_STOCK',
            severity: 'CRITICAL',
            title: `Critical Out of Stock: ${product.name}`,
            message: `Product ${product.name} (${product.sku}) has zero inventory across all warehouses!`,
            productId,
            recommendedAction: `Create urgent purchase receipt for at least ${product.reorderPoint * 2} ${product.unitOfMeasure}.`,
            status: 'ACTIVE',
          },
        });
      }
    } else if (currentStock <= product.minimumStock) {
      // Create LOW_STOCK alert
      const existing = await prisma.alert.findFirst({
        where: { productId, alertType: 'LOW_STOCK', status: 'ACTIVE' },
      });
      if (!existing) {
        await prisma.alert.create({
          data: {
            alertType: 'LOW_STOCK',
            severity: 'CRITICAL',
            title: `Low Stock Alert: ${product.name}`,
            message: `Current stock (${currentStock} ${product.unitOfMeasure}) is below safety threshold (${product.minimumStock} ${product.unitOfMeasure}).`,
            productId,
            recommendedAction: `Trigger purchase order immediately. Supplier lead time is ${product.leadTimeDays} days.`,
            status: 'ACTIVE',
          },
        });
      }
    } else if (currentStock <= product.reorderPoint) {
      // Create REORDER_REQUIRED alert
      const existing = await prisma.alert.findFirst({
        where: { productId, alertType: 'REORDER_REQUIRED', status: 'ACTIVE' },
      });
      if (!existing) {
        await prisma.alert.create({
          data: {
            alertType: 'REORDER_REQUIRED',
            severity: 'WARNING',
            title: `Reorder Required: ${product.name}`,
            message: `Stock level (${currentStock} ${product.unitOfMeasure}) reached reorder threshold (${product.reorderPoint} ${product.unitOfMeasure}).`,
            productId,
            recommendedAction: `Plan replenishment order of ${product.maximumStock - currentStock} ${product.unitOfMeasure}.`,
            status: 'ACTIVE',
          },
        });
      }
    } else {
      // Resolve active low/out alerts if stock is healthy now
      await prisma.alert.updateMany({
        where: {
          productId,
          alertType: { in: ['LOW_STOCK', 'OUT_OF_STOCK', 'REORDER_REQUIRED'] },
          status: 'ACTIVE',
        },
        data: { status: 'RESOLVED' },
      });
    }
  }

  /**
   * RECEIPT VALIDATION: Vendor -> Warehouse (Stock Increases)
   */
  static async validateReceipt(receiptId: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const receipt = await tx.receipt.findUnique({
        where: { id: receiptId },
        include: {
          items: {
            include: { product: true, location: true },
          },
          warehouse: true,
          supplier: true,
        },
      });

      if (!receipt) {
        throw new AppError('Receipt not found', 404, 'NOT_FOUND');
      }

      if (receipt.status === 'DONE') {
        throw new AppError('Receipt has already been validated and marked DONE.', 400, 'ALREADY_COMPLETED');
      }

      if (receipt.status === 'CANCELED') {
        throw new AppError('Cannot validate a canceled receipt.', 400, 'INVALID_STATUS');
      }

      if (receipt.items.length === 0) {
        throw new AppError('Cannot validate a receipt with no items.', 400, 'EMPTY_RECEIPT');
      }

      const timestamp = new Date();

      for (const item of receipt.items) {
        const targetLocationId = item.locationId || item.product.defaultLocationId;
        if (!targetLocationId) {
          throw new AppError(
            `No destination location specified for product '${item.product.name}'.`,
            400,
            'MISSING_LOCATION'
          );
        }

        const qtyToReceive = item.receivedQuantity > 0 ? item.receivedQuantity : item.orderedQuantity;

        // Fetch current global and location stock before mutation
        const beforeGlobalStock = (
          await tx.stock.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true },
          })
        )._sum.quantity || 0;

        const currentLocationStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: targetLocationId,
            },
          },
        });

        const beforeLocStock = currentLocationStock?.quantity || 0;
        const afterLocStock = beforeLocStock + qtyToReceive;
        const afterGlobalStock = beforeGlobalStock + qtyToReceive;

        // Upsert stock record
        await tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: targetLocationId,
            },
          },
          update: {
            quantity: { increment: qtyToReceive },
            warehouseId: receipt.warehouseId,
            lastCountDate: timestamp,
          },
          create: {
            productId: item.productId,
            warehouseId: receipt.warehouseId,
            locationId: targetLocationId,
            quantity: qtyToReceive,
            lastCountDate: timestamp,
          },
        });

        // Update item received quantity
        await tx.receiptItem.update({
          where: { id: item.id },
          data: { receivedQuantity: qtyToReceive },
        });

        // Record immutable Stock Ledger entry
        const txNumber = `TXN-REC-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await tx.stockLedger.create({
          data: {
            transactionNumber: txNumber,
            timestamp,
            type: 'RECEIPT',
            productId: item.productId,
            sku: item.product.sku,
            destWarehouseId: receipt.warehouseId,
            destLocationId: targetLocationId,
            quantity: qtyToReceive,
            beforeStock: beforeGlobalStock,
            afterStock: afterGlobalStock,
            beforeLocationStock: beforeLocStock,
            afterLocationStock: afterLocStock,
            userId,
            referenceDoc: receipt.receiptNumber,
            reason: `Vendor Receipt from ${receipt.supplier.name}`,
            notes: item.notes || receipt.notes,
          },
        });
      }

      // Update receipt status to DONE
      const updatedReceipt = await tx.receipt.update({
        where: { id: receiptId },
        data: {
          status: 'DONE',
          receivedDate: timestamp,
          validatedById: userId,
        },
        include: {
          items: { include: { product: true, location: true } },
          supplier: true,
          warehouse: true,
        },
      });

      return updatedReceipt;
    });
  }

  /**
   * DELIVERY VALIDATION: Warehouse -> Customer (Stock Decreases)
   */
  static async validateDelivery(deliveryId: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const delivery = await tx.delivery.findUnique({
        where: { id: deliveryId },
        include: {
          items: {
            include: { product: true, location: true },
          },
          warehouse: true,
          customer: true,
        },
      });

      if (!delivery) {
        throw new AppError('Delivery order not found', 404, 'NOT_FOUND');
      }

      if (delivery.status === 'DONE') {
        throw new AppError('Delivery order is already validated and marked DONE.', 400, 'ALREADY_COMPLETED');
      }

      if (delivery.status === 'CANCELED') {
        throw new AppError('Cannot validate a canceled delivery order.', 400, 'INVALID_STATUS');
      }

      if (delivery.items.length === 0) {
        throw new AppError('Cannot validate a delivery order with no items.', 400, 'EMPTY_DELIVERY');
      }

      const timestamp = new Date();

      // Check stock availability for all items before fulfilling
      for (const item of delivery.items) {
        const sourceLocId = item.locationId || item.product.defaultLocationId;
        if (!sourceLocId) {
          throw new AppError(
            `No source location specified for product '${item.product.name}'.`,
            400,
            'MISSING_LOCATION'
          );
        }

        const qtyToDeliver = item.deliveredQuantity > 0 ? item.deliveredQuantity : item.requestedQuantity;

        const currentStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: sourceLocId,
            },
          },
        });

        const availableQty = currentStock?.quantity || 0;
        if (availableQty < qtyToDeliver) {
          // Log negative stock attempt alert
          await tx.alert.create({
            data: {
              alertType: 'NEGATIVE_STOCK_ATTEMPT',
              severity: 'CRITICAL',
              title: `Insufficient Stock for Delivery: ${item.product.name}`,
              message: `Requested ${qtyToDeliver} ${item.product.unitOfMeasure}, but only ${availableQty} available in selected location.`,
              productId: item.productId,
              warehouseId: delivery.warehouseId,
              locationId: sourceLocId,
              recommendedAction: 'Replenish stock or adjust delivery quantity before validation.',
              status: 'ACTIVE',
            },
          });

          throw new AppError(
            `Insufficient stock for '${item.product.name}'. Available: ${availableQty} ${item.product.unitOfMeasure}, Requested: ${qtyToDeliver} ${item.product.unitOfMeasure}.`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Execute stock deductions and ledger creation
      for (const item of delivery.items) {
        const sourceLocId = item.locationId || item.product.defaultLocationId!;
        const qtyToDeliver = item.deliveredQuantity > 0 ? item.deliveredQuantity : item.requestedQuantity;

        const beforeGlobalStock = (
          await tx.stock.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true },
          })
        )._sum.quantity || 0;

        const currentLocationStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: sourceLocId,
            },
          },
        });

        const beforeLocStock = currentLocationStock?.quantity || 0;
        const afterLocStock = beforeLocStock - qtyToDeliver;
        const afterGlobalStock = beforeGlobalStock - qtyToDeliver;

        // Deduct from location stock
        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: sourceLocId,
            },
          },
          data: {
            quantity: { decrement: qtyToDeliver },
            lastCountDate: timestamp,
          },
        });

        await tx.deliveryItem.update({
          where: { id: item.id },
          data: { deliveredQuantity: qtyToDeliver },
        });

        // Immutable Ledger Entry
        const txNumber = `TXN-DEL-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await tx.stockLedger.create({
          data: {
            transactionNumber: txNumber,
            timestamp,
            type: 'DELIVERY',
            productId: item.productId,
            sku: item.product.sku,
            sourceWarehouseId: delivery.warehouseId,
            sourceLocationId: sourceLocId,
            quantity: -qtyToDeliver,
            beforeStock: beforeGlobalStock,
            afterStock: afterGlobalStock,
            beforeLocationStock: beforeLocStock,
            afterLocationStock: afterLocStock,
            userId,
            referenceDoc: delivery.deliveryNumber,
            reason: `Customer Delivery to ${delivery.customer.name}`,
            notes: item.notes || delivery.notes,
          },
        });
      }

      const updatedDelivery = await tx.delivery.update({
        where: { id: deliveryId },
        data: {
          status: 'DONE',
          deliveredDate: timestamp,
          validatedById: userId,
        },
        include: {
          items: { include: { product: true, location: true } },
          customer: true,
          warehouse: true,
        },
      });

      return updatedDelivery;
    });
  }

  /**
   * INTERNAL TRANSFER: Location A -> Location B
   * Total inventory remains unchanged, location quantities change.
   */
  static async completeTransfer(transferId: string, userId?: string) {
    return await prisma.$transaction(async (tx) => {
      const transfer = await tx.transfer.findUnique({
        where: { id: transferId },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
        },
      });

      if (!transfer) {
        throw new AppError('Transfer not found', 404, 'NOT_FOUND');
      }

      if (transfer.status === 'COMPLETED') {
        throw new AppError('Transfer is already completed.', 400, 'ALREADY_COMPLETED');
      }

      if (transfer.status === 'CANCELED') {
        throw new AppError('Cannot complete a canceled transfer.', 400, 'INVALID_STATUS');
      }

      if (transfer.sourceLocationId === transfer.destLocationId) {
        throw new AppError('Source and destination locations cannot be identical.', 400, 'SAME_LOCATION');
      }

      const timestamp = new Date();

      // Validate quantities at source location
      for (const item of transfer.items) {
        const sourceStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
            },
          },
        });

        const available = sourceStock?.quantity || 0;
        if (available < item.quantity) {
          throw new AppError(
            `Insufficient stock for transfer of '${item.product.name}'. Available at ${transfer.sourceLocation.name}: ${available}, Requested: ${item.quantity}.`,
            400,
            'INSUFFICIENT_STOCK'
          );
        }
      }

      // Execute transfer: deduct source, increment dest, record ledger
      for (const item of transfer.items) {
        const globalStock = (
          await tx.stock.aggregate({
            where: { productId: item.productId },
            _sum: { quantity: true },
          })
        )._sum.quantity || 0;

        // Deduct from Source
        const sourceBefore = (
          await tx.stock.findUnique({
            where: {
              productId_locationId: {
                productId: item.productId,
                locationId: transfer.sourceLocationId,
              },
            },
          })
        )?.quantity || 0;

        await tx.stock.update({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.sourceLocationId,
            },
          },
          data: {
            quantity: { decrement: item.quantity },
            lastCountDate: timestamp,
          },
        });

        // Increment Destination
        const destBeforeStock = await tx.stock.findUnique({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.destLocationId,
            },
          },
        });

        const destBefore = destBeforeStock?.quantity || 0;

        await tx.stock.upsert({
          where: {
            productId_locationId: {
              productId: item.productId,
              locationId: transfer.destLocationId,
            },
          },
          update: {
            quantity: { increment: item.quantity },
            lastCountDate: timestamp,
          },
          create: {
            productId: item.productId,
            warehouseId: transfer.destWarehouseId,
            locationId: transfer.destLocationId,
            quantity: item.quantity,
            lastCountDate: timestamp,
          },
        });

        // Immutable Ledger Entry: Transfer shows source, dest, and total stock remaining constant!
        const txNumber = `TXN-TRF-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
        await tx.stockLedger.create({
          data: {
            transactionNumber: txNumber,
            timestamp,
            type: 'TRANSFER_IN', // Represents complete internal transfer
            productId: item.productId,
            sku: item.product.sku,
            sourceWarehouseId: transfer.sourceWarehouseId,
            sourceLocationId: transfer.sourceLocationId,
            destWarehouseId: transfer.destWarehouseId,
            destLocationId: transfer.destLocationId,
            quantity: item.quantity,
            beforeStock: globalStock, // Total global stock is unchanged
            afterStock: globalStock,  // Total global stock is unchanged
            beforeLocationStock: sourceBefore,
            afterLocationStock: sourceBefore - item.quantity,
            userId,
            referenceDoc: transfer.transferNumber,
            reason: `Internal Transfer: ${transfer.sourceLocation.name} → ${transfer.destLocation.name}`,
            notes: item.notes || transfer.notes,
          },
        });
      }

      const updated = await tx.transfer.update({
        where: { id: transferId },
        data: {
          status: 'COMPLETED',
          completedDate: timestamp,
        },
        include: {
          items: { include: { product: true } },
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
        },
      });

      return updated;
    });
  }

  /**
   * INVENTORY ADJUSTMENT: Physical vs Recorded count correction
   * Difference = Physical Quantity - System Quantity
   */
  static async recordAdjustment(data: {
    productId: string;
    warehouseId: string;
    locationId: string;
    physicalQuantity: number;
    reason: string;
    category?: string;
    notes?: string;
    userId?: string;
  }) {
    if (!data.reason || data.reason.trim() === '') {
      throw new AppError('A valid explanation/reason is strictly mandatory for inventory adjustments.', 400, 'REASON_REQUIRED');
    }

    if (data.physicalQuantity < 0) {
      throw new AppError('Physical quantity cannot be negative.', 400, 'INVALID_QUANTITY');
    }

    return await prisma.$transaction(async (tx) => {
      const product = await tx.product.findUnique({
        where: { id: data.productId },
      });

      if (!product) {
        throw new AppError('Product not found', 404, 'NOT_FOUND');
      }

      const currentLocStock = await tx.stock.findUnique({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.locationId,
          },
        },
      });

      const systemQuantity = currentLocStock?.quantity || 0;
      const difference = data.physicalQuantity - systemQuantity;

      const beforeGlobalStock = (
        await tx.stock.aggregate({
          where: { productId: data.productId },
          _sum: { quantity: true },
        })
      )._sum.quantity || 0;

      const afterGlobalStock = beforeGlobalStock + difference;
      const timestamp = new Date();
      const adjustmentNumber = `ADJ-${Date.now().toString().slice(-6)}`;

      // Update location stock directly to physical quantity
      await tx.stock.upsert({
        where: {
          productId_locationId: {
            productId: data.productId,
            locationId: data.locationId,
          },
        },
        update: {
          quantity: data.physicalQuantity,
          lastCountDate: timestamp,
        },
        create: {
          productId: data.productId,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          quantity: data.physicalQuantity,
          lastCountDate: timestamp,
        },
      });

      // Create Adjustment Record
      const adjustment = await tx.adjustment.create({
        data: {
          adjustmentNumber,
          warehouseId: data.warehouseId,
          locationId: data.locationId,
          productId: data.productId,
          systemQuantity,
          physicalQuantity: data.physicalQuantity,
          difference,
          reason: data.reason,
          category: data.category || 'COUNT_ERROR',
          status: 'CONFIRMED',
          adjustmentDate: timestamp,
          approvedById: data.userId,
          notes: data.notes,
        },
        include: {
          product: true,
          warehouse: true,
          location: true,
        },
      });

      // Immutable Stock Ledger Entry
      const txNumber = `TXN-ADJ-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      await tx.stockLedger.create({
        data: {
          transactionNumber: txNumber,
          timestamp,
          type: 'ADJUSTMENT',
          productId: data.productId,
          sku: product.sku,
          destWarehouseId: data.warehouseId,
          destLocationId: data.locationId,
          quantity: difference,
          beforeStock: beforeGlobalStock,
          afterStock: afterGlobalStock,
          beforeLocationStock: systemQuantity,
          afterLocationStock: data.physicalQuantity,
          userId: data.userId,
          referenceDoc: adjustmentNumber,
          reason: `Adjustment (${data.category || 'COUNT_ERROR'}): ${data.reason}`,
          notes: data.notes,
        },
      });

      // Anomaly Detection Rule: If adjustment difference is >= 10 units or > 25% of baseline
      if (Math.abs(difference) >= 10 || (systemQuantity > 0 && Math.abs(difference) / systemQuantity >= 0.25)) {
        await tx.alert.create({
          data: {
            alertType: 'UNUSUAL_ADJUSTMENT',
            severity: 'WARNING',
            title: `Unusual Inventory Adjustment: ${product.name}`,
            message: `Physical count adjusted by ${difference > 0 ? '+' : ''}${difference} ${product.unitOfMeasure} (${((difference / (systemQuantity || 1)) * 100).toFixed(1)}% variance). Reason: ${data.reason}`,
            productId: product.id,
            warehouseId: data.warehouseId,
            locationId: data.locationId,
            recommendedAction: 'Audit recent receipts and dispatch logs for potential discrepancies.',
            status: 'ACTIVE',
          },
        });
      }

      return adjustment;
    });
  }
}
