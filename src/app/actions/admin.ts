"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import {
  createAdminSession,
  deleteAdminSession,
  validateAdminSession,
  cancelAppointmentByAdmin,
  updateServicePrice,
  getBusinessSettings,
  updateBusinessSettings,
  AdminCancellationReason,
} from "@/lib/db";
import { ServiceId, BusinessSettings, UpdateBusinessSettingsSchema } from "@/types/booking";

const DEFAULT_ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

/**
 * Autenticación administrativa
 */
export async function loginAdminAction(
  prevState: { success: boolean; error?: string } | null,
  formData: FormData
) {
  const password = formData.get("password");

  if (typeof password !== "string" || !password) {
    return { success: false, error: "Ingresá la contraseña de administración." };
  }

  // Comparación segura
  if (password !== DEFAULT_ADMIN_PASSWORD) {
    return { success: false, error: "Contraseña incorrecta." };
  }

  const token = createAdminSession();
  const cookieStore = await cookies();

  cookieStore.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24, // 24 horas
  });

  return { success: true };
}

/**
 * Cierre de sesión de administración
 */
export async function logoutAdminAction() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (token) {
    deleteAdminSession(token);
    cookieStore.delete("admin_session");
  }

  redirect("/admin/login");
}

/**
 * Cancelación administrativa autorizada en servidor
 */
export async function cancelAppointmentByAdminAction(
  appointmentId: string,
  reasonCode: AdminCancellationReason
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  // Verificación estricta en servidor
  if (!validateAdminSession(token)) {
    return { success: false, error: "No autorizado. Sesión vencida o inválida." };
  }

  const res = cancelAppointmentByAdmin(appointmentId, reasonCode);
  if (res.success) {
    revalidatePath("/admin");
  }
  return res;
}

/**
 * Modificación autorizada de precios de servicios
 */
export async function updateServicePriceAction(
  serviceId: ServiceId,
  newPriceArs: number
) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  // Verificación estricta en servidor
  if (!validateAdminSession(token)) {
    return { success: false, message: "No autorizado. Sesión vencida o inválida." };
  }

  const res = updateServicePrice(serviceId, newPriceArs);
  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return res;
}

/**
 * Modificación autorizada de la configuración del negocio (dirección, whatsapp, horarios, días)
 */
export async function updateBusinessSettingsAction(settings: BusinessSettings) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  // Verificación estricta en servidor
  if (!validateAdminSession(token)) {
    return { success: false, message: "No autorizado. Sesión vencida o inválida." };
  }

  const validation = UpdateBusinessSettingsSchema.safeParse(settings);
  if (!validation.success) {
    return {
      success: false,
      message: validation.error.issues[0]?.message || "Datos de configuración inválidos.",
    };
  }

  const res = updateBusinessSettings(validation.data);
  if (res.success) {
    revalidatePath("/admin");
    revalidatePath("/");
  }
  return res;
}


