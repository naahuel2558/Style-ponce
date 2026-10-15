# Plan de implementación

Este documento guía a un agente coordinador futuro. La tarea actual es documentación: no implica que haya una aplicación, tecnología o infraestructura elegida. El alcance y las decisiones de producto están en [README.md](README.md). Seguir las fases en orden y registrar decisiones, cambios, verificaciones y riesgos en cada handoff.

## Forma de trabajo y orquestación

- El **agente coordinador** conserva la responsabilidad de alcance, arquitectura, integración, decisiones, puertas de seguridad y entrega final. Lee primero las instrucciones enumeradas en [AGENTS.md](AGENTS.md).
- Puede delegar tareas acotadas cuando sus entradas, salidas y archivos estén definidos. El coordinador asigna un responsable por archivo o conjunto de archivos; no permitir ediciones simultáneas sobre los mismos archivos.
- Un agente auxiliar devuelve cambios revisables, decisiones tomadas, comandos ejecutados y resultados; el coordinador integra y verifica en la rama de trabajo. No asumir que una tarea delegada quedó integrada solo porque terminó.
- Antes de delegar, escribir contrato de interfaz: rutas/operaciones, esquemas, errores, permisos, datos, dueño de archivos y criterio de aceptación. Si el contrato cambia, pausar la integración y actualizarlo.
- Skills: inspeccionar el catálogo disponible en la sesión y usar las que correspondan, sin inventar nombres ni forzar todas. Cada fase registra skills invocadas y motivo, y skills aplicables que no estaban disponibles. Ejemplos: `frontend-design` para interfaz/estilo; `find-docs` y la política global de Context7 para documentación actual de tecnologías; `sites` solo si se decide implementar o publicar con Sites. No asumir que hay una skill de seguridad si no aparece en el catálogo; aplicar el threat model y las referencias OWASP/NIST del README.

## Por qué construir por flujo vertical

Implementar primero toda la interfaz aislada y dejar el backend para después crea contratos imaginarios: la UI puede asumir estados, errores, permisos, disponibilidad o tiempos de respuesta que el servidor no ofrece. Integrar por flujo vertical obliga a validar temprano el modelo de datos, las reglas y las respuestas reales; reduce retrabajo y detecta conflictos como una reserva tomada entre consulta y confirmación. Cada flujo debe incluir interfaz, servidor, persistencia, errores, permisos y verificaciones correspondientes.

## Fase 0 — Descubrimiento y decisiones de producto

**Dependencias:** ninguna.

**Trabajo:**

1. Leer guía global de estilo, guía global de proyectos, `AGENTS.md`, `README.md` y este plan.
2. Confirmar el objetivo, usuarios, alcance y restricciones; revisar estructura real sin asumir stack.
3. Registrar como dato confirmado el precio de corte (ARS 10.000) y las opciones informadas (corte o corte + Coca-Cola/cerveza Brahma). Resolver o dejar pendiente explícitamente: duración de cada variante, precio del combo, presentación y disponibilidad de bebidas, profesionales, horarios, cancelación, país/ciudad/zona horaria, contacto, proveedores, retención y responsable operativo.
4. Registrar la dirección tecnológica recibida sin convertir opciones en decisiones: Next.js o SvelteKit; Tailwind CSS y Framer Motion como preferencias; Contentful/Sanity/Strapi; Supabase/PostgreSQL o Firebase; Square Appointments/Acuity/Calendly o motor propio; Vercel o Netlify; Lighthouse y posible Vercel Analytics. Confirmar qué es requisito y qué alternativa se elige.
5. Completar ficha de finalidad, inventario de datos, clasificación, acceso, proveedores y obligaciones relevantes.
6. Separar datos ficticios del prototipo de cualquier posible dato de producción. No aceptar datos reales en demo.

**Entregables:** registro de decisiones fechado; alcance MVP actualizado; inventario de datos; lista de pendientes con dueño y fecha objetivo.

