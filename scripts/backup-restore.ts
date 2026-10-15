import fs from "node:fs";
import path from "node:path";
import { DatabaseSync } from "node:sqlite";
import { getDatabase } from "../src/lib/db";

export function createDatabaseBackup(): { success: boolean; backupPath: string; recordCount: number } {
  const db = getDatabase();
  const backupDir = path.join(process.cwd(), "data", "backups");

  if (!fs.existsSync(backupDir)) {
    fs.mkdirSync(backupDir, { recursive: true });
  }

  const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
  const backupPath = path.join(backupDir, `peluqueria-backup-${timestamp}.db`);

  // Ejecutar copia segura consistente mediante VACUUM INTO
  db.exec(`VACUUM INTO '${backupPath.replace(/\\/g, "/")}'`);

  // Validar integridad del archivo de backup generado
  const backupDb = new DatabaseSync(backupPath);
  const integrity = backupDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
  
  if (integrity.integrity_check !== "ok") {
    backupDb.close();
    throw new Error(`Fallo de integridad en el archivo de copia de seguridad: ${integrity.integrity_check}`);
  }

  const countRow = backupDb.prepare("SELECT count(*) as count FROM appointments").get() as { count: number };
  backupDb.close();

  return {
    success: true,
    backupPath,
    recordCount: countRow.count,
  };
}

export function verifyRestoreProcedure(backupPath: string, testRestorePath?: string): { success: boolean; restoredCount: number } {
  const restoreFile = testRestorePath || path.join(process.cwd(), "data", "backups", "test-restore.db");

  if (fs.existsSync(restoreFile)) {
    fs.unlinkSync(restoreFile);
  }

  // Copiar archivo de respaldo al destino de prueba
  fs.copyFileSync(backupPath, restoreFile);

  const restoredDb = new DatabaseSync(restoreFile);
  const integrity = restoredDb.prepare("PRAGMA integrity_check").get() as { integrity_check: string };
  
  if (integrity.integrity_check !== "ok") {
    restoredDb.close();
    throw new Error(`Fallo en restauración: la base restaurada no superó la verificación de integridad.`);
  }

  const countRow = restoredDb.prepare("SELECT count(*) as count FROM appointments").get() as { count: number };
  restoredDb.close();

  // Limpiar archivo temporal de prueba si se utilizó el default
  if (!testRestorePath && fs.existsSync(restoreFile)) {
    fs.unlinkSync(restoreFile);
  }

  return {
    success: true,
    restoredCount: countRow.count,
  };
}

// Ejecución directa por CLI
if (process.argv[1]?.endsWith("backup-restore.ts") || process.argv[1]?.endsWith("backup-restore.js")) {
  console.log("Creando copia de seguridad consistente...");
  const backup = createDatabaseBackup();
  console.log("Copia creada exitosamente en:", backup.backupPath);
  console.log("Registros respaldados:", backup.recordCount);

  console.log("Verificando procedimiento de restauración...");
  const restore = verifyRestoreProcedure(backup.backupPath);
  console.log("Restauración verificada con éxito. Registros comprobados:", restore.restoredCount);
}
