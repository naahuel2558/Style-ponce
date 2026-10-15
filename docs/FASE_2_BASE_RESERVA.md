# Fase 2 — Registro de Base Técnica Mínima y Flujo Vertical Público de Reserva

Fecha: 2026-10-14  
Responsable: Agente Coordinador  
Referencias: [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), [FASE_1_ARQUITECTURA.md](FASE_1_ARQUITECTURA.md), [ADR_STACK_ARQUITECTURA.md](ADR_STACK_ARQUITECTURA.md).

---

## 1. Objetivo y Alcance de la Fase
Implementar la base técnica mínima en Next.js (App Router, Tailwind CSS v4, TypeScript) y construir el **flujo vertical público de reserva** completo y end-to-end:
Catálogo → Consulta de disponibilidad autoritativa en servidor → Selección de slot → Formulario de contacto mínimo (nombre y teléfono) → Persistencia y transacción atómica anti-colisión → Pantalla de confirmación con token de cancelación de un solo uso.

---

## 2. Archivos Creados y Modificados
* [`package.json`](../package.json): Inicialización de dependencias (`next@latest`, `react@latest`, `zod@latest`, `lucide-react`, `@tailwindcss/postcss`, `typescript`).
* [`src/types/booking.ts`](../src/types/booking.ts): Tipos y esquemas de validación Zod (`CreateBookingSchema`, `BookingResult`, `ServiceDefinition`, `AvailableSlot`).
* [`src/lib/catalog.ts`](../src/lib/catalog.ts): Catálogo oficial del servidor con precio confirmado para Corte Tradicional (ARS 10.000, 30 min) y precio provisional de demo para Combo Corte + Bebida (ARS 13.500, 45 min) con advertencia +18 para cerveza Brahma. Configuración horaria (`America/Argentina/Buenos_Aires`).
* [`src/lib/db.ts`](../src/lib/db.ts): Persistencia local basada en SQLite nativo (`node:sqlite`), sin dependencias binarias externas. Funciones autoritativas con transacciones atómicas inmediatas (`BEGIN IMMEDIATE TRANSACTION`) para prevención estricta de colisión / doble reserva, y hashing SHA-256 para tokens de cancelación.
* [`src/lib/seed.ts`](../src/lib/seed.ts): Semilla de turnos demostrativos para verificar slots ocupados en el prototipo.
* [`src/app/actions/booking.ts`](../src/app/actions/booking.ts): Server Actions seguras (`fetchAvailableSlotsAction`, `submitBookingAction`, `submitCancelAction`).
* [`src/components/BookingWizard.tsx`](../src/components/BookingWizard.tsx): Asistente de reserva interactivo por pasos (Servicio, Fecha/Hora con recarga reactiva de slots, Datos de contacto, Confirmación con enlace seguro de cancelación). Manejo explícito de colisión horaria (`SLOT_OCCUPIED`).
* [`src/app/page.tsx`](../src/app/page.tsx): Portada con Hero visual, presentación de servicios, precios en ARS y el componente `BookingWizard`.
* [`src/app/cancelar/page.tsx`](../src/app/cancelar/page.tsx) y [`CancelForm.tsx`](../src/app/cancelar/CancelForm.tsx): Flujo de autogestión para verificar estado y cancelar el turno mediante el token seguro.
* [`scripts/test-phase2.ts`](../scripts/test-phase2.ts): Suite completa de tests automatizados.

---

## 3. Decisiones y Motivos
1. **Validación autoritativa en servidor:** El precio y la duración jamás se leen de la petición del cliente; se inyectan en la transacción directamente desde `SERVICES_CATALOG`.
2. **Atomicidad mediante `BEGIN IMMEDIATE`:** En SQLite, una transacción inmediata adquiere el lock de escritura desde el inicio de la verificación, impidiendo que otra petición paralela inserte una reserva en el mismo intervalo.
3. **Tokens de cancelación criptográficos no enumerables:** Se generan 24 bytes aleatorios (48 caracteres hex) devueltos al cliente; en base de datos solo se persiste el hash SHA-256. El reuso o adivinación es mitigado por diseño.
4. **Alerta y autorecuperación ante conflicto:** Si un horario es reservado justo antes de la confirmación (`SLOT_OCCUPIED`), el cliente recibe un mensaje claro de colisión y el sistema refresca automáticamente la grilla horaria sin borrar su nombre ni teléfono.

---

## 4. Skills Invocadas y Disponibilidad
* **Invocadas:**
  - `frontend-design`: Aplicada para la dirección de arte (paleta oscura premium `barber-dark`, acentos bronce/ámbar, tipografía sin jerga técnica, copywriting conversacional en español argentino).
* **Disponibles pero no requeridas en esta fase:**
  - `find-docs` (instalada en Fase 1 para consultas de Context7).
* **No disponibles en el catálogo:**
  - Skill de seguridad específica (mitigado con testing formal de colisiones y minimización de datos).

---

## 5. Verificaciones Ejecutadas y Resultados
1. **Compilación de Producción:**
   - Comando: `npm run build`
   - Resultado: **Exitoso (código 0)** con Turbopack. Rutas `/`, `/_not-found` y `/cancelar` compiladas correctamente.
2. **Suite de Pruebas Automatizadas (`scripts/test-phase2.ts`):**
   - Comando: `npx -y tsx scripts/test-phase2.ts`
   - Resultado: **15 de 15 tests APROBADOS (0 fallados)**:
     - [PASS] Rechazo de nombres de 1 carácter.
     - [PASS] Rechazo de scripts / inyecciones en el nombre.
     - [PASS] Rechazo de teléfonos inválidos o cortos.
     - [PASS] Rechazo de servicios inexistentes.
     - [PASS] Rechazo de turnos en fechas pasadas (`PAST_TIME`).
     - [PASS] Creación exitosa de reserva normal (precio ARS 10.000 validado en servidor).
     - [PASS] Rechazo estricto de segundo turno en el mismo horario (`SLOT_OCCUPIED`).
     - [PASS] Rechazo estricto de turno con solapamiento parcial de horarios.
     - [PASS] Verificación en base de datos: solo se guarda el hash SHA-256 del token, nunca el token en claro.
     - [PASS] Cancelación exitosa mediante token válido.
     - [PASS] Rechazo de reuso de token ya cancelado.
     - [PASS] Rechazo seguro ante token inventado.
     - [PASS] Comprobación de que tras cancelar, el slot vuelve a quedar libre en la agenda.
3. **Verificación Visual E2E en Navegador (`browser_subagent`):**
   - Grabación generada: `reserva_turno_demo_1792012057867.webp`.
   - Flujo verificado: Navegación a `localhost:3000`, selección de Corte Tradicional, selección de fecha y horario libre (09:30 hs), ingreso de datos (Lautaro Rossi / 11 2345-6789), confirmación atómica y visualización del token de cancelación.

---

## 6. Riesgos, Supuestos y Decisiones Abiertas con Dueño
* **Cerveza Brahma:** Sigue rotulada con aviso para mayores de 18 años y delimitada al prototipo demo; requiere validación legal local antes de habilitarse comercialmente. Dueño: Responsable del negocio.
* **Proveedor de notificaciones externas:** No se conecta pasarela de SMS ni WhatsApp hasta acordar proveedor y costos. Dueño: Responsable del negocio.

---

## 7. Próximo Paso
* **Fase 3 — Panel administrativo protegido:** Implementación de autenticación de administrador (sesión segura vía cookies HTTP-only), grilla de turnos para el barbero, cancelación administrativa con motivo codificado y visualización de la agenda diaria.
