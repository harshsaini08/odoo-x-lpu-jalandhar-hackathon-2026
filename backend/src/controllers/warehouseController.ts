import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';

const createWarehouseSchema = z.object({
  name: z.string().min(2, 'Warehouse name is required'),
  code: z.string().min(2, 'Warehouse code is required').toUpperCase(),
  address: z.string().optional(),
  city: z.string().optional(),
  totalCapacity: z.number().positive().default(10000),
  isPrimary: z.boolean().default(false),
});

const createLocationSchema = z.object({
  warehouseId: z.string().min(1, 'Warehouse is required'),
  name: z.string().min(2, 'Location name is required'),
  code: z.string().min(2, 'Location code is required').toUpperCase(),
  rackNumber: z.string().optional(),
  shelfNumber: z.string().optional(),
  capacity: z.number().positive().default(1000),
  type: z.enum(['RECEIVING', 'STORAGE', 'PRODUCTION', 'DISPATCH', 'SCRAP']).default('STORAGE'),
});

export const getWarehouses = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const warehouses = await prisma.warehouse.findMany({
      include: {
        locations: {
          include: {
            stocks: {
              include: {
                product: {
                  include: { category: true },
                },
              },
            },
          },
        },
      },
      orderBy: { name: 'asc' },
    });

    const formatted = warehouses.map((w) => {
      let warehouseTotalUnits = 0;
      let warehouseTotalCapacity = w.totalCapacity;
      let lowStockItemCount = 0;

      const formattedLocations = w.locations.map((loc) => {
        const locationOccupied = loc.stocks.reduce((acc, s) => acc + s.quantity, 0);
        warehouseTotalUnits += locationOccupied;

        const lowStockInLoc = loc.stocks.filter((s) => s.quantity <= s.product.reorderPoint).length;
        lowStockItemCount += lowStockInLoc;

        const utilizationPercent = Math.min(100, Math.round((locationOccupied / (loc.capacity || 1)) * 100));

        let statusColor: 'green' | 'yellow' | 'red' = 'green';
        if (utilizationPercent >= 90) statusColor = 'red';
        else if (utilizationPercent >= 70) statusColor = 'yellow';

        return {
          id: loc.id,
          name: loc.name,
          code: loc.code,
          rackNumber: loc.rackNumber || 'N/A',
          shelfNumber: loc.shelfNumber || 'N/A',
          type: loc.type,
          capacity: loc.capacity,
          usedCapacity: locationOccupied,
          utilizationPercent,
          statusColor,
          productCount: loc.stocks.length,
          stocks: loc.stocks.map((s) => ({
            id: s.id,
            productId: s.productId,
            productName: s.product.name,
            sku: s.product.sku,
            category: s.product.category.name,
            quantity: s.quantity,
            unitOfMeasure: s.product.unitOfMeasure,
            reorderPoint: s.product.reorderPoint,
            isLowStock: s.quantity <= s.product.reorderPoint,
          })),
        };
      });

      const overallUtilization = Math.min(100, Math.round((warehouseTotalUnits / (warehouseTotalCapacity || 1)) * 100));

      return {
        id: w.id,
        name: w.name,
        code: w.code,
        address: w.address,
        city: w.city,
        isPrimary: w.isPrimary,
        totalCapacity: warehouseTotalCapacity,
        usedCapacity: warehouseTotalUnits,
        utilizationPercent: overallUtilization,
        totalLocations: w.locations.length,
        lowStockItemCount,
        locations: formattedLocations,
      };
    });

    return res.json({
      success: true,
      data: { warehouses: formatted },
    });
  } catch (error) {
    next(error);
  }
};

export const getWarehouseById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const warehouse = await prisma.warehouse.findUnique({
      where: { id },
      include: {
        locations: {
          include: {
            stocks: {
              include: { product: { include: { category: true } } },
            },
          },
        },
      },
    });

    if (!warehouse) {
      throw new AppError('Warehouse not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { warehouse },
    });
  } catch (error) {
    next(error);
  }
};

export const createWarehouse = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createWarehouseSchema.parse(req.body);

    const existing = await prisma.warehouse.findFirst({
      where: { OR: [{ code: validated.code }, { name: validated.name }] },
    });

    if (existing) {
      throw new AppError('Warehouse with this code or name already exists.', 400, 'DUPLICATE_WAREHOUSE');
    }

    const warehouse = await prisma.warehouse.create({
      data: validated,
    });

    return res.status(201).json({
      success: true,
      message: 'Warehouse created successfully',
      data: { warehouse },
    });
  } catch (error) {
    next(error);
  }
};

export const createLocation = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const validated = createLocationSchema.parse(req.body);

    const existing = await prisma.location.findUnique({
      where: {
        warehouseId_code: {
          warehouseId: validated.warehouseId,
          code: validated.code,
        },
      },
    });

    if (existing) {
      throw new AppError('A location with this code already exists in the selected warehouse.', 400, 'DUPLICATE_LOCATION');
    }

    const location = await prisma.location.create({
      data: validated,
    });

    return res.status(201).json({
      success: true,
      message: 'Location created successfully',
      data: { location },
    });
  } catch (error) {
    next(error);
  }
};
