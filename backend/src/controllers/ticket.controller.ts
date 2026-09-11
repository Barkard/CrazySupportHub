import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { triggerN8nEnrichment } from '../services/n8n.service.js';
import { addSSEClient, removeSSEClient, broadcastTicketEvent } from '../services/sse.service.js';
import { Role, TicketStatus, Priority, Category, EnrichmentStatus } from '@prisma/client';

// 1. Obtener lista de tickets con filtros opcionales, paginación por lotes y ordenamiento
export const getTickets = async (req: Request, res: Response) => {
  try {
    const {
      status,
      priority,
      category,
      assignedTo,
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
    } = req.query;

    const where: any = {};
    if (status) where.status = status as TicketStatus;
    if (priority) where.priority = priority as Priority;
    if (category) where.category = category as Category;
    if (assignedTo) where.assignedTo = Number(assignedTo);

    if (search && typeof search === 'string' && search.trim()) {
      where.OR = [
        { title: { contains: search.trim(), mode: 'insensitive' } },
        { description: { contains: search.trim(), mode: 'insensitive' } },
      ];
    }

    // Validación de campos seguros para ordenamiento
    const validSortFields = ['id', 'createdAt', 'updatedAt', 'title', 'status', 'priority', 'category'];
    const orderField = validSortFields.includes(String(sortBy)) ? String(sortBy) : 'createdAt';
    const orderDir: 'asc' | 'desc' = String(sortOrder).toLowerCase() === 'asc' ? 'asc' : 'desc';

    // Paginación
    const pageNum = page ? Math.max(1, Number(page)) : null;
    const limitNum = limit ? Math.max(1, Number(limit)) : null;

    const total = await prisma.ticket.count({ where });

    const findOptions: any = {
      where,
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
      orderBy: { [orderField]: orderDir },
    };

    if (pageNum && limitNum) {
      findOptions.skip = (pageNum - 1) * limitNum;
      findOptions.take = limitNum;
    }

    const tickets = await prisma.ticket.findMany(findOptions);

    if (pageNum && limitNum) {
      return res.json({
        data: tickets,
        pagination: {
          total,
          page: pageNum,
          limit: limitNum,
          totalPages: Math.ceil(total / limitNum),
          hasNextPage: pageNum < Math.ceil(total / limitNum),
          hasPrevPage: pageNum > 1,
        },
      });
    }

    return res.json(tickets);
  } catch (error) {
    console.error('Error al obtener tickets:', error);
    return res.status(500).json({ error: 'Error al obtener la lista de tickets' });
  }
};

// 2. Obtener un ticket por ID
export const getTicketById = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({
      where: { id },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    return res.json(ticket);
  } catch (error) {
    return res.status(500).json({ error: 'Error al obtener el ticket' });
  }
};

// 3. Crear un nuevo ticket y disparar n8n (Exclusivo Administrador)
export const createTicket = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== Role.admin) {
      return res.status(403).json({ error: 'Acceso denegado: Solo los administradores pueden crear tickets' });
    }

    const { title, description, assignedTo } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'El título y la descripción son obligatorios' });
    }

    const createdBy = req.user?.id || 1;
    const assignedToId = assignedTo ? Number(assignedTo) : null;

    const newTicket = await prisma.ticket.create({
      data: {
        title,
        description,
        createdBy,
        assignedTo: assignedToId,
        status: TicketStatus.open,
        enrichmentStatus: EnrichmentStatus.pending,
      },
      include: {
        creator: {
          select: { id: true, name: true, email: true, role: true },
        },
        assignee: {
          select: { id: true, name: true, email: true, role: true },
        },
      },
    });

    // Notificar a clientes conectados vía Server-Sent Events (SSE)
    broadcastTicketEvent('ticket_created', newTicket);

    // Disparar en segundo plano la automatización de n8n
    triggerN8nEnrichment(newTicket).catch((err: unknown) =>
      console.error('Error no controlado en n8n:', err)
    );

    return res.status(201).json(newTicket);
  } catch (error) {
    console.error('Error al crear ticket:', error);
    return res.status(500).json({ error: 'Error al crear el ticket' });
  }
};

// 4. Actualizar un ticket (Admin: CRUD completo; Agente: estado, auto-asignación y respuesta)
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { title, description, status, priority, category, assignedTo, tags, suggestedReply } = req.body;

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const data: any = {};

    // Edición de título y descripción permitida exclusivamente para Administradores
    if (title !== undefined) {
      if (req.user?.role !== Role.admin) {
        return res.status(403).json({ error: 'Solo los administradores pueden editar el título del ticket' });
      }
      data.title = title;
    }
    if (description !== undefined) {
      if (req.user?.role !== Role.admin) {
        return res.status(403).json({ error: 'Solo los administradores pueden editar la descripción del ticket' });
      }
      data.description = description;
    }

    if (status) data.status = status as TicketStatus;
    if (priority) data.priority = priority as Priority;
    if (category) data.category = category as Category;
    if (assignedTo !== undefined) {
      data.assignedTo = assignedTo === null || assignedTo === '' || assignedTo === 0 ? null : Number(assignedTo);
    }
    if (tags !== undefined) data.tags = tags;
    if (suggestedReply !== undefined) data.suggestedReply = suggestedReply;

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data,
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Notificar en tiempo real a clientes conectados
    broadcastTicketEvent('ticket_updated', updatedTicket);

    return res.json(updatedTicket);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el ticket' });
  }
};

