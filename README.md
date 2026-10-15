# Turnos para peluquería

## Visión del producto

Sistema web para que clientes consulten servicios y reserven un turno disponible, y para que personal autorizado administre la agenda. La identidad visual se definirá más adelante y deberá poder aplicarse sin cambiar las reglas de reserva.

El producto debe reducir el intercambio manual para coordinar horarios y dejar una agenda consistente. La disponibilidad que muestra el navegador es orientativa: el servidor es la autoridad al confirmar una reserva.

## Problema y objetivo

Hoy, coordinar por mensajes o llamadas puede requerir intercambios repetidos, producir errores de horario y dificultar que el negocio vea su agenda actualizada. El MVP busca completar la reserva y su gestión básica con pocos datos y reglas claras. No se presupone que esos problemas ocurran actualmente en un negocio concreto; son la hipótesis de producto a validar.

## Personas usuarias y roles

- **Cliente:** consulta servicios y disponibilidad, crea una reserva y puede cancelarla por un flujo verificable.
- **Personal autorizado:** consulta y gestiona la agenda y los turnos dentro de los permisos que tenga asignados.
- **Responsable del negocio:** define catálogo, profesionales, horarios y política de cancelación; administra accesos y decisiones operativas.
- **Sistema:** valida disponibilidad, aplica reglas de negocio y conserva únicamente los datos necesarios para operar.

El MVP puede tener una sola persona administradora. No se debe inferir el rol a partir de datos enviados por el navegador. Cada operación administrativa debe autorizarse en el servidor.

## Alcance del MVP

1. Página pública que presenta servicios, duración y precio cuando el negocio confirme esos datos.
2. Selección de profesional solo si hay más de uno. Si hay uno, el paso se omite.
3. Consulta de horarios libres según duración del servicio, horario de atención, disponibilidad del profesional y reservas existentes.
4. Formulario de reserva con el mínimo dato de contacto necesario para identificar y gestionar el turno. La selección exacta de campos queda pendiente; no pedir notas libres.
5. Confirmación de reserva solo después de validar de forma autoritativa disponibilidad y reglas en el servidor. La operación debe ser atómica o usar un mecanismo equivalente para evitar doble reserva ante solicitudes simultáneas.
6. Cancelación segura según una política configurable y todavía pendiente. El flujo debe verificar que quien solicita la cancelación está autorizado mediante una sesión o un mecanismo de cancelación aleatorio, limitado, expirable y de un solo uso cuando sea posible. No exponer datos del turno al consultar identificadores predecibles.
7. Vista administrativa protegida para consultar y gestionar catálogo, horarios, profesionales y turnos, según permisos definidos.
8. Estados y mensajes claros para horarios tomados, errores de validación y fallas temporales, sin filtrar detalles internos.

### Servicios y precio informados

- **Corte de pelo:** ARS 10.000.
- **Corte de pelo + bebida:** bebida a elección entre Coca-Cola o cerveza Brahma. El precio del combo todavía está pendiente.

Falta confirmar duración de cada opción, presentación/tamaño de la bebida, si hay disponibilidad variable y cómo reflejarla en el catálogo. Antes de ofrecer cerveza, la persona responsable debe confirmar país/jurisdicción, edad mínima y demás obligaciones aplicables. No recolectar documentos ni datos de salud para resolverlo; aplicar una regla de elegibilidad simple solo si la revisión local determina que corresponde.

## Fuera de alcance inicial

- Pagos, señas, facturación y reembolsos.
- Cuentas de cliente, perfiles persistentes, fidelización o historial comercial.
- Notas libres, datos médicos o detalles sobre el cabello o la salud.
- Chat, campañas, reseñas, analítica publicitaria y recomendaciones.
- Aplicaciones móviles nativas, múltiples sucursales e integraciones externas no aprobadas.
- Automatización de mensajes o recordatorios hasta definir canal, proveedor, consentimiento, costos y retención.

## Flujos funcionales

### Reserva pública

