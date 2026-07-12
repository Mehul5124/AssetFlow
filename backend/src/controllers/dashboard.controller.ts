import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { AssetStatus, AllocationStatus, TransferStatus, MaintenanceStatus, BookingStatus } from '@prisma/client';

export const getKPIs = async (req: Request, res: Response) => {
  try {
    const [
      totalAssets,
      availableAssets,
      allocatedAssets,
      maintenanceAssets,
      pendingTransfers,
      activeBookings
    ] = await Promise.all([
      prisma.asset.count(),
      prisma.asset.count({ where: { status: AssetStatus.AVAILABLE } }),
      prisma.asset.count({ where: { status: AssetStatus.ALLOCATED } }),
      prisma.asset.count({ where: { status: AssetStatus.UNDER_MAINTENANCE } }),
      prisma.transferRequest.count({ where: { status: TransferStatus.REQUESTED } }),
      prisma.booking.count({ where: { status: { in: [BookingStatus.ONGOING, BookingStatus.UPCOMING] } } })
    ]);

    res.status(200).json({
      data: {
        totalAssets,
        availableAssets,
        allocatedAssets,
        maintenanceAssets,
        pendingTransfers,
        activeBookings
      }
    });
  } catch (error) {
    console.error("GET KPIS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch KPIs' });
  }
};

export const getAnalytics = async (req: Request, res: Response) => {
  try {
    // 1. Department-wise Allocation Summary
    const allocations = await prisma.allocation.findMany({
      where: { status: AllocationStatus.ACTIVE },
      include: {
        user: { select: { department: { select: { name: true } } } }
      }
    });

    const deptAllocations: Record<string, number> = {};
    allocations.forEach(a => {
      const deptName = a.user.department?.name || 'Unassigned';
      deptAllocations[deptName] = (deptAllocations[deptName] || 0) + 1;
    });

    // 2. Maintenance Frequency by Category
    const maintenanceReqs = await prisma.maintenanceRequest.findMany({
      include: { asset: { include: { category: { select: { name: true } } } } }
    });

    const categoryMaintenance: Record<string, number> = {};
    maintenanceReqs.forEach(m => {
      const catName = m.asset.category.name;
      categoryMaintenance[catName] = (categoryMaintenance[catName] || 0) + 1;
    });

    // 3. Most Used Assets (by total historical allocations)
    const topAssets = await prisma.asset.findMany({
      take: 5,
      include: { _count: { select: { allocations: true } } },
      orderBy: { allocations: { _count: 'desc' } }
    });

    res.status(200).json({
      data: {
        departmentAllocations: deptAllocations,
        categoryMaintenance,
        topAssets: topAssets.map(a => ({
          name: a.name,
          tag: a.assetTag,
          totalAllocations: a._count.allocations
        }))
      }
    });
  } catch (error) {
    console.error("GET ANALYTICS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch analytics' });
  }
};
