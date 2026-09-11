import { Router } from 'express';
import type { IRouter } from 'express';
import { login, register, getMe } from '../controllers/auth.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Rutas públicas de autenticación
router.post('/login', login);
router.post('/register', register);

// Rutas protegidas
router.get('/me', authenticateToken, getMe);

export default router;