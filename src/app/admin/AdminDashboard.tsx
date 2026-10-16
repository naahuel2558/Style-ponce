"use client";

import React, { useState, useTransition, useMemo } from "react";
import {
  cancelAppointmentByAdminAction,
  logoutAdminAction,
  updateServicePriceAction,
  updateBusinessSettingsAction,
} from "@/app/actions/admin";
import {
  ADMIN_CANCELLATION_REASONS,
  AdminCancellationReason,
  BusinessSettings,
  DaySchedule,
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
  MapPin,
  Building,
  Store,
  Check,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  MessageSquare,
  List,
  LayoutGrid,
  Clock3,
  Copy,
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
  initialBusinessSettings: BusinessSettings;
}

// Utilidades de fecha y hora para Argentina (UTC-3)
function getArgDateInfo(iso: string) {
  try {
    const d = new Date(iso);
    if (isNaN(d.getTime())) {
      return { dateKey: "", timeStr: "", dayName: "", displayDate: iso, rawDate: new Date() };
    }
    // Desplazamiento a UTC-3
    const arg = new Date(d.getTime() - 3 * 3600 * 1000);
    const y = arg.getUTCFullYear();
    const m = String(arg.getUTCMonth() + 1).padStart(2, "0");
    const day = String(arg.getUTCDate()).padStart(2, "0");
    const h = String(arg.getUTCHours()).padStart(2, "0");
    const min = String(arg.getUTCMinutes()).padStart(2, "0");

    const days = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
    const months = [
      "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
      "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre"
    ];

    const dayName = days[arg.getUTCDay()];
    const monthName = months[arg.getUTCMonth()];
    const dateKey = `${y}-${m}-${day}`;
    const timeStr = `${h}:${min}`;
    const displayDate = `${dayName} ${parseInt(day, 10)} de ${monthName}`;

    return { dateKey, timeStr, dayName, displayDate, rawDate: arg };
  } catch {
    return { dateKey: "", timeStr: "", dayName: "", displayDate: iso, rawDate: new Date() };
  }
}

