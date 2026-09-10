import { Router } from 'express';
import type { IRouter } from 'express';
import {
  getUsers,
  createUser,
  updateUser,
  deleteUser,
} from '../controllers/user.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router: IRouter = Router();

// Listar usuarios (disponible para autenticados para que el dropdown de asignación funcione)
router.get('/', authenticateToken, getUsers);

// Acciones de administración de usuarios (solo admin)
router.post('/', authenticateToken, requireRole([Role.admin]), createUser);
router.patch('/:id', authenticateToken, requireRole([Role.admin]), updateUser);
router.delete('/:id', authenticateToken, requireRole([Role.admin]), deleteUser);

export default router;
