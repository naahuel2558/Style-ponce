import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import {
  AppointmentRecord,
  AvailableSlot,
  BookingResult,
  CreateBookingInput,
  ServiceDefinition,
  ServiceId,
} from "@/types/booking";
import { BUSINESS_CONFIG, SERVICES_CATALOG } from "./catalog";

let dbInstance: DatabaseSync | null = null;

export function getDatabase(): DatabaseSync {
  if (dbInstance) return dbInstance;

  const dataDir = process.env.VERCEL
    ? path.join("/tmp", "peluqueria_data")
    : path.join(process.cwd(), "data");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  const dbPath = path.join(dataDir, "peluqueria.db");
  const db = new DatabaseSync(dbPath);

  // Inicializar esquema
  db.exec(`
    CREATE TABLE IF NOT EXISTS appointments (
      id TEXT PRIMARY KEY,
      barber_id TEXT NOT NULL,
      service_id TEXT NOT NULL,
      beverage_choice TEXT,
      start_time TEXT NOT NULL,
      end_time TEXT NOT NULL,
      client_name TEXT NOT NULL,
      client_phone TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'CONFIRMED',
      cancel_token_hash TEXT NOT NULL UNIQUE,
      created_at TEXT NOT NULL
    );
    CREATE INDEX IF NOT EXISTS idx_barber_time ON appointments (barber_id, start_time, end_time);
    CREATE INDEX IF NOT EXISTS idx_cancel_token ON appointments (cancel_token_hash);

    CREATE TABLE IF NOT EXISTS admin_sessions (
      token_hash TEXT PRIMARY KEY,
      created_at TEXT NOT NULL,
      expires_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS admin_audit_log (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      target_id TEXT,
      reason_code TEXT,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS services_config (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      duration_minutes INTEGER NOT NULL,
      price_ars INTEGER NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Inicializar services_config si está vacía
  const checkServices = db.prepare("SELECT count(*) as count FROM services_config").get() as { count: number };
  if (!checkServices || checkServices.count === 0) {
    const insertService = db.prepare(`
      INSERT INTO services_config (id, name, duration_minutes, price_ars, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const now = new Date().toISOString();
    insertService.run("corte-tradicional", "Corte Tradicional", 30, 10000, now);
    insertService.run("combo-corte-bebida", "Corte + Bebida", 45, 13500, now);
  }

  dbInstance = db;

  // Cargar datos demo iniciales si la tabla está vacía
  try {
    const { seedDemoDataIfNeeded } = require("./seed");
    seedDemoDataIfNeeded();
  } catch (e) {
    // Silently continue if seed error
  }

  return dbInstance;
}

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token.trim()).digest("hex");
}

export function generateToken(): string {
  return crypto.randomBytes(24).toString("hex");
}

/**
 * Consulta de horarios disponibles en base a fecha y duración del servicio
 */
