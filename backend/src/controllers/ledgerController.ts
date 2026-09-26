import { Request, Response, NextFunction } from 'express';
import prisma from '../utils/prisma';

export const getLedger = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const {
      productId,
      type,
      search,
      warehouseId,
      startDate,
      endDate,
      page = '1',
      limit = '50',
    } = req.query;

    const pageNum = parseInt(page as string, 10) || 1;
    const limitNum = parseInt(limit as string, 10) || 50;
    const skip = (pageNum - 1) * limitNum;

    const where: any = {};

    if (productId && productId !== 'ALL') {
      where.productId = String(productId);
    }

    if (type && type !== 'ALL') {
      where.type = String(type);
    }

    if (warehouseId && warehouseId !== 'ALL') {
      where.OR = [
        { sourceWarehouseId: String(warehouseId) },
        { destWarehouseId: String(warehouseId) },
      ];
    }

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(String(startDate));
      if (endDate) where.timestamp.lte = new Date(String(endDate));
    }

    if (search) {
      const q = String(search).trim();
      where.OR = [
        { transactionNumber: { contains: q } },
        { sku: { contains: q } },
        { referenceDoc: { contains: q } },
        { reason: { contains: q } },
        { product: { name: { contains: q } } },
      ];
    }

    const [total, entries] = await Promise.all([
      prisma.stockLedger.count({ where }),
      prisma.stockLedger.findMany({
        where,
        include: {
          product: { select: { id: true, name: true, sku: true, unitOfMeasure: true } },
          sourceWarehouse: { select: { id: true, name: true, code: true } },
          sourceLocation: { select: { id: true, name: true, code: true } },
          destWarehouse: { select: { id: true, name: true, code: true } },
          destLocation: { select: { id: true, name: true, code: true } },
          user: { select: { id: true, name: true, email: true } },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: limitNum,
      }),
    ]);

    return res.json({
      success: true,
      data: {
        items: entries,
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

export const exportLedgerCsv = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { productId, type, warehouseId } = req.query;

    const where: any = {};
    if (productId && productId !== 'ALL') where.productId = String(productId);
    if (type && type !== 'ALL') where.type = String(type);
    if (warehouseId && warehouseId !== 'ALL') {
      where.OR = [
        { sourceWarehouseId: String(warehouseId) },
        { destWarehouseId: String(warehouseId) },
      ];
    }

    const entries = await prisma.stockLedger.findMany({
      where,
      include: {
        product: true,
        sourceWarehouse: true,
        sourceLocation: true,
        destWarehouse: true,
        destLocation: true,
        user: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 1000,
    });

    const headers = [
      'Timestamp',
      'Transaction ID',
      'Type',
      'Product Name',
      'SKU',
      'Source Location',
      'Destination Location',
      'Quantity Change',
      'Unit',
      'Before Stock',
      'After Stock',
      'Reference Document',
      'Reason',
      'Operator',
    ];

    const rows = entries.map((e) => [
      `"${new Date(e.timestamp).toISOString()}"`,
      `"${e.transactionNumber}"`,
      `"${e.type}"`,
      `"${e.product.name.replace(/"/g, '""')}"`,
      `"${e.sku}"`,
      `"${e.sourceLocation ? `${e.sourceWarehouse?.name} - ${e.sourceLocation.name}` : 'N/A'}"`,
      `"${e.destLocation ? `${e.destWarehouse?.name} - ${e.destLocation.name}` : 'N/A'}"`,
      e.quantity,
      `"${e.product.unitOfMeasure}"`,
      e.beforeStock,
      e.afterStock,
      `"${e.referenceDoc || 'N/A'}"`,
      `"${(e.reason || '').replace(/"/g, '""')}"`,
      `"${e.user?.name || 'System'}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=stocksense_ledger_${Date.now()}.csv`);
    return res.status(200).send(csvContent);
  } catch (error) {
    next(error);
  }
};
