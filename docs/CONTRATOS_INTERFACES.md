# Especificación de Contratos de Interfaz y Validación

Fecha: 2026-10-13  
Fase: 1 — Arquitectura, contratos y diseño de seguridad  
Referencias: [README.md](../README.md), [ADR_STACK_ARQUITECTURA.md](ADR_STACK_ARQUITECTURA.md)

---

## 1. Principios Generales de Seguridad y Contratos
1. **Autoridad en el Servidor:** El cliente jamás envía precio, duración ni disponibilidad precalculada. El cliente solo envía el `serviceId`, la fecha/hora deseada (`startDateTimeIso`), y datos de contacto mínimos (`clientName`, `clientPhone`).
2. **Minimización de Datos:** No se admiten campos de texto libre, notas médicas, comentarios no estructurados ni datos de pago.
3. **Manejo Seguro de Errores:** Las respuestas ante errores de validación o conflictos devuelven códigos legibles y seguros. No se filtran errores internos de base de datos ni volcados de pila (stack traces).

---

## 2. Esquemas de Datos y Validación (Zod)

### A. Solicitud de Reserva Pública (`CreateBookingInput`)
```typescript
import { z } from 'zod';

export const CreateBookingSchema = z.object({
  serviceId: z.enum(['corte-tradicional', 'combo-corte-bebida'], {
    errorMap: () => ({ message: 'Servicio seleccionado no válido' })
  }),
  beverageChoice: z.enum(['coca-cola', 'cerveza-brahma', 'ninguna']).optional(),
  startDateTimeIso: z.string().datetime({
    message: 'Formato de fecha y hora inválido (debe ser ISO 8601)'
  }),
  clientName: z.string()
    .trim()
    .min(2, { message: 'El nombre debe tener al menos 2 caracteres' })
    .max(60, { message: 'El nombre no puede superar 60 caracteres' })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, { message: 'El nombre solo debe contener letras y espacios' }),
  clientPhone: z.string()
    .trim()
    .min(8, { message: 'Número de teléfono demasiado corto' })
    .max(20, { message: 'Número de teléfono demasiado largo' })
    .regex(/^\+?[0-9\s\-]+$/, { message: 'El formato de teléfono ingresado es inválido' })
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;
```

### B. Respuesta de Creación de Reserva (`BookingResult`)
```typescript
export type BookingResult = 
  | {
      success: true;
      data: {
        bookingId: string;
        serviceName: string;
        startDateTimeIso: string;
        durationMinutes: number;
        clientName: string;
        cancelToken: string; // Token de un solo uso o revocable
      };
    }
  | {
      success: false;
      error: {
        code: 'SLOT_OCCUPIED' | 'INVALID_DATE' | 'PAST_TIME' | 'VALIDATION_ERROR' | 'SERVICE_UNAVAILABLE' | 'INTERNAL_ERROR';
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
```

---

## 3. Contratos de Operaciones Públicas

### 3.1 Consulta de Disponibilidad (`getAvailableSlots`)
* **Entrada:** `date` (YYYY-MM-DD), `serviceId` (string).
* **Validación en Servidor:**
  - Verifica que la fecha pertenezca al horizonte de reserva permitido (hoy hasta +30 días).
  - No permite fechas pasadas.
  - Recupera la duración oficial del servicio desde la configuración interna del servidor (ej. Corte = 30 min, Combo = 45 min).
  - Cruza con el horario de atención configurado (ej. 09:00 a 18:00) y reservas confirmadas existentes.
* **Salida:** Lista de slots libres `string[]` en formato ISO con zona horaria `-03:00` (`America/Argentina/Buenos_Aires`).

### 3.2 Confirmación de Reserva (`confirmBooking`)
* **Entrada:** `CreateBookingInput` (vía Server Action / Endpoint POST).
* **Procesamiento:**
  1. Validación sintáctica con `CreateBookingSchema`.
  2. Validación semántica: comprueba que `startDateTimeIso` esté en el futuro y dentro del horario laboral.
  3. Ejecución de transacción atómica con lock o restricción de exclusión para evitar condiciones de carrera.
* **Salida:** `BookingResult`.

### 3.3 Cancelación de Turno por Cliente (`cancelBooking`)
* **Entrada:** `cancelToken` (string, token criptográficamente seguro de 32 bytes en formato hex/base64url).
* **Validación en Servidor:**
  - Búsqueda por hash del token (o token directo si se almacena seguro).
  - Comprueba que el turno esté en estado `CONFIRMED`.
  - Comprueba política de antelación mínima (ej. 24 hs previas en prototipo).
  - Idempotente: si ya fue cancelado, retorna respuesta segura sin revelar información confidencial.
* **Salida:** `{ success: boolean; message: string; code?: string }`.

---

## 4. Contratos de Operaciones Administrativas

### 4.1 Autenticación de Administrador (`adminLogin`)
* Mecanismo: Credenciales de administrador validadas en servidor con hash seguro (Argon2id o Bcrypt) y cookie HTTP-only segura, `SameSite=Lax`, `Secure`.

### 4.2 Matriz de Autorización y Permisos

| Rol | Consultar Servicios | Ver Horarios Libres | Crear Reserva | Cancelar con Token | Acceso a Panel Admin | Modificar Horarios / Bloqueos | Cancelar Turno sin Token |
| --- | :---: | :---: | :---: | :---: | :---: | :---: | :---: |
| **Público / Cliente** | ✅ | ✅ | ✅ | ✅ (solo su turno) | ❌ | ❌ | ❌ |
| **Administrador / Barbero** | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ (con motivo codificado) |

### 4.3 Gestión de Turnos en Panel Admin
* `getAppointments(fromIso, toIso)`: Devuelve lista de turnos (identificador, hora inicio, hora fin, servicio, nombre, teléfono ofuscado o visible solo a personal autenticado, estado: `CONFIRMED`, `CANCELLED_BY_CLIENT`, `CANCELLED_BY_ADMIN`, `COMPLETED`).
* `cancelAppointmentByAdmin(appointmentId, reasonCode)`:
  - `reasonCode`: `['CLIENT_ABSENT', 'EMERGENCY_CLOSURE', 'CLIENT_PHONE_REQUEST', 'OTHER_OPERATIONAL']`. No se requiere texto libre.
