import { Request, Response, NextFunction } from 'express';
import prisma from '../config/prisma';

export const activityLogger = async (req: Request, res: Response, next: NextFunction) => {
  // Only log mutating requests (POST, PATCH, PUT, DELETE)
  if (['POST', 'PATCH', 'PUT', 'DELETE'].includes(req.method)) {
    // We hook into res.on('finish') so we only log successful actions,
    // and we have access to the final status code.
    res.on('finish', async () => {
      // Only log if the request was successful
      if (res.statusCode >= 200 && res.statusCode < 300) {
        try {
          const user = (req as any).user;
          if (user) {
            // Determine action based on route
            let action = `${req.method} ${req.baseUrl}${req.path}`;
            
            // Clean up action string for common paths
            if (req.baseUrl.includes('/api/assets')) action = `Modified Asset Database`;
            if (req.baseUrl.includes('/api/allocations')) action = `Modified Asset Allocation`;
            if (req.baseUrl.includes('/api/maintenance')) action = `Updated Maintenance Workflow`;
            if (req.baseUrl.includes('/api/audits')) action = `Triggered Audit Action`;

            await prisma.activityLog.create({
              data: {
                userId: user.id,
                action,
                details: req.body ? req.body : {}
              }
            });
          }
        } catch (error) {
          console.error("Failed to log activity:", error);
        }
      }
    });
  }
  next();
};
