import { Request, Response } from 'express';
import prisma from '../config/prisma';
import { BookingStatus } from '@prisma/client';

export const createBooking = async (req: Request, res: Response) => {
  try {
    const { assetId, userId, startTime, endTime } = req.body;

    if (!assetId || !userId || !startTime || !endTime) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'All fields are required' });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (start >= end) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Start time must be before end time' });
    }

    // 1. HARD OVERLAP VALIDATION: Check for existing overlapping bookings
    const overlappingBookings = await prisma.booking.findFirst({
      where: {
        assetId,
        status: { in: [BookingStatus.UPCOMING, BookingStatus.ONGOING] },
        OR: [
          // New start is within an existing booking
          { startTime: { lte: start }, endTime: { gt: start } },
          // New end is within an existing booking
          { startTime: { lt: end }, endTime: { gte: end } },
          // New booking completely envelops an existing booking
          { startTime: { gte: start }, endTime: { lte: end } }
        ]
      }
    });

    if (overlappingBookings) {
      return res.status(409).json({ 
        error: 'CONFLICT', 
        message: 'This asset is already booked during the requested time slot.' 
      });
    }

    const booking = await prisma.booking.create({
      data: {
        assetId,
        userId,
        startTime: start,
        endTime: end,
        status: BookingStatus.UPCOMING
      }
    });

    res.status(201).json({ data: booking });
  } catch (error) {
    console.error("CREATE BOOKING ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create booking' });
  }
};

export const getBookingsForAsset = async (req: Request, res: Response) => {
  try {
    const { assetId } = req.query;

    const filter: any = {};
    if (assetId) filter.assetId = assetId as string;

    const bookings = await prisma.booking.findMany({
      where: filter,
      include: {
        user: { select: { id: true, name: true, email: true } },
        asset: { select: { id: true, name: true, assetTag: true } }
      },
      orderBy: { startTime: 'asc' }
    });

    res.status(200).json({ data: bookings });
  } catch (error) {
    console.error("GET BOOKINGS ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch bookings' });
  }
};

export const cancelBooking = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    const booking = await prisma.booking.findUnique({ where: { id: id as string } });

    if (!booking) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'Booking not found' });
    }

    if (booking.status === BookingStatus.CANCELLED || booking.status === BookingStatus.COMPLETED) {
      return res.status(400).json({ error: 'INVALID_STATE', message: `Cannot cancel a booking that is already ${booking.status}` });
    }

    const updatedBooking = await prisma.booking.update({
      where: { id: id as string },
      data: { status: BookingStatus.CANCELLED }
    });

    res.status(200).json({ data: updatedBooking });
  } catch (error) {
    console.error("CANCEL BOOKING ERROR:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to cancel booking' });
  }
};