// 5. Eliminar un ticket (Exclusivo Administrador)
export const deleteTicket = async (req: Request, res: Response) => {
  try {
    if (req.user?.role !== Role.admin) {
      return res.status(403).json({ error: 'Acceso denegado: Solo los administradores pueden eliminar tickets' });
    }

    const id = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    await prisma.ticket.delete({ where: { id } });

    // Notificar eliminación a todos los clientes conectados en tiempo real
    broadcastTicketEvent('ticket_deleted', { id });

    return res.json({ message: 'Ticket eliminado exitosamente', id });
  } catch (error) {
    console.error('Error al eliminar ticket:', error);
    return res.status(500).json({ error: 'Error al eliminar el ticket' });
  }
};

// 6. Callback Endpoint para n8n (Recibe la clasificación de la IA)
export const enrichTicket = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { priority, category, tags, suggestedReply, secret } = req.body || {};
    const rawSecret =
      secret ||
      req.headers['x-callback-secret'] ||
      req.headers['x-n8n-secret'] ||
      req.query.secret;

    // Validar token/secreto de n8n para seguridad
    const expectedSecret = process.env.N8N_CALLBACK_SECRET || 'secreto_compartido_para_n8n';
    if (!rawSecret || rawSecret !== expectedSecret) {
      return res.status(401).json({ error: 'Secreto de callback inválido' });
    }

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const dataToUpdate: any = {
      enrichmentStatus: EnrichmentStatus.done,
      enrichedAt: new Date(),
    };

    if (priority !== undefined) {
      dataToUpdate.priority = parsePriority(priority);
    }
    if (category !== undefined) {
      dataToUpdate.category = parseCategory(category);
    }
    if (tags !== undefined) {
      dataToUpdate.tags = Array.isArray(tags)
        ? tags
        : typeof tags === 'string'
        ? tags.split(',').map((t: string) => t.trim()).filter(Boolean)
        : [];
    }
    if (suggestedReply !== undefined) {
      dataToUpdate.suggestedReply = suggestedReply;
    }

    const enrichedTicket = await prisma.ticket.update({
      where: { id },
      data: dataToUpdate,
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Notificar en tiempo real a clientes conectados vía SSE
    broadcastTicketEvent('ticket_updated', enrichedTicket);

    console.log(`✨ Ticket #${id} enriquecido por IA exitosamente y emitido vía SSE`);
    return res.json(enrichedTicket);
  } catch (error) {
    console.error('Error al enriquecer ticket desde n8n:', error);
    return res.status(500).json({ error: 'Error al procesar enriquecimiento de n8n' });
  }
};

// 7. Reintentar enriquecimiento de IA manualmente
export const retryEnrichment = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);

    const ticket = await prisma.ticket.findUnique({ where: { id } });
    if (!ticket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const updatedTicket = await prisma.ticket.update({
      where: { id },
      data: {
        enrichmentStatus: EnrichmentStatus.pending,
      },
      include: {
        creator: { select: { id: true, name: true, email: true, role: true } },
        assignee: { select: { id: true, name: true, email: true, role: true } },
      },
    });

    // Notificar actualización de estado
    broadcastTicketEvent('ticket_updated', updatedTicket);

    // Re-disparar webhook asíncrono
    triggerN8nEnrichment(updatedTicket).catch((err: unknown) =>
      console.error('Error al reintentar enriquecimiento en n8n:', err)
    );

    return res.json(updatedTicket);
  } catch (error) {
    console.error('Error al reintentar enriquecimiento:', error);
    return res.status(500).json({ error: 'Error al reintentar enriquecimiento de IA' });
  }
};

// 8. Server-Sent Events (SSE) Stream para clientes frontend
export const streamTicketEvents = (req: Request, res: Response) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.setHeader('X-Accel-Buffering', 'no');
  res.flushHeaders?.();

  addSSEClient(res);

  // Keep-alive heartbeat cada 30 segundos
  const keepAlive = setInterval(() => {
    try {
      res.write(': keepalive\n\n');
    } catch {
      clearInterval(keepAlive);
      removeSSEClient(res);
    }
  }, 30000);

  req.on('close', () => {
    clearInterval(keepAlive);
    removeSSEClient(res);
  });
};

// Helpers para parsear enums de forma segura (soporta español, inglés y texto libre de IA)
function parsePriority(val: unknown): Priority | undefined {
  if (!val) return undefined;
  const s = String(val).toLowerCase().trim();
  if (s === 'low' || s === 'baja' || s === 'bajo') return Priority.low;
  if (s === 'medium' || s === 'media' || s === 'medio') return Priority.medium;
  if (s === 'high' || s === 'alta' || s === 'alto') return Priority.high;
  if (s === 'urgent' || s === 'urgente' || s === 'critica' || s === 'crítica' || s === 'critical') return Priority.urgent;
  return Priority.medium;
}

function parseCategory(val: unknown): Category | undefined {
  if (!val) return undefined;
  const s = String(val).toLowerCase().trim();
  if (s === 'billing' || s.includes('factur') || s.includes('pago') || s.includes('cobro') || s.includes('tarjeta')) return Category.billing;
  if (s === 'technical' || s.includes('tecnic') || s.includes('técnic') || s.includes('error') || s.includes('bug') || s.includes('sistema') || s.includes('falla') || s.includes('caida') || s.includes('caída')) return Category.technical;
  if (s === 'account' || s.includes('cuenta') || s.includes('usuario') || s.includes('login') || s.includes('acceso') || s.includes('perfil')) return Category.account;
  return Category.other;
}