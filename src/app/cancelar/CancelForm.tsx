"use client";

import React, { useState, useTransition } from "react";
import { submitCancelAction } from "@/app/actions/booking";
import { CheckCircle2, AlertTriangle, ArrowLeft } from "lucide-react";
import Link from "next/link";

interface CancelFormProps {
  token: string;
  isAlreadyCancelled: boolean;
}

export function CancelForm({ token, isAlreadyCancelled }: CancelFormProps) {
  const [isPending, startTransition] = useTransition();
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null);

  const handleCancel = () => {
    startTransition(async () => {
      const formData = new FormData();
      formData.set("cancelToken", token);
      const res = await submitCancelAction(null, formData);
      setResult(res);
    });
  };

  if (result) {
    return (
      <div className="space-y-4 text-center">
        <div
          className={`p-4 rounded-xl border text-xs ${
            result.success
              ? "bg-emerald-950/40 border-emerald-800 text-emerald-200"
              : "bg-red-950/40 border-red-800 text-red-200"
          }`}
        >
          {result.success ? (
            <div className="flex items-center justify-center gap-2 font-semibold">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              {result.message}
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 font-semibold">
              <AlertTriangle className="w-4 h-4 text-red-400" />
              {result.message}
            </div>
          )}
        </div>

        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-barber-gold hover:underline pt-2"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a reservar un nuevo turno
        </Link>
      </div>
    );
  }

  if (isAlreadyCancelled) {
    return (
      <div className="space-y-4 text-center">
        <p className="text-xs text-barber-textSecondary">
          Este turno ya fue cancelado previamente. El horario correspondiente quedó libre en la agenda.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs text-barber-gold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Volver a la página principal
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-barber-textSecondary text-center">
        Al confirmar la cancelación, tu turno se dará de baja inmediatamente y el horario quedará disponible para otros clientes.
      </p>

      <button
        type="button"
        disabled={isPending}
        onClick={handleCancel}
        className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all ${
          isPending
            ? "bg-red-950 border border-red-900 text-red-300 cursor-not-allowed"
            : "bg-red-800/80 hover:bg-red-700 text-white shadow-lg shadow-red-950/50 cursor-pointer"
        }`}
      >
        {isPending ? (
          <>
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
            Cancelando reserva...
          </>
        ) : (
          "Confirmar Cancelación del Turno"
        )}
      </button>

      <div className="text-center pt-2">
        <Link href="/" className="text-xs text-barber-textSecondary hover:text-barber-textPrimary">
          Mantener mi turno y volver
        </Link>
      </div>
    </div>
  );
}
