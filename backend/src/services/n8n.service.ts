import axios from 'axios';

interface TicketData {
  id: number;
  title: string;
  description: string;
  createdAt: Date;
}

export const triggerN8nEnrichment = async (ticket: TicketData): Promise<void> => {
  const webhookUrl = process.env.N8N_WEBHOOK_URL;

  if (!webhookUrl) {
    console.warn('⚠️ N8N_WEBHOOK_URL no está definida en el archivo .env. Omitiendo enriquecimiento.');
    return;
  }

  try {
    // Enviamos los datos del ticket a n8n de forma asíncrona
    await axios.post(
      webhookUrl,
      {
        ticketId: ticket.id,
        title: ticket.title,
        description: ticket.description,
        createdAt: ticket.createdAt,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          'x-callback-secret': process.env.N8N_CALLBACK_SECRET || '',
        },
        timeout: 5000, // Timeout de 5 segundos para no bloquear la app si n8n no responde
      }
    );

    console.log(`📡 Notificación enviada a n8n con éxito para el Ticket #${ticket.id}`);
  } catch (error: any) {
    // Registramos el error sin interrumpir el flujo principal del backend
    console.error(`❌ Error al conectar con el webhook de n8n para el Ticket #${ticket.id}:`, error.message);
  }
};