1. El cliente consulta servicios y sus datos publicados.
2. Elige un servicio; el sistema determina si debe mostrar selección de profesional.
3. Elige una fecha y un horario ofrecido como libre.
4. Proporciona solo el contacto requerido y revisa el resumen y las condiciones aplicables.
5. El servidor valida formato, reglas, vigencia del horario y ausencia de conflicto; confirma de forma atómica.
6. El cliente recibe una confirmación con información mínima y, si aplica, un medio seguro para cancelar.

Si otro cliente toma el horario antes de confirmar, el sistema rechaza esa confirmación sin crear un turno duplicado y ofrece volver a consultar horarios.

### Cancelación

1. El cliente inicia la cancelación desde su sesión o enlace/token de capacidad limitada.
2. El servidor valida autenticidad, expiración, uso, estado del turno y ventana permitida por la política vigente.
3. El servidor cancela de forma idempotente o informa un resultado seguro; registra el evento mínimo necesario.
4. Las respuestas no revelan si existe una reserva asociada a un identificador arbitrario.

### Administración

1. Personal autorizado inicia sesión con un mecanismo decidido antes de implementar el panel.
2. El servidor verifica permiso en cada lectura o cambio, y limita el acceso por recurso y operación.
3. Los cambios a agenda, catálogo o turnos se validan en servidor y dejan un evento mínimo de auditoría sin datos de contacto, secretos ni contenido sensible.
4. Al cerrar sesión o vencer la sesión, las rutas administrativas dejan de estar disponibles.

## Reglas de negocio

- El precio informado para corte de pelo es ARS 10.000. El precio del combo corte + bebida no está definido y no debe inventarse ni publicarse como precio real.
- El catálogo inicial ofrece corte de pelo o corte + bebida, con Coca-Cola o cerveza Brahma como opciones del combo. La disponibilidad de bebidas y el precio/duración de cada variante se deben confirmar.
- Los servicios deben tener duración definida para calcular disponibilidad; no se puede habilitar la reserva hasta que la duración de la opción elegida esté definida.
- Los intervalos deben respetar horario de apertura, zona horaria del negocio, duración, pausas y disponibilidad del profesional.
- No se confirma una reserva basándose solo en estado del frontend ni en una consulta previa de disponibilidad.
- Dos solicitudes concurrentes no pueden ocupar el mismo recurso y rango horario incompatible. Definir el mecanismo en arquitectura y verificarlo antes de aceptar el flujo.
- Si hay un profesional, se asigna automáticamente; con varios, el cliente puede elegir entre quienes estén habilitados para ese servicio.
- No se permiten reservas en horarios pasados ni más allá del horizonte que defina el negocio.
- La política de cancelación determina antelación, excepciones, efecto sobre la agenda y comunicación. Hasta que se defina, una demo usa una regla claramente marcada como provisional.
- El personal puede modificar o cancelar un turno solo con permiso explícito y una razón operativa codificada si hace falta; evitar texto libre.

## Datos, privacidad y seguridad

### Minimización y clasificación inicial

| Dato | Finalidad | Clasificación inicial | Acceso previsto | Retención |
| --- | --- | --- | --- | --- |
| Servicio, duración, precio y horarios | Mostrar oferta y calcular agenda | Pública/Interna según dato | Público para oferta; personal para configuración | Mientras esté vigente; definir archivo/borrado |
| Profesional y disponibilidad | Ofrecer horarios y asignar turno | Interna | Público solo en la medida necesaria; personal autorizado | Mientras esté vigente y según necesidades operativas |
| Nombre o identificador de contacto y medio de contacto | Identificar y gestionar un turno | Confidencial | Personal con necesidad operativa; cliente solo respecto de su reserva | Plazo mínimo que se defina según política y obligaciones |
| Identificador interno del turno, servicio, profesional, fecha, estado | Operar agenda y evitar conflictos | Interna/Confidencial por asociación | Servidor y personal autorizado | Definir plazo; eliminar o anonimizar al vencer |
| Token de cancelación, si se usa | Autorizar una cancelación limitada | Restringida mientras sea válido | Solo servidor; no registrar su valor | Expirar al vencer la ventana o al usarse; eliminar/hash según diseño |
| Eventos mínimos de seguridad y administración | Detectar abuso y reconstruir cambios | Interna/Confidencial | Personal operativo estrictamente autorizado | Plazo acotado y documentado |

