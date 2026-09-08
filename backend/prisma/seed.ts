import { PrismaClient, Role, TicketStatus, Priority, Category, EnrichmentStatus } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import seedData from '../../tickets-seed.json' with { type: 'json' };

const prisma = new PrismaClient();

async function main() {
  console.log('Limpiando base de datos...');
  await prisma.ticket.deleteMany();
  await prisma.user.deleteMany();

  console.log('Cargando usuarios...');
  for (const user of (seedData as any).users) {
    const passwordHash = await bcrypt.hash(user.password, 10);
    await prisma.user.create({
      data: {
        id: user.id,
        name: user.name,
        email: user.email,
        passwordHash,
        role: user.role as Role,
      },
    });
  }

  console.log('Cargando tickets...');
  for (const ticket of (seedData as any).tickets) {
    await prisma.ticket.create({
      data: {
        id: ticket.id,
        title: ticket.title,
        description: ticket.description,
        status: ticket.status as TicketStatus,
        createdBy: ticket.createdBy,
        assignedTo: ticket.assignedTo,
        priority: ticket.priority ? (ticket.priority as Priority) : null,
        category: ticket.category ? (ticket.category as Category) : null,
        tags: ticket.tags,
        suggestedReply: ticket.suggestedReply,
        enrichmentStatus: ticket.enrichmentStatus as EnrichmentStatus,
        enrichedAt: ticket.enrichedAt ? new Date(ticket.enrichedAt) : null,
        createdAt: new Date(ticket.createdAt),
        updatedAt: new Date(ticket.updatedAt),
      },
    });
  }

  console.log('¡Seed completado con éxito!');
}

main()
  .catch((e) => {
    console.error('Error durante la ejecución del seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });