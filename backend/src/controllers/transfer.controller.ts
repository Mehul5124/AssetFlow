import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { TransferStatus, AssetStatus, AllocationStatus } from '@prisma/client';

export const createTransferRequest = async (req: Request, res: Response) => {
  try {
    const { assetId, fromUserId, toUserId } = req.body;

    if (!assetId || !fromUserId || !toUserId) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Asset ID, From User, and To User are required' });
    }

    // Ensure the fromUser actually has the asset currently allocated
    const currentAllocation = await prisma.allocation.findFirst({
      where: {
        assetId,
        userId: fromUserId,
        status: AllocationStatus.ACTIVE
      }
    });

    if (!currentAllocation) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: 'You cannot transfer an asset that is not currently allocated to you.' 
      });
    }

    const transfer = await prisma.transferRequest.create({
      data: {
        assetId,
        fromUserId,
        toUserId,
        status: TransferStatus.REQUESTED
      }
    });

    res.status(201).json({ data: transfer });
  } catch (error) {
    console.error("CREATE TRANSFER ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to initiate transfer' });
  }
};

export const approveTransferRequest = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const transfer = await prisma.transferRequest.findUnique({
      where: { id: id as string }
    });

    if (!transfer) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Transfer request not found' });
    }

    if (transfer.status !== TransferStatus.REQUESTED) {
      return res.status(400).json({ error: 'INVALID_STATE', message: `Transfer is already ${transfer.status}` });
    }

    // Transaction: Approve transfer, close old allocation, create new allocation
    const result = await prisma.$transaction(async (tx) => {
      // 1. Approve Transfer
      const updatedTransfer = await tx.transferRequest.update({
        where: { id: id as string },
        data: { status: TransferStatus.APPROVED }
      });

      // 2. Close Old Allocation
      await tx.allocation.updateMany({
        where: {
          assetId: transfer.assetId,
          userId: transfer.fromUserId,
          status: AllocationStatus.ACTIVE
        },
        data: {
          status: AllocationStatus.RETURNED,
          actualReturnDate: new Date()
        }
      });

      // 3. Create New Allocation for toUser
      const newAllocation = await tx.allocation.create({
        data: {
          assetId: transfer.assetId,
          userId: transfer.toUserId,
          status: AllocationStatus.ACTIVE
        }
      });

      return { transfer: updatedTransfer, newAllocation };
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("APPROVE TRANSFER ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to approve transfer' });
  }
};
