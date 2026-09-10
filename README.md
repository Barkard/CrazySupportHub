# CrazySupportHub

Sistema de soporte técnico con enriquecimiento de tickets mediante IA.

---

## 📁 Estructura del proyecto

```
CrazySupportHub/
├── backend/                      # API REST (Node.js + Express + Prisma)
│   ├── prisma/
│   │   ├── schema.prisma         # Modelos de la base de datos
│   │   ├── seed.ts               # Script de datos iniciales
│   │   └── migrations/           # Migraciones SQL generadas por Prisma
│   ├── src/
│   │   ├── app.ts                # Configuración de Express
│   │   ├── server.ts             # Punto de entrada del servidor
│   │   ├── config/
│   │   │   └── prisma.ts         # Instancia compartida de PrismaClient
│   │   ├── controllers/
│   │   │   ├── auth.controller.ts
│   │   │   ├── ticket.controller.ts
│   │   │   └── user.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   ├── ticket.routes.ts
│   │   │   └── user.routes.ts
│   │   └── types/
│   │       └── express.d.ts      # Extensión de tipos de Express (req.user)
│   ├── package.json
│   └── tsconfig.json
├── frontend/                     # Aplicación Web (Next.js 16 + Tailwind CSS)
│   ├── src/
│   │   ├── app/
│   │   │   ├── dashboard/
│   │   │   │   ├── page.tsx      # Dashboard dinámico según rol (Agente / Admin)
│   │   │   │   ├── users/
│   │   │   │   │   └── page.tsx  # Gestión de Usuarios y Roles (Admin)
│   │   │   │   └── tickets/[id]/
│   │   │   │       └── page.tsx  # Detalle individual de ticket
│   │   │   ├── login/
│   │   │   └── providers.tsx
│   │   ├── components/
│   │   │   ├── CreateTicketModal.tsx
│   │   │   ├── TicketDetailModal.tsx
│   │   │   └── UserModal.tsx
│   │   ├── context/
│   │   │   └── AuthContext.tsx
│   │   └── lib/
│   │       └── api.ts
│   ├── package.json
│   └── tsconfig.json
└── tickets-seed.json             # Datos de prueba (usuarios y tickets)
```

---

## 🚀 Setup y Desarrollo

### ✋ Hecho manualmente (Frontend y Configuración)

- **Desarrollo completo de la interfaz de usuario en Frontend (Next.js + Tailwind CSS):**
  - **Rol: Agente de Soporte (El Operativo):**
    - **Dashboard Enfocado:** Pestañas de acceso rápido (*"Mis Tickets Asignados"*, *"Cola Sin Asignar"*, *"Todos los Tickets"*).
    - **Priorización Automática:** Destacado visual y ordenación inteligente priorizando tickets `URGENT` y `HIGH` clasificados por la IA.
    - **Acción Operativa Inmediata:** Botón directo *"Asignármelo"* desde la tabla para tickets sin responsable.
    - **Detalle del Ticket Operativo:** Botón *"Copiar Respuesta"* y botón *"Insertar en Respuesta"* para transferir y editar la sugerencia de la IA en un editor interactivo con opción de envío y cierre de ticket.
    - Ocultación de métricas administrativas complejas para mantener una experiencia limpia y ágil.
  - **Rol: Administrador (El Supervisor y Gestor):**
    - **Dashboard con Analíticas Avanzadas:** Métricas globales de volumen, porcentaje de éxito en enriquecimiento por IA y distribución gráfica por categorías (*Facturación*, *Técnico*, *Cuentas*, *Otros*).
    - **Filtro de Auditoría por Agente:** Selector para auditar tickets de cualquier agente o tickets sin asignar.
    - **Módulo de Gestión de Usuarios (`/dashboard/users`):** Tabla de usuarios con búsqueda en tiempo real, conteo de tickets asociados y modal interactivo para crear, editar roles o cambiar contraseñas.
    - **Detalle Extendido del Ticket:** Selector para reasignar manualmente tickets a cualquier agente registrado y botón para re-disparar el webhook de enriquecimiento de IA (`Reintentar IA`) si falló.
- **Configuración de arranque unificado:**
  - Integración de `concurrently` en la raíz del proyecto para ejecutar backend y frontend con un solo comando (`pnpm dev`).
  - Configuración explícita del puerto `3001` en frontend para evitar colisiones con el backend en el puerto `3000`.

---

### 🤖 Hecho con IA (Antigravity)

- **Backend - Módulo de Gestión de Usuarios:**
  - `src/controllers/user.controller.ts` y `src/routes/user.routes.ts` con operaciones CRUD completas y control de acceso por roles (`requireRole([Role.admin])`).
- **Backend - Reintento de IA y Soporte de Asignación:**
  - Endpoint `POST /api/tickets/:id/retry` para re-disparar el webhook de n8n y actualizar el estado a `pending`.
  - Mejora en `updateTicket` para soporte seguro de desasignación (`assignedTo: null`).
- **Sincronización de Base de Datos PostgreSQL:**
  - Corrección y sincronización automática de secuencias de autoincremento (`users_id_seq`, `tickets_id_seq`) tras operaciones de seed.
  - Creación del nuevo agente de soporte en la base de datos y actualización en `tickets-seed.json`.

---

## ⚙️ Variables de entorno

Crea un archivo `backend/.env` con:

```env
PORT=3000
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/crazysupporthub?schema=public"
JWT_SECRET="tu_secreto_jwt_aqui"
N8N_WEBHOOK_URL="tu_webhook_n8n_aqui"
N8N_CALLBACK_SECRET="tu_secreto_compartido_para_n8n"
```

---

## 🧪 Comandos útiles

### Desde la raíz del proyecto (Todo en uno)
```bash
# Levantar Frontend (puerto 3001) y Backend (puerto 3000) simultáneamente
pnpm dev

# Poblar la base de datos con datos de prueba
pnpm seed

# Abrir Prisma Studio (explorador visual de la BD)
pnpm studio

# Compilar ambos proyectos para producción
pnpm build
```

### Por separado
```bash
# Solo Backend
pnpm dev:backend   # o cd backend && pnpm dev

# Solo Frontend
pnpm dev:frontend  # o cd frontend && pnpm dev
```

---

## 🔌 Endpoints disponibles

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Estado del servidor | No |
| `POST` | `/api/auth/login` | Login con email y contraseña | No |
| `GET` | `/api/auth/me` | Datos del usuario autenticado | JWT |
| `GET` | `/api/tickets` | Lista de tickets (soporta filtros) | JWT |
| `GET` | `/api/tickets/:id` | Detalle de un ticket | JWT |
| `POST` | `/api/tickets` | Crear nuevo ticket | JWT |
| `PATCH` | `/api/tickets/:id` | Actualizar estado, prioridad o asignación | JWT |
| `POST` | `/api/tickets/:id/retry` | Reintentar enriquecimiento de IA vía n8n | JWT |
| `POST` | `/api/tickets/:id/enrich` | Callback de n8n con resultados IA | Secret |
| `GET` | `/api/users` | Listar usuarios del sistema | JWT |
| `POST` | `/api/users` | Crear nuevo usuario o agente | Admin |
| `PATCH` | `/api/users/:id` | Modificar datos, rol o contraseña | Admin |
| `DELETE` | `/api/users/:id` | Eliminar usuario | Admin |
