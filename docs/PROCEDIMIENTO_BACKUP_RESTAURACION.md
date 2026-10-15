# Procedimiento Operativo: Copias de Seguridad y Restauración

Fecha: 2026-10-14  
Estado: Verificado mediante pruebas automatizadas (`scripts/test-phase4.ts` y `scripts/backup-restore.ts`).

---

## 1. Alcance y Objetivos
Garantizar la disponibilidad, consistencia y recuperabilidad de la agenda de turnos sin pérdida de datos ni corrupción ante fallas de hardware, errores operativos o incidentes de infraestructura.

---

## 2. Estrategia de Copias de Seguridad (Backup)
* **Tipo de Copia:** Copia online consistente sin interrupción del servicio mediante `VACUUM INTO`.
* **Frecuencia Recomendada en Producción:**
  - Respaldo diario automático al finalizar la jornada (ej. 20:00 hs).
  - Respaldo previo a cualquier migración o actualización de software.
* **Ubicación:** `data/backups/peluqueria-backup-<timestamp>.db` (en producción, sincronizado con almacenamiento secundario protegido fuera del servidor web).
* **Control de Integridad:** Cada respaldo ejecuta inmediatamente `PRAGMA integrity_check` para verificar la ausencia de corrupción a nivel de páginas SQLite.

### Comando Manual de Ejecución:
```bash
npx tsx scripts/backup-restore.ts
```

---

## 3. Procedimiento de Restauración (Disaster Recovery)

En caso de fallo catastrófico o corrupción de la base de datos principal:

1. **Detener el servicio de la aplicación:**
   ```bash
   # Detener proceso Node / contenedor
   pkill -f "next start" || docker stop peluqueria-app
   ```
2. **Seleccionar el archivo de respaldo verificado más reciente:**
   Revisar el directorio `data/backups/` e identificar el archivo con la marca temporal deseada.
3. **Verificar la integridad del archivo de respaldo antes de aplicar:**
   ```bash
   node -e "const { DatabaseSync } = require('node:sqlite'); const db = new DatabaseSync('data/backups/peluqueria-backup-FECHA.db'); console.log(db.prepare('PRAGMA integrity_check').get());"
   ```
4. **Restaurar el archivo sobre la base activa:**
   ```bash
   # En Windows PowerShell:
   Copy-Item "data/backups/peluqueria-backup-FECHA.db" "data/peluqueria.db" -Force
   
   # En Linux / Bash:
   cp "data/backups/peluqueria-backup-FECHA.db" "data/peluqueria.db"
   ```
5. **Ejecutar purga de registros que hayan expirado durante el período de inactividad:**
   Para evitar que se reintroduzcan turnos pasados o sesiones que ya hubieran caducado:
   ```bash
   npx tsx scripts/purge-expired-data.ts
   ```
6. **Reiniciar el servicio y verificar el panel administrativo:**
   Iniciar la aplicación y comprobar en `/admin` que los turnos activos son coherentes.
