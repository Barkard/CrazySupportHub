# 📋 Reporte Cronológico de Commits — CrazySupportHub

Historial detallado y auditoría técnica de cada commit realizado en el proyecto **CrazySupportHub**, documentando los cambios en la arquitectura, backend, frontend, integraciones con IA/n8n, base de datos y despliegue.

---

## 1. Commit `a188290` — `first commit`
* **Autor:** Leon
* **Fecha:** 2026-09-07 13:06:43 -0400
* **Resumen:** Inicialización del repositorio Git del proyecto.
* **Archivos Afectados:**
  * `[NEW]` `README.md`: Creación del archivo inicial.

---

## 2. Commit `f7d7a6a` — `feat(backend): setup inicial del backend`
* **Autor:** Leon
* **Fecha:** 2026-09-07 21:09:04 -0400
* **Resumen:** Configuración base del entorno backend con Node.js, Express, TypeScript y Prisma ORM.
* **Detalles Técnicos:**
  * Configuración del proyecto TypeScript en modo ESM (`NodeNext`).
  * Definición del esquema Prisma ([`schema.prisma`](file:///home/kevin/Documentos/CrazySupportHub/backend/prisma/schema.prisma)) con modelos `User` y `Ticket`, junto a los enums `Role`, `TicketStatus`, `Priority`, `Category` y `EnrichmentStatus`.
  * Generación y aplicación de la migración inicial de PostgreSQL (`20260907203549_init`).
  * Implementación de autenticación JWT (`POST /api/auth/login`), middleware `authenticateToken` y control de acceso `requireRole`.
  * Endpoint de Health check (`GET /health`).
  * Tipado de Express extendido (`req.user`) mediante archivo de declaración [`express.d.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/types/express.d.ts).
  * Script inicial de seed y archivo [`tickets-seed.json`](file:///home/kevin/Documentos/CrazySupportHub/tickets-seed.json).
* **Archivos Afectados:**
  * `[NEW]` `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/prisma/migrations/20260907203549_init/migration.sql`
  * `[NEW]` `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/config/prisma.ts`
  * `[NEW]` `backend/src/controllers/auth.controller.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/middlewares/auth.middleware.ts`
  * `[NEW]` `backend/src/types/express.d.ts`, `backend/tsconfig.json`, `backend/package.json`, `tickets-seed.json`

---

## 3. Commit `1652055` — `feat(backend): implementar endpoints de tickets, integracion n8n y correcciones TypeScript`
* **Autor:** Leon
* **Fecha:** 2026-09-07 22:47:36 -0400
* **Resumen:** Creación de los servicios y endpoints para el ciclo de vida de tickets y la integración con n8n.
* **Detalles Técnicos:**
  * Creación del servicio [`n8n.service.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/services/n8n.service.ts) para disparar webhooks asíncronos hacia n8n con timeout de 5 segundos.
  * Implementación de los endpoints:
    * `GET /api/tickets`: Obtener listado de tickets con filtros y relaciones.
    * `GET /api/tickets/:id`: Detalle de ticket.
    * `POST /api/tickets`: Creación de ticket y disparo en segundo plano hacia n8n.
    * `PATCH /api/tickets/:id`: Actualización de estado y asignación.
    * `POST /api/tickets/:id/enrich`: Callback de n8n para recibir la clasificación de IA.
* **Archivos Afectados:**
  * `[NEW]` `backend/src/services/n8n.service.ts`
  * `[NEW]` `backend/src/controllers/ticket.controller.ts`
  * `[NEW]` `backend/src/routes/ticket.routes.ts`
  * `[MODIFY]` `backend/src/app.ts`, `.gitignore`, `package.json`, `pnpm-lock.yaml`

---

## 4. Commit `5231f66` — `feat(frontend): setup Next.js app, Axios client, AuthContext and Login page`
* **Autor:** Leon
* **Fecha:** 2026-09-07 23:42:47 -0400
* **Resumen:** Inicialización de la aplicación Frontend en Next.js (App Router), configuración de estilos, cliente HTTP y autenticación.
* **Detalles Técnicos:**
  * Estructura base de Next.js con Tailwind CSS y tipografía moderna.
  * Configuración del cliente Axios centralizado ([`frontend/src/lib/api.ts`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/lib/api.ts)) con interceptores para inyección automática de Bearer Token JWT y manejo de errores 401.
  * Creación de [`AuthContext.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/context/AuthContext.tsx) para gestión global de sesión, persistencia en `localStorage` y redirecciones de seguridad.
  * Implementación visual y funcional de la página de Login ([`login/page.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/login/page.tsx)).
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/globals.css`, `frontend/src/app/providers.tsx`
  * `[NEW]` `frontend/src/app/login/page.tsx`
  * `[NEW]` `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/api.ts`
  * `[NEW]` `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/postcss.config.mjs`

---

## 5. Commit `3484f7e` — `feat(frontend): implement Dashboard, New Ticket form and Ticket Detail view with AI reply integration`
* **Autor:** Leon
* **Fecha:** 2026-09-07 23:50:53 -0400
* **Resumen:** Construcción de las vistas principales de soporte: Dashboard con métricas, formulario de creación y detalle del ticket.
* **Detalles Técnicos:**
  * Implementación de [`dashboard/page.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/dashboard/page.tsx) con tarjetas de métricas (Total, Pendientes, En Progreso, Resueltos), filtros rápidos y tabla de tickets.
  * Creación de la página para redactar nuevos tickets (`dashboard/tickets/new/page.tsx`).
  * Implementación de la vista de detalle de ticket (`dashboard/tickets/id/page.tsx`) con visualización de metadatos, tags y caja para respuestas sugeridas por IA.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/dashboard/page.tsx`
  * `[NEW]` `frontend/src/app/dashboard/tickets/new/page.tsx`
  * `[NEW]` `frontend/src/app/dashboard/tickets/id/page.tsx`
  * `[MODIFY]` `backend/pnpm-lock.yaml`, `tickets-seed.json`

---

## 6. Commit `e933d7b` — `fix(frontend): changes views to modals`
* **Autor:** Leon
* **Fecha:** 2026-09-08 00:04:22 -0400
* **Resumen:** Refactorización de la experiencia de usuario (UX) migrando la navegación entre páginas completas a modales flotantes e interactivos.
* **Detalles Técnicos:**
  * Creación del componente [`CreateTicketModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/CreateTicketModal.tsx) para crear tickets sin perder el contexto del dashboard.
  * Creación del componente [`TicketDetailModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/TicketDetailModal.tsx) para consultar, auto-asignar y responder tickets con atajos de teclado (`Escape`) y backdrop blur.
  * Renombrado de ruta a parámetro dinámico estándar `dashboard/tickets/[id]`.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/components/CreateTicketModal.tsx`
  * `[NEW]` `frontend/src/components/TicketDetailModal.tsx`
  * `[MODIFY]` `frontend/src/app/dashboard/page.tsx`, `frontend/src/lib/api.ts`
  * `[RENAME]` `frontend/src/app/dashboard/tickets/id` ➔ `frontend/src/app/dashboard/tickets/[id]`

---

## 7. Commit `a149972` — `feat: adaptacion de interfaz y flujos por roles de agente y administrador`
* **Autor:** Leon
* **Fecha:** 2026-09-09 21:08:29 -0400
* **Resumen:** Segmentación integral de permisos, vistas y funcionalidades entre roles **Agente** y **Administrador**.
* **Detalles Técnicos:**
  * **Agente:** Pestañas de filtrado rápido (*Mis Tickets*, *Sin Asignar*, *Todos*), acción de auto-asignación rápida con 1 clic en la tabla y editor de respuesta al cliente.
  * **Administrador:** Métricas avanzadas, auditoría y filtrado por agente, reasignación dinámica de tickets y reintento de IA.
  * **Módulo de Usuarios:** Creación de [`/dashboard/users`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/dashboard/users/page.tsx) y [`UserModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/UserModal.tsx) con CRUD completo de agentes y administradores (`/api/users`).
  * **Resiliencia IA:** Endpoint `POST /api/tickets/:id/retry` para reintentar el procesamiento de n8n.
  * Configuración de ejecución concurrente con `concurrently` en `package.json`.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/dashboard/users/page.tsx`, `frontend/src/components/UserModal.tsx`
  * `[NEW]` `backend/src/controllers/user.controller.ts`, `backend/src/routes/user.routes.ts`
  * `[MODIFY]` `frontend/src/app/dashboard/page.tsx`, `frontend/src/components/TicketDetailModal.tsx`, `backend/src/controllers/ticket.controller.ts`, `backend/src/routes/ticket.routes.ts`, `backend/src/app.ts`, `backend/prisma/seed.ts`, `package.json`

---

## 8. Commit `c63867f` — `Fix tsconfig outDir and rootDir for Render build`
* **Autor:** Leon
* **Fecha:** 2026-09-09 22:20:34 -0400
* **Resumen:** Ajustes en la configuración de TypeScript del backend para garantizar la compilación en plataformas de despliegue en la nube (Render / CI/CD).
* **Detalles Técnicos:**
  * Corrección de `outDir` (`dist`) y `rootDir` (`src`) en `backend/tsconfig.json`.
  * Optimización de scripts de build en `backend/package.json`.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/tsconfig.json`, `backend/package.json`

---

## 9. Commit `8e8958f` — `feat: configurar CORS para Vercel e integracion con Neon`
* **Autor:** Leon
* **Fecha:** 2026-09-09 23:24:43 -0400
* **Resumen:** Integración con la plataforma de base de datos **Neon Postgres** y configuración de políticas CORS para despliegues en Vercel.
* **Detalles Técnicos:**
  * Configuración de CORS en Express para permitir peticiones seguras desde `https://crazy-support-hub.vercel.app` y puertos locales (`3000`, `3001`) con `credentials: true`.
  * Integración de paquetes oficiales `@neon/config` y `@neon/env`.
  * Adición de skills y guías de desarrollo de Neon en `.agents/skills`.
* **Archivos Afectados:**
  * `[NEW]` `neon.ts`, `.agents/skills/neon/*`
  * `[MODIFY]` `backend/src/app.ts`, `.gitignore`, `package.json`, `frontend/package.json`, `pnpm-lock.yaml`

---

## 10. Commit `16e44a0` — `feat(frontend): add apiFetch helper for Server Components in api.ts`
* **Autor:** Leon
* **Fecha:** 2026-09-09 23:36:09 -0400
* **Resumen:** Incorporación de un cliente HTTP nativo para Server Components en Next.js.
* **Detalles Técnicos:**
  * Adición del helper genérico `apiFetch<T>()` basado en la API nativa de `fetch` con soporte de caching (`cache`, `next.revalidate`).
  * Centralización de `BASE_URL` a través de la variable `NEXT_PUBLIC_API_URL`.
  * Manejo estandarizado de respuestas sin contenido (`204 No Content`) y parseo seguro de mensajes de error JSON.
* **Archivos Afectados:**
  * `[MODIFY]` `frontend/src/lib/api.ts`

---

## 11. Commit `05878ae` — `fix(backend): fix prisma seed script and add default test users and tickets`
* **Autor:** Leon
* **Fecha:** 2026-09-10 01:27:35 -0400
* **Resumen:** Corrección y robustecimiento del script de siembra (*seed*) de Prisma para la base de datos PostgreSQL.
* **Detalles Técnicos:**
  * Uso de operaciones `upsert` para evitar duplicación de usuarios por correo electrónico.
  * Creación de usuarios con contraseñas encriptadas mediante `bcrypt`.
  * Creación de un conjunto de tickets de prueba con metadatos de IA completados (`billing`, `technical`, `account`) para pruebas inmediatas.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/prisma/seed.ts`, `backend/package.json`

---

## 12. Commit `0754539` — `feat(backend): support dynamic vercel domains and FRONTEND_URL in CORS`
* **Autor:** Leon
* **Fecha:** 2026-09-10 01:34:42 -0400
* **Resumen:** Soporte dinámico para orígenes CORS generados por Vercel Preview y entornos de producción.
* **Detalles Técnicos:**
  * Implementación de validación por función/regex en CORS para permitir URLs dinámicas de previsualización de Vercel (`*.vercel.app`) y la variable `process.env.FRONTEND_URL`.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/app.ts`

---

## 13. Commit `c59bc78` — `feat(backend): support n8n shared secret in auth middleware and enrich endpoints`
* **Autor:** Leon
* **Fecha:** 2026-09-10 02:20:55 -0400
* **Resumen:** Blindaje de seguridad en la comunicación asíncrona entre el backend y n8n mediante secreto compartido.
* **Detalles Técnicos:**
  * Soporte de verificación de cabeceras seguras `x-callback-secret` y `x-n8n-secret` tanto en el middleware [`authenticateToken`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/middlewares/auth.middleware.ts) como en el controlador [`enrichTicket`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts).
  * Rechazo inmediato con `401 Unauthorized` si la petición no incluye el secreto compartido (`N8N_CALLBACK_SECRET`).
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/controllers/ticket.controller.ts`
  * `[MODIFY]` `backend/src/middlewares/auth.middleware.ts`
  * `[MODIFY]` `backend/src/routes/ticket.routes.ts`

---

## 14. Commit `1d4edf0` — `fix(backend): safely map priority and category from Spanish or free-text AI outputs in enrichTicket`
* **Autor:** Leon
* **Fecha:** 2026-09-10 02:29:13 -0400
* **Resumen:** Normalización y mapeo tolerante a fallos para respuestas de Gemini / LLM en lenguaje natural o español.
* **Detalles Técnicos:**
  * Implementación de las funciones de sanitización [`parsePriority`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts#L161-L168) y [`parseCategory`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts#L170-L176).
  * Mapeo semántico de términos comunes (*"urgente"*, *"facturación"*, *"error"*, *"cuenta"*) a los valores estrictos del enum de PostgreSQL (`urgent`, `high`, `billing`, `technical`, etc.).
  * Prevención de excepciones de Prisma ante clasificaciones no coincidentes devolviendo valores seguros por defecto.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/controllers/ticket.controller.ts`
