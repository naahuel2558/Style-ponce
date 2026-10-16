import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateAdminSession, getAdminAppointments, getServicesConfig, getBusinessSettings } from "@/lib/db";
import { AdminDashboard } from "./AdminDashboard";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  // Verificación estricta en servidor
  if (!validateAdminSession(token)) {
    redirect("/admin/login");
  }

  const appointments = getAdminAppointments();
  const servicesConfig = getServicesConfig();
  const businessSettings = getBusinessSettings();

  return (
    <AdminDashboard
      initialAppointments={appointments}
      initialServicesConfig={servicesConfig}
      initialBusinessSettings={businessSettings}
    />
  );
}
