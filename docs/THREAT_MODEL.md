# Modelo de Amenazas y Mapa de Flujo de Datos (Threat Model)

Fecha: 2026-10-13  
Fase: 1 — Arquitectura, contratos y diseño de seguridad  
Referencias: [README.md](../README.md), [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md), OWASP Cheat Sheets (Secure Product Design, Secrets Management, Logging), NIST SSDF (SP 800-218), NIST Privacy Framework.

---

## 1. Mapa de Flujo de Datos y Límites de Confianza

```text
[ ENTORNO NO CONFIABLE: NAVEGADOR / CLIENTE ]
       │
       │ (1) HTTPS / TLS
       ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LÍMITE DE CONFIANZA 1: SERVIDOR DE APLICACIÓN (Next.js / Node Runtime)  │
│                                                                        │
│  - Middleware de seguridad: cabeceras (CSP, HSTS, X-Content-Type)       │
│  - Endpoint / Server Action público:                                   │
│      * Rate limiting / protección contra spam                           │
│      * Validación Zod (tipo, formato, longitud, caracteres)            │
│      * Sanitización de cadenas                                         │
│      * Sobrescritura de precio/duración con configuración de servidor   │
│  - Endpoint / Server Action administrativo:                            │
│      * Verificación de sesión en servidor (Cookie HTTP-Only, Secure)   │
│      * Validación de permisos por recurso                              │
│                                                                        │
│  - Generación de logs:                                                 │
│      * Solo códigos de evento y marcas temporales                      │
│      * EXCLUSIÓN ESTRICTA de PII (nombres, teléfonos, tokens)          │
└────────────────────────────────────┬───────────────────────────────────┘
                                     │
                                     │ (2) Conexión interna / SSL
                                     ▼
┌────────────────────────────────────────────────────────────────────────┐
│ LÍMITE DE CONFIANZA 2: ALMACENAMIENTO DE DATOS (PostgreSQL / SQLite)   │
│                                                                        │
│  - Transacción atómica / Exclusión GiST                                │
│  - Tokens de cancelación almacenados como hashes criptográficos        │
│  - Restricciones de integridad referencial                             │
│  - Política de retención y purga periódica de datos pasados            │
└────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Análisis de Amenazas (STRIDE) y Matriz de Riesgos

| Categoría | Amenaza Específica | Probabilidad | Impacto | Controles Preventivos Implementados | Detección / Señal | Respuesta ante Incidente | Riesgo Residual |
| :--- | :--- | :---: | :---: | :--- | :--- | :--- | :---: |
| **Tampering** (Alteración) | Manipulación de precio, duración o servicio desde el cliente | Media | Alta | El servidor ignora cualquier valor de precio/duración enviado. Se obtienen directamente del catálogo interno según `serviceId`. | Detección de payloads con campos extra no reconocidos. | Rechazo inmediato (400 Bad Request) y registro de intento anómalo. | Bajo |
| **Denial of Service** | Doble reserva por peticiones concurrentes simultáneas | Alta | Alta | Restricción de exclusión a nivel de motor de BD (`EXCLUDE USING gist`) o transacción atómica con lock. | Violación de restricción única / colisión en base de datos. | Rollback inmediato, respuesta de conflicto (409) invitando a elegir otro turno. | Muy bajo |
| **Repudiation** (Cancelación ilegítima) | Adivinación o enumeración de enlaces para cancelar turnos ajenos | Media | Alta | Tokens criptográficos aleatorios de 32 bytes (256 bits de entropía). En BD solo se almacena su hash (SHA-256). Expiran tras su uso o al pasar la fecha del turno. | Múltiples fallos 404/403 en endpoint de cancelación desde una misma IP. | Rate limit estricto en ruta de cancelación y bloqueo temporal de IPs abusivas. | Bajo |
| **Information Disclosure** | Fuga de datos de contacto (PII) en consultas públicas o logs | Alta | Crítica | El endpoint público de disponibilidad solo devuelve horas de inicio libres; nunca expone quién reservó los turnos ocupados. Los logs excluyen teléfonos y nombres. | Auditoría de logs automatizada para detectar patrones regex de números telefónicos. | Rotación de logs y corrección inmediata del punto de logging. | Muy bajo |
| **Elevation of Privilege** | Acceso al panel o acciones de administración sin autenticación | Media | Crítica | Verificación autoritativa en cada Server Action / ruta administrativa. No se confía en parámetros de la URL ni estado del frontend. | Intentos de acceso a `/admin` sin sesión válida. | Redirección a login, bloqueo por fuerza bruta y corte de sesión. | Bajo |
| **Denial of Service** | Automatización / bot que llena la agenda de reservas ficticias | Media | Alta | Rate limiting por IP/huella; validación estricta de teléfono; límite de turnos activos por número de teléfono en una misma semana. | Alertas por pico súbito de reservas desde la misma red. | Descarte de reservas no confirmadas y bloqueo de orígenes maliciosos. | Medio |

---

## 3. Principios de Privacidad y Retención de Datos
1. **Minimización de Recolección:** Solo nombre de pila/apellido y número de teléfono. No se solicitan notas libres, correos innecesarios ni datos bancarios.
2. **Cerveza y Verificación:** Para la opción de bebida con cerveza Brahma, se mantiene deshabilitada de producción hasta contar con la validación de normativa local (Fase 0 - Pendiente 4).
3. **Ciclo de Vida y Purga:** Los turnos completados o cancelados conservan datos de contacto solo durante el plazo operativo estrictamente acordado; se implementará script de anonimización periódica.
