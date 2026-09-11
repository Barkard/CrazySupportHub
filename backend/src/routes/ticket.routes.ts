import { Router } from 'express';
import type { IRouter } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  enrichTicket,
  retryEnrichment,
  streamTicketEvents,
} from '../controllers/ticket.controller.js';
import { authenticateToken } from '../middlewares/auth.middleware.js';

const router: IRouter = Router();

// Server-Sent Events (SSE) Stream en tiempo real
router.get('/events/stream', streamTicketEvents);

// Endpoints protegidos para usuarios/agentes
router.get('/', authenticateToken, getTickets);
router.get('/:id', authenticateToken, getTicketById);
router.post('/', authenticateToken, createTicket);
router.patch('/:id', authenticateToken, updateTicket);
router.post('/:id/retry', authenticateToken, retryEnrichment);

// Callback público para n8n (se valida internamente con N8N_CALLBACK_SECRET)
router.post('/:id/enrich', enrichTicket);
router.patch('/:id/enrich', enrichTicket);

export default router;