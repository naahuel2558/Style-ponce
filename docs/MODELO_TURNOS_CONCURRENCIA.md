# Modelo de Turnos y Mecanismo Atómico Anti-Colisión

Fecha: 2026-10-13  
Fase: 1 — Arquitectura, contratos y diseño de seguridad  
Referencias: [README.md](../README.md), [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), [ADR_STACK_ARQUITECTURA.md](ADR_STACK_ARQUITECTURA.md)

---

## 1. Definición del Modelo de Turnos y Horarios

### 1.1 Parámetros de Dominio
* **Zona Horaria Oficial:** `America/Argentina/Buenos_Aires` (UTC-3 todo el año, sin horario de verano actualmente).
* **Capacidad:** 1 Profesional único en MVP. Todos los turnos compiten por el mismo recurso exclusivo (`barberId = 'barbero-principal'`).
* **Horarios de Apertura (Prototipo):**
  - Lunes a Sábados: 09:00 a 18:00.
  - Domingos y feriados: Cerrado.
* **Duración de Servicios:**
  - `corte-tradicional`: 30 minutos.
  - `combo-corte-bebida`: 45 minutos (provisional para prototipo; pendiente confirmación del responsable).
* **Pausa / Intervalo (Buffer):** 0 a 5 minutos entre turnos para sanitización/limpieza de puesto.

---

## 2. Generación de Horarios Disponibles (`getAvailableSlots`)

1. El servidor calcula los intervalos teóricos del día solicitado entre la hora de apertura y de cierre en pasos estándar (ej. cada 30 o 15 minutos).
2. Para cada intervalo potencial `[T_inicio, T_inicio + duracion_servicio]`:
   - Se verifica que `T_inicio + duracion_servicio <= hora_cierre_local`.
   - Se verifica que no exista solapamiento con turnos confirmados existentes:
     $$\text{Existe conflicto si: } T_{existente\_inicio} < T_{nuevo\_fin} \quad \text{y} \quad T_{existente\_fin} > T_{nuevo\_inicio}$$
   - Se descartan slots cuyo `T_inicio` sea anterior al momento actual + margen mínimo de anticipación (ej. 1 hora).
3. Se devuelve al navegador únicamente la lista de `T_inicio` disponibles.

---

## 3. Prevención Atómica de Doble Reserva (Condición de Carrera)

### 3.1 El Problema de Concurrencia
Si dos clientes (A y B) abren el calendario al mismo tiempo y ven las 15:00 libre:
- Cliente A envía la confirmación a las 15:00:01.
- Cliente B envía la confirmación a las 15:00:02.
Si el servidor valida la disponibilidad con un simple `SELECT` y luego ejecuta un `INSERT`, ambas peticiones pueden leer "disponible" e insertar turnos duplicados.

### 3.2 Mecanismo Autoritativo de Base de Datos

#### En PostgreSQL (Producción / Supabase):
Se utiliza una restricción de exclusión nativa mediante GiST o función RPC transaccional:
```sql
-- Extensión requerida en PostgreSQL
CREATE EXTENSION IF NOT EXISTS btree_gist;

-- Tabla de citas con exclusión estricta de solapamiento
CREATE TABLE appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id TEXT NOT NULL DEFAULT 'barbero-principal',
  service_id TEXT NOT NULL,
  start_time TIMESTAMPTZ NOT NULL,
  end_time TIMESTAMPTZ NOT NULL,
  client_name TEXT NOT NULL,
  client_phone TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'CONFIRMED', -- 'CONFIRMED', 'CANCELLED'
  cancel_token_hash TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  
  -- Restricción de exclusión: ningún turno confirmado puede solaparse en tiempo para el mismo barbero
  CONSTRAINT no_overlapping_appointments 
  EXCLUDE USING gist (
    barber_id WITH =,
    tstzrange(start_time, end_time) WITH &&
  ) WHERE (status = 'CONFIRMED')
);
```
Si dos peticiones concurrentes intentan insertar el mismo rango horario o rangos que se crucen, PostgreSQL rechaza la segunda con error de violación de restricción (`23P01` `exclusion_violation`), garantizando consistencia absoluta sin necesidad de locks distribuidos.

#### En SQLite (Desarrollo / Tests):
Para entornos de prueba y ejecución local inmediata sin PostgreSQL externo:
```sql
-- Envoltura de transacción inmediata
BEGIN IMMEDIATE TRANSACTION;

-- Comprobar si existe solapamiento activo
SELECT count(*) FROM appointments 
WHERE barber_id = ? 
  AND status = 'CONFIRMED'
  AND start_time < :new_end_time 
  AND end_time > :new_start_time;

-- Si el conteo es > 0:
ROLLBACK; -- Retornar error SLOT_OCCUPIED

-- Si el conteo es 0:
INSERT INTO appointments (...) VALUES (...);
COMMIT;
```
En SQLite, `BEGIN IMMEDIATE` bloquea la escritura de forma sincrónica, impidiendo que otra transacción concurrente verifique o inserte en el mismo intervalo.

---

## 4. Respuestas ante Conflicto
Cuando la restricción o comprobación atómica detecta colisión:
1. La base de datos aborta la transacción limpiamente.
2. El servidor atrapa el error y responde con código HTTP 409 (Conflict) o el objeto:
   ```json
   {
     "success": false,
     "error": {
       "code": "SLOT_OCCUPIED",
       "message": "El horario seleccionado acaba de ser reservado por otro cliente. Por favor, seleccioná otro horario disponible."
     }
   }
   ```
3. La interfaz de usuario muestra el mensaje de conflicto y recarga automáticamente la grilla de turnos actualizados.
