# Fase 1 — Registro de Arquitectura, Contratos y Seguridad

Fecha: 2026-10-13  
Responsable: Agente Coordinador  
Referencias: [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), [ADR_STACK_ARQUITECTURA.md](ADR_STACK_ARQUITECTURA.md), [CONTRATOS_INTERFACES.md](CONTRATOS_INTERFACES.md), [MODELO_TURNOS_CONCURRENCIA.md](MODELO_TURNOS_CONCURRENCIA.md), [THREAT_MODEL.md](THREAT_MODEL.md).

---

## 1. Objetivo y Alcance de la Fase
Definir la arquitectura base, la comparación y elección del stack técnico, los contratos formales de las operaciones públicas y administrativas, el mecanismo atómico de concurrencia para evitar la doble reserva, y el modelado exhaustivo de amenazas (Threat Model) antes de inicializar el código fuente.

---

## 2. Archivos Creados y Modificados
* [`docs/ADR_STACK_ARQUITECTURA.md`](ADR_STACK_ARQUITECTURA.md): Registro de decisiones arquitectónicas (Next.js App Router, PostgreSQL / transacciones atómicas, omisión de CMS externo, motor propio de reservas).
* [`docs/CONTRATOS_INTERFACES.md`](CONTRATOS_INTERFACES.md): Contratos de entrada y salida, esquemas Zod de validación estricta, matriz de autorización y manejo de errores.
* [`docs/MODELO_TURNOS_CONCURRENCIA.md`](MODELO_TURNOS_CONCURRENCIA.md): Algoritmo de cálculo de disponibilidad horaria y mecanismo atómico en base de datos (`EXCLUDE USING gist` en PostgreSQL / `BEGIN IMMEDIATE` en SQLite) para eliminar condiciones de carrera.
* [`docs/THREAT_MODEL.md`](THREAT_MODEL.md): Mapa de límites de confianza, análisis STRIDE, matriz de riesgos, controles preventivos y políticas de privacidad/minimización.
* [`docs/FASE_1_ARQUITECTURA.md`](FASE_1_ARQUITECTURA.md): Registro oficial de cierre de Fase 1.

---

## 3. Decisiones y Motivos
1. **Next.js (App Router + Server Actions con `useActionState`):** Permite renderizado del lado del servidor para SEO local y Server Actions que validan de forma autoritativa en el backend sin depender del cliente. Se descartó SvelteKit en esta etapa por mayor madurez de ecosistema en TypeScript y Server Actions con Zod.
2. **PostgreSQL con Restricciones Atómicas de Rango:** Se descartó Firebase Firestore debido a la dificultad para garantizar que dos reservas simultáneas no colisionen sin sobrecargar transacciones documentales. Se eligió persistencia relacional con capacidades de exclusión horaria.
3. **Omisión de Headless CMS:** Se evaluaron Contentful, Sanity y Strapi. Para un local con dos servicios base, un CMS externo añade costos innecesarios, latencia y complejidad de mantenimiento. La administración se realizará desde un panel integrado.
4. **Motor de Reservas Propio:** En lugar de Calendly o Square Appointments, permite total soberanía de datos personales (PII) bajo legislación argentina y adaptación a promociones con bebida.

---

## 4. Skills Invocadas y Disponibilidad
* **Invocadas:**
  - `find-docs` (junto con CLI `ctx7`): Se ejecutó la resolución de librerías y consulta de documentación oficial para `/vercel/next.js` (Server Actions con `useActionState` y Zod) y `/supabase/supabase` (transacciones atómicas y RPC con rollback ante excepciones).
* **Disponibles pero no requeridas en esta fase:**
  - `frontend-design`: Se utilizará en la Fase 2 al construir las vistas y componentes UI.
* **No disponibles en el catálogo:**
  - Skill específica de seguridad (se mitigó aplicando las pautas formales de OWASP y NIST referenciadas en el README).

---

## 5. Verificaciones Ejecutadas y Resultados
* **Context7 CLI:**
  - `npx ctx7@latest library "Next.js" "Server Actions and form submission"` -> ID resuelto: `/vercel/next.js` (Score 91.34).
  - `npx ctx7@latest docs /vercel/next.js "Server Actions form handling with useActionState"` -> Verificados ejemplos canónicos de validación de servidor con `useActionState` y Zod.
  - `npx ctx7@latest library "Supabase" "database transactions and concurrency"` -> ID resuelto: `/supabase/supabase` (Score 85.32).
  - `npx ctx7@latest docs /supabase/supabase "call Postgres function rpc transaction"` -> Verificada atomicidad de llamadas RPC que revierten operaciones en fallos.
* **Consistencia de Contratos:** Los esquemas Zod garantizan que ningún campo manipulado por el cliente determine precio o duración.

---

## 6. Riesgos, Supuestos y Decisiones Abiertas con Dueño
* **Cerveza y legislación argentina:** La cerveza Brahma permanece como opción de catálogo para el prototipo pero inhabilitada para reservas reales hasta confirmación legal. Dueño: Responsable del negocio.
* **Duración definitiva del combo:** Se asumieron provisionalmente 45 minutos para pruebas. Dueño: Responsable del negocio.
* **Canal de notificación:** Al solicitar teléfono en lugar de correo, el envío de recordatorios queda deshabilitado en el MVP hasta definir proveedor (WhatsApp/SMS). Dueño: Responsable del negocio.

---

## 7. Próximo Paso y Criterio de Entrada a Fase 2
* **Fase 2:** Inicialización de la base técnica mínima (proyecto Next.js con Tailwind y TypeScript), configuración de persistencia de desarrollo y construcción del **flujo vertical público de reserva** (catálogo → selección de horario libre → formulario mínimo → persistencia atómica → confirmación con token de cancelación).
