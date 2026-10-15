# Política de Privacidad, Tratamiento de Datos y Retención

Fecha: 2026-10-14  
Jurisdicción: República Argentina (Marco de referencia: Ley N° 25.326 de Protección de los Datos Personales).  
Referencias: [README.md](../README.md), [THREAT_MODEL.md](THREAT_MODEL.md), NIST Privacy Framework.

---

## 1. Principio de Minimización de Datos
1. **Datos Recolectados:** Únicamente nombre completo y número de teléfono celular.
2. **Datos Excluidos de Forma Estricta:**
   - No se solicitan correos electrónicos innecesarios.
   - No se recolectan notas libres ni comentarios subjetivos.
   - No se procesan datos médicos, características del cabello, ni datos sensibles.
   - No se procesan pagos con tarjeta, CBU ni datos financieros online (los pagos se efectúan presencialmente en el local).

---

## 2. Finalidad del Tratamiento
* **Gestión de Agenda:** Identificar al cliente en el turno solicitado y evitar la superposición de horarios.
* **Canal Operativo:** Contactar al cliente en caso de fuerza mayor o imprevisto operativo que altere el horario reservado.

---

## 3. Política de Retención y Anonimización Periódica
* **Turnos Activos y Futuros:** Se conservan mientras el turno esté en estado `CONFIRMED`.
* **Turnos Pasados (> 90 días):** Se ejecuta el proceso de anonimización (`scripts/purge-expired-data.ts`). El nombre se reemplaza por `ANONIMIZADO` y el teléfono por `0000000000`, conservando únicamente las métricas estadísticas operativas sin asociación a personas físicas identificables.
* **Sesiones Administrativas:** Caducan automáticamente a las 24 horas (`expires_at`) y son purgadas de la base de datos periódicamente.
* **Logs de Auditoría:** Se conservan por un máximo de 180 días con fines de seguridad informática y son depurados automáticamente. No contienen PII.

---

## 4. Derechos del Titular de los Datos (ARCO)
Cualquier cliente puede solicitar la rectificación o supresión anticipada de sus datos de contacto comunicándose directamente con el responsable del salón. El administrador puede cancelar el turno desde `/admin` y ejecutar la purga manual si corresponde.

---

## 5. Pendientes para Fase Productiva
1. **Aviso Legal y Términos:** Publicar texto legal adaptado a la razón social o titular fiscal del establecimiento una vez definidos los datos tributarios en Argentina.
2. **Cerveza Brahma y Legislación Local:** No habilitar comercialmente el expendio de bebidas alcohólicas hasta que el titular del negocio cuente con la habilitación municipal y registro correspondiente en su jurisdicción local.
