import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AssetStatus } from '@prisma/client';

/**
 * Generates the next asset tag in the format AF-XXXX
 */
const generateAssetTag = async () => {
  const lastAsset = await prisma.asset.findFirst({
    orderBy: { assetTag: 'desc' },
  });

  if (!lastAsset) {
    return 'AF-0001';
  }

  // Extract the numeric part (e.g., '0001' from 'AF-0001')
  const lastNumber = parseInt(lastAsset.assetTag.split('-')[1], 10);
  const nextNumber = lastNumber + 1;
  
  // Pad with leading zeros to maintain 4 digits
  return `AF-${nextNumber.toString().padStart(4, '0')}`;
};

export const createAsset = async (req: Request, res: Response) => {
  try {
    const { name, categoryId, serialNumber, acquisitionDate, acquisitionCost, condition, location, isBookable, departmentId } = req.body;

    if (!name || !categoryId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name and Category ID are required' });
    }

    const assetTag = await generateAssetTag();

    const asset = await prisma.asset.create({
      data: {
        assetTag,
        name,
        categoryId,
        serialNumber,
        acquisitionDate: acquisitionDate ? new Date(acquisitionDate) : null,
        acquisitionCost: acquisitionCost ? parseFloat(acquisitionCost) : null,
        condition,
        location,
        isBookable: isBookable || false,
        departmentId,
        status: AssetStatus.AVAILABLE
      },
      include: {
        category: true,
        department: { select: { id: true, name: true } }
      }
    });

    res.status(201).json({ data: asset });
  } catch (error: any) {
    console.error("CREATE ASSET ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to register asset' });
  }
};

export const getAssets = async (req: Request, res: Response) => {
  try {
    const { search, category, status, department, isBookable } = req.query;

    const filter: any = {};
    
    // Exact matches
    if (category) filter.categoryId = category as string;
    if (status) filter.status = status as AssetStatus;
    if (department) filter.departmentId = department as string;
    if (isBookable !== undefined) filter.isBookable = isBookable === 'true';

    // Text search (tag, name, serial)
    if (search) {
      filter.OR = [
        { name: { contains: search as string, mode: 'insensitive' } },
        { assetTag: { contains: search as string, mode: 'insensitive' } },
        { serialNumber: { contains: search as string, mode: 'insensitive' } }
      ];
    }

    const assets = await prisma.asset.findMany({
      where: filter,
      include: {
        category: { select: { id: true, name: true } },
        department: { select: { id: true, name: true } }
      },
      orderBy: { assetTag: 'desc' }
    });

    res.status(200).json({ data: assets });
  } catch (error) {
    console.error("GET ASSETS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch assets' });
  }
};

export const getAssetById = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const asset = await prisma.asset.findUnique({
      where: { id: id as string },
      include: {
        category: true,
        department: { select: { id: true, name: true, head: { select: { name: true, email: true } } } },
        allocations: {
          include: { user: { select: { id: true, name: true, email: true } } },
          orderBy: { createdAt: 'desc' }
        },
        maintenanceRequests: {
          include: { user: { select: { id: true, name: true } } },
          orderBy: { createdAt: 'desc' }
        }
      }
    });

    if (!asset) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Asset not found' });
    }

    res.status(200).json({ data: asset });
  } catch (error) {
    console.error("GET ASSET BY ID ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch asset details' });
  }
};
