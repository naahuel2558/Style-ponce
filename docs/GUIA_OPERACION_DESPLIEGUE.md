# Guía de Operación, Despliegue y Mantenimiento

Fecha: 2026-10-14  
Proyecto: Peluquería & Barbería Web (MVP Completo y Verificado)  
Estado: Listo para entorno local, pruebas y despliegue en servidor / contenedor.

---

## 1. Requisitos del Sistema
* **Runtime:** Node.js v22.5.0 o superior (recomendado Node.js v24.x LTS).
  - *Nota técnica:* El motor utiliza el módulo estándar `node:sqlite`, eliminando cualquier dependencia binaria externa o necesidad de compilación C++.
* **Gestor de paquetes:** `npm` v10+.
* **Memoria mínima:** 512 MB RAM.

---

## 2. Puesta en Marcha Inicial

### Paso 1: Instalación de Dependencias
```bash
npm install
```

### Paso 2: Configuración de Variables de Entorno
Copiar la plantilla de entorno:
```bash
# En Windows PowerShell:
Copy-Item .env.example .env.local

# En Linux / macOS:
cp .env.example .env.local
```
Editar `.env.local` y definir `ADMIN_PASSWORD` (por defecto para demo: `admin123`).

### Paso 3: Ejecución en Desarrollo
```bash
npm run dev
```
Acceder en el navegador a: `http://localhost:3000`

### Paso 4: Compilación y Ejecución para Producción
```bash
# Compilar paquete optimizado con Turbopack
npm run build

# Iniciar servidor de producción
npm start
```

---

## 3. Acceso y Rutas de la Aplicación

| Ruta | Audiencia | Finalidad |
| --- | --- | --- |
| `/` | Público / Clientes | Catálogo de servicios, visualización de precios en ARS y asistente interactivo de turnos con confirmación atómica. |
| `/cancelar?token=<token>` | Público / Clientes | Autogestión de turno; permite consultar el estado del turno y cancelarlo de forma segura con un solo clic. |
| `/admin/login` | Barbero / Administrador | Autenticación administrativa con contraseña. |
| `/admin` | Barbero / Administrador | Dashboard protegido; listado completo de citas, buscador, filtros por estado y cancelación administrativa con motivos codificados. |

---

## 4. Tareas de Mantenimiento y Operación

### 4.1 Ejecución de Pruebas de Verificación
El proyecto cuenta con suites de tests integrales automatizadas:
```bash
# Verificar flujo público, validaciones Zod y atomicidad anti-colisión (15 tests)
npx tsx scripts/test-phase2.ts

# Verificar autenticación, sesiones y auditoría administrativa (15 tests)
npx tsx scripts/test-phase3.ts

# Verificar hardening, cabeceras HTTP, retención de datos y backups (14 tests)
npx tsx scripts/test-phase4.ts
```

### 4.2 Generación de Copias de Seguridad (Backups)
Para generar un respaldo consistente en caliente:
```bash
npx tsx scripts/backup-restore.ts
```
Los archivos quedan almacenados en `data/backups/peluqueria-backup-<timestamp>.db`.

### 4.3 Purga y Anonimización Periódica de Datos
Para limpiar sesiones caducadas y anonimizar datos personales de turnos con más de 90 días:
```bash
npx tsx scripts/purge-expired-data.ts
```

---

## 5. Procedimiento de Reversión (Rollback)

Si un despliegue presenta inconvenientes:
1. Revertir el código al commit o tag previo mediante Git (`git checkout <tag-anterior>`).
2. Si hubo cambios en el archivo de base de datos, restaurar el respaldo previo generado antes de la actualización siguiendo las instrucciones de [PROCEDIMIENTO_BACKUP_RESTAURACION.md](PROCEDIMIENTO_BACKUP_RESTAURACION.md).
3. Recompilar (`npm run build`) y reiniciar el servicio (`npm start`).
