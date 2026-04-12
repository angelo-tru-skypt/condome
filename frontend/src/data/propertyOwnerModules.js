export const PROPERTY_OWNER_MODULES = {
  avisos: {
    title: "Avisos del condominio",
    eyebrow: "Comunidad",
    description: "Consulta comunicados oficiales y mantente al tanto de novedades importantes.",
    summary:
      "Este espacio es de consulta para el propietario. Aqui revisas anuncios, cambios operativos y recordatorios emitidos por la administracion.",
    actions: ["Leer avisos", "Filtrar por prioridad", "Revisar comunicados recientes"],
    workflows: [
      "Consultar comunicados generales del condominio.",
      "Revisar avisos importantes relacionados con mantenimiento o convivencia.",
      "Dar seguimiento a mensajes publicados por la administracion.",
    ],
    indicators: ["Avisos recientes", "Comunicados prioritarios", "Mensajes pendientes"],
    related: [
      { label: "Documentos", to: "/documentos" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  visitas: {
    title: "Visitas",
    eyebrow: "Acceso",
    description: "Gestiona el seguimiento de invitados relacionados con tu unidad.",
    summary:
      "Como propietario puedes dar seguimiento a accesos temporales asociados a tu unidad, sin entrar a la gestión global del condominio.",
    actions: ["Consultar solicitudes", "Revisar estatus", "Validar seguimiento"],
    workflows: [
      "Consultar invitaciones o accesos asociados a tu unidad.",
      "Dar seguimiento al estado de cada solicitud.",
      "Mantener control sobre visitantes vinculados a tu propiedad.",
    ],
    indicators: ["Solicitudes activas", "Visitas aprobadas", "Accesos recientes"],
    related: [
      { label: "Reservas", to: "/reservas" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  reservas: {
    title: "Reservas",
    eyebrow: "Amenidades",
    description: "Consulta y organiza solicitudes relacionadas con areas comunes.",
    summary:
      "Esta vista esta pensada para el propietario que necesita revisar disponibilidad, estado y seguimiento de reservas vinculadas a su unidad.",
    actions: ["Consultar disponibilidad", "Revisar solicitudes", "Ver historial"],
    workflows: [
      "Consultar reglas y disponibilidad de areas comunes.",
      "Revisar el estado de solicitudes vinculadas a tu unidad.",
      "Mantener trazabilidad de reservas activas o cerradas.",
    ],
    indicators: ["Reservas activas", "Solicitudes pendientes", "Historial reciente"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Incidencias", to: "/incidencias" },
    ],
  },
  incidencias: {
    title: "Incidencias",
    eyebrow: "Soporte",
    description: "Da seguimiento a reportes e incidencias relacionadas con tu propiedad.",
    summary:
      "Desde aqui el propietario consulta el estado de sus reportes y la respuesta de la administracion sin entrar a la gestión completa del panel administrativo.",
    actions: ["Ver casos", "Filtrar estado", "Revisar respuestas"],
    workflows: [
      "Consultar incidencias abiertas o cerradas vinculadas a tu unidad.",
      "Revisar respuestas y actualizaciones del equipo administrador.",
      "Mantener seguimiento hasta la resolución del caso.",
    ],
    indicators: ["Casos abiertos", "Casos en revision", "Casos resueltos"],
    related: [
      { label: "Documentos", to: "/documentos" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  documentos: {
    title: "Documentos",
    eyebrow: "Biblioteca",
    description: "Accede a reglamentos, actas y archivos compartidos con la comunidad.",
    summary:
      "El propietario puede consultar la documentación relevante del condominio sin editar el repositorio oficial de la administración.",
    actions: ["Consultar archivos", "Revisar categorías", "Buscar soporte"],
    workflows: [
      "Explorar documentos compartidos por la administración.",
      "Consultar archivos por categoría o vigencia.",
      "Usar la biblioteca como soporte para convivencia y pagos.",
    ],
    indicators: ["Documentos vigentes", "Categorias activas", "Archivos recientes"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Historial", to: "/historial" },
    ],
  },
  pagos: {
    title: "Pagos",
    eyebrow: "Finanzas",
    description: "Consulta y prepara el seguimiento de pagos asociados a tu unidad.",
    summary:
      "Aqui el propietario visualiza su estado de cuenta, cargos vinculados y próximos pasos dentro del flujo financiero.",
    actions: ["Revisar estado", "Consultar cargos", "Ver resumen"],
    workflows: [
      "Consultar cargos activos relacionados con tu unidad.",
      "Ver el estado general de pagos pendientes o conciliados.",
      "Preparar el seguimiento antes de ejecutar un pago.",
    ],
    indicators: ["Cargos activos", "Pagos pendientes", "Movimientos recientes"],
    related: [
      { label: "Historial", to: "/historial" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
  historial: {
    title: "Historial de pagos",
    eyebrow: "Finanzas",
    description: "Revisa trazabilidad y comprobantes financieros de tu unidad.",
    summary:
      "Esta vista permite al propietario consultar movimientos previos y tener referencia clara de sus transacciones registradas.",
    actions: ["Filtrar movimientos", "Ver comprobantes", "Revisar periodos"],
    workflows: [
      "Consultar pagos previos vinculados a tu propiedad.",
      "Revisar fechas, periodos y comprobantes disponibles.",
      "Mantener contexto financiero sin depender del panel administrativo.",
    ],
    indicators: ["Pagos conciliados", "Comprobantes disponibles", "Periodos revisados"],
    related: [
      { label: "Pagos", to: "/pagos" },
      { label: "Documentos", to: "/documentos" },
    ],
  },
  notificaciones: {
    title: "Notificaciones",
    eyebrow: "Seguimiento",
    description: "Consulta alertas relevantes sobre cobros, avisos, incidencias y actividad de tu unidad.",
    summary:
      "Esta sección concentra recordatorios y eventos importantes para el propietario desde una perspectiva de seguimiento, no de configuración administrativa.",
    actions: ["Revisar alertas", "Consultar recordatorios", "Seguir eventos"],
    workflows: [
      "Consultar alertas relacionadas con pagos y comunidad.",
      "Revisar recordatorios emitidos por la administración.",
      "Tener visibilidad rápida sobre eventos importantes de tu unidad.",
    ],
    indicators: ["Alertas recientes", "Recordatorios activos", "Eventos visibles"],
    related: [
      { label: "Avisos", to: "/avisos" },
      { label: "Incidencias", to: "/incidencias" },
    ],
  },
  vehiculos: {
    title: "Vehiculos",
    eyebrow: "Movilidad",
    description: "Consulta información de movilidad vinculada a tu unidad.",
    summary:
      "Esta vista te ayuda a mantener referencia de registros vehiculares asociados a tu propiedad sin entrar a la administración global del condominio.",
    actions: ["Consultar registros", "Ver estado", "Revisar autorizaciones"],
    workflows: [
      "Consultar vehículos vinculados a tu unidad.",
      "Revisar autorizaciones o restricciones visibles.",
      "Mantener contexto para acceso y control interno.",
    ],
    indicators: ["Vehiculos registrados", "Autorizaciones activas", "Eventos recientes"],
    related: [
      { label: "Visitas", to: "/visitas" },
      { label: "Notificaciones", to: "/notificaciones" },
    ],
  },
};

export const PROPERTY_OWNER_SECTIONS = [
  {
    title: "Seguimiento personal",
    description: "Todo lo que necesitas ver para gestionar tu unidad sin entrar en funciones administrativas.",
    routes: ["avisos", "documentos", "notificaciones"],
  },
  {
    title: "Gestiones y soporte",
    description: "Espacios para revisar solicitudes, incidencias y actividad vinculada a tu propiedad.",
    routes: ["visitas", "reservas", "incidencias"],
  },
  {
    title: "Finanzas",
    description: "Consulta financiera orientada a tu unidad y su historial.",
    routes: ["pagos", "historial"],
  },
];
