import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import nodemailer from 'nodemailer';
import { SellerPayload } from '../types';

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

export function signAccessToken(payload: SellerPayload): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, { expiresIn: '15m' });
}

export function signRefreshToken(sellerId: string): string {
  return jwt.sign({ sellerId }, process.env.JWT_REFRESH_SECRET!, { expiresIn: '7d' });
}

export function verifyAccessToken(token: string): SellerPayload {
  return jwt.verify(token, process.env.JWT_SECRET!) as SellerPayload;
}

export function verifyRefreshToken(token: string): { sellerId: string } {
  return jwt.verify(token, process.env.JWT_REFRESH_SECRET!) as { sellerId: string };
}

export async function sendPasswordResetEmail(to: string, resetUrl: string): Promise<void> {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  await transporter.sendMail({
    from: `"UzaChapChap" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Reset your UzaChapChap password',
    html: `
      <h2>Password Reset</h2>
      <p>You requested a password reset for your UzaChapChap account.</p>
      <p>Click the link below to reset your password. This link expires in 1 hour.</p>
      <a href="${resetUrl}" style="display:inline-block;padding:12px 24px;background:#4F46E5;color:white;text-decoration:none;border-radius:6px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
    `,
  });
}
