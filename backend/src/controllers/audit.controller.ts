import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AuditCycleStatus, AuditResult, AssetStatus } from '@prisma/client';

export const createAuditCycle = async (req: Request, res: Response) => {
  try {
    const { scopeDeptId, scopeLocation, startDate, endDate, auditorIds } = req.body;

    if (!startDate || !endDate || !auditorIds || !Array.isArray(auditorIds)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Dates and an array of auditor IDs are required' });
    }

    const cycle = await prisma.$transaction(async (tx) => {
      const newCycle = await tx.auditCycle.create({
        data: {
          scopeDeptId,
          scopeLocation,
          startDate: new Date(startDate),
          endDate: new Date(endDate),
          status: AuditCycleStatus.OPEN
        }
      });

      const assignments = auditorIds.map((userId: string) => ({
        auditCycleId: newCycle.id,
        userId
      }));

      await tx.auditAssignment.createMany({
        data: assignments
      });

      return newCycle;
    });

    res.status(201).json({ data: cycle });
  } catch (error) {
    console.error("CREATE AUDIT CYCLE ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create audit cycle' });
  }
};

export const submitAuditRecord = async (req: Request, res: Response) => {
  try {
    const { id } = req.params; // AuditCycle ID
    const { assetId, result, notes } = req.body;

    if (!assetId || !result) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Asset ID and Result are required' });
    }

    // Verify cycle is OPEN
    const cycle = await prisma.auditCycle.findUnique({ where: { id: id as string } });
    if (!cycle || cycle.status !== AuditCycleStatus.OPEN) {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Audit cycle is closed or does not exist' });
    }

    const record = await prisma.auditRecord.create({
      data: {
        auditCycleId: id as string,
        assetId,
        result: result as AuditResult,
        notes
      }
    });

    // If missing or damaged, increment discrepancy counter
    if (result === AuditResult.MISSING || result === AuditResult.DAMAGED) {
      await prisma.auditCycle.update({
        where: { id: id as string },
        data: { discrepancyCount: { increment: 1 } }
      });
    }

    res.status(201).json({ data: record });
  } catch (error) {
    console.error("SUBMIT AUDIT RECORD ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to submit audit record' });
  }
};

export const closeAuditCycle = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const cycle = await prisma.auditCycle.findUnique({
      where: { id: id as string },
      include: { records: true }
    });

    if (!cycle) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Audit cycle not found' });
    }

    if (cycle.status === AuditCycleStatus.CLOSED) {
      return res.status(400).json({ error: 'INVALID_STATE', message: 'Audit cycle is already closed' });
    }

    // Transaction: Close cycle and sync missing assets
    const result = await prisma.$transaction(async (tx) => {
      const closedCycle = await tx.auditCycle.update({
        where: { id: id as string },
        data: { status: AuditCycleStatus.CLOSED }
      });

      // Find all MISSING records in this cycle and update their assets to LOST
      const missingRecords = cycle.records.filter(r => r.result === AuditResult.MISSING);
      
      for (const record of missingRecords) {
        await tx.asset.update({
          where: { id: record.assetId },
          data: { status: AssetStatus.LOST }
        });
      }

      return closedCycle;
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("CLOSE AUDIT CYCLE ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to close audit cycle' });
  }
};

export const getAuditCycles = async (req: Request, res: Response) => {
  try {
    const cycles = await prisma.auditCycle.findMany({
      include: {
        assignments: { include: { user: { select: { name: true, email: true } } } }
      },
      orderBy: { createdAt: 'desc' }
    });
    res.status(200).json({ data: cycles });
  } catch (error) {
    console.error("GET AUDITS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch audit cycles' });
  }
};
