import { Request, Response } from 'express';
import prisma from '../config/prisma';

export const getCategories = async (req: Request, res: Response) => {
  try {
    const categories = await prisma.assetCategory.findMany();
    res.status(200).json({ data: categories });
  } catch (error) {
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch categories' });
  }
};

export const createCategory = async (req: Request, res: Response) => {
  try {
    const { name, description, extraFields } = req.body;
    if (!name) return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name is required' });

    const category = await prisma.assetCategory.create({
      data: { name, description, extraFields: extraFields || {} }
    });
    res.status(201).json({ data: category });
  } catch (error: any) {
    console.error("CREATE CATEGORY ERROR:", error);
    if (error.code === 'P2002') {
      return res.status(409).json({ error: 'CONFLICT', message: 'Category with this name already exists' });
    }
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create category' });
  }
};
