# Fase 0 — Registro de decisiones y pendientes

Fecha: 2026-10-13. Fuente de las decisiones: respuestas de la persona responsable del proyecto en esta sesión.

## Objetivo y alcance
Descubrimiento y decisiones de producto previas a la arquitectura (ver [PLAN_IMPLEMENTACION.md](../PLAN_IMPLEMENTACION.md)). No se creó código ni se eligió tecnología.

## Hechos confirmados
| Dato | Valor | Fuente |
| --- | --- | --- |
| Corte de pelo | ARS 10.000 | README |
| Combo | Corte + Coca-Cola o cerveza Brahma (precio y duración pendientes) | README |
| País/zona horaria | Argentina, `America/Argentina/Buenos_Aires`; ciudad por confirmar | Responsable, 2026-10-13 |
| Profesionales | Uno solo, que además administra | Responsable, 2026-10-13 |
| Contacto mínimo del cliente | Nombre + teléfono | Responsable, 2026-10-13 |

Consecuencias: el paso de elegir profesional se omite (README, alcance 2). Un solo rol administrativo. Al pedir teléfono, la confirmación/cancelación no puede asumir email; el canal de envío sigue pendiente (no se conecta ningún proveedor).

## Decisiones de proceso
- Se avanza con **prototipo de datos ficticios** y el stack se decide en Fase 1 con comparación vía Context7 y un ADR. Alternativa descartada por ahora: fijar stack sin comparación.

## Pendientes (dueño: responsable del negocio, salvo indicación)
1. Duración del corte y del combo; precio del combo; presentación de bebidas.
2. Horarios, feriados, pausas, anticipación mínima y horizonte de reserva.
3. Política de cancelación y ausencias.
4. Ciudad; edad mínima y obligaciones para ofrecer cerveza en la jurisdicción (revisión local).
5. Canal de confirmación/cancelación con teléfono (WhatsApp, SMS, llamada u otro), proveedor y costos.
6. Retención, borrado, copias y responsable operativo.
7. Revisión legal/privacidad aplicable en Argentina antes de producción (por la persona responsable con asesoría adecuada).
8. Identidad visual, contenido, dominio y accesibilidad.
9. Stack y proveedores (Fase 1, ADR). Los candidatos del README siguen siendo opciones, no decisiones.

## Inventario de datos (sin cambios respecto del README)
Datos de contacto (nombre, teléfono) = Confidencial; token de cancelación = Restringido; sin notas libres, pagos ni datos médicos. Datos ficticios únicamente en el prototipo.

## Skills
- Invocadas: ninguna en esta fase (solo documentación).
- Instaladas para fases siguientes: `frontend-design`, `find-docs`. No disponibles/no instaladas: `sites` (no aplica por ahora) y skill de seguridad (se usan threat model y OWASP/NIST).

## Verificaciones
- Revisión documental contra README: realizada.
- No se pudieron leer las guías globales `README_ASISTENTE.md` y `README.md` de `HERRAMIENTAS` (permiso denegado por la política del sistema). Limitación registrada; no se afirma haberlas leído.

## Riesgos y siguiente paso
- Riesgo: ofrecer cerveza sin revisión legal local; mitigación: no habilitarla hasta resolver el pendiente 4.
- Siguiente paso: Fase 1 (comparación de stack con Context7, contratos, modelo de turnos atómico, threat model).