**Criterio de salida:** ningún dato, permiso, proveedor o comportamiento sensible se considera acordado por inferencia. Se conserva ARS 10.000 como precio informado del corte; el precio/duración del combo y las demás decisiones pendientes tienen dueño o continúan bloqueadas para producción. Los candidatos tecnológicos no se presentan como elecciones finales.

**Revisión de seguridad:** identificar datos innecesarios, jurisdicciones por confirmar, amenazas iniciales y grupos con acceso.

**Verificación:** revisión documental contra README; no seleccionar tecnología aún si las decisiones que la afectan no están resueltas.

## Fase 1 — Arquitectura, contratos y diseño de seguridad

**Dependencias:** fase 0 terminada para decisiones necesarias a la arquitectura. Si quedan preguntas no bloqueantes, registrar supuestos y límites.

**Trabajo:**

1. Comparar Next.js y SvelteKit contra SSR/SSG y SEO local; elegir una aplicación modular desplegable como una unidad salvo necesidad demostrable de separar servicios.
2. Definir contratos públicos y administrativos, validación, estados, errores, autenticación, autorización, sesiones y acceso a datos.
3. Especificar modelo de turnos y mecanismo autoritativo/atómico para prevenir doble reserva, incluyendo zona horaria y conflictos.
4. Documentar mapa de flujo de datos y límites de confianza para navegador, servidor, almacenamiento, proveedor, logs, soporte y copias.
5. Hacer threat model con impacto, probabilidad estimada, controles preventivos, señales, respuesta y riesgo residual.
6. Evaluar si el MVP necesita CMS. Para un único local, comparar el costo y superficie de Contentful/Sanity/Strapi con editar contenido desde el panel administrativo; no añadir un CMS sin una necesidad concreta.
7. Comparar Supabase/PostgreSQL y Firebase, y proveedores de agenda externos (Square Appointments, Acuity, Calendly) frente a desarrollo propio. Considerar transacciones/conflictos, país disponible, costos, sincronización, autorización, exportación y tratamiento de datos. No fijar proveedor por una afirmación general de marketing.
8. Definir retención/borrado, secretos, registros mínimos, backups/restauración y decisiones de hosting/proveedor antes de introducir datos reales. Evaluar Vercel y Netlify según framework y ubicación/procesamiento de datos.
9. Consultar documentación actual antes de elegir o configurar framework, librería, SDK, API, CLI o servicio cloud: seguir la instrucción global de `ctx7`, primero `library`, luego `docs`, hasta 3 comandos por pregunta y una consulta `docs` separada por concepto. `find-docs` complementa el proceso si está disponible; no sustituye el requisito global. No usar docs recordadas para detalles de API/configuración.

**Posibles delegaciones:** agente de arquitectura puede comparar opciones con criterios; otro puede revisar threat model. No editar simultáneamente el mismo documento. El coordinador decide y consolida.

**Entregables:** ADRs/decisiones (incluida comparación de stack/proveedores y si se omite CMS); contratos; diagrama/mapa actualizado; matriz de permisos; plan de datos y operaciones; backlog priorizado.

**Criterio de salida:** se puede implementar un primer flujo de reserva sin inventar contrato, proveedor ni regla crítica; los riesgos abiertos están asignados y delimitados.

**Revisión de seguridad:** revisar autorización por operación/recurso, concurrencia, cancelación, secretos, proveedores y exposición en errores/logs.

**Verificación:** revisión del diseño contra las referencias OWASP/NIST enlazadas en README y aprobación de responsables de producto/operación para las decisiones que les corresponden.

## Fase 2 — Base técnica mínima y flujo vertical público de reserva

**Dependencias:** fases 0 y 1. Tecnología y proveedor seleccionados o límites de prototipo claramente fijados.

**Trabajo:**