function getTodayArgKey(): string {
  const now = new Date();
  const arg = new Date(now.getTime() - 3 * 3600 * 1000);
  const y = arg.getUTCFullYear();
  const m = String(arg.getUTCMonth() + 1).padStart(2, "0");
  const d = String(arg.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function getOffsetArgKey(daysOffset: number): string {
  const now = new Date();
  const target = new Date(now.getTime() - 3 * 3600 * 1000 + daysOffset * 24 * 3600 * 1000);
  const y = target.getUTCFullYear();
  const m = String(target.getUTCMonth() + 1).padStart(2, "0");
  const d = String(target.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

const WEEK_DAYS: Array<{ id: number; name: string; short: string }> = [
  { id: 1, name: "Lunes", short: "Lun" },
  { id: 2, name: "Martes", short: "Mar" },
  { id: 3, name: "Miércoles", short: "Mié" },
  { id: 4, name: "Jueves", short: "Jue" },
  { id: 5, name: "Viernes", short: "Vie" },
  { id: 6, name: "Sábado", short: "Sáb" },
  { id: 0, name: "Domingo", short: "Dom" },
];

export function AdminDashboard({
  initialAppointments,
  initialServicesConfig,
  initialBusinessSettings,
}: AdminDashboardProps) {
  const [appointments, setAppointments] = useState<AppointmentItem[]>(initialAppointments);
  const [servicesConfig, setServicesConfig] = useState(initialServicesConfig);
  const [businessSettings, setBusinessSettings] = useState<BusinessSettings>(initialBusinessSettings);
  const [savingBusiness, setSavingBusiness] = useState(false);

  // Horario individual por día
  const [scheduleByDay, setScheduleByDay] = useState<Record<number, DaySchedule>>(() => {
    if (initialBusinessSettings.scheduleByDay) {
      return initialBusinessSettings.scheduleByDay;
    }
    const daysOpen = initialBusinessSettings.daysOpen || [1, 2, 3, 4, 5, 6];
    return {
      1: { isOpen: daysOpen.includes(1), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
      2: { isOpen: daysOpen.includes(2), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
      3: { isOpen: daysOpen.includes(3), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
      4: { isOpen: daysOpen.includes(4), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
      5: { isOpen: daysOpen.includes(5), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
      6: { isOpen: daysOpen.includes(6), openingHour: initialBusinessSettings.openingHour || 9, closingHour: Math.min(initialBusinessSettings.closingHour || 19, 14) },
      0: { isOpen: daysOpen.includes(0), openingHour: initialBusinessSettings.openingHour || 9, closingHour: initialBusinessSettings.closingHour || 19 },
    };
  });

  // Precios
  const [priceDrafts, setPriceDrafts] = useState<Record<ServiceId, string>>({
    "corte-tradicional": String(initialServicesConfig["corte-tradicional"]?.priceArs || 10000),
    "combo-corte-bebida": String(initialServicesConfig["combo-corte-bebida"]?.priceArs || 13500),
  });
  const [savingServiceId, setSavingServiceId] = useState<ServiceId | null>(null);

  // Navegación intuitiva de turnos por Fecha y Hora
  const todayKey = useMemo(() => getTodayArgKey(), []);
  const tomorrowKey = useMemo(() => getOffsetArgKey(1), []);
  const weekEndKey = useMemo(() => getOffsetArgKey(7), []);

  const [dateFilterMode, setDateFilterMode] = useState<"TODAY" | "TOMORROW" | "WEEK" | "CUSTOM" | "ALL">("TODAY");
  const [customSelectedDate, setCustomSelectedDate] = useState<string>(todayKey);
  const [viewMode, setViewMode] = useState<"AGENDA" | "TABLE">("AGENDA");

  // Filtros adicionales
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "CONFIRMED" | "CANCELLED">("ALL");

  // Modal de cancelación
  const [selectedToCancel, setSelectedToCancel] = useState<AppointmentItem | null>(null);
  const [cancelReason, setCancelReason] = useState<AdminCancellationReason>("CLIENT_PHONE_REQUEST");
  const [isPending, startTransition] = useTransition();
  const [feedback, setFeedback] = useState<{ type: "success" | "error"; message: string } | null>(null);

  // Conteo de turnos por fecha para las pestañas
  const counts = useMemo(() => {
    let today = 0;
    let tomorrow = 0;
    let week = 0;

    appointments.forEach((app) => {
      if (app.status === "CONFIRMED") {
        const { dateKey } = getArgDateInfo(app.startTime);
        if (dateKey === todayKey) today++;
        if (dateKey === tomorrowKey) tomorrow++;
        if (dateKey >= todayKey && dateKey <= weekEndKey) week++;
      }
    });

    return { today, tomorrow, week, total: appointments.length };
  }, [appointments, todayKey, tomorrowKey, weekEndKey]);

  // Filtrado reactivo de turnos
  const filteredAppointments = useMemo(() => {
    return appointments.filter((app) => {
      const { dateKey } = getArgDateInfo(app.startTime);

      // 1. Filtro de fecha
      if (dateFilterMode === "TODAY" && dateKey !== todayKey) return false;
      if (dateFilterMode === "TOMORROW" && dateKey !== tomorrowKey) return false;
      if (dateFilterMode === "WEEK" && (dateKey < todayKey || dateKey > weekEndKey)) return false;
      if (dateFilterMode === "CUSTOM" && dateKey !== customSelectedDate) return false;

      // 2. Filtro de estado
      if (statusFilter === "CONFIRMED" && app.status !== "CONFIRMED") return false;
      if (statusFilter === "CANCELLED" && app.status === "CONFIRMED") return false;

      // 3. Búsqueda por texto (nombre, teléfono o servicio)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        const matchName = app.clientName.toLowerCase().includes(term);
        const matchPhone = app.clientPhone.includes(term);
        const matchService = app.serviceName.toLowerCase().includes(term);
        if (!matchName && !matchPhone && !matchService) return false;
      }

      return true;
    });
  }, [appointments, dateFilterMode, todayKey, tomorrowKey, weekEndKey, customSelectedDate, statusFilter, searchTerm]);

  // Agrupación por día para visualización ordenada
  const groupedByDay = useMemo(() => {
    const groups: Record<string, { dateKey: string; displayDate: string; items: AppointmentItem[] }> = {};

    filteredAppointments.forEach((app) => {
      const { dateKey, displayDate } = getArgDateInfo(app.startTime);
      if (!groups[dateKey]) {
        groups[dateKey] = {
          dateKey,
          displayDate,
          items: [],
        };
      }
      groups[dateKey].items.push(app);
    });

    return Object.values(groups).sort((a, b) => a.dateKey.localeCompare(b.dateKey));
  }, [filteredAppointments]);

  // Navegar día anterior / siguiente en modo CUSTOM
  const handleShiftCustomDate = (days: number) => {
    try {
      const [y, m, d] = customSelectedDate.split("-").map(Number);
      const cur = new Date(Date.UTC(y, m - 1, d));
      cur.setUTCDate(cur.getUTCDate() + days);
      const ny = cur.getUTCFullYear();
      const nm = String(cur.getUTCMonth() + 1).padStart(2, "0");
      const nd = String(cur.getUTCDate()).padStart(2, "0");
      setCustomSelectedDate(`${ny}-${nm}-${nd}`);
      setDateFilterMode("CUSTOM");
    } catch {
      // Ignorar errores de fecha
    }
  };

  // Manejadores para horarios individuales por día
  const handleToggleDayOpen = (dayId: number) => {
    setScheduleByDay((prev) => {
      const cur = prev[dayId] || { isOpen: true, openingHour: 9, closingHour: 19 };
      return {
        ...prev,
        [dayId]: {
          ...cur,
          isOpen: !cur.isOpen,
        },
      };
    });
  };

  const handleUpdateDayHour = (dayId: number, field: "openingHour" | "closingHour", val: number) => {
    setScheduleByDay((prev) => {
      const cur = prev[dayId] || { isOpen: true, openingHour: 9, closingHour: 19 };
      return {
        ...prev,
        [dayId]: {
          ...cur,
          [field]: val,
        },
      };
    });
  };

  const handleCopyDayScheduleToWeek = (sourceDayId: number) => {
    const source = scheduleByDay[sourceDayId];
    if (!source) return;

    setScheduleByDay((prev) => {
      const next = { ...prev };
      // Copiar a días de semana hábiles (1 a 5)
      [1, 2, 3, 4, 5].forEach((d) => {
        if (next[d]) {
          next[d] = {
            ...next[d],
            openingHour: source.openingHour,
            closingHour: source.closingHour,
          };
        }
      });
      return next;
    });

    setFeedback({
      type: "success",
      message: `Horario (${String(source.openingHour).padStart(2, "0")}:00 a ${String(source.closingHour).padStart(2, "0")}:00 hs) copiado a Lunes - Viernes.`,
    });
    setTimeout(() => setFeedback(null), 3500);
  };

  // Guardar Precios
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

  // Guardar Configuración del Negocio con Horarios por Día
  const handleSaveBusinessSettings = async (e: React.FormEvent) => {
    e.preventDefault();

    const openDays = Object.entries(scheduleByDay).filter(([_, v]) => v.isOpen);
    if (openDays.length === 0) {
      setFeedback({
        type: "error",
        message: "Debe haber al menos un día habilitado para la atención.",
      });
      return;
    }

    // Validar que cada día abierto tenga cierre > apertura
    for (const [dayKey, conf] of openDays) {
      if (conf.closingHour <= conf.openingHour) {
        const dayName = WEEK_DAYS.find((d) => d.id === Number(dayKey))?.name || "un día";
        setFeedback({
          type: "error",
          message: `El ${dayName} tiene un horario de cierre (${conf.closingHour}:00 hs) que debe ser posterior al de apertura (${conf.openingHour}:00 hs).`,
        });
        return;
      }
    }

    setSavingBusiness(true);
    try {
      const computedDaysOpen = openDays.map(([k]) => Number(k)).sort();
      const updatedSettings: BusinessSettings = {
        ...businessSettings,
        daysOpen: computedDaysOpen,
        scheduleByDay,
      };

      const res = await updateBusinessSettingsAction(updatedSettings);
      if (res.success) {
        setBusinessSettings(updatedSettings);
        setFeedback({
          type: "success",
          message: res.message || "Configuración y horarios individuales por día guardados con éxito.",
        });
      } else {
        setFeedback({
          type: "error",
          message: res.message || "Error al guardar la configuración.",
        });
      }
    } catch {
      setFeedback({
        type: "error",
        message: "Ocurrió un error inesperado al guardar los datos del negocio.",
      });
    } finally {
      setSavingBusiness(false);
      setTimeout(() => setFeedback(null), 4500);
    }
  };

  // Confirmar Cancelación
  const handleConfirmCancel = () => {
    if (!selectedToCancel) return;

    startTransition(async () => {
      const res = await cancelAppointmentByAdminAction(selectedToCancel.id, cancelReason);
      if (res.success && "message" in res) {
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

  // Enlace directo a WhatsApp del cliente
  const getClientWhatsAppUrl = (app: AppointmentItem) => {
    const rawDigits = app.clientPhone.replace(/\D/g, "");
    const formattedPhone = rawDigits.startsWith("54") ? rawDigits : `549${rawDigits}`;
    const { displayDate, timeStr } = getArgDateInfo(app.startTime);
    const message = `¡Hola ${app.clientName}! Te escribimos de ${businessSettings.businessName} con respecto a tu turno agendado para el ${displayDate} a las ${timeStr} hs (${app.serviceName}). ¡Te esperamos!`;
    return `https://wa.me/${formattedPhone}?text=${encodeURIComponent(message)}`;
  };

  const confirmedCount = appointments.filter((a) => a.status === "CONFIRMED").length;
  const cancelledCount = appointments.filter((a) => a.status !== "CONFIRMED").length;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-8">
      {/* Header del Dashboard */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-barber-border">
        <div>
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-bold tracking-tight text-barber-textPrimary">
              Panel de Administración
            </h1>
          </div>
          <p className="text-xs text-barber-textSecondary mt-1">
            Gestión de turnos por fecha/hora, horarios individuales por día y datos de {businessSettings.businessName}.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="px-3.5 py-2 rounded-xl bg-barber-card border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary flex items-center gap-1.5 transition-all"
          >
            <Scissors className="w-3.5 h-3.5 text-barber-gold" />
            Ver Web Pública
          </Link>

          <form action={logoutAdminAction}>
            <button
              type="submit"
              className="px-3.5 py-2 rounded-xl bg-red-950/40 hover:bg-red-950 border border-red-900/60 text-xs font-semibold text-red-300 flex items-center gap-1.5 transition-all cursor-pointer"
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
          className={`p-4 rounded-xl border text-xs flex items-center gap-2 animate-fadeIn shadow-lg ${
            feedback.type === "success"
              ? "bg-emerald-950/50 border-emerald-800 text-emerald-200"
              : "bg-red-950/50 border-red-800 text-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
          )}
          <span className="font-medium">{feedback.message}</span>
        </div>
      )}

      {/* Tarjetas de Estadísticas Principales */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-barber-textSecondary font-semibold">
            Turnos de Hoy
          </span>
          <p className="text-2xl font-black text-barber-gold">{counts.today}</p>
          <span className="text-[10px] text-barber-textSecondary block">Para atender hoy</span>
        </div>

        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-barber-textSecondary font-semibold">
            Turnos de Mañana
          </span>
          <p className="text-2xl font-black text-amber-300">{counts.tomorrow}</p>
          <span className="text-[10px] text-barber-textSecondary block">Agendados para mañana</span>
        </div>

        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-emerald-400 font-semibold">
            Total Activos
          </span>
          <p className="text-2xl font-black text-emerald-400">{confirmedCount}</p>
          <span className="text-[10px] text-barber-textSecondary block">En base de datos</span>
        </div>

        <div className="p-4 rounded-xl barber-panel border border-barber-border space-y-1">
          <span className="text-[11px] uppercase tracking-wider text-red-400 font-semibold">
            Cancelados
          </span>
          <p className="text-2xl font-black text-red-400">{cancelledCount}</p>
          <span className="text-[10px] text-barber-textSecondary block">Cupos liberados</span>
        </div>
      </div>

      {/* ========================================================================= */}
      {/* SECCIÓN PRINCIPAL: AGENDA INTUITIVA DE TURNOS CON FECHA Y HORA           */}
      {/* ========================================================================= */}
      <section className="barber-panel rounded-2xl border border-barber-border p-6 shadow-2xl space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-barber-border/70 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <CalendarDays className="w-5 h-5 text-barber-gold" />
              <h2 className="text-lg font-bold text-barber-textPrimary">
                Agenda de Turnos
              </h2>
            </div>
            <p className="text-xs text-barber-textSecondary mt-0.5">
              Visualizá los turnos organizados intuitivamente por fecha y horario de atención.
            </p>
          </div>

          {/* Selector de modo de vista (Agenda vs Tabla) */}
          <div className="flex items-center gap-2 self-start md:self-auto">
            <span className="text-xs text-barber-textSecondary font-medium">Vista:</span>
            <div className="flex items-center p-1 rounded-xl bg-barber-card border border-barber-border">
              <button
                type="button"
                onClick={() => setViewMode("AGENDA")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "AGENDA"
                    ? "bg-barber-gold text-barber-dark shadow-sm"
                    : "text-barber-textSecondary hover:text-barber-textPrimary"
                }`}
              >
                <LayoutGrid className="w-3.5 h-3.5" />
                Agenda Diaria
              </button>
              <button
                type="button"
                onClick={() => setViewMode("TABLE")}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                  viewMode === "TABLE"
                    ? "bg-barber-gold text-barber-dark shadow-sm"
                    : "text-barber-textSecondary hover:text-barber-textPrimary"
                }`}
              >
                <List className="w-3.5 h-3.5" />
                Tabla Compacta
              </button>
            </div>
          </div>
        </div>

        {/* Barra de Filtro de Fechas Rápido y Calendario */}
        <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-xl bg-barber-card/60 border border-barber-border/80">
          <div className="flex flex-wrap items-center gap-2">
            {/* Botón HOY */}
            <button
              type="button"
              onClick={() => setDateFilterMode("TODAY")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dateFilterMode === "TODAY"
                  ? "bg-barber-gold text-barber-dark shadow-md"
                  : "bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
              }`}
            >
              <span>Hoy</span>
              {counts.today > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    dateFilterMode === "TODAY" ? "bg-barber-dark text-barber-gold" : "bg-emerald-900 text-emerald-300"
                  }`}
                >
                  {counts.today}
                </span>
              )}
            </button>

            {/* Botón MAÑANA */}
            <button
              type="button"
              onClick={() => setDateFilterMode("TOMORROW")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all cursor-pointer ${
                dateFilterMode === "TOMORROW"
                  ? "bg-barber-gold text-barber-dark shadow-md"
                  : "bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
              }`}
            >
              <span>Mañana</span>
              {counts.tomorrow > 0 && (
                <span
                  className={`px-1.5 py-0.2 rounded-full text-[10px] font-bold ${
                    dateFilterMode === "TOMORROW" ? "bg-barber-dark text-barber-gold" : "bg-amber-900 text-amber-300"
                  }`}
                >
                  {counts.tomorrow}
                </span>
              )}
            </button>

            {/* Botón PRÓXIMOS 7 DÍAS */}
            <button
              type="button"
              onClick={() => setDateFilterMode("WEEK")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                dateFilterMode === "WEEK"
                  ? "bg-barber-gold text-barber-dark shadow-md font-bold"
                  : "bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
              }`}
            >
              <Clock3 className="w-3.5 h-3.5" />
              <span>Próximos 7 Días</span>
              {counts.week > 0 && (
                <span className="px-1.5 py-0.2 rounded-full text-[10px] font-bold bg-barber-border text-barber-textSecondary">
                  {counts.week}
                </span>
              )}
            </button>

            {/* Botón TODOS */}
            <button
              type="button"
              onClick={() => setDateFilterMode("ALL")}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                dateFilterMode === "ALL"
                  ? "bg-barber-gold text-barber-dark shadow-md font-bold"
                  : "bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
              }`}
            >
              Historial Completo
            </button>
          </div>

          {/* Selector de Fecha Específica con Botones Prev/Next */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] text-barber-textSecondary font-medium hidden sm:inline">
              Elegir fecha:
            </span>
            <button
              type="button"
              title="Día anterior"
              onClick={() => handleShiftCustomDate(-1)}
              className="p-1.5 rounded-lg bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary transition-all cursor-pointer"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>

            <div className="relative">
              <input
                type="date"
                value={customSelectedDate}
                onChange={(e) => {
                  setCustomSelectedDate(e.target.value);
                  setDateFilterMode("CUSTOM");
                }}
                className={`bg-barber-panel border rounded-lg px-2.5 py-1 text-xs font-mono text-barber-textPrimary focus:outline-none focus:border-barber-gold cursor-pointer ${
                  dateFilterMode === "CUSTOM" ? "border-barber-gold ring-1 ring-barber-gold/40" : "border-barber-border"
                }`}
              />
            </div>

            <button
              type="button"
              title="Día siguiente"
              onClick={() => handleShiftCustomDate(1)}
              className="p-1.5 rounded-lg bg-barber-panel border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary transition-all cursor-pointer"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Buscador y Filtro de Estados */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="w-full sm:w-80 relative">
            <Search className="w-4 h-4 text-barber-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Buscar por cliente, teléfono o servicio..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-barber-card border border-barber-border rounded-xl pl-10 pr-4 py-2 text-xs text-barber-textPrimary placeholder:text-barber-textSecondary/50 focus:outline-none focus:border-barber-gold transition-all"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-barber-textSecondary hover:text-barber-textPrimary"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <Filter className="w-3.5 h-3.5 text-barber-textSecondary" />
            <span className="text-xs text-barber-textSecondary">Estado:</span>
            {(["ALL", "CONFIRMED", "CANCELLED"] as const).map((filter) => (
              <button
                key={filter}
                type="button"
                onClick={() => setStatusFilter(filter)}
                className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                  statusFilter === filter
                    ? "bg-amber-500/20 text-amber-300 border border-amber-500/50"
                    : "bg-barber-card border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
                }`}
              >
                {filter === "ALL" && "Todos"}
                {filter === "CONFIRMED" && "Confirmados"}
                {filter === "CANCELLED" && "Cancelados"}
              </button>
            ))}
          </div>
        </div>

        {/* CONTENIDO DE TURNOS: MODO AGENDA (CARDS DIARIAS) */}
        {viewMode === "AGENDA" && (
          <div className="space-y-6">
            {groupedByDay.length === 0 ? (
              <div className="py-16 text-center barber-panel rounded-2xl border border-dashed border-barber-border/80 space-y-3">
                <CalendarX className="w-10 h-10 text-barber-textSecondary/40 mx-auto" />
                <div className="space-y-1">
                  <p className="text-sm font-semibold text-barber-textPrimary">
                    No hay turnos registrados para este criterio
                  </p>
                  <p className="text-xs text-barber-textSecondary max-w-sm mx-auto">
                    {dateFilterMode === "TODAY"
                      ? "Hoy no hay citas agendadas aún. Probá cambiar de fecha o seleccionar 'Próximos 7 Días'."
                      : "Probá limpiando los filtros de búsqueda o fecha seleccionada."}
                  </p>
                </div>
                {dateFilterMode !== "ALL" && (
                  <button
                    type="button"
                    onClick={() => setDateFilterMode("ALL")}
                    className="mt-2 px-4 py-1.5 rounded-xl bg-barber-card border border-barber-border text-xs font-semibold text-barber-gold hover:border-barber-gold transition-all cursor-pointer"
                  >
                    Ver Todo el Historial
                  </button>
                )}
              </div>
            ) : (
              groupedByDay.map((group) => {
                const isTodayGroup = group.dateKey === todayKey;
                const isTomorrowGroup = group.dateKey === tomorrowKey;
                const activeInGroup = group.items.filter((a) => a.status === "CONFIRMED").length;
                const totalRevenueInGroup = group.items
                  .filter((a) => a.status === "CONFIRMED")
                  .reduce((acc, cur) => acc + cur.priceArs, 0);

                return (
                  <div key={group.dateKey} className="space-y-3">
                    {/* Encabezado del Día */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 p-3 rounded-xl bg-barber-card border border-barber-border/80">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-barber-gold" />
                        <h3 className="font-bold text-sm text-barber-textPrimary capitalize">
                          {group.displayDate}
                        </h3>
                        {isTodayGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500 text-black">
                            HOY
                          </span>
                        )}
                        {isTomorrowGroup && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-400 text-black">
                            MAÑANA
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 text-xs text-barber-textSecondary">
                        <span>
                          <strong className="text-barber-textPrimary">{activeInGroup}</strong> turno(s) confirmado(s)
                        </span>
                        <span>•</span>
                        <span>
                          Ingresos estimados:{" "}
                          <strong className="text-barber-gold font-mono">
                            ${totalRevenueInGroup.toLocaleString("es-AR")} ARS
                          </strong>
                        </span>
                      </div>
                    </div>

                    {/* Lista cronológica de turnos del día */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                      {group.items.map((app) => {
                        const { timeStr } = getArgDateInfo(app.startTime);
                        const endInfo = getArgDateInfo(app.endTime);
                        const isConfirmed = app.status === "CONFIRMED";

                        return (
                          <div
                            key={app.id}
                            className={`p-4 rounded-xl border transition-all flex flex-col justify-between gap-3 shadow-sm ${
                              isConfirmed
                                ? "bg-barber-card/90 border-barber-border/90 hover:border-barber-gold/60"
                                : "bg-barber-panel/60 border-red-950/60 opacity-75"
                            }`}
                          >
                            {/* Fila Superior: Horario Grande + Estado */}
                            <div className="flex items-start justify-between gap-2">
                              <div className="flex items-center gap-2">
                                <div className="px-2.5 py-1.5 rounded-lg bg-barber-dark border border-barber-border flex items-center gap-1.5">
                                  <Clock className="w-3.5 h-3.5 text-barber-gold" />
                                  <span className="font-mono text-sm font-black text-barber-gold tracking-wide">
                                    {timeStr}
                                  </span>
                                  <span className="text-[11px] text-barber-textSecondary font-mono">
                                    - {endInfo.timeStr} hs
                                  </span>
                                </div>
                                <span className="text-[11px] text-barber-textSecondary font-medium">
                                  ({app.durationMinutes} min)
                                </span>
                              </div>

                              <div>
                                {isConfirmed ? (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                                    Confirmado
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800">
                                    <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                    Cancelado
                                  </span>
                                )}
                              </div>
                            </div>

                            {/* Datos del Cliente y Servicio */}
                            <div className="space-y-1.5 pt-1 border-t border-barber-border/40">
                              <div className="flex items-center justify-between">
                                <span className="font-bold text-sm text-barber-textPrimary flex items-center gap-1.5">
                                  <User className="w-3.5 h-3.5 text-barber-textSecondary" />
                                  {app.clientName}
                                </span>
                                <span className="font-mono text-xs font-bold text-barber-gold">
                                  ${app.priceArs.toLocaleString("es-AR")} ARS
                                </span>
                              </div>

                              <div className="flex items-center justify-between text-xs text-barber-textSecondary">
                                <span className="font-medium text-barber-textPrimary/90">
                                  {app.serviceName}
                                </span>
                                {app.beverageChoice && (
                                  <span className="text-[11px] font-semibold text-amber-300 bg-amber-950/40 px-2 py-0.5 rounded border border-amber-800/40 capitalize">
                                    🥤 {app.beverageChoice.replace("-", " ")}
                                  </span>
                                )}
                              </div>

                              <div className="flex items-center gap-1.5 text-xs font-mono text-barber-textSecondary">
                                <Phone className="w-3 h-3 text-barber-textSecondary" />
                                <span>{app.clientPhone}</span>
                              </div>
                            </div>

                            {/* Botones de Acción Inmediata (WhatsApp directo + Cancelar) */}
                            <div className="pt-2 border-t border-barber-border/40 flex items-center justify-between gap-2">
                              <a
                                href={getClientWhatsAppUrl(app)}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-3 py-1.5 rounded-lg bg-emerald-950/60 hover:bg-emerald-900 border border-emerald-800/80 text-[11px] font-semibold text-emerald-300 flex items-center gap-1.5 transition-all shadow-sm"
                              >
                                <MessageSquare className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Enviar WhatsApp</span>
                              </a>

                              {isConfirmed ? (
                                <button
                                  type="button"
                                  onClick={() => setSelectedToCancel(app)}
                                  className="px-2.5 py-1.5 rounded-lg bg-red-950/30 hover:bg-red-950/80 border border-red-900/50 text-[11px] font-medium text-red-300 transition-all cursor-pointer"
                                >
                                  Cancelar Turno
                                </button>
                              ) : (
                                <span className="text-[11px] text-barber-textSecondary/40 italic">
                                  Horario liberado
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* CONTENIDO DE TURNOS: MODO TABLA COMPACTA */}
        {viewMode === "TABLE" && (
          <div className="barber-panel rounded-xl border border-barber-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-barber-card/90 border-b border-barber-border text-barber-textSecondary uppercase tracking-wider text-[11px]">
                  <tr>
                    <th className="py-3 px-4">Fecha & Hora</th>
                    <th className="py-3 px-4">Servicio & Extra</th>
                    <th className="py-3 px-4">Cliente</th>
                    <th className="py-3 px-4">Teléfono</th>
                    <th className="py-3 px-4">Monto</th>
                    <th className="py-3 px-4">Estado</th>
                    <th className="py-3 px-4 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-barber-border/60">
                  {filteredAppointments.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-barber-textSecondary">
                        No se encontraron turnos con los filtros aplicados.
                      </td>
                    </tr>
                  ) : (
                    filteredAppointments.map((app) => {
                      const { displayDate, timeStr } = getArgDateInfo(app.startTime);
                      const isConfirmed = app.status === "CONFIRMED";

                      return (
                        <tr key={app.id} className="hover:bg-barber-card/40 transition-colors">
                          <td className="py-3 px-4 whitespace-nowrap">
                            <span className="font-mono font-bold text-barber-gold block">
                              {timeStr} hs
                            </span>
                            <span className="text-[11px] text-barber-textSecondary">
                              {displayDate}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            <span className="font-semibold text-barber-textPrimary block">
                              {app.serviceName}
                            </span>
                            {app.beverageChoice && (
                              <span className="text-[11px] text-amber-300 capitalize">
                                + {app.beverageChoice.replace("-", " ")}
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 font-medium text-barber-textPrimary">
                            {app.clientName}
                          </td>
                          <td className="py-3 px-4 font-mono text-barber-textSecondary whitespace-nowrap">
                            <a
                              href={getClientWhatsAppUrl(app)}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="hover:text-emerald-400 underline decoration-dotted flex items-center gap-1"
                            >
                              <MessageSquare className="w-3 h-3 text-emerald-400" />
                              {app.clientPhone}
                            </a>
                          </td>
                          <td className="py-3 px-4 font-mono font-bold text-barber-gold whitespace-nowrap">
                            ${app.priceArs.toLocaleString("es-AR")}
                          </td>
                          <td className="py-3 px-4 whitespace-nowrap">
                            {isConfirmed ? (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-950/80 text-emerald-300 border border-emerald-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                                Confirmado
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[11px] font-semibold bg-red-950/80 text-red-300 border border-red-800">
                                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
                                Cancelado
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-right whitespace-nowrap">
                            {isConfirmed ? (
                              <button
                                type="button"
                                onClick={() => setSelectedToCancel(app)}
                                className="px-2.5 py-1 rounded-lg bg-red-950/40 hover:bg-red-900/60 border border-red-800 text-[11px] font-semibold text-red-200 transition-all cursor-pointer"
                              >
                                Cancelar
                              </button>
                            ) : (
                              <span className="text-[11px] text-barber-textSecondary/50 italic">
                                Liberado
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      {/* ========================================================================= */}
      {/* SECCIÓN: CONFIGURACIÓN DEL LOCAL Y HORARIOS INDIVIDUALES POR DÍA         */}
      {/* ========================================================================= */}
      <form
        onSubmit={handleSaveBusinessSettings}
        className="barber-panel rounded-2xl border border-barber-border p-6 shadow-xl space-y-6"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-barber-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-barber-gold" />
            <h2 className="text-base font-bold text-barber-textPrimary">
              Configuración del Local y Horarios por Día
            </h2>
          </div>
          <span className="text-[11px] text-barber-textSecondary">
            Personalizá el horario de apertura y cierre para cada día de la semana.
          </span>
        </div>

        {/* Datos generales del Salón */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-barber-textSecondary flex items-center gap-1.5">
              <Building className="w-3.5 h-3.5 text-barber-gold" />
              Nombre del Local
            </label>
            <input
              type="text"
              required
              value={businessSettings.businessName}
              onChange={(e) =>
                setBusinessSettings((prev) => ({ ...prev, businessName: e.target.value }))
              }
              placeholder="Ej. Style Ponce"
              className="w-full bg-barber-card border border-barber-border rounded-xl px-3.5 py-2 text-xs text-barber-textPrimary focus:outline-none focus:border-barber-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-barber-textSecondary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-barber-gold" />
              Dirección del Salón
            </label>
            <input
              type="text"
              required
              value={businessSettings.address}
              onChange={(e) =>
                setBusinessSettings((prev) => ({ ...prev, address: e.target.value }))
              }
              placeholder="Ej. Av. San Martín 450"
              className="w-full bg-barber-card border border-barber-border rounded-xl px-3.5 py-2 text-xs text-barber-textPrimary focus:outline-none focus:border-barber-gold"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-barber-textSecondary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-barber-gold" />
              Ciudad / Provincia
            </label>
            <input
              type="text"
              required
              value={businessSettings.city}
              onChange={(e) =>
                setBusinessSettings((prev) => ({ ...prev, city: e.target.value }))
              }
              placeholder="Ej. Río Cuarto, Córdoba"
              className="w-full bg-barber-card border border-barber-border rounded-xl px-3.5 py-2 text-xs text-barber-textPrimary focus:outline-none focus:border-barber-gold"
            />
          </div>
        </div>

        {/* WhatsApp Comercial */}
        <div className="pt-2 border-t border-barber-border/40">
          <div className="max-w-md space-y-1.5">
            <label className="text-xs font-semibold text-barber-textSecondary flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-emerald-400" />
              WhatsApp Comercial (Recepción de Comprobantes de Turnos)
            </label>
            <input
              type="text"
              required
              value={businessSettings.whatsappNumber}
              onChange={(e) =>
                setBusinessSettings((prev) => ({ ...prev, whatsappNumber: e.target.value }))
              }
              placeholder="Ej. 3582435386"
              className="w-full bg-barber-card border border-barber-border rounded-xl px-3.5 py-2 text-xs font-mono text-barber-textPrimary focus:outline-none focus:border-barber-gold"
            />
            <p className="text-[10px] text-barber-textSecondary/70">
              Número al que los clientes envían su comprobante y confirmación directa.
            </p>
          </div>
        </div>

        {/* ========================================================================= */}
        {/* GRILLA DE HORARIOS INDIVIDUALES POR DÍA (Lunes a Domingo)                */}
        {/* ========================================================================= */}
        <div className="pt-3 border-t border-barber-border/40 space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-1">
            <label className="text-xs font-bold text-barber-textPrimary flex items-center gap-1.5">
              <Clock className="w-4 h-4 text-barber-gold" />
              Horario de Atención Específico por Día
            </label>
            <span className="text-[11px] text-barber-textSecondary">
              Activá o desactivá cada día y elegí el horario exacto de apertura y cierre.
            </span>
          </div>

          <div className="grid grid-cols-1 gap-2.5">
            {WEEK_DAYS.map((day) => {
              const conf = scheduleByDay[day.id] || { isOpen: true, openingHour: 9, closingHour: 19 };
              const isOpen = conf.isOpen;
              const hoursCount = conf.closingHour - conf.openingHour;
              const hasInvalidOrder = isOpen && conf.closingHour <= conf.openingHour;

              return (
                <div
                  key={day.id}
                  className={`p-3.5 rounded-xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-3 ${
                    isOpen
                      ? "bg-barber-card/80 border-barber-border/90 hover:border-barber-gold/40"
                      : "bg-barber-panel/40 border-barber-border/40 opacity-60"
                  }`}
                >
                  {/* Identificador del Día + Toggle Abierto/Cerrado */}
                  <div className="flex items-center gap-3 min-w-[160px]">
                    <button
                      type="button"
                      onClick={() => handleToggleDayOpen(day.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                        isOpen
                          ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm"
                          : "bg-barber-dark border border-barber-border text-barber-textSecondary hover:text-barber-textPrimary"
                      }`}
                    >
                      {isOpen ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-400" />
                          <span>Abierto</span>
                        </>
                      ) : (
                        <span>Cerrado</span>
                      )}
                    </button>
                    <span className="font-bold text-xs text-barber-textPrimary">{day.name}</span>
                  </div>

                  {/* Configuración de Horas de Apertura y Cierre */}
                  {isOpen ? (
                    <div className="flex flex-wrap items-center gap-3">
                      {/* Apertura */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-barber-textSecondary">Abre:</span>
                        <select
                          value={conf.openingHour}
                          onChange={(e) =>
                            handleUpdateDayHour(day.id, "openingHour", parseInt(e.target.value, 10))
                          }
                          className="bg-barber-dark border border-barber-border rounded-lg px-2 py-1 text-xs text-barber-textPrimary font-mono focus:outline-none focus:border-barber-gold cursor-pointer"
                        >
                          {Array.from({ length: 24 }, (_, i) => (
                            <option key={i} value={i}>
                              {String(i).padStart(2, "0")}:00 hs
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Cierre */}
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] text-barber-textSecondary">Cierra:</span>
                        <select
                          value={conf.closingHour}
                          onChange={(e) =>
                            handleUpdateDayHour(day.id, "closingHour", parseInt(e.target.value, 10))
                          }
                          className="bg-barber-dark border border-barber-border rounded-lg px-2 py-1 text-xs text-barber-textPrimary font-mono focus:outline-none focus:border-barber-gold cursor-pointer"
                        >
                          {Array.from({ length: 24 }, (_, i) => {
                            const h = i + 1;
                            return (
                              <option key={h} value={h}>
                                {h === 24 ? "24:00 hs" : `${String(h).padStart(2, "0")}:00 hs`}
                              </option>
                            );
                          })}
                        </select>
                      </div>

                      {/* Info de horas del día */}
                      {!hasInvalidOrder ? (
                        <span className="text-[10px] text-emerald-400 font-mono bg-emerald-950/40 border border-emerald-900/60 px-2 py-0.5 rounded">
                          {hoursCount} hs de atención
                        </span>
                      ) : (
                        <span className="text-[10px] text-red-400 font-bold bg-red-950/60 border border-red-900 px-2 py-0.5 rounded">
                          Cierre debe ser mayor a apertura
                        </span>
                      )}

                      {/* Botón copiar a semana */}
                      {day.id === 1 && (
                        <button
                          type="button"
                          onClick={() => handleCopyDayScheduleToWeek(day.id)}
                          className="px-2 py-1 rounded bg-barber-panel border border-barber-border text-[10px] text-barber-textSecondary hover:text-barber-textPrimary flex items-center gap-1 transition-all cursor-pointer"
                          title="Copiar este mismo horario de Lunes a los demás días hábiles (Mar a Vie)"
                        >
                          <Copy className="w-3 h-3 text-barber-gold" />
                          <span>Copiar a Lun-Vie</span>
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="text-xs text-barber-textSecondary/50 italic">
                      Día no disponible para reservas públicas.
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="pt-3 border-t border-barber-border/60 flex justify-end">
          <button
            type="submit"
            disabled={savingBusiness}
            className="px-6 py-2.5 rounded-xl bg-barber-gold hover:bg-yellow-500 text-barber-dark font-bold text-xs flex items-center gap-2 transition-all shadow-md cursor-pointer disabled:opacity-50"
          >
            {savingBusiness ? (
              <>
                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                <span>Guardando horarios por día...</span>
              </>
            ) : (
              <>
                <Save className="w-3.5 h-3.5" />
                <span>Guardar Configuración y Horarios</span>
              </>
            )}
          </button>
        </div>
      </form>

      {/* ========================================================================= */}
      {/* SECCIÓN: CONFIGURACIÓN DE PRECIOS DE SERVICIOS                            */}
      {/* ========================================================================= */}
      <div className="barber-panel rounded-2xl border border-barber-border p-6 shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 border-b border-barber-border/60 pb-3">
          <div className="flex items-center gap-2">
            <Tag className="w-4 h-4 text-barber-gold" />
            <h2 className="text-base font-bold text-barber-textPrimary">
              Configuración de Precios de Servicios
            </h2>
          </div>
          <span className="text-[11px] text-barber-textSecondary">
            Los precios guardados se actualizan de inmediato en la web pública y en cada nueva reserva.
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

      {/* Modal de Cancelación Administrativa */}
      {selectedToCancel && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fadeIn">
          <div className="w-full max-w-md barber-panel rounded-2xl p-6 border border-barber-border shadow-2xl relative">
            <button
              type="button"
              onClick={() => setSelectedToCancel(null)}
              className="absolute top-4 right-4 text-barber-textSecondary hover:text-barber-textPrimary cursor-pointer"
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
                    Cliente: {selectedToCancel.clientName} (
                    {getArgDateInfo(selectedToCancel.startTime).displayDate} -{" "}
                    {getArgDateInfo(selectedToCancel.startTime).timeStr} hs)
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
                  className="w-full bg-barber-card border border-barber-border rounded-xl px-3 py-2.5 text-xs text-barber-textPrimary focus:outline-none focus:border-barber-gold cursor-pointer"
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
                  className="px-4 py-2 rounded-xl border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary cursor-pointer"
                >
                  Volver
                </button>

                <button
                  type="button"
                  disabled={isPending}
                  onClick={handleConfirmCancel}
                  className="px-4 py-2 rounded-xl bg-red-700 hover:bg-red-600 font-bold text-xs text-white transition-all shadow-md shadow-red-950 cursor-pointer disabled:opacity-50"
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
