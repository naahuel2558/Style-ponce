"use client";

import React from "react";
import { MessageCircle } from "lucide-react";

interface WhatsAppFloatProps {
  whatsappNumber?: string;
  businessName?: string;
}

export function WhatsAppFloat({
  whatsappNumber = "3582435386",
  businessName = "Style Ponce",
}: WhatsAppFloatProps) {
  const cleanPhone = whatsappNumber.replace(/[^0-9]/g, "");
  const formattedPhone = cleanPhone.startsWith("54") ? cleanPhone : `549${cleanPhone}`;
  const text = encodeURIComponent(
    `¡Hola ${businessName}! 👋 Tengo una consulta sobre los turnos de la peluquería.`
  );
  const waUrl = `https://wa.me/${formattedPhone}?text=${text}`;

  return (
    <aside aria-label="Contacto por WhatsApp" className="fixed bottom-6 right-6 z-50 flex items-center gap-3">
      <div className="hidden sm:block px-3 py-1.5 rounded-xl bg-surface-container/90 backdrop-blur-md border border-surface-container-high shadow-lg text-[11px] text-on-surface">
        <span>¿Consultas? Escribinos por WhatsApp</span>
      </div>

      <a
        href={waUrl}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Abrir chat de WhatsApp"
        className="w-14 h-14 rounded-full bg-emerald-500 hover:bg-emerald-400 text-white flex items-center justify-center shadow-2xl shadow-emerald-950/80 transition-all transform hover:scale-110 active:scale-95 group border-2 border-emerald-300/40"
      >
        <MessageCircle className="w-7 h-7 fill-current" />
        <span className="sr-only">Abrir WhatsApp</span>
      </a>
    </aside>
  );
}
