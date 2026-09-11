import type { Response } from 'express';

// Conjunto de clientes conectados a SSE
const clients = new Set<Response>();

export const addSSEClient = (res: Response): void => {
  clients.add(res);
  console.log(`🔌 Cliente conectado a SSE. Clientes activos: ${clients.size}`);

  // Mensaje inicial de handshake
  res.write(`data: ${JSON.stringify({ type: 'connected', message: 'SSE stream conectado exitosamente' })}\n\n`);
};

export const removeSSEClient = (res: Response): void => {
  clients.delete(res);
  console.log(`❌ Cliente desconectado de SSE. Clientes activos: ${clients.size}`);
};

export const broadcastTicketEvent = (
  event: 'ticket_created' | 'ticket_updated' | 'ticket_deleted',
  data: unknown
): void => {
  if (clients.size === 0) return;

  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;

  for (const client of clients) {
    try {
      client.write(payload);
    } catch {
      clients.delete(client);
    }
  }
};
