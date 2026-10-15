import { getDatabase } from "../src/lib/db";

export function runDataRetentionPurge(retentionDays = 90) {
  const db = getDatabase();
  const now = new Date();
  const nowIso = now.toISOString();

  const cutoffDate = new Date(now.getTime() - retentionDays * 24 * 3600 * 1000);
  const cutoffIso = cutoffDate.toISOString();

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    // 1. Limpieza de sesiones administrativas expiradas
    const deleteSessions = db.prepare("DELETE FROM admin_sessions WHERE expires_at < ?");
    const sessionsResult = deleteSessions.run(nowIso);

    // 2. Anonimización de datos personales (PII) en turnos antiguos pasados
    const anonymizeAppointments = db.prepare(`
      UPDATE appointments
      SET client_name = 'ANONIMIZADO',
          client_phone = '0000000000'
      WHERE end_time < ?
        AND client_name != 'ANONIMIZADO'
    `);
    const anonResult = anonymizeAppointments.run(cutoffIso);

    // 3. Purga de logs de auditoría antiguos (> 180 días)
    const auditCutoff = new Date(now.getTime() - 180 * 24 * 3600 * 1000).toISOString();
    const deleteAudit = db.prepare("DELETE FROM admin_audit_log WHERE created_at < ?");
    const auditResult = deleteAudit.run(auditCutoff);

    db.exec("COMMIT;");

    return {
      success: true,
      sessionsPurged: sessionsResult.changes,
      appointmentsAnonymized: anonResult.changes,
      auditLogsPurged: auditResult.changes,
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    throw error;
  }
}

// Ejecución directa si se invoca por CLI
if (process.argv[1]?.endsWith("purge-expired-data.ts") || process.argv[1]?.endsWith("purge-expired-data.js")) {
  console.log("Ejecutando política de retención y purga de datos...");
  const result = runDataRetentionPurge(90);
  console.log("Resultado de la purga:", result);
}