1. Inicializar solo la estructura acordada, configuración segura y persistencia de desarrollo con datos ficticios.
2. Implementar catálogo con corte a ARS 10.000 y corte + bebida (Coca-Cola o cerveza Brahma) solo con duración y precio aprobados; horario, disponibilidad y reserva end-to-end: vista pública → endpoint/acción del servidor → validación → persistencia → confirmación.
3. El servidor calcula/valida disponibilidad al confirmar y evita doble reserva mediante transacción, restricción o mecanismo equivalente probado bajo solicitudes concurrentes.
4. Implementar selección condicional de profesional y reglas de duración/horario en el servidor.
5. Definir y ejecutar el flujo de confirmación y cancelación conforme a política aprobada; si no hay canal real elegido, dejarlo como demo sin envío externo. Antes de ofrecer cerveza, resolver la revisión de edad y obligaciones de la jurisdicción aplicable.
6. Integrar estados de conflicto, errores seguros y recuperación de la consulta de horarios.

**Posibles delegaciones:** auxiliar A toma UI pública y sus estilos; auxiliar B toma dominio/API/persistencia; el coordinador primero define contratos y asigna archivos sin solapamiento. Integrar en un flujo funcional, no por capas aisladas.

**Entregables:** reserva pública funcional en entorno de desarrollo; contrato actualizado; datos demo ficticios; instrucciones de ejecución local.

**Criterio de salida:** reserva normal funciona end-to-end; carrera por horario no produce duplicados; un error no crea confirmación falsa; el cliente ve resultado seguro y entendible.

**Revisión de seguridad:** entradas no confiables, abuso/automatización, enumeración, minimización, token de cancelación y fugas en logs. Revisar además que bebida/precio/duración se obtengan de datos vigentes del servidor y no de campos manipulables del cliente.

**Verificación:** implementar verificaciones automatizadas y manuales acordes al stack y registrar comandos/resultados. Cubrir al menos reserva válida, horario ocupado/simultáneo, horario inválido/pasado, entradas inválidas, cancelación inválida/expirada/usada y ausencia de datos sensibles en logs. No afirmar ejecución si no se ejecutó.

## Fase 3 — Panel administrativo protegido

**Dependencias:** flujo público integrado; autenticación y matriz de permisos decididas.

**Trabajo:**

1. Implementar inicio/cierre de sesión, expiración y recuperación según mecanismo aprobado.
2. Construir panel para turnos y configuración que pertenezca al MVP.
3. Verificar autorización en servidor para cada ruta, acción y recurso; ocultar botones en UI no cuenta como control.
4. Registrar cambios administrativos mínimos y protegidos sin incluir contacto, tokens, secretos ni cuerpos sensibles.
5. Definir manejo de cambios/cancelaciones por personal y sus efectos sobre disponibilidad.

**Posibles delegaciones:** un agente implementa UI del panel con datos de contrato; otro puede revisar autorización o aportar verificaciones. No compartir archivos en edición simultánea.

**Entregables:** panel protegido, matriz de permisos implementada y guía de operación.

**Criterio de salida:** acceso no autenticado o sin permiso falla en servidor; personal autorizado puede completar tareas acordadas; sesiones vencidas no conservan acceso.

**Revisión de seguridad:** IDOR/acceso a recurso ajeno, CSRF cuando corresponda al mecanismo, sesiones, abuso de privilegio, errores y logs.

**Verificación:** registrar pruebas/controles positivos y negativos, cambios de permisos, sesión expirada y rutas directas. No declarar verificación sin evidencia.

## Fase 4 — Hardening, privacidad y operación

**Dependencias:** fases 2 y 3 integradas; proveedor real definido si se prepara producción.

**Trabajo:**

