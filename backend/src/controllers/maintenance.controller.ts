import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { MaintenanceStatus, Priority, AssetStatus } from '@prisma/client';

export const createMaintenanceRequest = async (req: Request, res: Response) => {
  try {
    const { assetId, userId, issueDescription, priority, photoUrl } = req.body;

    if (!assetId || !userId || !issueDescription || !priority) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Asset, User, Issue Description, and Priority are required' });
    }

    const request = await prisma.maintenanceRequest.create({
      data: {
        assetId,
        userId,
        issueDescription,
        priority: priority as Priority,
        photoUrl
      }
    });

    res.status(201).json({ data: request });
  } catch (error) {
    console.error("CREATE MAINTENANCE ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create maintenance request' });
  }
};

export const updateMaintenanceStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, technicianNotes } = req.body;

    const maintenance = await prisma.maintenanceRequest.findUnique({ where: { id: id as string } });

    if (!maintenance) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Maintenance request not found' });
    }

    // Transaction: Update maintenance request and sync Asset status
    const result = await prisma.$transaction(async (tx) => {
      const updatedRequest = await tx.maintenanceRequest.update({
        where: { id: id as string },
        data: {
          status: status as MaintenanceStatus,
          technicianNotes: technicianNotes || maintenance.technicianNotes
        }
      });

      // Business logic: If approved or in progress, asset goes offline. If resolved, it goes back online.
      if (status === MaintenanceStatus.APPROVED || status === MaintenanceStatus.IN_PROGRESS || status === MaintenanceStatus.TECHNICIAN_ASSIGNED) {
        await tx.asset.update({
          where: { id: maintenance.assetId },
          data: { status: AssetStatus.UNDER_MAINTENANCE }
        });
      } else if (status === MaintenanceStatus.RESOLVED || status === MaintenanceStatus.REJECTED) {
        // Technically it should revert to previous status, but AVAILABLE is safe for MVP
        await tx.asset.update({
          where: { id: maintenance.assetId },
          data: { status: AssetStatus.AVAILABLE }
        });
      }

      return updatedRequest;
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("UPDATE MAINTENANCE ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update maintenance request' });
  }
};

export const getMaintenanceRequests = async (req: Request, res: Response) => {
  try {
    const { assetId, status } = req.query;

    const filter: any = {};
    if (assetId) filter.assetId = assetId as string;
    if (status) filter.status = status as MaintenanceStatus;

    const requests = await prisma.maintenanceRequest.findMany({
      where: filter,
      include: {
        asset: { select: { name: true, assetTag: true } },
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: requests });
  } catch (error) {
    console.error("GET MAINTENANCE ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch maintenance requests' });
  }
};
