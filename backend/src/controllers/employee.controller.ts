import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Role, Status } from '@prisma/client';

export const getEmployees = async (req: Request, res: Response) => {
  try {
    const { department, role, status } = req.query;
    
    const filter: any = {};
    if (department) filter.departmentId = department as string;
    if (role) filter.role = role as Role;
    if (status) filter.status = status as Status;

    const employees = await prisma.user.findMany({
      where: filter,
      select: { id: true, name: true, email: true, role: true, status: true, departmentId: true, createdAt: true },
      orderBy: { name: 'asc' }
    });
    
    res.status(200).json({ data: employees });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch employees' });
  }
};

export const updateEmployeeRole = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { role } = req.body;
    
    if (!role || !Object.values(Role).includes(role)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid role is required (EMPLOYEE, DEPARTMENT_HEAD, ASSET_MANAGER, ADMIN)' });
    }

    const employee = await prisma.user.update({
      where: { id: id as string },
      data: { role: role as Role },
      select: { id: true, name: true, email: true, role: true, departmentId: true }
    });
    
    res.status(200).json({ data: employee });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update employee role' });
  }
};
