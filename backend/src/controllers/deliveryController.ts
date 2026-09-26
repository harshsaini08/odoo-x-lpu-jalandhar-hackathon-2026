import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockEngine } from '../services/stockEngine';

const deliveryItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  locationId: z.string().optional().nullable(),
  requestedQuantity: z.number().positive('Requested quantity must be positive'),
  deliveredQuantity: z.number().min(0).default(0),
  unitPrice: z.number().min(0).default(0),
  notes: z.string().optional(),
});

const createDeliverySchema = z.object({
  customerId: z.string().min(1, 'Customer is required'),
  warehouseId: z.string().min(1, 'Warehouse is required'),
  scheduledDate: z.string().optional().nullable(),
  destination: z.string().optional(),
  trackingNumber: z.string().optional(),
  notes: z.string().optional(),
  items: z.array(deliveryItemSchema).min(1, 'At least one item is required'),
});

export const getDeliveries = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, warehouseId, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (warehouseId && warehouseId !== 'ALL') where.warehouseId = String(warehouseId);
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { deliveryNumber: { contains: q } },
        { customer: { name: { contains: q } } },
        { destination: { contains: q } },
        { trackingNumber: { contains: q } },
      ];
    }

    const [total, deliveries] = await Promise.all([
      prisma.delivery.count({ where }),
      prisma.delivery.findMany({
        where,
        include: {
          customer: true,
          warehouse: true,
          items: {
            include: {
              product: {
                include: {
                  stocks: true,
                },
              },
              location: true,
            },
          },
          createdBy: { select: { id: true, name: true, email: true } },
          validatedBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: deliveries,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      },
    });
  } catch (error) {
    next(error);
  }
};

export const getDeliveryById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({
      where: { id },
      include: {
        customer: true,
        warehouse: true,
        items: {
          include: {
            product: { include: { stocks: true } },
            location: true,
          },
        },
        createdBy: { select: { id: true, name: true, email: true } },
        validatedBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!delivery) {
      throw new AppError('Delivery order not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

export const createDelivery = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createDeliverySchema.parse(req.body);

    const deliveryNumber = `DEL-${Date.now().toString().slice(-6)}`;

    const delivery = await prisma.delivery.create({
      data: {
        deliveryNumber,
        customerId: validated.customerId,
        warehouseId: validated.warehouseId,
        scheduledDate: validated.scheduledDate ? new Date(validated.scheduledDate) : null,
        status: 'WAITING',
        destination: validated.destination,
        trackingNumber: validated.trackingNumber,
        notes: validated.notes,
        createdById: req.user?.id,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            locationId: item.locationId,
            requestedQuantity: item.requestedQuantity,
            deliveredQuantity: item.deliveredQuantity || item.requestedQuantity,
            unitPrice: item.unitPrice,
            notes: item.notes,
          })),
        },
      },
      include: {
        customer: true,
        warehouse: true,
        items: { include: { product: true, location: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Delivery order ${delivery.deliveryNumber} created successfully.`,
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

export const updateDeliveryStatus = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['WAITING', 'READY', 'PICKED', 'PACKED'].includes(status)) {
      throw new AppError('Invalid delivery workflow status transition', 400, 'INVALID_STATUS');
    }

    const delivery = await prisma.delivery.update({
      where: { id },
      data: { status },
      include: { customer: true, items: { include: { product: true } } },
    });

    return res.json({
      success: true,
      message: `Delivery status updated to ${status}`,
      data: { delivery },
    });
  } catch (error) {
    next(error);
  }
};

export const validateDelivery = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updatedDelivery = await StockEngine.validateDelivery(id, req.user?.id);

    // Recalculate status for each product in delivery
    for (const item of updatedDelivery.items) {
      await StockEngine.recalculateProductStatus(item.productId);
    }

    return res.json({
      success: true,
      message: `Delivery ${updatedDelivery.deliveryNumber} validated and dispatched. Inventory deducted and ledger updated!`,
      data: { delivery: updatedDelivery },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelDelivery = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const delivery = await prisma.delivery.findUnique({ where: { id } });
    if (!delivery) throw new AppError('Delivery order not found', 404, 'NOT_FOUND');
    if (delivery.status === 'DONE') throw new AppError('Cannot cancel an already completed delivery.', 400, 'ALREADY_DONE');

    const updated = await prisma.delivery.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    return res.json({
      success: true,
      message: `Delivery ${delivery.deliveryNumber} canceled.`,
      data: { delivery: updated },
    });
  } catch (error) {
    next(error);
  }
};
