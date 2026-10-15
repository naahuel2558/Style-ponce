import { getDatabase, createAdminSession } from "../src/lib/db";
import { runDataRetentionPurge } from "./purge-expired-data";
import { createDatabaseBackup, verifyRestoreProcedure } from "./backup-restore";
import crypto from "node:crypto";
import fs from "node:fs";

console.log("=== INICIANDO SUITE DE VERIFICACIÓN FORMAL FASE 4 (HARDENING & OPERACIÓN) ===\n");

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

const db = getDatabase();

// 1. Test: Retención y Purga de Datos
console.log("--- 1. Pruebas de Retención de Datos y Anonimización ---");

// Crear sesión expirada a propósito
createAdminSession(-60); // expirada hace 60 segundos

// Crear turno pasado de hace 120 días
const oldId = crypto.randomUUID();
const oldDate = new Date(Date.now() - 120 * 24 * 3600 * 1000).toISOString();
const insertOld = db.prepare(`
  INSERT INTO appointments (
    id, barber_id, service_id, beverage_choice, start_time, end_time,
    client_name, client_phone, status, cancel_token_hash, created_at
  ) VALUES (?, 'barbero-principal', 'corte-tradicional', null, ?, ?, 'Juan Pasado', '1122334455', 'CONFIRMED', ?, ?)
`);
insertOld.run(oldId, oldDate, oldDate, crypto.randomBytes(32).toString("hex"), oldDate);

// Ejecutar purga con corte a 90 días
const purgeResult = runDataRetentionPurge(90);
assert(purgeResult.success === true, "Ejecución de purga de retención completada con éxito");
assert(purgeResult.sessionsPurged >= 1, "Purga elimina sesiones expiradas de admin_sessions");

// Comprobar anonimización de PII en turno antiguo
const oldRecord = db.prepare("SELECT client_name, client_phone FROM appointments WHERE id = ?").get(oldId) as { client_name: string; client_phone: string };
assert(oldRecord.client_name === "ANONIMIZADO", "Datos personales (nombre) anonimizados tras vencer período de retención");
assert(oldRecord.client_phone === "0000000000", "Datos personales (teléfono) anonimizados tras vencer período de retención");


// 2. Test: Copias de Seguridad y Restauración Verificada
console.log("\n--- 2. Pruebas de Backup Consistente y Restauración ---");
const backup = createDatabaseBackup();
assert(backup.success === true, "Copia de seguridad online creada exitosamente");
assert(fs.existsSync(backup.backupPath), "El archivo físico de respaldo existe en disco");
assert(backup.recordCount > 0, "El respaldo contiene los registros de la base de datos");

const restore = verifyRestoreProcedure(backup.backupPath);
assert(restore.success === true, "Procedimiento de restauración ejecutado y verificado");
assert(restore.restoredCount === backup.recordCount, "La base de datos restaurada conserva exactamente la misma cantidad de registros íntegros");


async function runTests() {
  // 3. Test: Verificación de Cabeceras de Seguridad en Configuración
  console.log("\n--- 3. Verificación de Cabeceras HTTP de Seguridad ---");
  const nextConfigModule = await import("../next.config.mjs");
  const nextConfig = nextConfigModule.default;
  const headersList = (await nextConfig.headers?.()) || [];
  const globalHeaders = headersList.find((h: any) => h.source === "/(.*)")?.headers || [];

  const getHeader = (key: string) => globalHeaders.find((h: any) => h.key.toLowerCase() === key.toLowerCase())?.value;

  assert(Boolean(getHeader("Strict-Transport-Security")?.includes("max-age")), "Configuración incluye cabecera HSTS");
  assert(getHeader("X-Frame-Options") === "DENY", "Configuración incluye X-Frame-Options: DENY");
  assert(getHeader("X-Content-Type-Options") === "nosniff", "Configuración incluye X-Content-Type-Options: nosniff");
  assert(getHeader("Referrer-Policy") === "strict-origin-when-cross-origin", "Configuración incluye Referrer-Policy estricto");
  assert(Boolean(getHeader("Content-Security-Policy")?.includes("default-src")), "Configuración incluye Content-Security-Policy (CSP) robusta");

  console.log(`\n========================================`);
  console.log(`RESULTADO DE TESTS FASE 4: ${passedCount} APROBADOS, ${failedCount} FALLADOS`);
  console.log(`========================================\n`);

  if (failedCount > 0) {
    process.exit(1);
  } else {
    process.exit(0);
  }
}

runTests();
