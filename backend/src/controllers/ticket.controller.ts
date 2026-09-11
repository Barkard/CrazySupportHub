import type { Request, Response } from 'express';
import { prisma } from '../config/prisma.js';
import { triggerN8nEnrichment } from '../services/n8n.service.js';
import { TicketStatus, Priority, Category, EnrichmentStatus } from '@prisma/client';

// 1. Obtener lista de tickets con filtros opcionales
export const getTickets = async (req: Request, res: Response) => {
  try {
    const { status, priority, category, assignedTo } = req.query;

    const where: any = {};
    if (status) where.status = status as TicketStatus;
    if (priority) where.priority = priority as Priority;
    if (category) where.category = category as Category;
    if (assignedTo) where.assignedTo = Number(assignedTo);

    const tickets = await prisma.ticket.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

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
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
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

// 3. Crear un nuevo ticket y disparar n8n
export const createTicket = async (req: Request, res: Response) => {
  try {
    const { title, description, assignedTo } = req.body;

    if (!title || !description) {
      return res.status(400).json({ error: 'El título y la descripción son obligatorios' });
    }

    const createdBy = req.user?.id || 1; // ID del usuario autenticado
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

// 4. Actualizar un ticket (estado, agente asignado, etc.)
export const updateTicket = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    const { status, priority, category, assignedTo, tags, suggestedReply } = req.body;

    const existingTicket = await prisma.ticket.findUnique({ where: { id } });
    if (!existingTicket) {
      return res.status(404).json({ error: 'Ticket no encontrado' });
    }

    const data: any = {};
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
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

    return res.json(updatedTicket);
  } catch (error) {
    return res.status(500).json({ error: 'Error al actualizar el ticket' });
  }
};

// 6. Reintentar enriquecimiento de IA manualmente
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
        creator: { select: { id: true, name: true, email: true } },
        assignee: { select: { id: true, name: true, email: true } },
      },
    });

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

// 5. Callback Endpoint para n8n (Recibe la clasificación de la IA)
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
    });

    console.log(`✨ Ticket #${id} enriquecido por IA exitosamente`);
    return res.json(enrichedTicket);
  } catch (error) {
    console.error('Error al enriquecer ticket desde n8n:', error);
    return res.status(500).json({ error: 'Error al procesar enriquecimiento de n8n' });
  }
};