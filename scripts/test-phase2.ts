import { getDatabase, createBookingAtomic, cancelBookingByToken, hashToken } from "../src/lib/db";
import { CreateBookingSchema } from "../src/types/booking";

console.log("=== INICIANDO SUITE DE VERIFICACIÓN FORMAL FASE 2 ===\n");

let passedCount = 0;
let failedCount = 0;

function assert(condition: boolean, testName: string) {
  if (condition) {
    console.log(`[PASS] ${testName}`);
    passedCount++;
  } else {
    console.error(`[FAIL] ${testName}`);
    failedCount++;
  }
}

// 1. Test: Validación de Esquemas Zod
console.log("--- 1. Pruebas de Validación de Entradas (Zod) ---");
const invalidName = CreateBookingSchema.safeParse({
  serviceId: "corte-tradicional",
  startDateTimeIso: "2026-10-20T14:00:00.000Z",
  clientName: "A", // Demasiado corto
  clientPhone: "1123456789"
});
assert(!invalidName.success, "Rechaza nombre de 1 carácter");

const scriptInjection = CreateBookingSchema.safeParse({
  serviceId: "corte-tradicional",
  startDateTimeIso: "2026-10-20T14:00:00.000Z",
  clientName: "Lautaro <script>alert(1)</script>", // Caracteres no permitidos
  clientPhone: "1123456789"
});
assert(!scriptInjection.success, "Rechaza caracteres maliciosos / etiquetas en el nombre");

const invalidPhone = CreateBookingSchema.safeParse({
  serviceId: "corte-tradicional",
  startDateTimeIso: "2026-10-20T14:00:00.000Z",
  clientName: "Lautaro Gomez",
  clientPhone: "123" // Demasiado corto
});
assert(!invalidPhone.success, "Rechaza teléfono demasiado corto (< 8 dígitos)");

const invalidService = CreateBookingSchema.safeParse({
  serviceId: "servicio-trucho",
  startDateTimeIso: "2026-10-20T14:00:00.000Z",
  clientName: "Lautaro Gomez",
  clientPhone: "1123456789"
});
assert(!invalidService.success, "Rechaza servicio no existente en catálogo");


// 2. Test: Horario en el Pasado
console.log("\n--- 2. Pruebas de Reglas de Negocio en Servidor ---");
const pastBooking = createBookingAtomic({
  serviceId: "corte-tradicional",
  startDateTimeIso: "2020-01-01T14:00:00.000Z",
  clientName: "Viajero Tiempo",
  clientPhone: "1123456789"
});
assert(!pastBooking.success && pastBooking.error.code === "PAST_TIME", "Rechaza reservas en fechas/horas pasadas");


// 3. Test: Creación Exitosa de Reserva (End-to-End)
console.log("\n--- 3. Creación Atómica de Reserva Normal ---");
const randomOffsetMs = Math.floor(Math.random() * 10000000) * 60;
const testDateObj = new Date(Date.now() + 7 * 86400000 + randomOffsetMs);
const testSlotIso = testDateObj.toISOString();
const overlapSlotIso = new Date(testDateObj.getTime() + 15 * 60 * 1000).toISOString();

const booking1 = createBookingAtomic({
  serviceId: "corte-tradicional",
  startDateTimeIso: testSlotIso,
  clientName: "Joaquin Perez",
  clientPhone: "1144332211"
});

assert(booking1.success === true, "Creación de reserva válida exitosa");
assert(booking1.success && booking1.data.priceArs === 10000, "Precio validado autoritativamente en servidor (ARS 10.000)");
assert(booking1.success && typeof booking1.data.cancelToken === "string" && booking1.data.cancelToken.length > 20, "Genera token de cancelación aleatorio y seguro");


// 4. Test: Prevención Atómica de Doble Reserva (Colisión)
console.log("\n--- 4. Concurrencia y Prevención Atómica de Doble Reserva ---");
// Intento 2: Mismo horario exacto
const booking2 = createBookingAtomic({
  serviceId: "corte-tradicional",
  startDateTimeIso: testSlotIso,
  clientName: "Matias Rossi",
  clientPhone: "1188776655"
});
assert(!booking2.success && booking2.error.code === "SLOT_OCCUPIED", "Rechaza segunda reserva en el mismo horario con SLOT_OCCUPIED");

// Intento 3: Solapamiento parcial (comienza 15 minutos después, mientras el primero de 30m aún dura)
const booking3 = createBookingAtomic({
  serviceId: "corte-tradicional",
  startDateTimeIso: overlapSlotIso,
  clientName: "Lucas Alario",
  clientPhone: "1155667788"
});
assert(!booking3.success && booking3.error.code === "SLOT_OCCUPIED", "Rechaza reserva con solapamiento parcial de horario");


// 5. Test: Almacenamiento Seguro (Hash del Token)
console.log("\n--- 5. Seguridad y Minimización de Datos ---");
const db = getDatabase();
if (booking1.success) {
  const recordInDb = db.prepare("SELECT cancel_token_hash FROM appointments WHERE id = ?").get(booking1.data.bookingId) as { cancel_token_hash: string };
  const expectedHash = hashToken(booking1.data.cancelToken);
  assert(recordInDb.cancel_token_hash === expectedHash, "En la base de datos se almacena el HASH criptográfico SHA-256, jamás el token plano");
}

// 6. Test: Cancelación con Token y Reuso
console.log("\n--- 6. Cancelación y No Reusabilidad de Tokens ---");
if (booking1.success) {
  const cancelResult = cancelBookingByToken(booking1.data.cancelToken);
  assert(cancelResult.success === true, "Cancelación exitosa mediante token válido");

  // Reuso del mismo token ya cancelado
  const cancelReuse = cancelBookingByToken(booking1.data.cancelToken);
  assert(!cancelReuse.success, "Rechaza reuso de token sobre turno ya cancelado");

  // Intento de cancelación con token inventado/inexistente
  const cancelBogus = cancelBookingByToken("token_falso_completamente_inventado_12345");
  assert(!cancelBogus.success, "Rechaza token inexistente de forma segura sin revelar información");

  // Comprobar que tras la cancelación el horario vuelve a quedar libre
  const rebookingAfterCancel = createBookingAtomic({
    serviceId: "corte-tradicional",
    startDateTimeIso: testSlotIso,
    clientName: "Nuevo Cliente Libre",
    clientPhone: "1199001122"
  });
  assert(rebookingAfterCancel.success === true, "Tras la cancelación, el horario queda inmediatamente disponible para un nuevo cliente");
}

console.log(`\n========================================`);
console.log(`RESULTADO DE TESTS: ${passedCount} APROBADOS, ${failedCount} FALLADOS`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
