import { Request, Response } from 'express';
import { asyncHandler } from '../../common/asyncHandler';
import { ApiResponse } from '../../common/ApiResponse';
import { authService } from './auth.service';

export class AuthController {
  signup = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.signup(req.body);
    ApiResponse.created(res, user, 'Account created successfully');
  });

  login = asyncHandler(async (req: Request, res: Response) => {
    const { user, accessToken, refreshToken } = await authService.login(req.body);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
      path: '/',
    });

    ApiResponse.success(res, { user, accessToken }, 'Login successful');
  });

  refresh = asyncHandler(async (req: Request, res: Response) => {
    const oldRefreshToken = req.cookies?.refreshToken;
    if (!oldRefreshToken) {
      return res.status(401).json({ success: false, message: 'Refresh token not found' });
    }

    const { accessToken, refreshToken } = await authService.refresh(oldRefreshToken);

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60 * 1000,
      path: '/',
    });

    ApiResponse.success(res, { accessToken }, 'Token refreshed');
  });

  logout = asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.cookies?.refreshToken;
    await authService.logout(refreshToken);

    res.clearCookie('refreshToken', { path: '/' });
    ApiResponse.success(res, null, 'Logged out successfully');
  });

  forgotPassword = asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.forgotPassword(req.body.email);
    ApiResponse.success(res, result);
  });

  resetPassword = asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.newPassword);
    ApiResponse.success(res, null, 'Password reset successfully');
  });

  getMe = asyncHandler(async (req: Request, res: Response) => {
    const user = await authService.getMe(req.user!.id);
    ApiResponse.success(res, user);
  });
}

export const authController = new AuthController();
