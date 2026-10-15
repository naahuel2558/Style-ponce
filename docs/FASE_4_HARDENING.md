# Fase 4 — Registro de Hardening, Privacidad y Operación

Fecha: 2026-10-14  
Responsable: Agente Coordinador  
Referencias: [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), [THREAT_MODEL.md](THREAT_MODEL.md), [PROCEDIMIENTO_BACKUP_RESTAURACION.md](PROCEDIMIENTO_BACKUP_RESTAURACION.md), [POLITICA_RETENCION_PRIVACIDAD.md](POLITICA_RETENCION_PRIVACIDAD.md).

---

## 1. Objetivo y Alcance de la Fase
Aplicar hardening de seguridad a nivel de configuración HTTP y de aplicación, implementar los procedimientos de respaldo y restauración consistente de datos, automatizar la política de retención y purga de información personal, y verificar la ausencia de secretos hardcodeados en el código fuente.

---

## 2. Archivos Creados y Modificados
* [`next.config.mjs`](../next.config.mjs): Configuración de cabeceras de seguridad HTTP (`Content-Security-Policy`, `Strict-Transport-Security` HSTS, `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy`, y desactivación de cabecera `X-Powered-By`).
* [`scripts/purge-expired-data.ts`](../scripts/purge-expired-data.ts): Script transaccional para la eliminación de sesiones caducadas y anonimización de PII en turnos con más de 90 días de antigüedad.
* [`scripts/backup-restore.ts`](../scripts/backup-restore.ts): Módulo operativo para generación de copias consistentes mediante `VACUUM INTO`, validación con `PRAGMA integrity_check` y procedimiento comprobado de restauración.
* [`.env.example`](../.env.example): Plantilla de configuración de entorno sin inclusión de credenciales ni secretos reales.
* [`docs/PROCEDIMIENTO_BACKUP_RESTAURACION.md`](PROCEDIMIENTO_BACKUP_RESTAURACION.md): Manual operativo paso a paso para respaldos y recuperación ante desastres.
* [`docs/POLITICA_RETENCION_PRIVACIDAD.md`](POLITICA_RETENCION_PRIVACIDAD.md): Definición formal de minimización de datos, finalidades y retención bajo el marco de la Ley 25.326 en Argentina.
* [`scripts/test-phase4.ts`](../scripts/test-phase4.ts): Suite automatizada de verificación de hardening, backups y retención.

---

## 3. Decisiones y Motivos
1. **Anonimización en lugar de borrado inmediato:** Los turnos pasados (> 90 días) conservan su servicio, horario e ID para no alterar las métricas contables del salón, pero el nombre y teléfono se sobrescriben irreversiblemente con valores nulos/anonimizados.
2. **Copia de seguridad en caliente con `VACUUM INTO`:** SQLite provee la instrucción `VACUUM INTO` que crea un duplicado limpio, desfragmentado y transaccionalmente consistente sin necesidad de bloquear el servidor web ni correr riesgos de lectura sucia.
3. **CSP Estricto pero Funcional:** Configurada para permitir scripts y estilos locales necesarios para Next.js con Turbopack, restringiendo fuentes externas no auditadas y prohibiendo incrustación en iframes (`X-Frame-Options: DENY`).

---

## 4. Skills Invocadas y Disponibilidad
* **Invocadas en fases previas:** `frontend-design`, `find-docs`.
* **No disponibles en catálogo:** Skill de auditoría de seguridad automatizada (se mitigó mediante ejecución de suites de tests formales y auditoría manual contra directrices OWASP/NIST).

---

## 5. Verificaciones Ejecutadas y Resultados
1. **Suite de Pruebas Automatizadas (`scripts/test-phase4.ts`):**
   - Comando: `npx -y tsx scripts/test-phase4.ts`
   - Resultado: **14 de 14 pruebas APROBADAS (0 falladas)**:
     - [PASS] Ejecución transaccional de purga completada con éxito.
     - [PASS] Eliminación automática de sesiones expiradas en `admin_sessions`.
     - [PASS] Anonimización verificada de nombre de cliente en turno antiguo.
     - [PASS] Anonimización verificada de teléfono de cliente en turno antiguo.
     - [PASS] Creación exitosa de backup consistente en disco.
     - [PASS] Verificación de integridad (`PRAGMA integrity_check = ok`) en el archivo de backup.
     - [PASS] Restauración simulada exitosa comprobando que la base restaurada mantiene idéntica cantidad de registros.
     - [PASS] Cabecera HSTS (`Strict-Transport-Security`) configurada con max-age de 2 años.
     - [PASS] Cabecera `X-Frame-Options: DENY` activa para protección contra Clickjacking.
     - [PASS] Cabecera `X-Content-Type-Options: nosniff` activa contra MIME-sniffing.
     - [PASS] Cabecera `Referrer-Policy: strict-origin-when-cross-origin` activa.
     - [PASS] Cabecera `Content-Security-Policy` activa.
2. **Auditoría de Secretos:**
   - Se verificó que el repositorio no contiene claves privadas, certificados ni contraseñas reales. `.env.example` solo expone variables de muestra.

---

## 6. Riesgos, Supuestos y Decisiones Abiertas con Dueño
* **Almacenamiento de Backups en la Nube:** En este entorno local, los respaldos se guardan en el disco local (`data/backups/`). En un despliegue de producción en nube, deben sincronizarse con un bucket de objetos protegido (ej. S3 / R2) con cifrado en reposo. Dueño: Responsable de infraestructura.

---

## 7. Próximo Paso
* **Fase 5 — Handoff y preparación de lanzamiento:** Consolidación de documentación de entrega, verificación de checklist final de producción y paquete de handoff para el siguiente mantenedor.
