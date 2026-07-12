import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';

export const authorizeRole = (...allowedRoles: Role[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = (req as any).user;
    
    if (!user || !user.role) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'User not authenticated or role missing' });
    }

    if (!allowedRoles.includes(user.role)) {
      return res.status(403).json({ 
        error: 'FORBIDDEN', 
        message: `Access denied. Requires one of the following roles: ${allowedRoles.join(', ')}` 
      });
    }

    next();
  };
};
