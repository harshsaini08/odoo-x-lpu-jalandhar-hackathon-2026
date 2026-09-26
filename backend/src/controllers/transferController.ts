import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import prisma from '../utils/prisma';
import { AppError } from '../middleware/errorHandler';
import { AuthenticatedRequest } from '../middleware/auth';
import { StockEngine } from '../services/stockEngine';

const transferItemSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantity: z.number().positive('Transfer quantity must be positive'),
  notes: z.string().optional(),
});

const createTransferSchema = z.object({
  sourceWarehouseId: z.string().min(1, 'Source warehouse is required'),
  sourceLocationId: z.string().min(1, 'Source location is required'),
  destWarehouseId: z.string().min(1, 'Destination warehouse is required'),
  destLocationId: z.string().min(1, 'Destination location is required'),
  notes: z.string().optional(),
  items: z.array(transferItemSchema).min(1, 'At least one item is required'),
});

export const getTransfers = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status, warehouseId, search, page = '1', limit = '50' } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};
    if (status && status !== 'ALL') where.status = String(status);
    if (warehouseId && warehouseId !== 'ALL') {
      where.OR = [
        { sourceWarehouseId: String(warehouseId) },
        { destWarehouseId: String(warehouseId) },
      ];
    }
    if (search) {
      const q = String(search).trim();
      where.OR = [
        { transferNumber: { contains: q } },
        { notes: { contains: q } },
      ];
    }

    const [total, transfers] = await Promise.all([
      prisma.transfer.count({ where }),
      prisma.transfer.findMany({
        where,
        include: {
          sourceWarehouse: true,
          sourceLocation: true,
          destWarehouse: true,
          destLocation: true,
          items: {
            include: { product: true },
          },
          createdBy: { select: { id: true, name: true, email: true } },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: transfers,
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

export const getTransferById = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.transfer.findUnique({
      where: { id },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        items: {
          include: { product: true },
        },
        createdBy: { select: { id: true, name: true, email: true } },
      },
    });

    if (!transfer) {
      throw new AppError('Transfer not found', 404, 'NOT_FOUND');
    }

    return res.json({
      success: true,
      data: { transfer },
    });
  } catch (error) {
    next(error);
  }
};

export const createTransfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const validated = createTransferSchema.parse(req.body);

    if (validated.sourceLocationId === validated.destLocationId) {
      throw new AppError('Source and destination locations cannot be the same.', 400, 'SAME_LOCATION');
    }

    const transferNumber = `TRF-${Date.now().toString().slice(-6)}`;

    const transfer = await prisma.transfer.create({
      data: {
        transferNumber,
        sourceWarehouseId: validated.sourceWarehouseId,
        sourceLocationId: validated.sourceLocationId,
        destWarehouseId: validated.destWarehouseId,
        destLocationId: validated.destLocationId,
        status: 'PENDING',
        notes: validated.notes,
        createdById: req.user?.id,
        items: {
          create: validated.items.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            notes: item.notes,
          })),
        },
      },
      include: {
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        items: { include: { product: true } },
      },
    });

    return res.status(201).json({
      success: true,
      message: `Transfer ${transfer.transferNumber} created successfully.`,
      data: { transfer },
    });
  } catch (error) {
    next(error);
  }
};

export const completeTransfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const completedTransfer = await StockEngine.completeTransfer(id, req.user?.id);

    return res.json({
      success: true,
      message: `Transfer ${completedTransfer.transferNumber} completed. Rack quantities updated and ledger logged!`,
      data: { transfer: completedTransfer },
    });
  } catch (error) {
    next(error);
  }
};

export const cancelTransfer = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.transfer.findUnique({ where: { id } });
    if (!transfer) throw new AppError('Transfer not found', 404, 'NOT_FOUND');
    if (transfer.status === 'COMPLETED') throw new AppError('Cannot cancel a completed transfer.', 400, 'ALREADY_COMPLETED');

    const updated = await prisma.transfer.update({
      where: { id },
      data: { status: 'CANCELED' },
    });

    return res.json({
      success: true,
      message: `Transfer ${transfer.transferNumber} canceled.`,
      data: { transfer: updated },
    });
  } catch (error) {
    next(error);
  }
};