export function getAvailableSlots(dateString: string, serviceId: ServiceId): AvailableSlot[] {
  const services = getServicesConfig();
  const service = services[serviceId];
  if (!service) return [];

  // Parsear fecha YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(dateString)) return [];

  const [year, month, day] = dateString.split("-").map(Number);
  const selectedDate = new Date(Date.UTC(year, month - 1, day, 12, 0, 0));
  
  // 0 = Domingo en JavaScript
  const dayOfWeek = selectedDate.getUTCDay();
  if (dayOfWeek === 0) {
    // Domingo cerrado
    return [];
  }

  const db = getDatabase();
  const dayStartIso = `${dateString}T00:00:00.000Z`;
  const dayEndIso = `${dateString}T23:59:59.999Z`;

  const query = db.prepare(`
    SELECT start_time, end_time FROM appointments
    WHERE barber_id = ?
      AND status = 'CONFIRMED'
      AND start_time >= ?
      AND start_time <= ?
    ORDER BY start_time ASC
  `);

  const confirmedRows = query.all(
    BUSINESS_CONFIG.barberId,
    dayStartIso,
    dayEndIso
  ) as Array<{ start_time: string; end_time: string }>;

  const slots: AvailableSlot[] = [];
  const durationMs = service.durationMinutes * 60 * 1000;

  // Generar slots de 09:00 a 19:00
  // Para Argentina (UTC-3), las 09:00 son 12:00 UTC, y las 19:00 son 22:00 UTC
  const openUtcHour = BUSINESS_CONFIG.openingHour + 3;
  const closeUtcHour = BUSINESS_CONFIG.closingHour + 3;

  const currentNow = new Date();
  const minAllowedTime = new Date(currentNow.getTime() + BUSINESS_CONFIG.minHoursAdvance * 3600 * 1000);

  const startOfDayUtc = new Date(Date.UTC(year, month - 1, day, openUtcHour, 0, 0, 0));
  const endOfDayUtc = new Date(Date.UTC(year, month - 1, day, closeUtcHour, 0, 0, 0));

  let currentSlotStart = new Date(startOfDayUtc.getTime());

  while (currentSlotStart.getTime() + durationMs <= endOfDayUtc.getTime()) {
    const slotEnd = new Date(currentSlotStart.getTime() + durationMs);

    // No permitir turnos en el pasado
    if (currentSlotStart.getTime() >= minAllowedTime.getTime()) {
      const slotStartIso = currentSlotStart.toISOString();
      const slotEndIso = slotEnd.toISOString();

      // Comprobar si solapa con algún turno confirmado
      const overlaps = confirmedRows.some((booked) => {
        return booked.start_time < slotEndIso && booked.end_time > slotStartIso;
      });

      if (!overlaps) {
        // Formato legible para el cliente en hora de Argentina (HH:mm)
        // Como guardamos en UTC+3 para compensar UTC-3:
        const localHour = String((currentSlotStart.getUTCHours() - 3 + 24) % 24).padStart(2, "0");
        const localMin = String(currentSlotStart.getUTCMinutes()).padStart(2, "0");
        slots.push({
          startIso: slotStartIso,
          endIso: slotEndIso,
          label: `${localHour}:${localMin} hs`,
        });
      }
    }

    // Avanzar en intervalos configurados (ej. cada 30 minutos)
    currentSlotStart = new Date(
      currentSlotStart.getTime() + BUSINESS_CONFIG.slotIntervalMinutes * 60 * 1000
    );
  }

  return slots;
}

/**
 * Confirmación autoritativa y atómica de reserva
 */
export function createBookingAtomic(input: CreateBookingInput): BookingResult {
  const services = getServicesConfig();
  const service = services[input.serviceId];
  if (!service) {
    return {
      success: false,
      error: { code: "SERVICE_UNAVAILABLE", message: "Servicio no válido o inactivo." },
    };
  }

  const startDate = new Date(input.startDateTimeIso);
  if (isNaN(startDate.getTime())) {
    return {
      success: false,
      error: { code: "INVALID_DATE", message: "Fecha seleccionada inválida." },
    };
  }

  const now = new Date();
  if (startDate.getTime() <= now.getTime()) {
    return {
      success: false,
      error: { code: "PAST_TIME", message: "No se pueden reservar horarios pasados." },
    };
  }

  const durationMs = service.durationMinutes * 60 * 1000;
  const endDate = new Date(startDate.getTime() + durationMs);
  const startIso = startDate.toISOString();
  const endIso = endDate.toISOString();

  const db = getDatabase();

  // Transacción atómica inmediata: bloquea lecturas y escrituras concurrentes
  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    const checkOverlap = db.prepare(`
      SELECT count(*) as count FROM appointments
      WHERE barber_id = ?
        AND status = 'CONFIRMED'
        AND start_time < ?
        AND end_time > ?
    `);

    const collision = checkOverlap.get(
      BUSINESS_CONFIG.barberId,
      endIso,
      startIso
    ) as { count: number };

    if (collision && collision.count > 0) {
      db.exec("ROLLBACK;");
      return {
        success: false,
        error: {
          code: "SLOT_OCCUPIED",
          message: "El horario seleccionado acaba de ser ocupado. Por favor, elegí otro turno disponible.",
        },
      };
    }

    const bookingId = crypto.randomUUID();
    const rawToken = generateToken();
    const tokenHash = hashToken(rawToken);
    const createdAt = new Date().toISOString();

    const insertStmt = db.prepare(`
      INSERT INTO appointments (
        id, barber_id, service_id, beverage_choice, start_time, end_time,
        client_name, client_phone, status, cancel_token_hash, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
    `);

    insertStmt.run(
      bookingId,
      BUSINESS_CONFIG.barberId,
      input.serviceId,
      input.beverageChoice || null,
      startIso,
      endIso,
      input.clientName,
      input.clientPhone,
      tokenHash,
      createdAt
    );

    db.exec("COMMIT;");

    return {
      success: true,
      data: {
        bookingId,
        serviceName: service.name,
        startDateTimeIso: startIso,
        durationMinutes: service.durationMinutes,
        clientName: input.clientName,
        cancelToken: rawToken,
        priceArs: service.priceArs,
      },
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    return {
      success: false,
      error: {
        code: "INTERNAL_ERROR",
        message: "Ocurrió un error inesperado al procesar la reserva. Por favor reintentá.",
      },
    };
  }
}

