# 🚀 CrazySupportHub — Sistema de Soporte con Enriquecimiento por IA

**CrazySupportHub** es una plataforma de gestión de tickets de soporte técnico que integra automatización e Inteligencia Artificial mediante **n8n** y **Google Gemini (LLM)** para clasificar automáticamente incidencias (categoría, prioridad, tags) y generar sugerencias de respuestas contextuales en tiempo real.

---

## 🛠️ 1. Setup de las Tres Piezas (Frontend, Backend, n8n)

### Prerrequisitos
* **Node.js** >= 18.x
* **pnpm** (o npm / yarn)
* Base de datos **PostgreSQL** (local o en la nube mediante **Neon**)
* Instancia de **n8n** (Cloud o Self-Hosted con Docker)

---

### A. Backend (Node.js + Express + Prisma)

1. **Instalación:**
   ```bash
   cd backend
   pnpm install
   ```

2. **Variables de Entorno (`backend/.env`):**
   Crea un archivo `.env` dentro de la carpeta `backend/` con los siguientes valores:
   ```env
   PORT=3000
   DATABASE_URL="postgresql://usuario:contraseña@localhost:5432/crazysupporthub?sslmode=prefer"
   JWT_SECRET="secreto_super_seguro_para_jwt_crazysupporthub"
   N8N_WEBHOOK_URL="https://tu-instancia.app.n8n.cloud/webhook/ticket-created"
   N8N_CALLBACK_SECRET="secreto_compartido_para_n8n"
   ```

3. **Migraciones y Siembra de Datos (Seed):**
   ```bash
   # Generar cliente y aplicar migraciones en la BD
   pnpm exec prisma migrate dev --name init
   # o en producción/Neon: pnpm exec prisma migrate deploy

   # Poblar usuarios y tickets de prueba
   pnpm run seed
   ```

4. **Ejecutar en desarrollo:**
   ```bash
   pnpm dev
   # Servidor escuchando en http://localhost:3000
   ```

---

### B. Frontend (Next.js 16 + Tailwind CSS)

1. **Instalación:**
   ```bash
   cd frontend
   pnpm install
   ```

2. **Variables de Entorno (`frontend/.env.local`):**
   Crea un archivo `.env.local` dentro de la carpeta `frontend/`:
   ```env
   NEXT_PUBLIC_API_URL="http://localhost:3000/api"
   ```

3. **Ejecutar en desarrollo:**
   ```bash
   pnpm dev
   # Aplicación disponible en http://localhost:3001
   ```

---

### C. n8n (Flujo de Automatización con AI Agent y Gemini)

1. **Importar o Configurar Workflow en n8n:**
   * Se incluye el workflow exportado listo para importar en [`n8n/CrazySupportHubN8N.json`](n8n/CrazySupportHubN8N.json).
   * **Estructura de Nodos:**
     * **Nodo 1 (Webhook Trigger):**
       * **Method:** `POST`
       * **Path:** `webhook/ticket-created`
       * **Authentication:** Validación de cabecera `x-callback-secret`.
     * **Nodo 2 (AI Agent - `@n8n/n8n-nodes-langchain.agent`):**
       * **Tipo:** AI Agent de LangChain configurado en modo `define`.
       * **Prompt:** Recibe `{ title, description }` e instruye la clasificación en JSON estricto (`prioridad`, `clasificacion`, `solucion_propuesta`).
       * **Modelo Conectado (Google Gemini Chat Model - `@n8n/n8n-nodes-langchain.lmChatGoogleGemini`):** Conectado al AI Agent a través del puerto `ai_languageModel` (utilizando `models/gemini-3-flash-preview` o credenciales Google Gemini API).
     * **Nodo 3 (Parse Gemini Output - Code JavaScript):**
       * Procesa la respuesta generada por el AI Agent (`$json.output`), limpia posibles bloques markdown y estandariza las propiedades (`ticketId`, `priority`, `category`, `tags`, `suggestedReply`).
     * **Nodo 4 (HTTP Request - Callback de Enriquecimiento):**
       * **Method:** `POST`
       * **URL:** `http://<TU_BACKEND_HOST>/api/tickets/{{ $json.ticketId }}/enrich`
       * **Headers:**
         * `Content-Type`: `application/json`
         * `x-callback-secret`: `secreto_compartido_para_n8n`
       * **Body:** JSON con los campos enriquecidos para actualizar el ticket en la base de datos y disparar SSE.

