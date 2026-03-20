import { Router } from 'express';
import { authController } from './auth.controller';
import { RegisterSchema, LoginSchema, ForgotPasswordSchema, ResetPasswordSchema, changePasswordSchema, UpdateMeSchema } from './auth.validation';
import { validate } from '../../shared/middleware/validation';
import { authenticate } from '../../shared/middleware/authenticate';
import { tenantContext } from '../../shared/middleware/tenant-context';
import {
  loginLimiter,
  registerLimiter,
  forgotPasswordLimiter,
  resetPasswordLimiter,
} from '../../shared/middleware/rate-limiter';

const router = Router();

router.post('/register', registerLimiter, validate(RegisterSchema), authController.register.bind(authController));
router.post('/login', loginLimiter, validate(LoginSchema), authController.login.bind(authController));
router.post('/forgot-password', forgotPasswordLimiter, validate(ForgotPasswordSchema), authController.forgotPassword.bind(authController));
router.post('/reset-password', resetPasswordLimiter, validate(ResetPasswordSchema), authController.resetPassword.bind(authController));
router.post('/logout', authenticate, tenantContext, authController.logout.bind(authController));
router.post('/change-password', authenticate, validate(changePasswordSchema), authController.changePassword.bind(authController));

// Current user endpoints
router.get('/me', authenticate, authController.getMe.bind(authController));
router.patch('/me', authenticate, validate(UpdateMeSchema), authController.updateMe.bind(authController));

export default router;
