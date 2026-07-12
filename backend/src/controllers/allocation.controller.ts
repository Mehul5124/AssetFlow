import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AssetStatus, AllocationStatus } from '@prisma/client';

export const createAllocation = async (req: Request, res: Response) => {
  try {
    const { assetId, userId, expectedReturnDate, conditionNotes } = req.body;

    if (!assetId || !userId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Asset ID and User ID are required' });
    }

    // 1. HARD CONFLICT RULE: Check if asset is actually available
    const asset = await prisma.asset.findUnique({ where: { id: assetId } });
    if (!asset) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Asset not found' });
    }
    
    if (asset.status !== AssetStatus.AVAILABLE) {
      return res.status(409).json({ 
        error: 'CONFLICT', 
        message: `Asset is currently ${asset.status}. It cannot be allocated.` 
      });
    }

    // 2. Transaction: Create allocation AND update asset status
    const result = await prisma.$transaction(async (tx) => {
      const allocation = await tx.allocation.create({
        data: {
          assetId,
          userId,
          expectedReturnDate: expectedReturnDate ? new Date(expectedReturnDate) : null,
          conditionNotes,
          status: AllocationStatus.ACTIVE
        }
      });

      await tx.asset.update({
        where: { id: assetId },
        data: { status: AssetStatus.ALLOCATED }
      });

      return allocation;
    });

    res.status(201).json({ data: result });
  } catch (error) {
    console.error("CREATE ALLOCATION ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to allocate asset' });
  }
};

export const returnAllocation = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { conditionNotes } = req.body;

    const allocation = await prisma.allocation.findUnique({
      where: { id: id as string },
      include: { asset: true }
    });

    if (!allocation) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Allocation not found' });
    }

    if (allocation.status === AllocationStatus.RETURNED) {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Asset is already returned' });
    }

    // Transaction: Mark allocation as RETURNED, and free up the Asset
    const result = await prisma.$transaction(async (tx) => {
      const updatedAllocation = await tx.allocation.update({
        where: { id: id as string },
        data: {
          status: AllocationStatus.RETURNED,
          actualReturnDate: new Date(),
          conditionNotes: conditionNotes ? conditionNotes : allocation.conditionNotes
        }
      });

      await tx.asset.update({
        where: { id: allocation.assetId },
        data: { status: AssetStatus.AVAILABLE }
      });

      return updatedAllocation;
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("RETURN ALLOCATION ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to return asset' });
  }
};

export const getOverdueAllocations = async (req: Request, res: Response) => {
  try {
    const overdue = await prisma.allocation.findMany({
      where: {
        status: AllocationStatus.ACTIVE,
        expectedReturnDate: {
          lt: new Date() // Past expected date
        }
      },
      include: {
        asset: { select: { assetTag: true, name: true } },
        user: { select: { name: true, email: true } }
      }
    });

    res.status(200).json({ data: overdue });
  } catch (error) {
    console.error("GET OVERDUE ALLOCATIONS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch overdue allocations' });
  }
};