1. Revisar configuración por entorno, permisos, dependencias, transporte, almacenamiento, cabeceras y límites adecuados al stack.
2. Revisar secretos, acceso y rotación; confirmar que no hay valores secretos en cliente, repo, logs o artefactos.
3. Revisar el inventario y flujos con proveedores reales: ubicación, finalidad, acceso, retención, borrado, transferencias e incidentes.
4. Implementar política de retención y borrado, incluidas copias, registros, token y procedimiento de restauración que no reintroduzca registros expirados.
5. Configurar copias protegidas, monitoreo mínimo, alertas accionables y respuesta a incidentes; practicar restauración en entorno controlado.
6. Revisar accesibilidad, errores, rendimiento y comportamiento ante indisponibilidad de dependencias. Usar Lighthouse para registrar mediciones reproducibles; acordar el umbral de rendimiento con datos antes de declararlo cumplido. Vercel Analytics es condicional a elegir Vercel y a documentar finalidad, datos recibidos, retención y requisitos de privacidad; si no, evaluar no añadir analítica o usar una alternativa aprobada.
7. Completar revisión de privacidad/legal adecuada al país y datos reales. No publicar si obligaciones o consentimiento requeridos no están resueltos.

**Posibles delegaciones:** revisión independiente de configuración/privacidad y revisión de accesibilidad; cada una devuelve hallazgos priorizados. El coordinador es dueño de corregir o elevar riesgos.

**Entregables:** checklist de producción completado; procedimientos de secreto, incidente, backup/restauración y borrado; riesgos residuales aceptados por responsables.

**Criterio de salida:** restauración verificada; retención y borrado definidos; errores/logs y permisos revisados; hallazgos críticos corregidos o aceptación explícita y documentada. No confundir salida técnica con aprobación legal.

**Revisión de seguridad:** revisar todo el threat model ante cambios de datos, permisos, funciones públicas, proveedor o arquitectura.

**Verificación:** ejecutar y documentar controles de seguridad/calidad definidos por el stack y resultados concretos de restauración, escaneo/revisión y comprobaciones manuales. No hacer afirmaciones de cumplimiento automático.

## Fase 5 — Handoff y preparación de lanzamiento

**Dependencias:** fases anteriores con criterios de salida satisfechos. El lanzamiento requiere autorización operativa aparte si corresponde.

**Trabajo:**

1. Consolidar README, decisiones, arquitectura, inventario, contratos, configuración por entorno sin secretos y guía de operación.
2. Resumir cambios, verificaciones con evidencia, riesgos residuales y tareas pendientes.
3. Asegurar que los datos de demo sean ficticios y que ningún secreto quede en archivos, historial o registros.
4. Dar instrucciones de despliegue/reversión y quién puede aprobar y ejecutar cada paso.
5. Entregar estado reproducible: rama/revisión, comandos ejecutados, variables esperadas por nombre (nunca sus valores), y contexto para el agente siguiente.

**Entregables:** paquete de handoff y lista de salida a producción.

**Criterio de salida:** el siguiente agente o responsable puede continuar sin repetir descubrimiento; las verificaciones tienen resultado trazable; decisiones abiertas y riesgos tienen dueño.

## Registro obligatorio por fase

Al cerrar cada fase, dejar:

1. Objetivo y alcance de la fase.
2. Archivos/cambios realizados y responsables.
3. Decisiones y motivos, con fecha y alternativas relevantes.
4. Skills invocadas y por qué; skills aplicables no disponibles.
5. Verificaciones ejecutadas, comandos y resultados; lo no ejecutado, explícitamente pendiente.
6. Riesgos, supuestos y decisiones abiertas con dueño.
7. Próximo paso, dependencias y contrato para tareas delegadas.

## Protocolo de handoff entre agentes

- El coordinador prepara una tarea con contexto, alcance, criterios de salida, archivos asignados y archivos que no se deben tocar.
- El agente auxiliar trabaja solo dentro del contrato y devuelve cambios con explicación, verificaciones reales y limitaciones.
- El coordinador inspecciona el diff, integra secuencialmente, resuelve conflictos y verifica interfaces en conjunto.
- Si aparece una decisión de producto, seguridad, privacidad o arquitectura fuera de contrato, no improvisar: registrar y consultar a quien corresponda antes de habilitarla.
- No delegar autenticación, autorización, cancelación, retención o manejo de secretos sin contrato explícito y revisión del coordinador.
