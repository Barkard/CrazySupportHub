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
│   │   │   └── auth.controller.ts
│   │   ├── middlewares/
│   │   │   └── auth.middleware.ts
│   │   ├── routes/
│   │   │   └── auth.routes.ts
│   │   └── types/
│   │       └── express.d.ts      # Extensión de tipos de Express (req.user)
│   ├── package.json
│   └── tsconfig.json
└── tickets-seed.json             # Datos de prueba (usuarios y tickets)
```

---

## 🚀 Setup inicial del backend

### ✋ Hecho manualmente (comandos ejecutados a mano)

```bash
# Inicializar el proyecto con pnpm
pnpm init

# Instalar dependencias de producción
pnpm add @prisma/client bcrypt cors dotenv express jsonwebtoken

# Instalar dependencias de desarrollo
pnpm add -D prisma typescript @types/node @types/bcrypt @types/cors \
  @types/express @types/jsonwebtoken ts-node-dev tsx

# Inicializar Prisma (genera prisma/schema.prisma y .env)
pnpm exec prisma init

# Eliminar archivos de configuración incorrectos generados por Prisma
rm -f prisma.config.ts prisma.config.js prisma/prisma.config.ts prisma/prisma.config.js

# Generar el cliente de Prisma
pnpm exec prisma generate

# Crear el archivo .env y configurar DATABASE_URL
touch .env

# Ejecutar la migración inicial (crea las tablas en la base de datos)
pnpm exec prisma migrate dev --name init
```

### 🤖 Hecho con IA (Antigravity)

- **`prisma/schema.prisma`** — Modelos `User` y `Ticket` con enums (`Role`, `TicketStatus`, `Priority`, `Category`, `EnrichmentStatus`)
- **`prisma/seed.ts`** — Script de seed con 4 usuarios y 8 tickets de prueba
- **`tickets-seed.json`** — Datos de prueba en JSON referenciados por el seed
- **`tsconfig.json`** — Configuración TypeScript (`nodenext`, `verbatimModuleSyntax`, `resolveJsonModule`, etc.)
- **`package.json`** — Scripts `dev`, `build`, `start` y config del seed de Prisma; campo `"type": "module"` para ESM
- **`src/app.ts`** — Setup de Express con CORS, JSON middleware y health check
- **`src/server.ts`** — Punto de entrada que levanta el servidor en el puerto configurado
- **`src/config/prisma.ts`** — Instancia singleton de PrismaClient
- **`src/controllers/auth.controller.ts`** — Handlers de `POST /login` y `GET /me`
- **`src/middlewares/auth.middleware.ts`** — Middleware JWT (`authenticateToken`) y control de roles (`requireRole`)
- **`src/routes/auth.routes.ts`** — Definición de rutas de autenticación
- **`src/types/express.d.ts`** — Declaración de `req.user` en el namespace de Express
- Corrección de errores TypeScript por `verbatimModuleSyntax` y módulos NodeNext ESM:
  - Extensiones `.js` obligatorias en imports relativos
  - `import type` para tipos puros (`Request`, `Response`, `NextFunction`, `IRouter`, `Express`)
  - Atributo `with { type: 'json' }` en imports de JSON
  - Anotaciones de tipo explícitas en `app` y `router` (tipos no portables)

---

## ⚙️ Variables de entorno

Crea un archivo `backend/.env` con:

```env
DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/crazysupporthub"
JWT_SECRET="tu_secreto_jwt_aqui"
PORT=3000
```

---

## 🧪 Comandos útiles

```bash
# Levantar el servidor en modo desarrollo (con hot reload)
pnpm dev

# Poblar la base de datos con datos de prueba
pnpm exec prisma db seed

# Abrir Prisma Studio (explorador visual de la BD)
pnpm exec prisma studio

# Compilar para producción
pnpm build

# Ejecutar en producción
pnpm start
```

---

## 🔌 Endpoints disponibles

| Método | Ruta | Descripción | Auth |
|--------|------|-------------|------|
| `GET` | `/health` | Estado del servidor | No |
| `POST` | `/api/auth/login` | Login con email y contraseña | No |
| `GET` | `/api/auth/me` | Datos del usuario autenticado | JWT |
