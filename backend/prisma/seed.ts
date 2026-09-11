import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { Role, TicketStatus, Priority, Category, EnrichmentStatus } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  console.log('🌱 Iniciando siembra completa de base de datos desde tickets-seed.json...');

  // Leer tickets-seed.json
  const seedFilePath = path.resolve(__dirname, '../../tickets-seed.json');
  const seedRaw = fs.readFileSync(seedFilePath, 'utf-8');
  const seedData = JSON.parse(seedRaw);

  // 1. Limpiar tickets existentes para evitar duplicados / conflictos de IDs
  await prisma.ticket.deleteMany({});
  console.log('🧹 Tickets previos eliminados.');

  // 2. Crear o actualizar usuarios
  const userMap = new Map<number, number>();

  for (const u of seedData.users) {
    const passwordHash = await bcrypt.hash(u.password, 10);
    const role = u.role === 'admin' ? Role.admin : Role.agent;

    const createdUser = await prisma.user.upsert({
      where: { email: u.email },
      update: {
        name: u.name,
        passwordHash,
        role,
      },
      create: {
        name: u.name,
        email: u.email,
        passwordHash,
        role,
      },
    });

    userMap.set(u.id, createdUser.id);
    console.log(`👤 Usuario listo: ${createdUser.name} (${createdUser.email}) - Rol: ${createdUser.role}`);
  }

  // Usuario Kevin como admin extra
  const kevinPass = await bcrypt.hash('28169315', 10);
  await prisma.user.upsert({
    where: { email: 'kevin@gmail.com' },
    update: { passwordHash: kevinPass, name: 'Kevin Saavedra', role: Role.admin },
    create: {
      name: 'Kevin Saavedra',
      email: 'kevin@gmail.com',
      passwordHash: kevinPass,
      role: Role.admin,
    },
  });
  console.log('👤 Usuario listo: Kevin Saavedra (kevin@gmail.com) - Rol: admin');

  // 3. Crear tickets
  console.log(`📝 Insertando ${seedData.tickets.length} tickets...`);

  for (const t of seedData.tickets) {
    const createdById = userMap.get(t.createdBy) || 1;
    const assignedToId = t.assignedTo ? (userMap.get(t.assignedTo) || null) : null;

    let priorityEnum: Priority | null = null;
    if (t.priority) {
      const p = t.priority.toLowerCase();
      if (p === 'low') priorityEnum = Priority.low;
      if (p === 'medium') priorityEnum = Priority.medium;
      if (p === 'high') priorityEnum = Priority.high;
      if (p === 'urgent') priorityEnum = Priority.urgent;
    }

    let categoryEnum: Category | null = null;
    if (t.category) {
      const c = t.category.toLowerCase();
      if (c === 'billing') categoryEnum = Category.billing;
      if (c === 'technical') categoryEnum = Category.technical;
      if (c === 'account') categoryEnum = Category.account;
      if (c === 'other') categoryEnum = Category.other;
    }

    let statusEnum: TicketStatus = TicketStatus.open;
    if (t.status === 'in_progress') statusEnum = TicketStatus.in_progress;
    if (t.status === 'resolved') statusEnum = TicketStatus.resolved;
    if (t.status === 'closed') statusEnum = TicketStatus.closed;

    let enrichmentEnum: EnrichmentStatus = EnrichmentStatus.pending;
    if (t.enrichmentStatus === 'processing') enrichmentEnum = EnrichmentStatus.processing;
    if (t.enrichmentStatus === 'done' || t.enrichmentStatus === 'completed') enrichmentEnum = EnrichmentStatus.done;
    if (t.enrichmentStatus === 'failed') enrichmentEnum = EnrichmentStatus.failed;

    await prisma.ticket.create({
      data: {
        title: t.title,
        description: t.description,
        status: statusEnum,
        priority: priorityEnum,
        category: categoryEnum,
        tags: t.tags || [],
        suggestedReply: t.suggestedReply || null,
        enrichmentStatus: enrichmentEnum,
        enrichedAt: t.enrichedAt ? new Date(t.enrichedAt) : null,
        createdBy: createdById,
        assignedTo: assignedToId,
        createdAt: t.createdAt ? new Date(t.createdAt) : new Date(),
        updatedAt: t.updatedAt ? new Date(t.updatedAt) : new Date(),
      },
    });
  }

  console.log(`✅ ${seedData.tickets.length} tickets creados exitosamente en Neon.`);
  console.log('🎉 Siembra completada con éxito.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
