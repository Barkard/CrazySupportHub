import { Router } from 'express';
import type { IRouter } from 'express';
import {
  getTickets,
  getTicketById,
  createTicket,
  updateTicket,
  deleteTicket,
  enrichTicket,
  retryEnrichment,
  streamTicketEvents,
} from '../controllers/ticket.controller.js';
import { authenticateToken, requireRole } from '../middlewares/auth.middleware.js';
import { Role } from '@prisma/client';

const router: IRouter = Router();

// Server-Sent Events (SSE) Stream en tiempo real
router.get('/events/stream', streamTicketEvents);

// Endpoints protegidos para usuarios/agentes
router.get('/', authenticateToken, getTickets);
router.get('/:id', authenticateToken, getTicketById);

// 1. Exclusivo Administrador: Crear Ticket
router.post('/', authenticateToken, requireRole([Role.admin]), createTicket);

// 2. Actualización de tickets (Admin: CRUD completo; Agente: auto-asignación, estado y respuesta)
router.patch('/:id', authenticateToken, updateTicket);

// 3. Exclusivo Administrador: Eliminar Ticket
router.delete('/:id', authenticateToken, requireRole([Role.admin]), deleteTicket);

// 4. Reintentar enriquecimiento de IA (Admin y Agente)
router.post('/:id/retry', authenticateToken, retryEnrichment);

// Callback público para n8n (se valida internamente con N8N_CALLBACK_SECRET)
router.post('/:id/enrich', enrichTicket);
router.patch('/:id/enrich', enrichTicket);

export default router;