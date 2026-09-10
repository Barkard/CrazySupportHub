import { prisma } from '../src/config/prisma.js';
import bcrypt from 'bcrypt';
import { Role, TicketStatus, Priority, Category, EnrichmentStatus } from '@prisma/client';

async function main() {
  console.log('🌱 Iniciando siembra de base de datos...');

  // 1. Crear usuarios por defecto
  const kevinPass = await bcrypt.hash('28169315', 10);
  const adminPass = await bcrypt.hash('admin123', 10);
  const agentPass = await bcrypt.hash('agent123', 10);

  const kevin = await prisma.user.upsert({
    where: { email: 'kevin@gmail.com' },
    update: { passwordHash: kevinPass, name: 'Kevin Saavedra', role: Role.admin },
    create: {
      name: 'Kevin Saavedra',
      email: 'kevin@gmail.com',
      passwordHash: kevinPass,
      role: Role.admin,
    },
  });

  const admin = await prisma.user.upsert({
    where: { email: 'admin@crazysupporthub.com' },
    update: { passwordHash: adminPass, name: 'Administrador Principal', role: Role.admin },
    create: {
      name: 'Administrador Principal',
      email: 'admin@crazysupporthub.com',
      passwordHash: adminPass,
      role: Role.admin,
    },
  });

  const agent = await prisma.user.upsert({
    where: { email: 'agente@crazysupporthub.com' },
    update: { passwordHash: agentPass, name: 'Agente Soporte', role: Role.agent },
    create: {
      name: 'Agente Soporte',
      email: 'agente@crazysupporthub.com',
      passwordHash: agentPass,
      role: Role.agent,
    },
  });

  console.log('✅ Usuarios creados/actualizados:');
  console.log(`   - ${kevin.email} (Rol: ${kevin.role}, Contraseña: 28169315)`);
  console.log(`   - ${admin.email} (Rol: ${admin.role}, Contraseña: admin123)`);
  console.log(`   - ${agent.email} (Rol: ${agent.role}, Contraseña: agent123)`);

  // 2. Crear tickets de prueba si no existen
  const ticketCount = await prisma.ticket.count();
  if (ticketCount === 0) {
    console.log('📝 Creando tickets de demostración...');
    await prisma.ticket.createMany({
      data: [
        {
          title: 'Error al procesar el pago mensual con tarjeta Visa',
          description: 'El cliente reporta que al intentar renovar la suscripción le arroja un error 502 en la pasarela de pagos.',
          status: TicketStatus.open,
          priority: Priority.high,
          category: Category.billing,
          tags: ['facturación', 'pagos', 'error-502'],
          suggestedReply: 'Hola, hemos verificado el intento de cobro y detectamos un bloqueo temporal en la pasarela. Ya fue desbloqueado; por favor intenta nuevamente.',
          enrichmentStatus: EnrichmentStatus.done,
          enrichedAt: new Date(),
          createdBy: kevin.id,
          assignedTo: agent.id,
        },
        {
          title: 'No puedo acceder a mi panel de configuración',
          description: 'Al hacer clic en Configuración de Cuenta la página se queda en blanco.',
          status: TicketStatus.in_progress,
          priority: Priority.urgent,
          category: Category.technical,
          tags: ['ui', 'bug', 'urgente'],
          suggestedReply: 'Hola, estamos investigando un problema en la carga del módulo de configuración. Mientras tanto, puedes acceder mediante el enlace directo enviado a tu correo.',
          enrichmentStatus: EnrichmentStatus.done,
          enrichedAt: new Date(),
          createdBy: admin.id,
          assignedTo: kevin.id,
        },
        {
          title: 'Consulta sobre límites del plan Pro',
          description: '¿Cuántos agentes simultáneos permite el plan Pro antes de requerir Enterprise?',
          status: TicketStatus.open,
          priority: Priority.medium,
          category: Category.account,
          tags: ['ventas', 'plan-pro'],
          suggestedReply: 'El plan Pro incluye hasta 10 agentes simultáneos. Si requieres más, te recomendamos migrar al plan Enterprise.',
          enrichmentStatus: EnrichmentStatus.done,
          enrichedAt: new Date(),
          createdBy: kevin.id,
        }
      ],
    });
    console.log('✅ Tickets de prueba creados.');
  }

  console.log('🎉 Siembra completada exitosamente.');
}

main()
  .catch((e) => {
    console.error('❌ Error en el seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

