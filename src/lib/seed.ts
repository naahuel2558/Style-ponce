import { getDatabase, hashToken, generateToken } from "./db";
import { BUSINESS_CONFIG } from "./catalog";
import crypto from "node:crypto";

export function seedDemoDataIfNeeded() {
  const db = getDatabase();
  const countRow = db.prepare("SELECT count(*) as count FROM appointments").get() as { count: number };
  
  if (countRow && countRow.count > 0) {
    return; // Ya hay turnos
  }

  // Insertar 2 turnos ficticios para mañana de muestra
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  if (tomorrow.getDay() === 0) {
    tomorrow.setDate(tomorrow.getDate() + 1); // Si es domingo, pasar al lunes
  }

  const yyyy = tomorrow.getFullYear();
  const mm = String(tomorrow.getMonth() + 1).padStart(2, "0");
  const dd = String(tomorrow.getDate()).padStart(2, "0");

  // Turno 1: 10:00 a 10:30 (13:00 a 13:30 UTC)
  const slot1Start = `${yyyy}-${mm}-${dd}T13:00:00.000Z`;
  const slot1End = `${yyyy}-${mm}-${dd}T13:30:00.000Z`;

  // Turno 2: 15:30 a 16:15 (18:30 a 19:15 UTC) - Combo
  const slot2Start = `${yyyy}-${mm}-${dd}T18:30:00.000Z`;
  const slot2End = `${yyyy}-${mm}-${dd}T19:15:00.000Z`;

  const insert = db.prepare(`
    INSERT INTO appointments (
      id, barber_id, service_id, beverage_choice, start_time, end_time,
      client_name, client_phone, status, cancel_token_hash, created_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'CONFIRMED', ?, ?)
  `);

  insert.run(
    crypto.randomUUID(),
    BUSINESS_CONFIG.barberId,
    "corte-tradicional",
    null,
    slot1Start,
    slot1End,
    "Facundo Quiroga (Demo)",
    "1198765432",
    hashToken(generateToken()),
    new Date().toISOString()
  );

  insert.run(
    crypto.randomUUID(),
    BUSINESS_CONFIG.barberId,
    "combo-corte-bebida",
    "coca-cola",
    slot2Start,
    slot2End,
    "Esteban Morales (Demo)",
    "1187654321",
    hashToken(generateToken()),
    new Date().toISOString()
  );
}
