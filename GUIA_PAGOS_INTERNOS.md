# Guía: Gestión de Pagos Internos (Manuales)

Esta guía explica cómo procesar los pagos que los residentes registran manualmente a través del portal.

## Flujo de Trabajo

### 1. Registro del Residente
Cuando un residente realiza una transferencia bancaria a la cuenta central, accede al portal y:
- Selecciona el cargo pendiente.
- Ingresa el **Método de Pago** (Transferencia/Efectivo).
- Ingresa el número de **Referencia**.
- El sistema marca el cargo como `paid` (Pagado) en Odoo automáticamente para agilizar la vista del residente.

### 2. Validación Administrativa (Odoo Backend)
Es responsabilidad del administrador conciliar estas referencias con el estado de cuenta bancario real:

1. Inicie sesión en Odoo.
2. Vaya a **Condome Billing > Cargos**.
3. Filtre por **Estado: Pagado**.
4. Abra el cargo y verifique el campo **Referencia de Pago**.
5. Cruce este número con su cuenta bancaria.
6. Si la referencia es inválida o no se recibió el dinero:
   - Cambie el estado del cargo de vuelta a **Pendiente** o **Vencido**.
   - Añada una nota explicativa en el campo **Observaciones**.
   - El residente verá el cambio de estado inmediatamente en su panel.

## Reglas de Validación Automática
- El sistema impide que dos residentes registren la **misma referencia** para evitar duplicados o errores de dedo.
- La fecha de pago (`paid_at`) se captura en el momento exacto del registro para trazabilidad.

## Soporte
Si tiene problemas con una referencia duplicada legítima, puede editar el registro desde el backend de Odoo con permisos de Administrador de Sistema.
