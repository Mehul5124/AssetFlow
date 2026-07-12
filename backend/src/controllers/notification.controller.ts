import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getUserNotifications = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const notifications = await prisma.notification.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' }
    });

    res.status(200).json({ data: notifications });
  } catch (error) {
    console.error("GET NOTIFICATIONS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch notifications' });
  }
};

export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const userId = (req as any).user.id;

    const notification = await prisma.notification.findUnique({ where: { id: id as string } });

    if (!notification || notification.userId !== userId) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Notification not found' });
    }

    const updated = await prisma.notification.update({
      where: { id: id as string },
      data: { isRead: true }
    });

    res.status(200).json({ data: updated });
  } catch (error) {
    console.error("MARK NOTIFICATION READ ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update notification' });
  }
};

export const markAllAsRead = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const result = await prisma.notification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true }
    });

    res.status(200).json({ data: result });
  } catch (error) {
    console.error("MARK ALL NOTIFICATIONS READ ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update notifications' });
  }
};

export const getActivityLogs = async (req: Request, res: Response) => {
  try {
    const logs = await prisma.activityLog.findMany({
      include: {
        user: { select: { name: true, email: true } }
      },
      orderBy: { createdAt: 'desc' },
      take: 100 // Limit for performance
    });

    res.status(200).json({ data: logs });
  } catch (error) {
    console.error("GET ACTIVITY LOGS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch activity logs' });
  }
};
