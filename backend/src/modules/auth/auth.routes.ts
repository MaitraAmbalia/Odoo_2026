import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import {
  SignupSchema,
  LoginSchema,
  ForgotPasswordSchema,
  ResetPasswordSchema,
} from './auth.schema';

const router = Router();

router.post('/signup',          validate(SignupSchema),         authController.signup);
router.post('/login',           validate(LoginSchema),          authController.login);
router.post('/forgot-password', validate(ForgotPasswordSchema), authController.forgotPassword);
router.post('/reset-password',  validate(ResetPasswordSchema),  authController.resetPassword);

router.post('/refresh', authController.refresh);
router.post('/logout',  authController.logout);
router.get('/me',        authenticate, authController.getMe);

export default router;