/**
 * Cancelación autorizada mediante token de un solo uso
 */
export function cancelBookingByToken(cancelToken: string): { success: boolean; message: string; appointment?: { startIso: string; serviceName: string } } {
  if (!cancelToken || typeof cancelToken !== "string") {
    return { success: false, message: "Token de cancelación inexistente o inválido." };
  }

  const tokenHash = hashToken(cancelToken);
  const db = getDatabase();

  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    const findStmt = db.prepare(`
      SELECT id, service_id, start_time, status FROM appointments
      WHERE cancel_token_hash = ?
    `);

    const appointment = findStmt.get(tokenHash) as {
      id: string;
      service_id: ServiceId;
      start_time: string;
      status: string;
    } | undefined;

    if (!appointment) {
      db.exec("ROLLBACK;");
      return { success: false, message: "No se encontró ningún turno activo asociado a este enlace." };
    }

    if (appointment.status !== "CONFIRMED") {
      db.exec("ROLLBACK;");
      return { success: false, message: "El turno ya se encontraba cancelado." };
    }

    const updateStmt = db.prepare(`
      UPDATE appointments SET status = 'CANCELLED_BY_CLIENT'
      WHERE id = ?
    `);
    updateStmt.run(appointment.id);

    db.exec("COMMIT;");

    const service = SERVICES_CATALOG[appointment.service_id];
    return {
      success: true,
      message: "Tu turno ha sido cancelado con éxito. El horario quedó liberado.",
      appointment: {
        startIso: appointment.start_time,
        serviceName: service ? service.name : "Servicio",
      },
    };
  } catch (error) {
    db.exec("ROLLBACK;");
    return { success: false, message: "Error al intentar cancelar el turno." };
  }
}

/**
 * Consulta de estado de reserva para la pantalla de confirmación/cancelación
 */
