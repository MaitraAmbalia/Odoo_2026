import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { env } from '../../config/env';
import { ApiError } from '../../common/ApiError';
import { authRepository } from './auth.repository';
import type { SignupInput, LoginInput } from './auth.schema';

const SALT_ROUNDS = 10;

export class AuthService {
  async signup(input: SignupInput) {
    const existing = await authRepository.findUserByEmail(input.email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const passwordHash = await bcrypt.hash(input.password, SALT_ROUNDS);
    const user = await authRepository.createUser({
      name: input.name,
      email: input.email,
      passwordHash,
      departmentId: input.departmentId,
    });

    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async login(input: LoginInput) {
    const user = await authRepository.findUserByEmail(input.email);
    if (!user) {
      throw new ApiError(401, 'Invalid email or password');
    }

    if (user.status === 'INACTIVE') {
      throw new ApiError(403, 'Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(input.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new ApiError(401, 'Invalid email or password');
    }

    const accessToken = this.generateAccessToken(user);
    const refreshToken = this.generateRefreshToken(user);

    const tokenHash = this.hashToken(refreshToken);
    const expiresAt = new Date(Date.now() + this.parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash,
      expiresAt,
    });

    const { passwordHash: _, ...safeUser } = user;
    return { user: safeUser, accessToken, refreshToken };
  }

  async refresh(refreshToken: string) {
    const tokenHash = this.hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);

    if (!stored) {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    await authRepository.revokeRefreshToken(stored.id);

    const user = await authRepository.findUserById(stored.userId);
    if (!user) {
      throw new ApiError(401, 'User not found');
    }

    const newAccessToken = this.generateAccessToken(user);
    const newRefreshToken = this.generateRefreshToken(user);

    const newTokenHash = this.hashToken(newRefreshToken);
    const expiresAt = new Date(Date.now() + this.parseDuration(env.REFRESH_TOKEN_EXPIRY));
    await authRepository.createRefreshToken({
      userId: user.id,
      tokenHash: newTokenHash,
      expiresAt,
    });

    return { accessToken: newAccessToken, refreshToken: newRefreshToken };
  }

  async logout(refreshToken: string | undefined) {
    if (!refreshToken) return;

    const tokenHash = this.hashToken(refreshToken);
    const stored = await authRepository.findRefreshToken(tokenHash);
    if (stored) {
      await authRepository.revokeRefreshToken(stored.id);
    }
  }

  async getMe(userId: string) {
    const user = await authRepository.findUserById(userId);
    if (!user) {
      throw new ApiError(404, 'User not found');
    }
    const { passwordHash: _, ...safeUser } = user;
    return safeUser;
  }

  async forgotPassword(email: string) {
    const user = await authRepository.findUserByEmail(email);
    if (!user) {
      return { message: 'If an account with that email exists, a reset link has been sent.' };
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    console.log(`\n🔑 Password reset token for ${email}: ${resetToken}\n`);

    return {
      message: 'If an account with that email exists, a reset link has been sent.',
      resetToken,
    };
  }

  async resetPassword(token: string, newPassword: string) {
    throw new ApiError(501, 'Password reset via token is a stub — use forgot-password to get a token, then manually update via admin for now.');
  }

  private generateAccessToken(user: { id: string; role: string; departmentId: string | null }) {
    return jwt.sign(
      { id: user.id, role: user.role, departmentId: user.departmentId },
      env.JWT_ACCESS_SECRET,
      { expiresIn: env.ACCESS_TOKEN_EXPIRY } as any
    );
  }

  private generateRefreshToken(user: { id: string }) {
    return jwt.sign(
      { id: user.id, type: 'refresh' },
      env.JWT_REFRESH_SECRET,
      { expiresIn: env.REFRESH_TOKEN_EXPIRY } as any
    );
  }

  private hashToken(token: string): string {
    return crypto.createHash('sha256').update(token).digest('hex');
  }

  private parseDuration(duration: string): number {
    const match = duration.match(/^(\d+)(m|h|d)$/);
    if (!match) return 7 * 24 * 60 * 60 * 1000;
    const value = parseInt(match[1]);
    const unit = match[2];
    switch (unit) {
      case 'm': return value * 60 * 1000;
      case 'h': return value * 60 * 60 * 1000;
      case 'd': return value * 24 * 60 * 60 * 1000;
      default:  return 7 * 24 * 60 * 60 * 1000;
    }
  }
}

export const authService = new AuthService();
