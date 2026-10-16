"use client";

import React, { useState, useEffect, useTransition } from "react";
import {
  SERVICES_CATALOG,
  BEVERAGE_OPTIONS,
  BUSINESS_CONFIG,
} from "@/lib/catalog";
import { ServiceId, ServiceDefinition, AvailableSlot, BookingResult, BusinessSettings } from "@/types/booking";
import {
  fetchAvailableSlotsAction,
  submitBookingAction,
} from "@/app/actions/booking";
import {
  Scissors,
  Coffee,
  Calendar,
  Clock,
  User,
  Phone,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  ArrowLeft,
  Copy,
  Check,
  ShieldCheck,
  Sparkles,
  MessageCircle,
} from "lucide-react";

interface BookingWizardProps {
  servicesConfig?: Record<ServiceId, ServiceDefinition>;
  businessSettings?: BusinessSettings;
}

const defaultSettings: BusinessSettings = {
  businessName: "Style Ponce",
  address: "Centro, Río Cuarto",
  city: "Río Cuarto, Córdoba",
  whatsappNumber: "3582435386",
  openingHour: 9,
  closingHour: 19,
  daysOpen: [1, 2, 3, 4, 5, 6],
};

export function BookingWizard({
  servicesConfig = SERVICES_CATALOG,
  businessSettings = defaultSettings,
}: BookingWizardProps = {}) {
  // Estado del flujo
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selecciones del cliente
  const [serviceId, setServiceId] = useState<ServiceId>("corte-tradicional");
  const [beverageChoice, setBeverageChoice] = useState<string>("coca-cola");
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<AvailableSlot | null>(null);
  const [clientName, setClientName] = useState("");
  const [clientPhone, setClientPhone] = useState("");

  // Slots disponibles y carga
  const [slots, setSlots] = useState<AvailableSlot[]>([]);
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [isPending, startTransition] = useTransition();

  // Resultado de la acción de reserva
  const [bookingResult, setBookingResult] = useState<BookingResult | null>(null);
  const [copiedLink, setCopiedLink] = useState(false);

  // Generar lista de próximos 14 días laborables (excluyendo domingos)
  const [availableDates, setAvailableDates] = useState<
    Array<{ dateStr: string; labelDay: string; labelDate: string }>
  >([]);

  useEffect(() => {
    const dates: Array<{ dateStr: string; labelDay: string; labelDate: string }> = [];
    const today = new Date();

    const daysOfWeek = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
    const months = [
      "Ene", "Feb", "Mar", "Abr", "May", "Jun",
      "Jul", "Ago", "Sep", "Oct", "Nov", "Dic"
    ];

    let current = new Date(today);
    // Empezar a buscar desde hoy filtrando por los días configurados en el negocio
    while (dates.length < 12) {
      const dayOfWeek = current.getDay();
      const isDayOpen = businessSettings.scheduleByDay
        ? businessSettings.scheduleByDay[dayOfWeek]?.isOpen
        : businessSettings.daysOpen.includes(dayOfWeek);

      if (isDayOpen) {
        const yyyy = current.getFullYear();
        const mm = String(current.getMonth() + 1).padStart(2, "0");
        const dd = String(current.getDate()).padStart(2, "0");
        const dateStr = `${yyyy}-${mm}-${dd}`;

        dates.push({
          dateStr,
          labelDay: daysOfWeek[dayOfWeek],
          labelDate: `${current.getDate()} ${months[current.getMonth()]}`,
        });
      }
      current.setDate(current.getDate() + 1);
    }

    setAvailableDates(dates);
    if (dates.length > 0) {
      setSelectedDate(dates[0].dateStr);
    }
  }, [businessSettings.daysOpen, businessSettings.scheduleByDay]);

  // Cargar slots cuando cambia la fecha o el servicio
  useEffect(() => {
    if (!selectedDate || !serviceId) return;

    let isMounted = true;
    setLoadingSlots(true);
    setSelectedSlot(null);

    fetchAvailableSlotsAction(selectedDate, serviceId)
      .then((data) => {
        if (isMounted) {
          setSlots(data);
          setLoadingSlots(false);
        }
      })
      .catch(() => {
        if (isMounted) {
          setSlots([]);
          setLoadingSlots(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [selectedDate, serviceId]);

  // Manejador del envío final del formulario
  const handleConfirmBooking = () => {
    if (!selectedSlot) return;

    startTransition(async () => {
      const formData = new FormData();
      formData.set("serviceId", serviceId);
      if (serviceId === "combo-corte-bebida") {
        formData.set("beverageChoice", beverageChoice);
      }
      formData.set("startDateTimeIso", selectedSlot.startIso);
      formData.set("clientName", clientName);
      formData.set("clientPhone", clientPhone);

      const result = await submitBookingAction(null, formData);
      setBookingResult(result);

      if (result.success) {
        setStep(4);
      } else if (result.error.code === "SLOT_OCCUPIED") {
        // Si colisionó, volver a cargar la grilla de slots y alertar al cliente
        setStep(2);
        fetchAvailableSlotsAction(selectedDate, serviceId).then(setSlots);
      }
    });
  };

  const copyCancellationLink = () => {
    if (!bookingResult || !bookingResult.success) return;
    const link = `${window.location.origin}/cancelar?token=${bookingResult.data.cancelToken}`;
    navigator.clipboard.writeText(link);
    setCopiedLink(true);
    setTimeout(() => setCopiedLink(false), 3000);
  };

  return (
    <div className="w-full max-w-3xl mx-auto">
      {/* Pasos / Stepper */}
      {step < 4 && (
        <div className="mb-8">
          <div className="flex items-center justify-between relative px-2">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-barber-border -translate-y-1/2 z-0" />
            {[
              { num: 1, label: "Servicio" },
              { num: 2, label: "Fecha y Hora" },
              { num: 3, label: "Tus Datos" },
            ].map((s) => {
              const active = step === s.num;
              const done = step > s.num;
              return (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs transition-all ${
                      active
                        ? "bg-barber-gold text-barber-dark ring-4 ring-barber-gold/20"
                        : done
                        ? "bg-emerald-600 text-white"
                        : "bg-barber-card border border-barber-border text-barber-textSecondary"
                    }`}
                  >
                    {done ? "✓" : s.num}
                  </div>
                  <span
                    className={`text-xs mt-2 font-medium tracking-wide ${
                      active ? "text-barber-gold" : "text-barber-textSecondary"
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Contenedor Principal del Wizard */}
      <div className="barber-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        {/* Decoración superior sutil */}
        <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-transparent via-barber-gold to-transparent opacity-40" />

        {/* ALERTA DE ERROR GENERAL / CONFLICTO */}
        {bookingResult && !bookingResult.success && (
          <div className="mb-6 p-4 rounded-xl bg-red-950/40 border border-red-800/60 text-red-200 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
            <div>
              <p className="font-semibold text-sm">{bookingResult.error.message}</p>
              {bookingResult.error.code === "SLOT_OCCUPIED" && (
                <p className="text-xs text-red-300/90 mt-1">
                  La agenda se actualizó automáticamente para mostrarte los horarios libres reales.
                </p>
              )}
            </div>
          </div>
        )}

        {/* PASO 1: SELECCIÓN DE SERVICIO */}
        {step === 1 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-barber-textPrimary flex items-center gap-2">
                <Scissors className="w-5 h-5 text-barber-gold" />
                Elegí tu Servicio
              </h2>
              <p className="text-sm text-barber-textSecondary mt-1">
                Atención personalizada a cargo de nuestro barbero titular.
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {Object.values(servicesConfig).map((serv) => {
                const selected = serviceId === serv.id;
                return (
                  <div
                    key={serv.id}
                    onClick={() => setServiceId(serv.id)}
                    className={`cursor-pointer rounded-xl p-5 border transition-all text-left relative flex flex-col justify-between ${
                      selected
                        ? "bg-barber-gold/10 border-barber-gold shadow-lg shadow-barber-gold/5"
                        : "bg-barber-card/60 border-barber-border hover:border-barber-border/90 hover:bg-barber-card"
                    }`}
                  >
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-bold text-base text-barber-textPrimary">
                          {serv.name}
                        </span>
                        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-barber-panel border border-barber-border text-barber-gold">
                          {serv.durationMinutes} min
                        </span>
                      </div>
                      <p className="text-xs text-barber-textSecondary leading-relaxed mb-4">
                        {serv.description}
                      </p>
                    </div>

                    <div className="pt-3 border-t border-barber-border/60 flex items-center justify-between">
                      <div>
                        <span className="text-lg font-bold text-barber-textPrimary">
                          ${serv.priceArs.toLocaleString("es-AR")} ARS
                        </span>
                        {serv.isProvisionalPricing && (
                          <span className="block text-[10px] text-amber-400/90 font-medium">
                            *Precio provisional demo
                          </span>
                        )}
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border flex items-center justify-center ${
                          selected
                            ? "border-barber-gold bg-barber-gold text-barber-dark font-bold text-xs"
                            : "border-barber-border"
                        }`}
                      >
                        {selected && "✓"}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Sub-selección de bebida si eligió combo */}
            {serviceId === "combo-corte-bebida" && (
              <div className="pt-4 border-t border-barber-border/80 space-y-3 animate-fadeIn">
                <label className="text-xs font-semibold uppercase tracking-wider text-barber-gold flex items-center gap-1.5">
                  <Coffee className="w-4 h-4" />
                  Elegí la Bebida para tu Combo
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {BEVERAGE_OPTIONS.map((bev) => (
                    <label
                      key={bev.id}
                      className={`flex items-center justify-between p-3.5 rounded-lg border cursor-pointer text-xs transition-all ${
                        beverageChoice === bev.id
                          ? "bg-barber-gold/15 border-barber-gold text-barber-textPrimary font-semibold"
                          : "bg-barber-card border-barber-border text-barber-textSecondary hover:border-barber-border/90"
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="radio"
                          name="beverageChoice"
                          value={bev.id}
                          checked={beverageChoice === bev.id}
                          onChange={() => setBeverageChoice(bev.id)}
                          className="accent-barber-gold"
                        />
                        <span>{bev.label}</span>
                      </div>
                      {bev.isAlcoholic && (
                        <span className="text-[10px] bg-red-950/60 text-red-300 border border-red-800/40 px-1.5 py-0.5 rounded">
                          +18
                        </span>
                      )}
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="pt-4 flex justify-end">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-6 py-3 rounded-xl bg-barber-gold hover:bg-barber-goldHover text-barber-dark font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-barber-gold/20"
              >
                Siguiente: Seleccionar Horario
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 2: SELECCIÓN DE FECHA Y HORARIO */}
        {step === 2 && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-barber-textPrimary flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-barber-gold" />
                  Elegí Día y Horario
                </h2>
                <p className="text-sm text-barber-textSecondary mt-1">
                  Horarios calculados en tiempo real para {SERVICES_CATALOG[serviceId].name} ({SERVICES_CATALOG[serviceId].durationMinutes} min).
                </p>
              </div>
              <button
                type="button"
                onClick={() => setStep(1)}
                className="text-xs text-barber-textSecondary hover:text-barber-textPrimary flex items-center gap-1"
              >
                <ArrowLeft className="w-3.5 h-3.5" />
                Cambiar servicio
              </button>
            </div>

            {/* Carrusel de días disponibles */}
            <div>
              <span className="text-xs font-semibold uppercase tracking-wider text-barber-textSecondary mb-2 block">
                Día de la reserva
              </span>
              <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                {availableDates.map((d) => {
                  const isSelected = selectedDate === d.dateStr;
                  return (
                    <button
                      key={d.dateStr}
                      type="button"
                      onClick={() => setSelectedDate(d.dateStr)}
                      className={`min-w-20 p-3 rounded-xl border text-center transition-all shrink-0 ${
                        isSelected
                          ? "bg-barber-gold text-barber-dark border-barber-gold font-bold shadow-md shadow-barber-gold/20"
                          : "bg-barber-card/80 border-barber-border text-barber-textSecondary hover:border-barber-border/90 hover:text-barber-textPrimary"
                      }`}
                    >
                      <span className="block text-[11px] uppercase tracking-wider">
                        {d.labelDay}
                      </span>
                      <span className="block text-sm font-bold mt-0.5">
                        {d.labelDate}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Grilla de horarios libres */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold uppercase tracking-wider text-barber-textSecondary flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-barber-gold" />
                  Horarios Disponibles
                </span>
                <span className="text-[11px] text-barber-textSecondary">
                  Zona: Buenos Aires (UTC-3)
                </span>
              </div>

              {loadingSlots ? (
                <div className="py-12 text-center text-sm text-barber-textSecondary flex flex-col items-center justify-center gap-2">
                  <div className="w-6 h-6 border-2 border-barber-gold border-t-transparent rounded-full animate-spin" />
                  Consultando agenda autoritativa...
                </div>
              ) : slots.length === 0 ? (
                <div className="py-10 text-center rounded-xl bg-barber-card/40 border border-barber-border p-6 text-sm text-barber-textSecondary">
                  <p className="font-semibold text-barber-textPrimary">
                    No hay turnos disponibles para esta fecha.
                  </p>
                  <p className="text-xs mt-1">
                    Todos los horarios están reservados o el salón se encuentra cerrado. Por favor elegí otro día.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5 max-h-60 overflow-y-auto pr-1">
                  {slots.map((s) => {
                    const isSelected = selectedSlot?.startIso === s.startIso;
                    return (
                      <button
                        key={s.startIso}
                        type="button"
                        onClick={() => setSelectedSlot(s)}
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold tracking-wider transition-all ${
                          isSelected
                            ? "bg-barber-gold text-barber-dark border-barber-gold shadow-md shadow-barber-gold/20"
                            : "bg-barber-card border-barber-border text-barber-textPrimary hover:border-barber-gold/60"
                        }`}
                      >
                        {s.label}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-barber-border/80">
              <button
                type="button"
                onClick={() => setStep(1)}
                className="px-5 py-2.5 rounded-xl border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary hover:bg-barber-card"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={!selectedSlot}
                onClick={() => setStep(3)}
                className={`px-6 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  selectedSlot
                    ? "bg-barber-gold hover:bg-barber-goldHover text-barber-dark shadow-lg shadow-barber-gold/20 cursor-pointer"
                    : "bg-barber-card border border-barber-border text-barber-textSecondary/50 cursor-not-allowed"
                }`}
              >
                Continuar a tus Datos
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* PASO 3: DATOS DE CONTACTO Y CONFIRMACIÓN */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-barber-textPrimary flex items-center gap-2">
                <User className="w-5 h-5 text-barber-gold" />
                Completá tus Datos
              </h2>
              <p className="text-sm text-barber-textSecondary mt-1">
                Solo solicitamos lo mínimo necesario para identificar y gestionar tu turno.
              </p>
            </div>

            {/* Resumen del turno */}
            <div className="p-4 rounded-xl bg-barber-card/80 border border-barber-border space-y-2 text-xs">
              <div className="flex justify-between items-center text-barber-textSecondary">
                <span>Servicio:</span>
                <span className="font-semibold text-barber-textPrimary">
                  {SERVICES_CATALOG[serviceId].name}
                  {serviceId === "combo-corte-bebida" && ` + ${beverageChoice === "cerveza-brahma" ? "Cerveza Brahma" : "Coca-Cola"}`}
                </span>
              </div>
              <div className="flex justify-between items-center text-barber-textSecondary">
                <span>Horario:</span>
                <span className="font-semibold text-barber-textPrimary">
                  {selectedSlot?.label} (Duración {SERVICES_CATALOG[serviceId].durationMinutes} min)
                </span>
              </div>
              <div className="flex justify-between items-center text-barber-textSecondary">
                <span>Barbero:</span>
                <span className="font-semibold text-barber-textPrimary">
                  {BUSINESS_CONFIG.barberName}
                </span>
              </div>
              <div className="pt-2 border-t border-barber-border flex justify-between items-center text-sm font-bold">
                <span className="text-barber-textSecondary">Total a abonar en el local:</span>
                <span className="text-barber-gold text-base">
                  ${SERVICES_CATALOG[serviceId].priceArs.toLocaleString("es-AR")} ARS
                </span>
              </div>
            </div>

            {/* Formulario de contacto */}
            <div className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-barber-textSecondary mb-1.5 block">
                  Nombre completo *
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-barber-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    required
                    placeholder="Ej. Lautaro Rossi"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full bg-barber-card border border-barber-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-barber-textPrimary placeholder:text-barber-textSecondary/40 focus:outline-none focus:border-barber-gold"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-barber-textSecondary mb-1.5 block">
                  Número de teléfono celular (WhatsApp) *
                </label>
                <div className="relative">
                  <Phone className="w-4 h-4 text-barber-textSecondary absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="tel"
                    required
                    placeholder="Ej. 11 2345-6789"
                    value={clientPhone}
                    onChange={(e) => setClientPhone(e.target.value)}
                    className="w-full bg-barber-card border border-barber-border rounded-xl pl-10 pr-4 py-2.5 text-sm text-barber-textPrimary placeholder:text-barber-textSecondary/40 focus:outline-none focus:border-barber-gold"
                  />
                </div>
                <p className="text-[11px] text-barber-textSecondary/70 mt-1 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
                  Sin spam. Tus datos se guardan de forma privada y protegida.
                </p>
              </div>
            </div>

            <div className="pt-4 flex items-center justify-between border-t border-barber-border/80">
              <button
                type="button"
                onClick={() => setStep(2)}
                className="px-5 py-2.5 rounded-xl border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary hover:bg-barber-card"
              >
                Volver
              </button>

              <button
                type="button"
                disabled={isPending || clientName.trim().length < 2 || clientPhone.trim().length < 8}
                onClick={handleConfirmBooking}
                className={`px-7 py-3 rounded-xl font-bold text-sm flex items-center gap-2 transition-all ${
                  isPending || clientName.trim().length < 2 || clientPhone.trim().length < 8
                    ? "bg-barber-card border border-barber-border text-barber-textSecondary/50 cursor-not-allowed"
                    : "bg-emerald-600 hover:bg-emerald-500 text-white shadow-lg shadow-emerald-900/40 cursor-pointer"
                }`}
              >
                {isPending ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Confirmando en servidor...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    Confirmar Reserva
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* PASO 4: CONFIRMACIÓN EXITOSA Y TOKEN DE CANCELACIÓN */}
        {step === 4 && bookingResult && bookingResult.success && (
          <div className="text-center space-y-6 py-4 animate-fadeIn">
            <div className="w-16 h-16 rounded-full bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center mx-auto text-emerald-400">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <span className="text-xs font-bold uppercase tracking-widest text-emerald-400">
                ¡Reserva Confirmada!
              </span>
              <h2 className="text-2xl sm:text-3xl font-extrabold text-barber-textPrimary mt-1">
                Te esperamos, {bookingResult.data.clientName}
              </h2>
              <p className="text-xs text-barber-textSecondary mt-2">
                Código de turno: <span className="font-mono text-barber-textPrimary">{bookingResult.data.bookingId.slice(0, 8)}</span>
              </p>
            </div>

            <div className="max-w-md mx-auto p-5 rounded-xl bg-barber-card border border-barber-border text-left space-y-3 text-xs">
              <div className="flex justify-between">
                <span className="text-barber-textSecondary">Servicio:</span>
                <span className="font-bold text-barber-textPrimary">{bookingResult.data.serviceName}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-barber-textSecondary">Horario asignado:</span>
                <span className="font-bold text-barber-gold">{selectedSlot?.label}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-barber-textSecondary">Precio informado:</span>
                <span className="font-bold text-barber-textPrimary">${bookingResult.data.priceArs.toLocaleString("es-AR")} ARS</span>
              </div>
              <div className="flex justify-between">
                <span className="text-barber-textSecondary">Dirección:</span>
                <span className="font-medium text-barber-textPrimary">{businessSettings.address}, {businessSettings.city}</span>
              </div>
            </div>

            {/* Botón directo de confirmación a WhatsApp */}
            {(() => {
              const cleanPhone = businessSettings.whatsappNumber.replace(/[^0-9]/g, "");
              const formattedPhone = cleanPhone.startsWith("54") ? cleanPhone : `549${cleanPhone}`;
              const dateFormatted = selectedSlot?.label ? `${selectedSlot.label} (${selectedDate})` : selectedDate;
              const waText = encodeURIComponent(
                `¡Hola ${businessSettings.businessName}! 👋 Acabo de reservar mi turno desde la web:\n\n` +
                `💈 *Servicio:* ${bookingResult.data.serviceName}\n` +
                (beverageChoice && serviceId === "combo-corte-bebida" ? `🥤 *Bebida:* ${beverageChoice === "coca-cola" ? "Coca-Cola" : "Cerveza Brahma"}\n` : "") +
                `📅 *Horario:* ${dateFormatted}\n` +
                `👤 *Cliente:* ${bookingResult.data.clientName}\n` +
                `📱 *Teléfono:* ${clientPhone}\n` +
                `💰 *Total:* $${bookingResult.data.priceArs.toLocaleString("es-AR")} ARS\n` +
                `📍 *Dirección:* ${businessSettings.address}, ${businessSettings.city}\n` +
                `🔑 *Código de Turno:* ${bookingResult.data.bookingId.slice(0, 8)}\n\n` +
                `¡Muchas gracias!`
              );
              const whatsappUrl = `https://wa.me/${formattedPhone}?text=${waText}`;

              return (
                <div className="max-w-md mx-auto space-y-2 pt-1">
                  <a
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full py-3.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-950/40 transition-all transform hover:-translate-y-0.5 cursor-pointer"
                  >
                    <MessageCircle className="w-4 h-4 fill-current" />
                    <span>Enviar Aviso por WhatsApp</span>
                  </a>
                  <p className="text-[11px] text-barber-textSecondary">
                    Hacé clic para enviar automáticamente los datos de tu turno al WhatsApp del local ({businessSettings.whatsappNumber}).
                  </p>
                </div>
              );
            })()}

            {/* Token y enlace de cancelación seguro */}
            <div className="max-w-md mx-auto p-4 rounded-xl bg-barber-panel border border-barber-border text-left space-y-2">
              <span className="text-[11px] font-semibold text-barber-gold uppercase tracking-wider block">
                ¿Necesitás cancelar o reprogramar?
              </span>
              <p className="text-xs text-barber-textSecondary">
                Guardá este enlace de cancelación seguro. Es exclusivo para tu turno y te permite liberar el horario con un solo clic:
              </p>
              <div className="flex items-center gap-2 pt-1">
                <input
                  type="text"
                  readOnly
                  value={
                    typeof window !== "undefined"
                      ? `${window.location.origin}/cancelar?token=${bookingResult.data.cancelToken}`
                      : ""
                  }
                  className="w-full bg-barber-dark border border-barber-border rounded-lg px-3 py-2 text-xs font-mono text-barber-textSecondary truncate select-all"
                />
                <button
                  type="button"
                  onClick={copyCancellationLink}
                  className="px-3 py-2 rounded-lg bg-barber-card hover:bg-barber-card/80 border border-barber-border text-xs font-medium text-barber-textPrimary flex items-center gap-1.5 shrink-0"
                >
                  {copiedLink ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  {copiedLink ? "Copiado" : "Copiar"}
                </button>
              </div>
            </div>

            <div className="pt-2">
              <button
                type="button"
                onClick={() => {
                  setStep(1);
                  setBookingResult(null);
                  setSelectedSlot(null);
                }}
                className="px-6 py-2.5 rounded-xl border border-barber-border text-xs font-semibold text-barber-textSecondary hover:text-barber-textPrimary hover:bg-barber-card transition-all"
              >
                Hacer otra reserva
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