export function getBookingSummaryByToken(cancelToken: string) {
  if (!cancelToken) return null;
  const tokenHash = hashToken(cancelToken);
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT id, service_id, beverage_choice, start_time, end_time, client_name, status, created_at
    FROM appointments
    WHERE cancel_token_hash = ?
  `);

  const record = stmt.get(tokenHash) as {
    id: string;
    service_id: ServiceId;
    beverage_choice: string | null;
    start_time: string;
    end_time: string;
    client_name: string;
    status: string;
    created_at: string;
  } | undefined;

  if (!record) return null;

  const service = SERVICES_CATALOG[record.service_id];

  return {
    id: record.id,
    serviceName: service ? service.name : record.service_id,
    priceArs: service ? service.priceArs : 0,
    beverageChoice: record.beverage_choice,
    startIso: record.start_time,
    endIso: record.end_time,
    clientName: record.client_name,
    status: record.status,
  };
}

/**
 * =====================================================================
 * GESTIÓN ADMINISTRATIVA, SESIONES Y AUDITORÍA (FASE 3)
 * =====================================================================
 */

import { ADMIN_CANCELLATION_REASONS, AdminCancellationReason } from "@/types/booking";
export { ADMIN_CANCELLATION_REASONS };
export type { AdminCancellationReason };

/**
 * Crea una sesión administrativa con token criptográfico seguro
 */
export function createAdminSession(ttlSeconds = 86400): string {
  const rawToken = crypto.randomBytes(32).toString("hex");
  const tokenHash = hashToken(rawToken);
  const now = new Date();
  const expiresAt = new Date(now.getTime() + ttlSeconds * 1000).toISOString();

  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO admin_sessions (token_hash, created_at, expires_at)
    VALUES (?, ?, ?)
  `);
  stmt.run(tokenHash, now.toISOString(), expiresAt);

  // Registrar auditoría de inicio de sesión sin datos personales
  recordAdminAudit("ADMIN_LOGIN", "session");

  return rawToken;
}

/**
 * Valida autoritativamente si una sesión administrativa sigue vigente
 */
export function validateAdminSession(token: string | undefined | null): boolean {
  if (!token || typeof token !== "string") return false;

  const tokenHash = hashToken(token);
  const nowIso = new Date().toISOString();
  const db = getDatabase();

  const stmt = db.prepare(`
    SELECT token_hash FROM admin_sessions
    WHERE token_hash = ? AND expires_at > ?
  `);

  const row = stmt.get(tokenHash, nowIso);
  return !!row;
}

/**
 * Cierra la sesión administrativa eliminando el registro
 */
export function deleteAdminSession(token: string): void {
  if (!token) return;
  const tokenHash = hashToken(token);
  const db = getDatabase();

  const stmt = db.prepare("DELETE FROM admin_sessions WHERE token_hash = ?");
  stmt.run(tokenHash);

  recordAdminAudit("ADMIN_LOGOUT", "session");
}

/**
 * Registra un evento de auditoría administrativa mínimo sin PII
 */
export function recordAdminAudit(
  eventType: string,
  targetId?: string | null,
  reasonCode?: string | null
): void {
  const db = getDatabase();
  const id = crypto.randomUUID();
  const createdAt = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO admin_audit_log (id, event_type, target_id, reason_code, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);
  stmt.run(id, eventType, targetId || null, reasonCode || null, createdAt);
}

/**
 * Consulta de turnos para el panel administrativo con filtro opcional de fecha
 */
export function getAdminAppointments(dateFilter?: string) {
  const db = getDatabase();

  let query = `
    SELECT id, barber_id, service_id, beverage_choice, start_time, end_time,
           client_name, client_phone, status, created_at
    FROM appointments
  `;
  const params: string[] = [];

  if (dateFilter && /^\d{4}-\d{2}-\d{2}$/.test(dateFilter)) {
    query += " WHERE start_time >= ? AND start_time <= ?";
    params.push(`${dateFilter}T00:00:00.000Z`, `${dateFilter}T23:59:59.999Z`);
  }

  query += " ORDER BY start_time ASC";

  const rows = db.prepare(query).all(...params) as Array<{
    id: string;
    barber_id: string;
    service_id: ServiceId;
    beverage_choice: string | null;
    start_time: string;
    end_time: string;
    client_name: string;
    client_phone: string;
    status: string;
    created_at: string;
  }>;

  const services = getServicesConfig();

  return rows.map((r) => {
    const service = services[r.service_id];
    return {
      id: r.id,
      serviceName: service ? service.name : r.service_id,
      durationMinutes: service ? service.durationMinutes : 30,
      priceArs: service ? service.priceArs : 0,
      beverageChoice: r.beverage_choice,
      startTime: r.start_time,
      endTime: r.end_time,
      clientName: r.client_name,
      clientPhone: r.client_phone,
      status: r.status,
      createdAt: r.created_at,
    };
  });
}

