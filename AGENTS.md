# Instrucciones para agentes

## Orden de lectura obligatorio

Antes de cambiar archivos, leé en este orden:

1. `C:\Users\Lautaro\OneDrive\Documents\ChatGPT\HERRAMIENTAS\README_ASISTENTE.md` para tono y forma de colaboración.
2. `C:\Users\Lautaro\OneDrive\Documents\ChatGPT\HERRAMIENTAS\README.md` para proceso de proyectos y controles de seguridad.
3. Este `AGENTS.md`.
4. [`README.md`](README.md) del proyecto.
5. [`PLAN_IMPLEMENTACION.md`](PLAN_IMPLEMENTACION.md).
6. Otros documentos o instrucciones locales relevantes.

Si una guía global no está disponible, seguí las instrucciones restantes y registrá la limitación. No inventes que la leíste.

## Reglas de trabajo

- Seguí las fases del `PLAN_IMPLEMENTACION.md` en orden. No saltees descubrimiento, contratos o revisiones de seguridad para acelerar implementación.
- Esta carpeta puede empezar vacía. Inspeccioná su estado y no presupongas lenguaje, framework, infraestructura ni código existente.
- Antes de elegir o configurar una librería, framework, SDK, API, CLI o servicio cloud, seguí la instrucción global de `ctx7`: ejecutar primero `npx ctx7@latest library <nombre oficial> "<consulta concreta>"`, seleccionar el ID válido, y después `npx ctx7@latest docs <org/proyecto> "<concepto concreto>"`. Consultá cada concepto por separado y no superes tres comandos por pregunta. No pongas secretos en esas consultas. La guía global pide ejecutar Context7 fuera del sandbox predeterminado; si falla por DNS/red dentro del sandbox, reintentá fuera del sandbox según el procedimiento de permisos vigente. No reemplaces silenciosamente una falla de cuota por conocimiento recordado: informá el bloqueo y la alternativa de autenticación indicada por la guía global.
- Inspeccioná el catálogo de skills disponible en la sesión y usá las relevantes sin inventar nombres ni forzar todas. Ejemplos: `frontend-design` para construir o estilizar la interfaz; `find-docs` junto con Context7 para documentación actual; `sites` solo si se implementa o publica con Sites. Si una skill aplicable no está en el catálogo, registralo. No afirmes que existe una skill de seguridad si no aparece disponible: usá el threat model y las referencias OWASP/NIST del README.
- Cada fase debe registrar las skills invocadas y por qué, además de skills aplicables no disponibles, siguiendo el formato de registro del plan.
- Mantené separados interfaz, reglas de negocio y acceso a datos. El servidor valida disponibilidad y autorización; el navegador no es autoridad.
- Asigná un responsable por archivo al delegar. No hagas ni permitas ediciones concurrentes sobre los mismos archivos. El coordinador integra y revisa los cambios delegados.
- No incluyas datos reales, contraseñas, tokens, claves, certificados ni información de usuarios en código, ejemplos, logs, capturas o demos. Para este MVP no agregues notas libres ni datos médicos o de pago.
- No registres datos personales, tokens, secretos ni cuerpos de solicitudes en logs. Definí retención, borrado, copias y restauración antes de producción.
- No confíes en valores de cliente para identidad, rol, propiedad, precio, duración o permiso. Autorizá en servidor cada operación administrativa y cada recurso.
- Aplicá las revisiones de seguridad y privacidad como criterios de cada fase, no como una revisión improvisada al final. Usá el threat model y las referencias del README; actualizá ambos si cambian datos, permisos, proveedores o arquitectura.
- Ajustá obligaciones legales y de privacidad al país, datos y proveedores reales. No prometas cumplimiento ni riesgo cero.
- Separá hechos, inferencias y decisiones pendientes. Usá defaults de prototipo solo con datos ficticios, marcados como provisionales; exigí confirmación de las decisiones de producto antes de producción.
- No digas que algo se probó, verificó, está seguro o cumple si no ejecutaste y registraste la comprobación correspondiente. Si no pudiste verificar algo, anotá exactamente qué quedó pendiente.
- Cada entrega documenta objetivo, alcance, archivos afectados, decisiones y motivos, verificaciones y resultados, riesgos, pendientes y siguiente paso.

## Alcance documentado

El producto es una web de reservas para una peluquería. El README define el MVP: el corte está informado a ARS 10.000 y se ofrecen corte o corte + bebida (Coca-Cola o cerveza Brahma). Siguen pendientes la duración y el precio del combo, profesionales, horarios, cancelación, país/zona horaria, contacto, elección concreta entre alternativas de tecnología y proveedores, y hosting/backend. No asumas que esos datos ya fueron provistos. No uses defaults del prototipo para aceptar reservas reales ni publicar.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
