import { ServiceDefinition, ServiceId } from "@/types/booking";

export const SERVICES_CATALOG: Record<ServiceId, ServiceDefinition> = {
  "corte-tradicional": {
    id: "corte-tradicional",
    name: "Corte Tradicional",
    description: "Corte clásico o moderno con asesoramiento, lavado y peinado final.",
    durationMinutes: 30,
    priceArs: 10000,
    isProvisionalPricing: false,
  },
  "combo-corte-bebida": {
    id: "combo-corte-bebida",
    name: "Corte + Bebida",
    description: "Corte completo acompañado por una Coca-Cola fría o cerveza Brahma (+18).",
    durationMinutes: 45,
    priceArs: 13500, // Precio provisional para prototipo, pendiente confirmación final
    requiresBeverage: true,
    isProvisionalPricing: true,
  },
};

export const BEVERAGE_OPTIONS = [
  { id: "coca-cola", label: "Coca-Cola (Línea Clásica / Zero)", isAlcoholic: false },
  { id: "cerveza-brahma", label: "Cerveza Brahma (Solo mayores de 18 años)", isAlcoholic: true },
];

export const BUSINESS_CONFIG = {
  timeZone: "America/Argentina/Buenos_Aires",
  openingHour: 9,  // 09:00
  closingHour: 19, // 19:00
  slotIntervalMinutes: 30,
  barberId: "barbero-principal",
  barberName: "Barbero Titular",
  maxDaysHorizon: 21, // Máximo 3 semanas en el futuro
  minHoursAdvance: 1, // Mínimo 1 hora de anticipación
};
