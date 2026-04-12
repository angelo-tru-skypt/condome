export const RESIDENT_WORKSPACES = [
  {
    title: "Mi residencia",
    description: "Ten a mano la informacion de tu unidad, avisos y documentos importantes.",
    color: "#1A6B9A",
    routes: ["mi-residencia", "avisos", "documentos"],
  },
  {
    title: "Accesos y movilidad",
    description: "Gestiona visitas, vehiculos autorizados y alertas operativas.",
    color: "#2E7D52",
    routes: ["visitas", "vehiculos", "notificaciones"],
  },
  {
    title: "Pagos y soporte",
    description: "Resuelve pagos, historial, reservas e incidencias desde un mismo centro.",
    color: "#D94F10",
    routes: ["pagos", "historial", "reservas", "incidencias"],
  },
];

export const RESIDENT_MODULES = {
  residencia: {
    title: "Mi residencia",
    eyebrow: "Mi unidad",
    description: "Vista central del residente para entender su apartamento, reglas y accesos disponibles.",
    summary:
      "Esta interfaz concentra la informacion que el residente necesita para vivir el dia a dia del condominio sin depender de canales dispersos.",
    actions: ["Revisar datos de la unidad", "Ver reglamentos", "Abrir gestiones frecuentes"],
    workflows: [
      "Consultar la informacion base del apartamento y la convivencia del condominio.",
      "Tener acceso directo a pagos, visitas, reservas e incidencias.",
      "Mantener una experiencia clara desde el primer ingreso a la plataforma.",
    ],
    indicators: ["Unidad visible", "Acciones frecuentes a un clic", "Informacion esencial accesible"],
    related: [
      { label: "Pagos", to: "/pagos" },
      { label: "Avisos", to: "/avisos" },
    ],
  },
  visitas: {
    title: "Solicitar visitas",
    eyebrow: "Acceso",
    description: "Permite registrar invitados, proveedores o entregas para tu apartamento.",
    summary:
      "El residente puede programar visitas con anticipacion, compartir datos de acceso y mantener un historial ordenado de autorizaciones.",
    actions: ["Crear solicitud", "Compartir datos del visitante", "Revisar historial"],
    workflows: [
      "Registrar nombre, fecha, hora y motivo de la visita.",
      "Enviar o mostrar la autorizacion para control de acceso.",
      "Consultar visitas pendientes, aprobadas o ya utilizadas.",
    ],
    indicators: ["Solicitudes listas", "Historial ordenado", "Acceso mas rapido en porteria"],
    related: [
      { label: "Vehiculos", to: "/vehiculos" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  pagos: {
    title: "Pagos",
    eyebrow: "Finanzas",
    description: "Centro del residente para pagar cuotas y ver su estado financiero.",
    summary:
      "La experiencia debe permitir pagar con confianza, entender saldos pendientes y acceder rapidamente a comprobantes recientes.",
    actions: ["Pagar cuota", "Ver balance", "Descargar comprobante"],
    workflows: [
      "Revisar cargos pendientes y su fecha limite.",
      "Seleccionar medio de pago y confirmar la transaccion.",
      "Guardar comprobantes y estados de pago para futuras consultas.",
    ],
    indicators: ["Pagos listos para procesar", "Balance claro", "Comprobantes disponibles"],
    related: [
      { label: "Historial", to: "/historial" },
      { label: "Avisos", to: "/avisos" },
    ],
  },
  historial: {
    title: "Historial de pagos",
    eyebrow: "Finanzas",
    description: "Consulta pagos anteriores, comprobantes y estados de cada transaccion.",
    summary:
      "El residente necesita una vista sencilla para validar su historial, responder dudas y confirmar que cada pago quedo aplicado.",
    actions: ["Filtrar por periodo", "Ver comprobantes", "Validar estado"],
    workflows: [
      "Consultar movimientos por fecha o por tipo de cuota.",
      "Abrir comprobantes asociados a cada pago realizado.",
      "Detectar rapidamente pagos aprobados, pendientes o rechazados.",
    ],
    indicators: ["Trazabilidad completa", "Busqueda rapida", "Comprobantes accesibles"],
    related: [
      { label: "Pagos", to: "/pagos" },
      { label: "Documentos", to: "/documentos" },
    ],
  },
  avisos: {
    title: "Avisos y comunicados",
    eyebrow: "Comunidad",
    description: "Recibe los anuncios oficiales del condominio en una cartelera clara.",
    summary:
      "Desde aqui el residente puede enterarse de mantenimientos, cambios operativos, recordatorios de pago y novedades de convivencia.",
    actions: ["Leer comunicados", "Filtrar por prioridad", "Confirmar lectura"],
    workflows: [
      "Ver los comunicados mas recientes del condominio.",
      "Identificar rapidamente anuncios urgentes o de interes general.",
      "Mantenerse informado sin depender de mensajes sueltos.",
    ],
    indicators: ["Comunicacion centralizada", "Prioridades visibles", "Lectura mas ordenada"],
    related: [
      { label: "Notificaciones", to: "/notificaciones" },
      { label: "Documentos", to: "/documentos" },
    ],
  },
  reservas: {
    title: "Reservas",
    eyebrow: "Operacion",
    description: "Permite reservar amenidades o areas comunes del condominio.",
    summary:
      "El residente puede revisar disponibilidad, solicitar horarios y mantener control de sus reservas sin friccion.",
    actions: ["Ver disponibilidad", "Reservar area", "Revisar reglas"],
    workflows: [
      "Explorar espacios y franjas horarias disponibles.",
      "Enviar solicitudes de reserva con reglas claras.",
      "Consultar reservas activas, futuras o canceladas.",
    ],
    indicators: ["Disponibilidad visible", "Solicitud guiada", "Historial de reservas"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Incidencias", to: "/incidencias" },
    ],
  },
  incidencias: {
    title: "Incidencias y reclamos",
    eyebrow: "Soporte",
    description: "Canal del residente para reportar problemas y dar seguimiento al caso.",
    summary:
      "La vista debe facilitar que el residente reporte una incidencia, adjunte contexto y vea el avance de su solicitud hasta su cierre.",
    actions: ["Crear incidencia", "Adjuntar evidencia", "Ver seguimiento"],
    workflows: [
      "Registrar el problema con ubicacion, categoria y prioridad.",
      "Compartir fotos o notas para acelerar la atencion.",
      "Revisar cambios de estado y respuestas del equipo administrativo.",
    ],
    indicators: ["Reportes ordenados", "Seguimiento visible", "Comunicacion mas clara"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Mi residencia", to: "/mi-residencia" },
    ],
  },
  vehiculos: {
    title: "Vehiculos",
    eyebrow: "Acceso",
    description: "Gestiona tus vehiculos registrados y la informacion asociada al acceso.",
    summary:
      "El residente debe poder revisar los datos de sus vehiculos autorizados, parqueos asignados y observaciones relevantes.",
    actions: ["Ver vehiculos", "Actualizar datos", "Confirmar autorizacion"],
    workflows: [
      "Consultar placas, marcas y parqueos asociados.",
      "Validar que la informacion de acceso este actualizada.",
      "Mantener ordenados los vehiculos autorizados por la unidad.",
    ],
    indicators: ["Registros claros", "Acceso mejor preparado", "Informacion vigente"],
    related: [
      { label: "Visitas", to: "/visitas" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  documentos: {
    title: "Documentos",
    eyebrow: "Biblioteca",
    description: "Accede a reglamentos, normas y documentos compartidos por la administracion.",
    summary:
      "El residente necesita una biblioteca organizada para consultar rapidamente reglas, comunicados formales y archivos de referencia.",
    actions: ["Buscar archivo", "Leer reglamento", "Descargar documento"],
    workflows: [
      "Explorar documentos por categoria o fecha.",
      "Abrir archivos importantes para pagos, convivencia o reservas.",
      "Conservar una referencia confiable dentro de la plataforma.",
    ],
    indicators: ["Biblioteca organizada", "Documentos importantes a mano", "Consulta mas simple"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Mi residencia", to: "/mi-residencia" },
    ],
  },
  notificaciones: {
    title: "Notificaciones",
    eyebrow: "Alertas",
    description: "Centro del residente para alertas de pagos, visitas, reservas e incidencias.",
    summary:
      "Esta vista organiza recordatorios y avisos personales para que el residente no pierda eventos importantes del condominio.",
    actions: ["Revisar alertas", "Priorizar avisos", "Entrar al detalle"],
    workflows: [
      "Ver recordatorios relacionados con pagos o vencimientos.",
      "Recibir actualizaciones de visitas, reservas o incidencias.",
      "Usar las alertas como puerta de entrada a cada gestion.",
    ],
    indicators: ["Alertas centralizadas", "Seguimiento mas claro", "Menos pasos para actuar"],
    related: [
      { label: "Pagos", to: "/pagos" },
      { label: "Visitas", to: "/visitas" },
    ],
  },
};
