import { z } from "zod";

export type ServiceId = "corte-tradicional" | "combo-corte-bebida";

export interface ServiceDefinition {
  id: ServiceId;
  name: string;
  description: string;
  durationMinutes: number;
  priceArs: number;
  requiresBeverage?: boolean;
  isProvisionalPricing?: boolean;
}

export const CreateBookingSchema = z.object({
  serviceId: z.enum(["corte-tradicional", "combo-corte-bebida"], {
    message: "Servicio seleccionado inválido",
  }),
  beverageChoice: z.enum(["coca-cola", "cerveza-brahma", "ninguna"]).optional(),
  startDateTimeIso: z.string().datetime({
    message: "Formato de fecha y hora inválido (debe ser ISO 8601)",
  }),
  clientName: z.string()
    .trim()
    .min(2, { message: "El nombre debe tener al menos 2 caracteres" })
    .max(60, { message: "El nombre no puede exceder 60 caracteres" })
    .regex(/^[a-zA-ZáéíóúÁÉÍÓÚñÑ\s]+$/, {
      message: "El nombre solo puede contener letras y espacios",
    }),
  clientPhone: z.string()
    .trim()
    .min(8, { message: "El teléfono debe tener al menos 8 dígitos" })
    .max(20, { message: "El teléfono no puede exceder 20 caracteres" })
    .regex(/^\+?[0-9\s\-]+$/, {
      message: "Formato telefónico inválido (solo números, guiones y +)",
    }),
});

export type CreateBookingInput = z.infer<typeof CreateBookingSchema>;

export const ADMIN_CANCELLATION_REASONS = {
  CLIENT_ABSENT: "Cliente ausente / no se presentó",
  EMERGENCY_CLOSURE: "Cierre por imprevisto / urgencia del local",
  CLIENT_PHONE_REQUEST: "Solicitud telefónica del cliente",
  OTHER_OPERATIONAL: "Causa operativa interna",
} as const;

export type AdminCancellationReason = keyof typeof ADMIN_CANCELLATION_REASONS;

export interface AppointmentRecord {
  id: string;
  barberId: string;
  serviceId: ServiceId;
  beverageChoice?: string | null;
  startTime: string; // ISO string
  endTime: string;   // ISO string
  clientName: string;
  clientPhone: string;
  status: "CONFIRMED" | "CANCELLED_BY_CLIENT" | "CANCELLED_BY_ADMIN";
  cancelTokenHash: string;
  createdAt: string;
}

export interface AvailableSlot {
  startIso: string;
  endIso: string;
  label: string;
}

export type BookingResult =
  | {
      success: true;
      data: {
        bookingId: string;
        serviceName: string;
        startDateTimeIso: string;
        durationMinutes: number;
        clientName: string;
        cancelToken: string;
        priceArs: number;
      };
    }
  | {
      success: false;
      error: {
        code:
          | "SLOT_OCCUPIED"
          | "INVALID_DATE"
          | "PAST_TIME"
          | "VALIDATION_ERROR"
          | "SERVICE_UNAVAILABLE"
          | "INTERNAL_ERROR";
        message: string;
        fieldErrors?: Record<string, string[]>;
      };
    };
