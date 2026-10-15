"use server";

import {
  CreateBookingSchema,
  BookingResult,
  ServiceId,
} from "@/types/booking";
import {
  createBookingAtomic,
  getAvailableSlots,
  cancelBookingByToken,
} from "@/lib/db";

export async function fetchAvailableSlotsAction(
  dateString: string,
  serviceId: ServiceId
) {
  try {
    return getAvailableSlots(dateString, serviceId);
  } catch (error) {
    return [];
  }
}

export async function submitBookingAction(
  prevState: BookingResult | null,
  formData: FormData
): Promise<BookingResult> {
  const rawData = {
    serviceId: formData.get("serviceId"),
    beverageChoice: formData.get("beverageChoice") || undefined,
    startDateTimeIso: formData.get("startDateTimeIso"),
    clientName: formData.get("clientName"),
    clientPhone: formData.get("clientPhone"),
  };

  const validation = CreateBookingSchema.safeParse(rawData);

  if (!validation.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of validation.error.issues) {
      const field = issue.path[0] as string;
      if (!fieldErrors[field]) {
        fieldErrors[field] = [];
      }
      fieldErrors[field].push(issue.message);
    }

    return {
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Por favor revisá los datos ingresados.",
        fieldErrors,
      },
    };
  }

  // Ejecución atómica en servidor
  return createBookingAtomic(validation.data);
}

export async function submitCancelAction(
  prevState: { success: boolean; message: string } | null,
  formData: FormData
) {
  const token = formData.get("cancelToken");
  if (!token || typeof token !== "string") {
    return { success: false, message: "Token de cancelación inválido o faltante." };
  }

  return cancelBookingByToken(token);
}
