# 📋 Reporte Cronológico y Auditoría Técnica — CrazySupportHub

Auditoría detallada de cada commit en el repositorio **CrazySupportHub**, desglosando las tareas realizadas **manualmente** por el desarrollador y las asistidas/generadas con **Inteligencia Artificial (IA)**.

---

## 1. Commit `a188290` — `first commit`
* **Autor:** Leon | **Fecha:** 2026-09-07 13:06:43 -0400
* **Resumen:** Inicialización del repositorio Git local y conexión con el origen remoto en GitHub.
* **✋ Hecho a mano:**
  * Creación del repositorio en GitHub (`Barkard/CrazySupportHub`).
  * Ejecución de comandos Git (`git init`, `git branch -M main`, `git remote add origin`).
* **🤖 Hecho con IA:**
  * Ninguno (commit puramente administrativo).
* **Archivos Afectados:**
  * `[NEW]` `README.md`

---

## 2. Commit `f7d7a6a` — `feat(backend): setup inicial del backend`
* **Autor:** Leon | **Fecha:** 2026-09-07 21:09:04 -0400
* **Resumen:** Configuración base del backend en Node.js con Express, TypeScript y Prisma ORM para PostgreSQL.
* **✋ Hecho a mano:**
  * Inicialización del package con `pnpm init` e instalación manual de paquetes (`@prisma/client`, `bcrypt`, `cors`, `dotenv`, `express`, `jsonwebtoken`, `typescript`, etc.).
  * Ejecución de comandos CLI de Prisma: `pnpm exec prisma init` y `pnpm exec prisma migrate dev --name init`.
  * Creación y configuración de base de datos local y archivo `.env`.
* **🤖 Hecho con IA:**
  * Diseño y redacción de [`backend/prisma/schema.prisma`](file:///home/kevin/Documentos/CrazySupportHub/backend/prisma/schema.prisma) (modelos `User` y `Ticket`, enums `Role`, `TicketStatus`, `Priority`, `Category`, `EnrichmentStatus`).
  * Creación de [`backend/prisma/seed.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/prisma/seed.ts) y [`tickets-seed.json`](file:///home/kevin/Documentos/CrazySupportHub/tickets-seed.json).
  * Arquitectura modular en Express: servidor HTTP ([`server.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/server.ts)), configuración de Express ([`app.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/app.ts)) y singleton de Prisma ([`prisma.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/config/prisma.ts)).
  * Implementación del controlador de autenticación ([`auth.controller.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/auth.controller.ts)), rutas ([`auth.routes.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/routes/auth.routes.ts)) y middleware JWT ([`auth.middleware.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/middlewares/auth.middleware.ts)).
  * Definición de tipos personalizados de Express ([`express.d.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/types/express.d.ts)) para `req.user`.
* **Archivos Afectados:**
  * `[NEW]` `backend/prisma/schema.prisma`, `backend/prisma/seed.ts`, `backend/prisma/migrations/20260907203549_init/migration.sql`
  * `[NEW]` `backend/src/app.ts`, `backend/src/server.ts`, `backend/src/config/prisma.ts`
  * `[NEW]` `backend/src/controllers/auth.controller.ts`, `backend/src/routes/auth.routes.ts`, `backend/src/middlewares/auth.middleware.ts`
  * `[NEW]` `backend/src/types/express.d.ts`, `backend/tsconfig.json`, `backend/package.json`, `tickets-seed.json`

---

## 3. Commit `1652055` — `feat(backend): implementar endpoints de tickets, integracion n8n y correcciones TypeScript`
* **Autor:** Leon | **Fecha:** 2026-09-07 22:47:36 -0400
* **Resumen:** Implementación del CRUD de tickets, servicio asíncrono hacia webhook de n8n y corrección de compatibilidad ESM/NodeNext.
* **✋ Hecho a mano:**
  * Creación y activación de la cuenta / instancia en n8n Cloud y configuración del workflow receptor del webhook.
  * Pruebas de conectividad manual con Postman / curl al endpoint de tickets.
