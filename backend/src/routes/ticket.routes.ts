import { Router } from 'express';
import type { IRouter } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  enrichTicket,
} from '../controllers/ticket.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Endpoints protegidos para usuarios/agentes
router.get('/', authenticateToken, getTickets);
router.get('/:id', authenticateToken, getTicketById);
router.post('/', authenticateToken, createTicket);
router.patch('/:id', authenticateToken, updateTicket);

// Callback público para n8n (se valida internamente con N8N_CALLBACK_SECRET)
router.post('/:id/enrich', enrichTicket);

export default router;