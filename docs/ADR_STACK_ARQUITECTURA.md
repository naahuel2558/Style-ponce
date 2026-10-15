# ADR 001 — Elección de Stack y Arquitectura Técnica

Fecha: 2026-10-13  
Estado: Aprobado para prototipo y desarrollo MVP  
Contexto y referencias: [README.md](../README.md), [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), [FASE_0_DECISIONES.md](FASE_0_DECISIONES.md). Consultas realizadas vía Context7 (`/vercel/next.js`, `/supabase/supabase`).

---

## 1. Contexto del Problema
Se requiere construir una aplicación web para la reserva de turnos en una peluquería (MVP para un solo local y un único profesional/administrador en Argentina, `America/Argentina/Buenos_Aires`). El sistema debe ofrecer SEO local, carga rápida móvil, interfaz dinámica y reactiva, y sobre todo **consistencia autoritativa en el servidor** para impedir turnos duplicados o colisiones horarias bajo concurrencia.

---

## 2. Decisiones y Comparativas

### A. Framework de Aplicación: Next.js (App Router, TypeScript)
* **Opciones evaluadas:** Next.js (React) vs. SvelteKit.
* **Criterios:** SSR/SSG para indexación y SEO local, validación autoritativa en servidor, gestión de mutaciones atómicas, adopción y ecosistema de tooling.
* **Análisis:**
  - SvelteKit ofrece un runtime ligero y excelente reactividad, pero el ecosistema de componentes UI, bibliotecas de animación controlada y documentación de integraciones de backend en TypeScript para turnos es menor.
  - Next.js (App Router) permite Server Components para catálogo y SEO estático con revalidación, y Server Actions (`useActionState` según documentación verificada en `/vercel/next.js`) con validación de esquemas (Zod) ejecutada exclusivamente en el servidor.
* **Decisión:** **Next.js (App Router + TypeScript)** desplegado como una unidad modular y autónoma (sin microservicios innecesarios).

---

### B. Base de Datos y Persistencia: PostgreSQL (Supabase / Postgres relacional)
* **Opciones evaluadas:** Supabase (PostgreSQL) vs. Firebase Firestore vs. SQLite local en desarrollo.
* **Criterios:** Manejo de transacciones ACID, restricciones relacionales de exclusión horaria (`tstzrange` / exclusion constraints), prevención nativa de doble reserva sin condiciones de carrera.
* **Análisis:**
  - Firebase Firestore (NoSQL) requiere transacciones documentales manuales con contención compleja y no soporta restricciones de solapamiento de rangos a nivel de esquema.
  - PostgreSQL proporciona soporte nativo para transacciones atómicas y funciones RPC (verificadas en `/supabase/supabase`) donde un `raise exception` aborta la transacción y revierte cualquier inserción previa de forma atómica.
* **Decisión:** **PostgreSQL** (compatible con Supabase o Postgres local/contenedor para desarrollo y pruebas). Para la base de desarrollo local inmediata se utilizará SQLite/Postgres según entorno con lógica de locking/transacción atómica idéntica.

---

### C. CMS de Contenido: Omitido (Panel administrativo integrado en MVP)
* **Opciones evaluadas:** CMS desacoplado (Contentful, Sanity, Strapi) vs. Panel administrativo directo.
* **Criterios:** Superficie de ataque, costo operativo, complejidad de integración para un único local y un único profesional.
* **Análisis:** Para un único salón con catálogo pequeño (corte y combo corte+bebida), añadir un headless CMS incrementa latencia, costos y dependencia de terceros sin beneficio operativo.
* **Decisión:** **Omitir CMS externo**. Las configuraciones de catálogo y horarios se gestionan desde el panel administrativo protegido dentro de la misma aplicación.

---

### D. Motor de Reservas: Motor Propio en Servidor
* **Opciones evaluadas:** Integración con proveedores externos (Calendly, Acuity, Square Appointments) vs. Motor propio.
* **Criterios:** Reglas de negocio particulares (combo con bebida, corte ARS 10.000, un solo barbero), costos, privacidad de datos en Argentina, soberanía sobre cancelaciones y confirmaciones.
* **Análisis:** Los proveedores externos imponen cuotas mensuales, redirecciones externas que degradan la experiencia de usuario y dificultades para validar combos condicionales.
* **Decisión:** **Motor propio con validación atómica en servidor**.

---

### E. Estilos e Interfaz: Vanilla CSS / Tailwind CSS con diseño de alto impacto
* **Criterios:** Seguir directrices de diseño visual distintivo (evitar aspecto genérico de plantilla, paleta cuidada, tipografía moderna, microinteracciones).
* **Decisión:** **Tailwind CSS + CSS Modules** para diseño responsivo mobile-first, cuidando la accesibilidad y rendimiento.

---

### F. Hosting y Despliegue: Vercel / Entorno Node modular
* **Decisión:** Preparado para Vercel o contenedor Node.js estándar. No se introduce analítica invasiva ni scripts de terceros sin evaluación de privacidad.

---

## 3. Consecuencias
- **Positivas:** Arquitectura simple y modular de un solo repositorio; transacciones seguras en servidor; control total de la privacidad y los flujos de reserva.
- **Riesgos y mitigaciones:** Al construir motor propio, es obligatorio auditar y testear exhaustivamente la condición de carrera ante reservas simultáneas en el mismo horario.
