import {
  getDatabase,
  createBookingAtomic,
  createAdminSession,
  validateAdminSession,
  deleteAdminSession,
  cancelAppointmentByAdmin,
  getAdminAppointments,
  ADMIN_CANCELLATION_REASONS,
  AdminCancellationReason,
} from "../src/lib/db";

console.log("=== INICIANDO SUITE DE VERIFICACIÓN FORMAL FASE 3 (PANEL ADMIN) ===\n");

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

// 1. Test: Validación de Sesión Inexistente o Falsa
console.log("--- 1. Pruebas de Autorización y Sesiones ---");
assert(!validateAdminSession(undefined), "Rechaza sesión con token indefinido");
assert(!validateAdminSession("token_trucho_inventado_12345"), "Rechaza sesión con token falso");

// 2. Test: Creación de Sesión Válida
const validToken = createAdminSession(3600);
assert(typeof validToken === "string" && validToken.length === 64, "Genera token criptográfico de 32 bytes (64 caracteres hex)");
assert(validateAdminSession(validToken), "Valida autoritativamente sesión recién creada");

// 3. Test: Expiración de Sesión
const expiredToken = createAdminSession(-10); // expirada hace 10 segundos
assert(!validateAdminSession(expiredToken), "Rechaza sesión expirada");

// 4. Test: Cierre de Sesión (Logout)
deleteAdminSession(validToken);
assert(!validateAdminSession(validToken), "Sesión queda inmediatamente invalidada tras deleteAdminSession");

// 5. Test: Cancelación Administrativa con Motivo Codificado
console.log("\n--- 2. Pruebas de Operaciones Administrativas sobre Turnos ---");
const randomOffsetMs = Math.floor(Math.random() * 10000000) * 60;
const testSlotDate = new Date(Date.now() + 14 * 86400000 + randomOffsetMs);
const testSlotIso = testSlotDate.toISOString();

const booking = createBookingAtomic({
  serviceId: "corte-tradicional",
  startDateTimeIso: testSlotIso,
  clientName: "Cliente Para Cancelar",
  clientPhone: "1133445566",
});

assert(booking.success === true, "Crea turno previo para prueba de administración");

if (booking.success) {
  // Intento con motivo inválido
  const invalidReason = cancelAppointmentByAdmin(
    booking.data.bookingId,
    "MOTIVO_INVENTADO" as AdminCancellationReason
  );
  assert(!invalidReason.success, "Rechaza motivo de cancelación no codificado en catálogo");

  // Cancelación exitosa con motivo codificado
  const validCancel = cancelAppointmentByAdmin(
    booking.data.bookingId,
    "CLIENT_PHONE_REQUEST"
  );
  assert(validCancel.success === true, "Cancelación administrativa exitosa con motivo CLIENT_PHONE_REQUEST");

  // Reintento sobre turno ya cancelado
  const secondCancel = cancelAppointmentByAdmin(
    booking.data.bookingId,
    "EMERGENCY_CLOSURE"
  );
  assert(!secondCancel.success, "Rechaza cancelar turno que ya se encontraba cancelado");

  // Verificar que el slot quedó liberado en la agenda
  const rebook = createBookingAtomic({
    serviceId: "corte-tradicional",
    startDateTimeIso: testSlotIso,
    clientName: "Cliente Reemplazo",
    clientPhone: "1177889900",
  });
  assert(rebook.success === true, "El horario cancelado por administración quedó disponible para nuevo turno");
}

// 6. Test: Auditoría Administrativa Mínima sin PII
console.log("\n--- 3. Verificación de Auditoría sin PII ---");
const db = getDatabase();
const auditLogs = db.prepare("SELECT * FROM admin_audit_log ORDER BY created_at DESC LIMIT 5").all() as Array<{
  id: string;
  event_type: string;
  target_id: string | null;
  reason_code: string | null;
  created_at: string;
}>;

assert(auditLogs.length > 0, "Se registran eventos en admin_audit_log");
const cancelAudit = auditLogs.find((l) => l.event_type === "CANCEL_APPOINTMENT_BY_ADMIN");
assert(!!cancelAudit, "Existe registro de auditoría para CANCEL_APPOINTMENT_BY_ADMIN");
if (cancelAudit) {
  assert(cancelAudit.reason_code === "CLIENT_PHONE_REQUEST", "El motivo codificado se almacena correctamente en auditoría");
  assert(!("client_phone" in cancelAudit) && !("client_name" in cancelAudit), "La tabla de auditoría NO posee columnas de datos de contacto (PII)");
}

console.log(`\n========================================`);
console.log(`RESULTADO DE TESTS FASE 3: ${passedCount} APROBADOS, ${failedCount} FALLADOS`);
console.log(`========================================\n`);

if (failedCount > 0) {
  process.exit(1);
} else {
  process.exit(0);
}