---

### 🐳 D. Despliegue con Docker y Docker Compose (Producción)

CrazySupportHub incluye configuración de Dockerización multi-stage optimizada tanto para el Backend (Express + Prisma) como para el Frontend (Next.js Standalone).

1. **Configurar variables de entorno:**
   Copia la plantilla de variables en la raíz del proyecto:
   ```bash
   cp .env.example .env
   ```
   Edita `.env` con tu `DATABASE_URL` (Neon o local), `JWT_SECRET`, `N8N_WEBHOOK_URL` y `N8N_CALLBACK_SECRET`.

2. **Levantar todos los servicios en producción:**
   ```bash
   # Construir e iniciar contenedores en segundo plano
   docker compose up --build -d
   ```

3. **Verificación de servicios:**
   * **Frontend:** [http://localhost:3001](http://localhost:3001)
   * **Backend API & Healthcheck:** [http://localhost:3000/health](http://localhost:3000/health)

4. **Comandos útiles:**
   ```bash
   # Ver logs en tiempo real
   docker compose logs -f

   # Detener servicios
   docker compose down

   # Si prefieres una base de datos PostgreSQL local en contenedor (sin Neon):
   docker compose --profile local-db up -d
   ```

---

### ⚡ Ejecución Rápida Local (Sin Docker)
Desde la raíz del proyecto puedes correr ambos servicios simultáneamente:
```bash
pnpm install
pnpm dev
```

---

## 🧠 2. Decisiones Técnicas

* **Express con TypeScript vs. NestJS:** Se seleccionó **Express + TypeScript** por su ligereza, control explícito sobre middlewares y velocidad de arranque. NestJS introduce una sobrecarga considerable de boilerplate, inyección de dependencias y decoradores que resultaba innecesaria para el alcance ágil de este servicio, mientras que Express con ESM y tipado estricto ofrece una arquitectura minimalista, mantenible y de alto rendimiento.
* **Prisma ORM con PostgreSQL:** Se eligió **Prisma** debido a su seguridad de tipos (*end-to-end type safety*), autocompletado nativo y un sistema declarativo de esquemas (`schema.prisma`) que simplifica la creación de enums nativos de base de datos (`Priority`, `Category`, `EnrichmentStatus`) y migraciones reproducibles.
* **Modelado del Enriquecimiento de IA:** El pipeline de IA se modeló mediante una máquina de estados independiente (`EnrichmentStatus: pending | processing | done | failed`) y un timestamp `enrichedAt`, totalmente desacoplada del `TicketStatus` operativo (`open`, `in_progress`, `resolved`, `closed`). Los campos generados por IA (`priority`, `category`, `tags`, `suggestedReply`) son opcionales y se pueblan progresivamente tras la respuesta del webhook, evitando inconsistencias si el modelo tarda o falla.
* **Manejo del Estado Asíncrono en el Frontend:** Para optimizar la experiencia de usuario (UX) y evitar bloqueos:
  1. Al crear un ticket, el backend responde `201 Created` de inmediato y el modal se cierra al instante sin esperar la inferencia del LLM.
  2. Mientras el ticket está en `pending`/`processing`, la interfaz muestra micro-estados contextuales (placeholders interactivos y badges animados de *"En cola IA"* / *"IA analizando..."*) en lugar de pantallas congeladas o valores vacíos.
  3. Los agentes pueden auto-asignarse y trabajar manualmente en el ticket sin depender de la IA.
  4. Si el webhook falla, el estado pasa a `failed` y se habilita un botón de **"Reintentar IA"** (`POST /api/tickets/:id/retry`) para administradores.

---

## ⚠️ 3. Pendientes / Mejoras Futuras

1. **Cola de Mensajería con Reintentos Exponenciales (BullMQ / Redis):** Para entornos de alta concurrencia masiva, encolar los disparos a n8n en Redis garantizaría control de tasa (*rate-limiting*) y reintentos automáticos ante caídas prolongadas del webhook.
2. **Exportación Masiva de Reportes (PDF / Excel):** Generación de auditorías descargables con estadísticas de tiempo de respuesta y efectividad de respuestas sugeridas por IA.
3. **Notificaciones Push / Webhooks Salientes:** Notificar a canales de Slack o Discord cuando un ticket de prioridad `urgent` sea detectado por Gemini.

---

## 🤖 4. Transparencia y Uso de Inteligencia Artificial

Siguiendo el principio de honestidad y responsabilidad técnica, a continuación se documenta qué partes fueron diseñadas y ejecutadas **manualmente** por el desarrollador y cuáles fueron asistidas mediante **Inteligencia Artificial**:

### Resumen Global

| Área | ✋ Hecho a Mano (Humano) | 🤖 Hecho con Asistencia de IA |
| :--- | :--- | :--- |
| **Arquitectura & Diseño** | Definición del flujo asíncrono con n8n, modelo de permisos RBAC (Admin/Agente), estrategia de autenticación (JWT + Secreto M2M) y arquitectura de eventos en tiempo real (SSE). | Diagramación de interfaces y sugerencias de estructuración de esquemas relacionales. |
| **Infraestructura & Cloud** | Aprovisionamiento de base de datos en Neon, configuración de proyecto en Vercel, creación y configuración del workflow en n8n Cloud. | Configuración de scripts de build en `package.json` y `tsconfig.json` para entornos cloud. |
| **Backend & APIs** | Pruebas de integración manuales con Postman, validación de variables de entorno y lógica de negocio. | Código de controladores Express, middlewares JWT, parsing tolerante a fallos (`parsePriority`/`parseCategory`), stream de SSE y tipado TypeScript ESM. |
| **Frontend & UX** | Definición del flujo de modales, selección de paleta de colores y validación de experiencia de usuario. | Generación de componentes React/Next.js con Tailwind CSS, modales interactivos, listeners de `EventSource` (SSE) y cliente Axios con interceptores. |

---

### Desglose Detallado por Commit

1. **`a188290` (first commit):**
   * ✋ *Manual:* Inicialización de Git y vinculación al repositorio remoto en GitHub.
   * 🤖 *IA:* Ninguno.
2. **`f7d7a6a` (feat: setup inicial del backend):**
   * ✋ *Manual:* Ejecución de `pnpm init`, instalación de dependencias, `prisma init` y `prisma migrate dev`.
   * 🤖 *IA:* Redacción de `schema.prisma`, singleton de Prisma, controladores de autenticación (`auth.controller.ts`), middleware JWT y tipado de Express.
3. **`1652055` (feat: endpoints de tickets e integracion n8n):**
   * ✋ *Manual:* Configuración de Webhook en n8n Cloud y definición de URLs de callback.
   * 🤖 *IA:* Servicio asíncrono con Axios (`n8n.service.ts`), controlador `ticket.controller.ts` y resolución de compatibilidad ESM/NodeNext.
4. **`5231f66` (feat: setup Next.js, Axios y Login):**
   * ✋ *Manual:* Creación del workspace Next.js e instalación de librerías UI.
   * 🤖 *IA:* Contexto global de sesión (`AuthContext.tsx`), cliente Axios centralizado (`api.ts`) y maquetación de la pantalla de Login.
5. **`3484f7e` (feat: Dashboard, formulario y detalle de ticket):**
   * ✋ *Manual:* Pruebas de extremo a extremo de creación de tickets y visualización.
   * 🤖 *IA:* Componentes de métricas estadísticas, vista detallada del ticket y caja de visualización de respuesta sugerida por IA.
6. **`e933d7b` (fix: cambios de vistas a modales):**
   * ✋ *Manual:* Decisión de diseño de UX para optimizar la velocidad del agente mediante ventanas modales flotantes.
   * 🤖 *IA:* Creación de `CreateTicketModal.tsx` y `TicketDetailModal.tsx` con soporte de atajos de teclado (`Escape`) y backdrop blur.
7. **`a149972` (feat: adaptacion por roles de agente y admin):**
   * ✋ *Manual:* Definición de la matriz de permisos de soporte y diseño de flujo de auditoría.
   * 🤖 *IA:* Módulo `/dashboard/users` con CRUD de agentes, filtros por pestaña para el agente, autoasignación y endpoint de reintento `POST /api/tickets/:id/retry`.
8. **`c63867f` (Fix tsconfig outDir y rootDir):**
   * ✋ *Manual:* Detección del error en los logs de compilación de Render.
   * 🤖 *IA:* Ajuste de rutas de compilación `dist` y `src` en `tsconfig.json` y `package.json`.
9. **`8e8958f` (feat: CORS para Vercel e integracion Neon):**
   * ✋ *Manual:* Configuración del cluster en Neon Console y variables de entorno en Vercel.
   * 🤖 *IA:* Configuración de CORS con credenciales habilitadas y scripts de integración de Neon.
10. **`16e44a0` (feat: helper apiFetch para RSC):**
    * ✋ *Manual:* Identificación de la necesidad de llamadas seguras desde Server Components.
    * 🤖 *IA:* Implementación del helper tipado `apiFetch<T>()` sobre `fetch` nativo con manejo de cache.
11. **`05878ae` (fix: script seed y datos de prueba):**
    * ✋ *Manual:* Ejecución y prueba del seed contra Neon PostgreSQL.
    * 🤖 *IA:* Refactorización con `upsert` idempotente y generación de contraseñas hasheadas con `bcrypt`.
12. **`0754539` (feat: soporte de dominios dinamicos Vercel en CORS):**
    * ✋ *Manual:* Detección de bloqueos en URLs de Preview de Vercel (`*.vercel.app`).
    * 🤖 *IA:* Implementación de función regex en CORS para aceptar subdominios de Vercel de manera dinámica y segura.
13. **`c59bc78` (feat: secreto compartido para n8n):**
    * ✋ *Manual:* Configuración del header `x-callback-secret` en el nodo de n8n.
    * 🤖 *IA:* Doble capa de validación del secreto compartido en `authenticateToken` y `enrichTicket`.
14. **`1d4edf0` (fix: mapeo seguro de respuestas en espanol de IA):**
    * ✋ *Manual:* Detección en pruebas reales de que Gemini a veces respondía con enums en español (*"urgente"*, *"facturación"*).
    * 🤖 *IA:* Creación de `parsePriority` y `parseCategory` con diccionario semántico tolerante a fallos.
15. **`a804525` (feat: asignacion de agente al crear ticket para admin):**
    * ✋ *Manual:* Solicitud del requerimiento de asignación directa desde la creación.
    * 🤖 *IA:* Integración del selector en `CreateTicketModal.tsx` condicionado al rol `admin` y actualización del endpoint `POST /api/tickets`.
16. **`feat(sse): streaming en tiempo real con Server-Sent Events`:**
    * ✋ *Manual:* Definición del requerimiento de reactividad en tiempo real para evitar recargas manuales.
    * 🤖 *IA:* Implementación del servicio `sse.service.ts` con broadcast de eventos (`ticket_created`, `ticket_updated`), endpoint `/events/stream` y suscripción con `EventSource` en `DashboardPage` y `TicketDetailModal`.
17. **`feat: paginacion por lotes elegibles, ordenamiento y busqueda`:**
    * ✋ *Manual:* Solicitud del requerimiento de paginación por lotes seleccionables para optimizar el rendimiento de la base de datos y ordenamiento flexible de la tabla.
    * 🤖 *IA:* Soporte de paginación (`take`, `skip`), filtros de búsqueda y ordenamiento seguro en `ticket.controller.ts:getTickets`; maquetación de selector de lotes (5, 10, 20, 50, Todos), buscador en vivo, cabeceras interactivas con `ArrowUpDown` y barra de paginación completa en `DashboardPage.tsx`.
18. **`feat: registro de usuarios (rol agente), validaciones inline y codigos HTTP consistentes`:**
    * ✋ *Manual:* Definición del requerimiento de registro abierto con rol de agente por defecto, eliminación de `alert()` y exigencia de validaciones inline en los formularios.
    * 🤖 *IA:* Endpoint `POST /api/auth/register` con rol `Role.agent` forzado y respuesta `201 Created` / `409 Conflict`; estandarización exhaustiva de códigos HTTP (`400`, `401`, `403`, `404`, `409`, `500`); rediseño de `LoginPage.tsx` con tabs de Login/Registro y maquetación de validaciones inline directas en `CreateTicketModal.tsx` y `NewTicketPage.tsx`.
19. **`feat: dockerizacion y orquestacion con docker-compose para produccion`:**
    * ✋ *Manual:* Definición de la estrategia de empaquetado para despliegue de entrega en producción e integración de healthchecks.
    * 🤖 *IA:* Creación de `Dockerfile` multi-stage optimizado para Backend con sincronización de Prisma en `docker-entrypoint.sh`; `Dockerfile` multi-stage con output standalone para Next.js en Frontend; orquestación unificada en `docker-compose.yml`, perfiles de base de datos local y documentación de variables en `.env.example`.

---
