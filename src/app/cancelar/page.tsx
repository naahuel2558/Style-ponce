import { getBookingSummaryByToken } from "@/lib/db";
import { CancelForm } from "./CancelForm";
import { AlertCircle, CalendarX } from "lucide-react";
import Link from "next/link";

interface CancelPageProps {
  searchParams: Promise<{ token?: string }>;
}

export default async function CancelPage({ searchParams }: CancelPageProps) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800 flex items-center justify-center mx-auto text-red-400">
          <AlertCircle className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-barber-textPrimary">Enlace no válido</h1>
        <p className="text-xs text-barber-textSecondary">
          No se proporcionó ningún token de cancelación válido en la dirección web.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-barber-card border border-barber-border text-xs font-semibold text-barber-textPrimary hover:bg-barber-card/80"
        >
          Ir al Inicio
        </Link>
      </div>
    );
  }

  const booking = getBookingSummaryByToken(token);

  if (!booking) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-950/40 border border-red-800 flex items-center justify-center mx-auto text-red-400">
          <CalendarX className="w-6 h-6" />
        </div>
        <h1 className="text-xl font-bold text-barber-textPrimary">Turno no encontrado</h1>
        <p className="text-xs text-barber-textSecondary">
          El enlace de cancelación no corresponde a ningún turno activo registrado en el sistema.
        </p>
        <Link
          href="/"
          className="inline-block mt-4 px-5 py-2.5 rounded-xl bg-barber-card border border-barber-border text-xs font-semibold text-barber-textPrimary hover:bg-barber-card/80"
        >
          Volver a la página principal
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-lg mx-auto px-4 py-12">
      <div className="barber-panel rounded-2xl p-6 sm:p-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 right-0 h-1 bg-red-500/50" />

        <div className="text-center space-y-2 mb-6">
          <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto text-amber-400">
            <CalendarX className="w-6 h-6" />
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-barber-textPrimary">
            Gestión de Turno
          </h1>
          <p className="text-xs text-barber-textSecondary">
            Podés verificar el estado de tu reserva o cancelarla si no vas a poder asistir.
          </p>
        </div>

        {/* Resumen del turno */}
        <div className="p-4 rounded-xl bg-barber-card border border-barber-border space-y-2.5 text-xs mb-6">
          <div className="flex justify-between">
            <span className="text-barber-textSecondary">Cliente:</span>
            <span className="font-bold text-barber-textPrimary">{booking.clientName}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-barber-textSecondary">Servicio:</span>
            <span className="font-semibold text-barber-textPrimary">{booking.serviceName}</span>
          </div>
          {booking.beverageChoice && (
            <div className="flex justify-between">
              <span className="text-barber-textSecondary">Bebida elegida:</span>
              <span className="font-semibold text-barber-gold capitalize">
                {booking.beverageChoice.replace("-", " ")}
              </span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-barber-textSecondary">Estado actual:</span>
            <span
              className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                booking.status === "CONFIRMED"
                  ? "bg-emerald-950 text-emerald-300 border border-emerald-800"
                  : "bg-red-950 text-red-300 border border-red-800"
              }`}
            >
              {booking.status === "CONFIRMED" ? "CONFIRMADO" : "CANCELADO"}
            </span>
          </div>
        </div>

        <CancelForm token={token} isAlreadyCancelled={booking.status !== "CONFIRMED"} />
      </div>
    </div>
  );
}
