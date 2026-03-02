import { Router } from 'express';
import {
    login,
    register,
    forgotPassword,
    resetPassword,
    refreshToken,
} from '../controllers/auth/auth.controller';
import { validateMiddleware } from '../middlewares/validate.middleware';
import {
    loginSchema,
    registerSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    refreshTokenSchema,
} from '../validators/auth.validator';
import {
    loginRateLimiter,
    signupRateLimiter,
} from '../middlewares/rate-limit.middleware';

const router = Router();

/**
 * @route   POST /api/auth/login
 * @desc    Connexion utilisateur
 * @access  Public
 */
router.post('/login', loginRateLimiter, validateMiddleware(loginSchema), login);

/**
 * @route   POST /api/auth/register
 * @desc    Inscription utilisateur (B2C)
 * @access  Public
 */
router.post('/register', signupRateLimiter, validateMiddleware(registerSchema), register);

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Demande de réinitialisation du mot de passe
 * @access  Public
 */
router.post('/forgot-password', validateMiddleware(forgotPasswordSchema), forgotPassword);

/**
 * @route   POST /api/auth/reset-password
 * @desc    Réinitialisation du mot de passe
 * @access  Public
 */
router.post('/reset-password', validateMiddleware(resetPasswordSchema), resetPassword);

/**
 * @route   POST /api/auth/refresh-token
 * @desc    Rafraîchir l'access token
 * @access  Public
 */
router.post('/refresh-token', validateMiddleware(refreshTokenSchema), refreshToken);

/**
 * TODO: Ajouter les routes SSO (Google, Microsoft)
 * router.get('/sso/google', ...)
 * router.get('/sso/microsoft', ...)
 */

export default router;
