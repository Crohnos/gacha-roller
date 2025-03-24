// authUtils.ts
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import nodemailer from 'nodemailer';
import logger from './logger';

// Secret for JWT - should be stored in environment variables in production
const JWT_SECRET = process.env.JWT_SECRET || 'gacha-secret-key';
const RESET_TOKEN_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

// Password hashing
export async function hashPassword(password: string): Promise<string> {
  const saltRounds = 10;
  return bcrypt.hash(password, saltRounds);
}

export async function comparePassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// JWT token generation for authentication
export function generateAuthToken(userId: string, username: string): string {
  return jwt.sign(
    { userId, username }, 
    JWT_SECRET, 
    { expiresIn: '7d' }
  );
}

export function verifyAuthToken(token: string): any {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}

// Password reset token generation
export function generateResetToken(): string {
  return uuidv4();
}

export function getResetTokenExpiry(): Date {
  const now = new Date();
  return new Date(now.getTime() + RESET_TOKEN_EXPIRY);
}

// Email sending for password reset
export async function sendPasswordResetEmail(email: string, resetToken: string, username: string): Promise<boolean> {
  try {
    // In a real application, this should use environment variables
    const emailHost = process.env.EMAIL_HOST || 'smtp.example.com';
    const emailUser = process.env.EMAIL_USER || 'noreply@example.com';
    const emailPass = process.env.EMAIL_PASS || 'password';
    const baseUrl = process.env.BASE_URL || 'http://localhost:3000';

    // Configure mail transport
    // Note: For development you might use a service like Mailtrap or console log the email
    const transport = nodemailer.createTransport({
      host: emailHost,
      port: 587,
      secure: false,
      auth: {
        user: emailUser,
        pass: emailPass
      }
    });

    // For development, just log the email details
    logger.info('Password reset email would be sent', {
      to: email,
      resetLink: `${baseUrl}/reset-password?token=${resetToken}`,
      username
    });

    // Uncomment this in production with real SMTP credentials
    /*
    const mailOptions = {
      from: `"Gacha Game" <${emailUser}>`,
      to: email,
      subject: 'Reset Your Password',
      html: `
        <h1>Reset Your Password</h1>
        <p>Hello ${username},</p>
        <p>You recently requested to reset your password. Click the link below to reset it:</p>
        <p><a href="${baseUrl}/reset-password?token=${resetToken}">Reset Password</a></p>
        <p>This link will expire in 24 hours.</p>
        <p>If you did not request a password reset, please ignore this email.</p>
      `
    };

    await transport.sendMail(mailOptions);
    */
    
    return true;
  } catch (error) {
    logger.error('Failed to send password reset email', { error, email });
    return false;
  }
}

// Session token management
export function generateSessionId(): string {
  return uuidv4();
}

export function getSessionExpiry(): Date {
  const now = new Date();
  // Session expires in 7 days
  return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
}