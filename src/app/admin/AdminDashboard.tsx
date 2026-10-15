"use client";

import React, { useState, useTransition } from "react";
import {
  cancelAppointmentByAdminAction,
  logoutAdminAction,
  updateServicePriceAction,
} from "@/app/actions/admin";
import {
  ADMIN_CANCELLATION_REASONS,
  AdminCancellationReason,
  ServiceDefinition,
  ServiceId,
} from "@/types/booking";
import {
  Calendar,
  Clock,
  User,
  Phone,
  Search,
  Filter,
  LogOut,
  AlertTriangle,
  X,
  CheckCircle2,
  CalendarX,
  Scissors,
  Tag,
  Save,
  RefreshCw,
} from "lucide-react";
import Link from "next/link";

interface AppointmentItem {
  id: string;
  serviceName: string;
  durationMinutes: number;
  priceArs: number;
  beverageChoice: string | null;
  startTime: string;
  endTime: string;
  clientName: string;
  clientPhone: string;
  status: string;
  createdAt: string;
}

interface AdminDashboardProps {
  initialAppointments: AppointmentItem[];
  initialServicesConfig: Record<ServiceId, ServiceDefinition>;
}

export function AdminDashboard({
  initialAppointments,
  initialServicesConfig,
}: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [servicesConfig, setServicesConfig] = useState(initialServicesConfig);
  const [priceDrafts, setPriceDrafts] = useState<Record<ServiceId, string>>({
    "corte-tradicional": String(initialServicesConfig["corte-tradicional"]?.priceArs || 10000),
    "combo-corte-bebida": String(initialServicesConfig["combo-corte-bebida"]?.priceArs || 13500),
  });
  const [savingServiceId, setSavingServiceId] = useState<ServiceId | null>(null);

  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("ALL");

  // Modal de cancelación
  const [selectedToCancel, setSelectedToCancel] = useState<AppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState<AdminCancellationReason>("CLIENT_PHONE_REQUEST");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const handleSavePrice = async (serviceId: ServiceId) => {
    const rawVal = priceDrafts[serviceId];
    const parsed = parseInt(rawVal, 10);
    if (isNaN(parsed) || parsed < 500 || parsed > 2000000) {
      setFeedback({
        type: "error",
        message: "Por favor ingresá un precio válido entre $500 y $2.000.000 ARS.",
      });
      return;
    }

    setSavingServiceId(serviceId);
    try {
      const res = await updateServicePriceAction(serviceId, parsed);
      if (res.success) {
        setServicesConfig((prev) => ({
          ...prev,
          [serviceId]: {
            ...prev[serviceId],
            priceArs: parsed,
          },
        }));
        setFeedback({
          type: "success",
          message: res.message || "Precio actualizado correctamente.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.message || "Error al actualizar precio.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Ocurrió un error inesperado al guardar el precio.",
      });
    } finally {
      setSavingServiceId(null);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  const formatDateTime = (iso: string) => {
    try {
      const d = new Date(iso);
      // Hora local Argentina (UTC-3)
      const hour = String((d.getUTCHours() - 3 + 24) % 24).padStart(2, "0");
      const min = String(d.getUTCMinutes()).padStart(2, "0");
      const day = String(d.getUTCDate()).padStart(2, "0");
      const month = String(d.getUTCMonth() + 1).padStart(2, "0");
      return `${day}/${month} - ${hour}:${min} hs`;
    } catch {
      return iso;
    }
  };

  const filteredAppointments = appointments.filter((app) => {
    // Filtro por estado
    if (statusFilter === "CONFIRMED" && app.status !== "CONFIRMED") return false;
    if (statusFilter === "CANCELLED" && app.status === "CONFIRMED") return false;

    // Búsqueda por texto (nombre o teléfono)
    if (searchTerm.trim()) {
      const term = searchTerm.toLowerCase();
      const matchName = app.clientName.toLowerCase().includes(term);
      const matchPhone = app.clientPhone.includes(term);
      if (!matchName && !matchPhone) return false;
    }

    return true;
  });

  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.status !== "CONFIRMED").length;

  const handleConfirmCancel = () => {
    if (!selectedToCancel) return;

    startTransition(async () => {
      const res = await cancelAppointmentByAdminAction(selectedToCancel.id, cancelReason);
      if (res.success && "message" in res) {
        // Actualizar estado local
        setAppointments((prev) =>
          prev.map((item) =>
            item.id === selectedToCancel.id ? { ...item, status: "CANCELLED_BY_ADMIN" } : item
          )
        );
        setFeedback({ type: "success", message: res.message });
        setSelectedToCancel(null);
      } else if (!res.success && "error" in res) {
        setFeedback({ type: "error", message: res.error });
      }

      setTimeout(() => setFeedback(null), 4000);
    });
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-barber-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-barber-textPrimary">
              Agenda Administrativa
            </h1>
          </div>
          <p className="text-xs text-barber-textSecondary mt-1">
            Gestión autoritativa de turnos y control de disponibilidad en tiempo real.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-barber-card border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary flex items-center gap-1.5"
          >
            <Scissors className="w-3.5 h-3.5 text-barber-gold" />
            Ver Web Pública
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition-all"
            >
              <LogOut className="w-3.5 h-3.5" />
              Cerrar Sesión
            </button>
          </form>
        </div>
      </div>

      {/* Alerta de Feedback */}
      {feedback && (
        <div
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn ${
            feedback.type === "success"
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-red-950/40 border-red-800 text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-xs text-barber-textSecondary font-medium">Total de Turnos Registrados</span>
          <p className="text-2xl font-extrabold text-barber-textPrimary">{appointments.length}</p>
        </div>

        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-xs text-emerald-400 font-medium">Turnos Confirmados (Activos)</span>
          <p className="text-2xl font-extrabold text-emerald-400">{confirmedCount}</p>
        </div>

        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-xs text-red-400 font-medium">Turnos Cancelados</span>
          <p className="text-2xl font-extrabold text-red-400">{cancelledCount}</p>
        </div>
      </div>

      {/* Configuración y Edición de Precios de Servicios */}
      <div className="barber-panel rounded-2xl border border-barber-border p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-barber-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-barber-gold" />
            <h2 className="text-base font-bold text-barber-textPrimary">
              Configuración de Precios de Servicios
            </h2>
          </div>
          <span className="text-[11px] text-barber-textSecondary">
            Los precios guardados se aplican inmediatamente al catálogo público y en cada reserva.
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
          {(["corte-tradicional", "combo-corte-bebida"] as ServiceId[]).map((id) => {
            const serv = servicesConfig[id];
            if (!serv) return null;
            const isSaving = savingServiceId === id;
            const currentDraft = priceDrafts[id];
            const hasChanged = parseInt(currentDraft, 10) !== serv.priceArs;

            return (
              <div
                key={id}
                className="p-4 rounded-xl bg-barber-card/60 border border-barber-border/80 flex flex-col justify-between gap-4"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="font-semibold text-sm text-barber-textPrimary">
                      {serv.name}
                    </h3>
                    <p className="text-xs text-barber-textSecondary mt-0.5">
                      Duración estimada: {serv.durationMinutes} min
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] uppercase tracking-wider text-barber-textSecondary block">
                      Precio Actual
                    </span>
                    <span className="font-mono text-sm font-bold text-barber-gold">
                      ${serv.priceArs.toLocaleString("es-AR")} ARS
                    </span>
                  </div>
                </div>

                <div className="pt-2 border-t border-barber-border/40 flex items-center gap-3">
                  <div className="relative flex-1">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-mono text-barber-textSecondary">
                      $
                    </span>
                    <input
                      type="number"
                      step={500}
                      min={500}
                      max={2000000}
                      value={currentDraft}
                      onChange={(e) =>
                        setPriceDrafts((prev) => ({ ...prev, [id]: e.target.value }))
                      }
                      placeholder="Precio en ARS"
                      className="w-full bg-barber-panel border border-barber-border rounded-xl pl-7 pr-12 py-2 text-xs font-mono text-barber-textPrimary focus:outline-none focus:border-barber-gold"
                    />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-barber-textSecondary font-medium">
                      ARS
                    </span>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleSavePrice(id)}
                    disabled={isSaving || !hasChanged}
                    className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all shadow-sm ${
                      hasChanged
                        ? "bg-barber-gold text-barber-dark hover:bg-yellow-500 cursor-pointer"
                        : "bg-barber-panel border border-barber-border text-barber-textSecondary/60 cursor-not-allowed"
                    }`}
                  >
                    {isSaving ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        <span>Guardando...</span>
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        <span>Guardar</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Filtros y Buscador */}
      <div className="p-4 rounded-xl barber-panel border border-barber-border flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="w-full sm:w-72 relative">
          <Search className="w-4 h-4 text-barber-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Buscar por cliente o teléfono..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-barber-card border border-barber-border rounded-xl pl-10 pr-4 py-2 text-xs text-barber-textPrimary placeholder:text-barber-textSecondary/40 focus:outline-none focus:border-barber-gold"
          />
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Filter className="w-3.5 h-3.5 text-barber-textSecondary" />
          <span className="text-xs text-barber-textSecondary">Filtrar:</span>
          {(["ALL", "CONFIRMED", "CANCELLED"] as const).map((filter) => (
            <button
              key={filter}
              type="button"
              onClick={() => setStatusFilter(filter)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                statusFilter === filter
                  ? "bg-barber-gold text-barber-dark"
                  : "bg-barber-card border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
              }`}
            >
              {filter === "ALL" && "Todos"}
              {filter === "CONFIRMED" && "Activos"}
              {filter === "CANCELLED" && "Cancelados"}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla de Turnos */}
      <div className="barber-panel rounded-2xl border border-barber-border overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-barber-card/80 border-b border-barber-border text-barber-textSecondary uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Fecha & Hora</th>
                <th className="py-3 px-4">Servicio</th>
                <th className="py-3 px-4">Cliente</th>
                <th className="py-3 px-4">Teléfono</th>
                <th className="py-3 px-4">Estado</th>
                <th className="py-3 px-4 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-barber-border/60">
              {filteredAppointments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-barber-textSecondary">
                    No se encontraron turnos con los filtros aplicados.
                  </td>
                </tr>
              ) : (
                filteredAppointments.map((app) => (
                  <tr key={app.id} className="hover:bg-barber-card/40 transition-colors">
                    <td className="py-3.5 px-4 font-mono font-semibold text-barber-textPrimary whitespace-nowrap">
                      {formatDateTime(app.startTime)}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="font-semibold text-barber-textPrimary block">
                        {app.serviceName}
                      </span>
                      {app.beverageChoice && (
                        <span className="text-[11px] text-barber-gold capitalize">
                          + {app.beverageChoice.replace("-", " ")}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-medium text-barber-textPrimary">
                      {app.clientName}
                    </td>
                    <td className="py-3.5 px-4 font-mono text-barber-textSecondary whitespace-nowrap">
                      {app.clientPhone}
                    </td>
                    <td className="py-3.5 px-4 whitespace-nowrap">
                      {app.status === "CONFIRMED" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                          Confirmado
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800">
                          <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                          {app.status === "CANCELLED_BY_ADMIN" ? "Cancelado (Admin)" : "Cancelado (Cliente)"}
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right whitespace-nowrap">
                      {app.status === "CONFIRMED" ? (
                        <button
                          type="button"
                          onClick={() => setSelectedToCancel(app)}
                          className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-[11px] font-semibold text-red-200 transition-all"
                        >
                          Cancelar Turno
                        </button>
                      ) : (
                        <span className="text-[11px] text-barber-textSecondary/50 italic">
                          Liberado
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal de Cancelación Administrativa con Motivo Codificado */}
      {selectedToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md barber-panel rounded-2xl p-6 border border-barber-border shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedToCancel(null)}
              className="absolute top-4 right-4 text-barber-textSecondary hover:text-barber-textPrimary"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-red-950 border border-red-800 flex items-center justify-center text-red-400 shrink-0">
                  <CalendarX className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-barber-textPrimary">
                    Cancelar Turno por Administración
                  </h3>
                  <p className="text-xs text-barber-textSecondary">
                    Cliente: {selectedToCancel.clientName} ({formatDateTime(selectedToCancel.startTime)})
                  </p>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-barber-textSecondary block mb-1.5">
                  Motivo codificado de cancelación *
                </label>
                <select
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value as AdminCancellationReason)}
                  className="w-full bg-barber-card border border-barber-border rounded-xl px-3 py-2.5 text-xs text-barber-textPrimary focus:outline-none focus:border-barber-gold"
                >
                  {Object.entries(ADMIN_CANCELLATION_REASONS).map(([code, label]) => (
                    <option key={code} value={code}>
                      {label}
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-barber-textSecondary/70 mt-1">
                  Se registrará un evento de auditoría administrativo mínimo sin datos personales.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedToCancel(null)}
                  className="px-4 py-2 rounded-xl border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary"
                >
                  Volver
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 font-bold text-xs text-white transition-all shadow-md shadow-red-950"
                >
                  {isPending ? "Cancelando..." : "Confirmar Cancelación"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