La tabla es un inventario inicial, no una decisión final. Antes de producción, documentar formato, origen, ubicación, proveedores, transferencias, dueño, accesos, plazo y método de eliminación de cada dato. No pedir datos médicos, pagos, documentos de identidad ni notas libres en el MVP.

### Mapa inicial del flujo de datos

```text
Cliente / navegador
  ├─ consulta catálogo y horarios ──> servidor de aplicación ──> almacenamiento de agenda
  └─ envía contacto y solicitud ────> validación y autorización en servidor
                                          ├─ reserva atómica ──> almacenamiento
                                          ├─ respuesta mínima ─> navegador
                                          └─ evento mínimo ────> registros protegidos

Personal autorizado ──> autenticación ──> autorización por operación/recurso en servidor
                                              ├─ agenda y configuración
                                              └─ evento de auditoría mínimo

Copias de seguridad: almacenamiento/agenda ──> copia protegida ──> restauración verificada
Proveedores de hosting, correo/mensajería, base de datos y monitoreo: por definir; no conectar
hasta evaluar qué datos reciben, ubicación, accesos, retención, borrado e incidentes.
```

Actualizar el mapa si se incorpora autenticación gestionada, mensajería, analítica, hosting, copias administradas u otro proveedor. Incluir también registros, soporte y borrado de copias.

### Controles requeridos

- Validar en servidor cada operación y cada recurso; no confiar en roles, propiedad, precios, duraciones o disponibilidad que envía el cliente.
- Mantener autenticación y autorización administrativa del lado servidor; proteger sesiones, expiración, recuperación y cambios de credenciales según el mecanismo seleccionado.
- Evitar enumeración de turnos y abuso de endpoints públicos; definir límites y respuestas que no revelen existencia o contacto.
- Usar transporte y almacenamiento protegidos por los servicios elegidos. No diseñar criptografía propia.
- Mantener secretos solo en configuración segura del servidor o gestor adecuado; documentar acceso, rotación y revocación. Nunca en cliente, repositorio, capturas o logs.
- No incluir datos personales, tokens, secretos ni cuerpos de solicitudes en registros. Definir eventos mínimos, acceso y plazo de retención.
- Definir política de retención, acceso, corrección y borrado de reservas, registros y copias; documentar cómo se propaga el borrado y cómo restaurar sin reintroducir datos expirados.
- Manejar errores con mensajes útiles para el cliente y detalles técnicos protegidos para diagnóstico.
- Usar exclusivamente datos ficticios en demos, capturas, ejemplos y entornos de desarrollo.
- Ajustar avisos, consentimiento cuando corresponda, derechos, transferencias, contratos y otras obligaciones al país, datos y proveedores reales. La documentación no promete cumplimiento legal ni riesgo cero; la persona responsable debe obtener revisión adecuada antes de producción.

### Amenazas iniciales a revisar

| Amenaza | Impacto posible | Controles a diseñar y verificar |
| --- | --- | --- |
| Doble reserva por solicitudes simultáneas | Agenda inconsistente y perjuicio a clientes | Restricción/operación atómica en servidor, conflictos explícitos y verificación concurrente |
| Acceso administrativo o a turno ajeno | Exposición o modificación de agenda y contacto | Autenticación, autorización por recurso/operación, sesiones seguras y pruebas de acceso negativo |
| Adivinación o filtración de enlace de cancelación | Cancelación no autorizada o exposición de reserva | Token aleatorio no predecible, alcance mínimo, expiración, un solo uso, almacenamiento seguro y respuestas no enumerables |
| Automatización/abuso de disponibilidad o reservas | Indisponibilidad y reservas basura | Límites razonables, validación, monitoreo mínimo y respuesta operativa |
| Filtración en logs, proveedor o copia | Exposición persistente de datos | Minimización, controles de acceso, retención, revisión de proveedor y proceso de borrado |
| Pérdida o corrupción de agenda | Interrupción y pérdida de reservas | Copias protegidas, restauración practicada y reconciliación de eventos |

