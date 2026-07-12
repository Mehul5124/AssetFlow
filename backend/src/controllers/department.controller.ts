import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { Status } from '@prisma/client';

export const getDepartments = async (req: Request, res: Response) => {
  try {
    const departments = await prisma.department.findMany({
      include: { 
        parent: { select: { id: true, name: true } }, 
        head: { select: { id: true, name: true, email: true } } 
      }
    });
    res.status(200).json({ data: departments });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch departments' });
  }
};

export const createDepartment = async (req: Request, res: Response) => {
  try {
    const { name, headId, parentId, status } = req.body;
    if (!name) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name is required' });

    const department = await prisma.department.create({
      data: { name, headId, parentId, status: status || Status.ACTIVE }
    });
    res.status(201).json({ data: department });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create department' });
  }
};

export const updateDepartment = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { name, headId, parentId, status } = req.body;

    const department = await prisma.department.update({
      where: { id: id as string },
      data: { name, headId, parentId, status }
    });
    res.status(200).json({ data: department });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update department' });
  }
};

export const updateDepartmentStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    if (!status || !Object.values(Status).includes(status)) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Valid status is required (ACTIVE or INACTIVE)' });
    }

    const department = await prisma.department.update({
      where: { id: id as string },
      data: { status }
    });
    res.status(200).json({ data: department });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to update department status' });
  }
};