/**
 * Cancelación administrativa autorizada con motivo codificado
 */
export function cancelAppointmentByAdmin(
  appointmentId: string,
  reasonCode: AdminCancellationReason
): { success: boolean; message: string } {
  if (!ADMIN_CANCELLATION_REASONS[reasonCode]) {
    return { success: false, message: "Código de motivo de cancelación no válido." };
  }

  const db = getDatabase();
  db.exec("BEGIN IMMEDIATE TRANSACTION;");
  try {
    const checkStmt = db.prepare("SELECT status FROM appointments WHERE id = ?");
    const appointment = checkStmt.get(appointmentId) as { status: string } | undefined;

    if (!appointment) {
      db.exec("ROLLBACK;");
      return { success: false, message: "Turno no encontrado." };
    }

    if (appointment.status !== "CONFIRMED") {
      db.exec("ROLLBACK;");
      return { success: false, message: "El turno ya se encuentra cancelado." };
    }

    const updateStmt = db.prepare("UPDATE appointments SET status = 'CANCELLED_BY_ADMIN' WHERE id = ?");
    updateStmt.run(appointmentId);

    // Registro de auditoría sin datos de contacto
    recordAdminAudit("CANCEL_APPOINTMENT_BY_ADMIN", appointmentId, reasonCode);

    db.exec("COMMIT;");
    return { success: true, message: "Turno cancelado por administración y registrado en auditoría." };
  } catch (error) {
    db.exec("ROLLBACK;");
    return { success: false, message: "Error al cancelar turno por administración." };
  }
}

/**
 * Obtiene la configuración autoritativa de servicios y precios desde SQLite
 */
export function getServicesConfig(): Record<ServiceId, ServiceDefinition> {
  const db = getDatabase();
  const rows = db.prepare("SELECT id, name, duration_minutes, price_ars FROM services_config").all() as Array<{
    id: ServiceId;
    name: string;
    duration_minutes: number;
    price_ars: number;
  }>;

  const result: Record<ServiceId, ServiceDefinition> = { ...SERVICES_CATALOG };

  for (const row of rows) {
    if (result[row.id]) {
      result[row.id] = {
        ...result[row.id],
        name: row.name,
        durationMinutes: row.duration_minutes,
        priceArs: row.price_ars,
      };
    }
  }

  return result;
}

/**
 * Actualiza el precio de un servicio con validación estricta y auditoría
 */
export function updateServicePrice(
  serviceId: ServiceId,
  newPriceArs: number
): { success: boolean; message: string } {
  if (!SERVICES_CATALOG[serviceId]) {
    return { success: false, message: "Servicio no válido." };
  }

  if (
    typeof newPriceArs !== "number" ||
    isNaN(newPriceArs) ||
    !Number.isInteger(newPriceArs) ||
    newPriceArs < 500 ||
    newPriceArs > 2000000
  ) {
    return {
      success: false,
      message: "El precio debe ser un número entero válido (entre $500 y $2.000.000 ARS).",
    };
  }

  const db = getDatabase();
  const now = new Date().toISOString();

  try {
    const stmt = db.prepare(`
      UPDATE services_config
      SET price_ars = ?, updated_at = ?
      WHERE id = ?
    `);
    const res = stmt.run(newPriceArs, now, serviceId);

    if (res.changes === 0) {
      const serv = SERVICES_CATALOG[serviceId];
      const insert = db.prepare(`
        INSERT INTO services_config (id, name, duration_minutes, price_ars, updated_at)
        VALUES (?, ?, ?, ?, ?)
      `);
      insert.run(serviceId, serv.name, serv.durationMinutes, newPriceArs, now);
    }

    recordAdminAudit("UPDATE_SERVICE_PRICE", serviceId, `PRICE_${newPriceArs}`);

    return {
      success: true,
      message: `Precio actualizado exitosamente a $${newPriceArs.toLocaleString("es-AR")} ARS.`,
    };
  } catch (error) {
    return {
      success: false,
      message: "Error de base de datos al actualizar el precio.",
    };
  }
}