El agente implementador debe revisar probabilidad, impacto, señales de detección, respuesta y riesgo residual con la arquitectura y proveedores reales. Usar como referencias el [diseño seguro de OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secure_Product_Design_Cheat_Sheet.html), [gestión de secretos OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html), [registro OWASP](https://cheatsheetseries.owasp.org/cheatsheets/Logging_Cheat_Sheet.html), [NIST SSDF](https://csrc.nist.gov/pubs/sp/800/218/final) y [NIST Privacy Framework](https://www.nist.gov/privacy-framework/privacy-framework). Son referencias para el trabajo, no una certificación.

## Supuestos provisionales de prototipo

Estos valores solo permiten prototipar navegación con datos ficticios y deben rotularse como tales:

- Un local, un profesional y un catálogo de ejemplo no confirmado.
- Horario ilustrativo de lunes a viernes, de 09:00 a 18:00, con disponibilidad ficticia.
- Servicios, duraciones y precios de muestra claramente identificados como ficticios.
- Cancelación sin costo hasta 24 horas antes solo como regla simulada, no como política aprobada.
- Zona horaria y país sin asumir en producción; usar una zona elegida explícitamente para prototipo y mostrarla.
- Sin pagos, notificaciones externas ni datos reales.

No usar estos defaults para publicar, aceptar reservas reales ni redactar promesas comerciales.

## Dirección tecnológica informada

La dirección indicada prioriza renderizado del lado del servidor o generación estática para SEO local, con Tailwind CSS para estilos y Framer Motion para animaciones. Las alternativas mencionadas todavía no equivalen a elecciones cerradas:

| Área | Dirección/opciones informadas | Estado y criterio |
| --- | --- | --- |
| Framework | Next.js o SvelteKit | Falta elegir uno. Comparar SSR/SSG, SEO, experiencia del equipo, mantenimiento e integración con el backend. |
| Estilos y animación | Tailwind CSS; Framer Motion | Preferencias de implementación; confirmar compatibilidad con el framework elegido y necesidad real de animaciones antes de agregar dependencias. |
| CMS de contenido | Contentful, Sanity o Strapi | Alternativas, no decisión. Para un único local el CMS puede agregar costo, proveedor y superficie operativa; comparar contra un panel administrativo pequeño que ya requiere el MVP. |
| Base de datos y autenticación | Supabase/PostgreSQL o Firebase | Alternativas, no decisión. Para reservas con relaciones y conflictos de horario, PostgreSQL/Supabase es el candidato inicial a evaluar por sus transacciones y restricciones relacionales; validar documentación, límites y modelo de autorización antes de adoptarlo. |
| Motor de reservas | Square Appointments, Acuity, Calendly o desarrollo propio | Pendiente. Comparar disponibilidad en el país, precio, integración, sincronización, tratamiento de datos y capacidad de aplicar las reglas del negocio. Un desarrollo propio da control, pero obliga a verificar concurrencia, horarios y operación. |
| Hosting | Vercel o Netlify | Alternativas, no decisión. Elegir según framework, backend, ubicación/procesamiento de datos, costos, copias, observabilidad y plan de reversión. |
| Analítica y rendimiento | Lighthouse; Vercel Analytics si corresponde | Medir rendimiento móvil y Core Web Vitals con un objetivo acordado. No asumir que una carga menor a un segundo ni que más del 80% de reservas móviles estén demostrados. Agregar analítica solo con finalidad y revisión de privacidad documentadas. |

No se eligió stack ni proveedor todavía. Antes de escoger o configurar tecnologías, el agente debe consultar Context7 como exigen las instrucciones globales: `library` primero y luego `docs` para cada concepto relevante. Registrar la comparación y la decisión en un ADR. No afirmar que Tailwind garantiza por sí solo un bundle pequeño ni que una opción tecnológica garantiza escala, SEO o rendimiento.

## Decisiones pendientes

Resolver y documentar antes de producción, y antes de implementar la parte que dependa de cada decisión:

1. Duración, precio del combo corte + bebida, presentación de bebidas, pausas y combinaciones permitidas. El precio del corte ya informado es ARS 10.000.
2. Cantidad de profesionales, servicios que realiza cada uno y quién administra.
3. Días, horarios, feriados, pausas, anticipación mínima y horizonte de reserva.
4. Política de cancelación y tratamiento de ausencias o cambios por el negocio.
5. País/ciudad de operación, zona horaria y jurisdicciones de clientes/procesamiento relevantes. La moneda informada es ARS; confirmar ubicación y obligaciones aplicables, en especial antes de ofrecer cerveza.
6. Dato mínimo de contacto y método para enviar confirmación y cancelación (por ejemplo, email, teléfono u otro); proveedor y costos si aplica.
7. Elección concreta entre Next.js y SvelteKit; CMS (o no usar uno); Supabase/PostgreSQL o Firebase; motor externo o desarrollo propio; Vercel o Netlify; y ubicación de datos, autenticación, copias y monitoreo.
8. Retención, borrado, soporte, recuperación y responsables operativos.
9. Obligaciones legales/contractuales aplicables y necesidad de revisión profesional según país, datos y proveedores reales.
10. Identidad visual, contenido, dominio y criterios de accesibilidad.

No bloquear prototipos con datos ficticios por estos puntos. Registrar toda decisión con fecha, responsable, motivo, alternativas consideradas y consecuencias en el plan de implementación.

## Documentos de trabajo y entregables del proyecto

- [Plan de implementación](PLAN_IMPLEMENTACION.md): fases, dependencias, criterios de salida, seguridad y handoff.
- [Instrucciones para agentes](AGENTS.md): orden de lectura y reglas operativas del proyecto.
- [Guía de operación y despliegue](docs/GUIA_OPERACION_DESPLIEGUE.md): comandos de instalación, ejecución, backups y purga.
- [ADR 001 - Stack y Arquitectura](docs/ADR_STACK_ARQUITECTURA.md): justificación técnica (Next.js, SQLite/PostgreSQL, motor propio).
- [Contratos de Interfaz](docs/CONTRATOS_INTERFACES.md): esquemas Zod, APIs y matriz de permisos.
- [Modelo de Turnos y Concurrencia](docs/MODELO_TURNOS_CONCURRENCIA.md): prevención de colisiones atómicas.
- [Threat Model](docs/THREAT_MODEL.md): matriz STRIDE, límites de confianza y controles preventivos.
- [Procedimiento de Backup y Restauración](docs/PROCEDIMIENTO_BACKUP_RESTAURACION.md): runbook de copias e integridad.
- [Política de Retención y Privacidad](docs/POLITICA_RETENCION_PRIVACIDAD.md): tratamiento de datos personales en Argentina.
- Registros formales de fase: [Fase 0](docs/FASE_0_DECISIONES.md), [Fase 1](docs/FASE_1_ARQUITECTURA.md), [Fase 2](docs/FASE_2_BASE_RESERVA.md), [Fase 3](docs/FASE_3_ADMIN.md), [Fase 4](docs/FASE_4_HARDENING.md), [Fase 5](docs/FASE_5_HANDOFF.md).

## Puesta en marcha rápida

```bash
# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev

# Ejecutar las 3 suites de pruebas automatizadas (44 tests)
npx tsx scripts/test-phase2.ts
npx tsx scripts/test-phase3.ts
npx tsx scripts/test-phase4.ts
```
