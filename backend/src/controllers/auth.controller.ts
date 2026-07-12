import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import prisma from '../config/prisma';

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_secret_key';

export const signup = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Name, email, and password are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({ error: 'CONFLICT', message: 'Email already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: hashedPassword,
        role: 'EMPLOYEE', // Force EMPLOYEE role as per spec
      },
      select: { id: true, name: true, email: true, role: true }
    });

    res.status(201).json({ data: user });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to create user' });
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, departmentId: user.departmentId },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    const userResponse = {
      id: user.id,
      name: user.name,
      role: user.role,
      departmentId: user.departmentId
    };

    res.status(200).json({ data: { token, user: userResponse } });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to login' });
  }
};

export const me = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, name: true, email: true, role: true, departmentId: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'NOT_FOUND', message: 'User not found' });
    }

    res.status(200).json({ data: user });
  } catch (error) {
    console.error("Me error:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to fetch user' });
  }
};

export const forgotPassword = async (req: Request, res: Response) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Email is required' });
    }

    const user = await prisma.user.findUnique({ where: { email } });
    
    // Security best practice: Don't reveal if user exists or not
    if (!user) {
      return res.status(200).json({ data: { message: "If the email exists, reset instructions have been sent." } });
    }

    // Generate a temporary reset token (valid for 1 hour)
    const resetToken = jwt.sign(
      { id: user.id, purpose: 'password_reset' }, 
      JWT_SECRET, 
      { expiresIn: '1h' }
    );

    // For a hackathon, we can't send a real email without setting up SendGrid/Nodemailer, 
    // so we'll log the token to the console for testing purposes.
    console.log(`\n\n=== PASSWORD RESET TOKEN FOR ${email} ===\n${resetToken}\n=========================================\n\n`);

    res.status(200).json({ 
      data: { 
        message: "If the email exists, reset instructions have been sent.",
        // We include the token in the response ONLY for hackathon testing purposes
        _demoToken: resetToken 
      } 
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to process forgot password request' });
  }
};

export const resetPassword = async (req: Request, res: Response) => {
  try {
    const { token, newPassword } = req.body;

    if (!token || !newPassword) {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Token and new password are required' });
    }

    let decoded: any;
    try {
      decoded = jwt.verify(token, JWT_SECRET);
    } catch (err) {
      return res.status(401).json({ error: 'UNAUTHORIZED', message: 'Invalid or expired reset token' });
    }

    if (decoded.purpose !== 'password_reset') {
      return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Invalid token purpose' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { id: decoded.id },
      data: { password: hashedPassword }
    });

    res.status(200).json({ data: { message: "Password has been successfully reset" } });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({ error: 'INTERNAL_ERROR', message: 'Failed to reset password' });
  }
};