* **🤖 Hecho con IA:**
  * Implementación de [`backend/src/services/n8n.service.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/services/n8n.service.ts) con llamada HTTP `POST` no bloqueante mediante Axios y timeout de 5s.
  * Desarrollo del controlador [`ticket.controller.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts) con métodos `getTickets`, `getTicketById`, `createTicket`, `updateTicket` y `enrichTicket`.
  * Definición de rutas en [`ticket.routes.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/routes/ticket.routes.ts).
  * Resolución de errores de tipos ESM (`verbatimModuleSyntax`, extensión `.js` en imports y `import type`).
* **Archivos Afectados:**
  * `[NEW]` `backend/src/services/n8n.service.ts`, `backend/src/controllers/ticket.controller.ts`, `backend/src/routes/ticket.routes.ts`
  * `[MODIFY]` `backend/src/app.ts`, `.gitignore`, `package.json`, `pnpm-lock.yaml`

---

## 4. Commit `5231f66` — `feat(frontend): setup Next.js app, Axios client, AuthContext and Login page`
* **Autor:** Leon | **Fecha:** 2026-09-07 23:42:47 -0400
* **Resumen:** Creación y configuración inicial de la aplicación Next.js con Tailwind CSS, contexto de autenticación y pantalla de Login.
* **✋ Hecho a mano:**
  * Creación del proyecto frontend con `pnpm create next-app frontend` e instalación de dependencias (`axios`, `lucide-react`, etc.).
  * Verificación visual del renderizado de la pantalla de inicio de sesión en el navegador.
* **🤖 Hecho con IA:**
  * Creación de [`frontend/src/context/AuthContext.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/context/AuthContext.tsx) con persistencia en `localStorage`, funciones `login`, `logout` y manejo de estado de sesión.
  * Configuración del cliente Axios centralizado en [`frontend/src/lib/api.ts`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/lib/api.ts) con interceptores para inyectar token JWT Bearer y redirección automática en 401.
  * Maquetación y diseño de la interfaz de Login moderna ([`login/page.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/login/page.tsx)) con validación de credenciales y efectos visuales de carga.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/layout.tsx`, `frontend/src/app/page.tsx`, `frontend/src/app/login/page.tsx`, `frontend/src/context/AuthContext.tsx`, `frontend/src/lib/api.ts`
  * `[NEW]` `frontend/package.json`, `frontend/tsconfig.json`, `frontend/next.config.ts`, `frontend/postcss.config.mjs`

---

## 5. Commit `3484f7e` — `feat(frontend): implement Dashboard, New Ticket form and Ticket Detail view with AI reply integration`
* **Autor:** Leon | **Fecha:** 2026-09-07 23:50:53 -0400
* **Resumen:** Creación del panel de control (Dashboard), formulario de nuevo ticket y visualizador de respuestas sugeridas por IA.
* **✋ Hecho a mano:**
  * Pruebas de integración de extremo a extremo enviando tickets desde la interfaz y observando el disparo en n8n.
* **🤖 Hecho con IA:**
  * Desarrollo de [`dashboard/page.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/dashboard/page.tsx) con tarjetas estadísticas (Total, Abiertos, En Progreso, Resueltos), filtros por estado y tabla de tickets.
  * Formulario de creación de ticket (`dashboard/tickets/new/page.tsx`).
  * Vista de detalle del ticket (`dashboard/tickets/id/page.tsx`) mostrando badges de prioridad, categoría, tags y caja de respuesta sugerida por IA con botón de copiar al portapapeles.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/dashboard/page.tsx`, `frontend/src/app/dashboard/tickets/new/page.tsx`, `frontend/src/app/dashboard/tickets/id/page.tsx`
  * `[MODIFY]` `backend/pnpm-lock.yaml`, `tickets-seed.json`

---

## 6. Commit `e933d7b` — `fix(frontend): changes views to modals`
* **Autor:** Leon | **Fecha:** 2026-09-08 00:04:22 -0400
* **Resumen:** Optimización de UX: migración del flujo de navegación basado en páginas a modales superpuestos interactivos.
* **✋ Hecho a mano:**
  * Definición del requerimiento de diseño para evitar recargas completas de pantalla y mejorar la fluidez de trabajo de los agentes.
* **🤖 Hecho con IA:**
  * Construcción de [`CreateTicketModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/CreateTicketModal.tsx) con backdrop blur, cierre con tecla `Escape` y animación de entrada.
  * Construcción de [`TicketDetailModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/TicketDetailModal.tsx) con soporte para cambio de estado rápido, edición de respuestas y copia de sugerencia de IA.
  * Actualización del dashboard para invocar los modales manteniendo sincronizada la lista de tickets.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/components/CreateTicketModal.tsx`, `frontend/src/components/TicketDetailModal.tsx`
  * `[MODIFY]` `frontend/src/app/dashboard/page.tsx`, `frontend/src/lib/api.ts`
  * `[RENAME]` `frontend/src/app/dashboard/tickets/id` ➔ `frontend/src/app/dashboard/tickets/[id]`

---

## 7. Commit `a149972` — `feat: adaptacion de interfaz y flujos por roles de agente y administrador`
* **Autor:** Leon | **Fecha:** 2026-09-09 21:08:29 -0400
* **Resumen:** Implementación de arquitectura basada en roles (RBAC) diferenciando vistas y acciones entre Agentes y Administradores.
* **✋ Hecho a mano:**
  * Definición de la matriz de permisos de negocio y pruebas con usuarios de ambos roles.
* **🤖 Hecho con IA:**
  * **Flujo Agente:** Pestañas de filtrado (*Mis Tickets*, *Sin Asignar*, *Todos*), botón de auto-asignación rápida y editor directo de resolución de ticket.
  * **Flujo Admin:** Métricas de auditoría, selector de reasignación manual de agente a cualquier ticket y botón para forzar reintento de IA.
  * **Módulo de Usuarios:** Creación de [`/dashboard/users`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/app/dashboard/users/page.tsx) y [`UserModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/UserModal.tsx) para crear, editar roles y contraseñas.
  * **Backend:** Endpoints de usuarios (`GET`, `POST`, `PATCH`, `DELETE` en `/api/users`) protegidos por `requireRole([Role.admin])` y endpoint `POST /api/tickets/:id/retry`.
  * Configuración de script unificado en `package.json` mediante `concurrently`.
* **Archivos Afectados:**
  * `[NEW]` `frontend/src/app/dashboard/users/page.tsx`, `frontend/src/components/UserModal.tsx`
  * `[NEW]` `backend/src/controllers/user.controller.ts`, `backend/src/routes/user.routes.ts`
  * `[MODIFY]` `frontend/src/app/dashboard/page.tsx`, `frontend/src/components/TicketDetailModal.tsx`, `backend/src/controllers/ticket.controller.ts`, `backend/src/routes/ticket.routes.ts`, `package.json`

---

## 8. Commit `c63867f` — `Fix tsconfig outDir and rootDir for Render build`
* **Autor:** Leon | **Fecha:** 2026-09-09 22:20:34 -0400
* **Resumen:** Ajustes de compilación de TypeScript para despliegue en entornos Serverless / PaaS.
* **✋ Hecho a mano:**
  * Diagnóstico de error en los logs del pipeline de compilación de Render.
* **🤖 Hecho con IA:**
  * Corrección de `outDir: "./dist"` y `rootDir: "./src"` en `backend/tsconfig.json`.
  * Corrección de paths en `backend/package.json` (`main: "dist/server.js"` y script `start: "node dist/server.js"`).
* **Archivos Afectados:**
  * `[MODIFY]` `backend/tsconfig.json`, `backend/package.json`

---

## 9. Commit `8e8958f` — `feat: configurar CORS para Vercel e integracion con Neon`
* **Autor:** Leon | **Fecha:** 2026-09-09 23:24:43 -0400
* **Resumen:** Integración con la nube de Neon Serverless Postgres y configuración de políticas de acceso CORS.
* **✋ Hecho a mano:**
  * Aprovisionamiento del proyecto y base de datos en Neon Console (`ep-still-mountain-ay65imri`).
  * Creación del proyecto en Vercel para el Frontend.
* **🤖 Hecho con IA:**
  * Configuración de CORS en [`backend/src/app.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/app.ts) permitiendo orígenes de Vercel y locales con soporte de credenciales.
  * Integración de dependencias `@neon/config`, `@neon/env` y archivo [`neon.ts`](file:///home/kevin/Documentos/CrazySupportHub/neon.ts).
* **Archivos Afectados:**
  * `[NEW]` `neon.ts`, `.agents/skills/neon/*`
  * `[MODIFY]` `backend/src/app.ts`, `.gitignore`, `package.json`, `frontend/package.json`, `pnpm-lock.yaml`

---

## 10. Commit `16e44a0` — `feat(frontend): add apiFetch helper for Server Components in api.ts`
* **Autor:** Leon | **Fecha:** 2026-09-09 23:36:09 -0400
* **Resumen:** Implementación de utilitario HTTP compatible con React Server Components (RSC) y Server-Side Rendering (SSR).
* **✋ Hecho a mano:**
  * Identificación de la necesidad de realizar llamadas HTTP desde el servidor de Next.js sin depender de APIs de navegador (`window` o `localStorage`).
* **🤖 Hecho con IA:**
  * Creación de la función genérica `apiFetch<T>()` en [`frontend/src/lib/api.ts`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/lib/api.ts) basada en el `fetch` nativo de Node.js/Next.js con opciones de revalidación (`next.revalidate`).
  * Estandarización del manejo de respuestas vacías (`204`) y parseo seguro de mensajes de error de la API.
* **Archivos Afectados:**
  * `[MODIFY]` `frontend/src/lib/api.ts`

---

## 11. Commit `05878ae` — `fix(backend): fix prisma seed script and add default test users and tickets`
* **Autor:** Leon | **Fecha:** 2026-09-10 01:27:35 -0400
* **Resumen:** Robustecimiento del script de siembra para prevenir duplicados y garantizar persistencia en Neon.
* **✋ Hecho a mano:**
  * Ejecución del script de seed contra la base de datos de Neon y validación de usuarios en Prisma Studio.
* **🤖 Hecho con IA:**
  * Refactorización de [`backend/prisma/seed.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/prisma/seed.ts) utilizando operaciones `upsert` idempotentes.
  * Encriptación de contraseñas con `bcrypt.hash` (salting factor 10).
  * Poblado de tickets con estados realistas de IA (`billing`, `technical`, `account`).
* **Archivos Afectados:**
  * `[MODIFY]` `backend/prisma/seed.ts`, `backend/package.json`

---

## 12. Commit `0754539` — `feat(backend): support dynamic vercel domains and FRONTEND_URL in CORS`
* **Autor:** Leon | **Fecha:** 2026-09-10 01:34:42 -0400
* **Resumen:** Soporte dinámico de dominios de preview y producción de Vercel en la política de CORS.
* **✋ Hecho a mano:**
  * Despliegue de ramas de previsualización en Vercel y detección de bloqueos de CORS en dominios con hash aleatorio (`*.vercel.app`).
* **🤖 Hecho con IA:**
  * Implementación de una función callback dinámica en el middleware de CORS de [`backend/src/app.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/app.ts) que evalúa expresiones regulares para aceptar cualquier subdominio de Vercel de forma segura.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/app.ts`

---

## 13. Commit `c59bc78` — `feat(backend): support n8n shared secret in auth middleware and enrich endpoints`
* **Autor:** Leon | **Fecha:** 2026-09-10 02:20:55 -0400
* **Resumen:** Blindaje de seguridad en los webhooks de callback de n8n mediante cabecera de secreto compartido.
* **✋ Hecho a mano:**
  * Configuración del header `x-callback-secret` en el nodo HTTP Request del workflow de n8n con el valor de `N8N_CALLBACK_SECRET`.
* **🤖 Hecho con IA:**
  * Implementación de doble capa de validación del secreto compartido en [`authenticateToken`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/middlewares/auth.middleware.ts) y en [`enrichTicket`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts).
  * Rechazo de peticiones no autorizadas con código `401 Unauthorized` si no coincide con `process.env.N8N_CALLBACK_SECRET`.
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/controllers/ticket.controller.ts`, `backend/src/middlewares/auth.middleware.ts`, `backend/src/routes/ticket.routes.ts`

---

## 14. Commit `1d4edf0` — `fix(backend): safely map priority and category from Spanish or free-text AI outputs in enrichTicket`
* **Autor:** Leon | **Fecha:** 2026-09-10 02:29:13 -0400
* **Resumen:** Normalizador semántico para respuestas de clasificación de IA generadas en español o texto libre.
* **✋ Hecho a mano:**
  * Pruebas con Gemini en n8n observando que el modelo a veces responde con palabras en español como *"urgente"*, *"técnico"* o *"facturación"*.
* **🤖 Hecho con IA:**
  * Creación de las funciones auxiliares [`parsePriority`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts#L161-L168) y [`parseCategory`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts#L170-L176).
  * Mapeo inteligente con lista blanca de palabras clave en español e inglés hacia los enums estrictos de PostgreSQL (`Priority`, `Category`).
* **Archivos Afectados:**
  * `[MODIFY]` `backend/src/controllers/ticket.controller.ts`

---

## 15. Commit `a804525` — `feat: permitir asignacion de agente al crear ticket en el modal para administradores`
* **Autor:** Leon | **Fecha:** 2026-09-10 20:06:19 -0400
* **Resumen:** Asignación directa de agente en el momento de creación del ticket exclusiva para usuarios administradores.
* **✋ Hecho a mano:**
  * Solicitud del requerimiento funcional para optimizar el flujo de triaje inicial desde la creación.
  * Pruebas funcionales con usuarios `admin` y `agent` verificando la visibilidad condicional del selector.
* **🤖 Hecho con IA:**
  * Actualización de [`backend/src/controllers/ticket.controller.ts:createTicket`](file:///home/kevin/Documentos/CrazySupportHub/backend/src/controllers/ticket.controller.ts#L57-L88) para recibir el parámetro opcional `assignedTo` y persistir la relación con `creator` y `assignee`.
  * Modificación de [`frontend/src/components/CreateTicketModal.tsx`](file:///home/kevin/Documentos/CrazySupportHub/frontend/src/components/CreateTicketModal.tsx) para consultar la lista de usuarios (`/api/users`) si el rol es `admin` y renderizar el selector estilizado.
  * Actualización del dataset completo de prueba en [`tickets-seed.json`](file:///home/kevin/Documentos/CrazySupportHub/tickets-seed.json) y script [`seed.ts`](file:///home/kevin/Documentos/CrazySupportHub/backend/prisma/seed.ts) con 12 tickets y 4 usuarios oficiales.
* **Archivos Afectados:**
  * `[MODIFY]` `frontend/src/components/CreateTicketModal.tsx`, `backend/src/controllers/ticket.controller.ts`
  * `[MODIFY]` `backend/prisma/seed.ts`, `tickets-seed.json`, `README.md`
