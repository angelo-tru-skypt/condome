import { useEffect, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const FILTER_INPUT =
  "px-4 py-2.5 bg-[#1A1A1A] border border-[#262626] rounded-xl text-sm text-[#E5E5E5] outline-none focus:border-[#D94F10] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerAuditPage() {
  const { condominio, edificios, apartamentos, residentes } = useCondominio();
  const [events, setEvents] = useState([]);
  const [filter, setFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!condominio?.id) {
      setEvents([]);
      setLoading(false);
      return;
    }

    Promise.all([
      adminService.listAuditEntries(condominio.id).catch(() => ({ data: [] })),
      adminService.listNotifications(condominio.id).catch(() => ({ data: [] })),
      adminService.listVisits().catch(() => ({ data: [] })),
      adminService.listIncidents().catch(() => ({ data: [] })),
    ])
      .then(([auditResponse, notificationsResponse, visitsResponse, incidentsResponse]) => {
        const workspaceEvents = (auditResponse.data || []).map((item) => ({
          id: item.id,
          source: item.category || "workspace",
          title: item.title,
          detail: item.detail,
          actor: item.actor || "Sistema",
          severity: item.severity || "info",
          createdAt: item.createdAt,
        }));

        const visitEvents = (visitsResponse.data || [])
          .filter((item) => item.fecha_decision || item.estado !== "pendiente")
          .map((item) => ({
            id: `visit_${item.id}`,
            source: "visitas",
            title: `Solicitud ${item.estado}`,
            detail: `${item.visitante_nombre} · ${item.apartamento_nombre}`,
            actor: "Flujo de visitas",
            severity: item.estado === "rechazada" ? "warning" : "success",
            createdAt: item.fecha_decision || item.fecha_visita,
          }));

        const incidentEvents = (incidentsResponse.data || []).map((item) => ({
          id: `incident_${item.id}`,
          source: "incidencias",
          title: `Incidencia ${item.estado}`,
          detail: `${item.titulo} · ${item.residente_nombre}`,
          actor: "Flujo de incidencias",
          severity: item.estado === "cerrada" || item.estado === "resuelta" ? "success" : "info",
          createdAt: item.fecha_resolucion || item.fecha_reporte,
        }));

        const notificationEvents = (notificationsResponse.data || []).map((item) => ({
          id: `notification_${item.id}`,
          source: "notificaciones",
          title: item.read ? "Notificacion atendida" : "Notificacion generada",
          detail: item.message,
          actor: "Sistema",
          severity: item.read ? "success" : "warning",
          createdAt: item.fecha_creacion,
        }));

        const combined = [...workspaceEvents, ...visitEvents, ...incidentEvents, ...notificationEvents]
          .filter((item) => item.createdAt)
          .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));

        setEvents(combined);
      })
      .finally(() => setLoading(false));
  }, [condominio?.id, edificios, apartamentos, residentes]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const filtered = filter === "all" ? events : events.filter((item) => item.source === filter);

  if (loading) {
    return <PageLoader label="Cargando auditoria..." />;
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
              Auditoria del condominio
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              Sigue el rastro de cambios y decisiones relevantes.
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Esta bitacora junta eventos del workspace administrativo con actividad operativa de visitas, incidencias y notificaciones.
            </p>
          </div>

          <div className="flex items-center gap-3 flex-wrap">
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className={FILTER_INPUT}>
              <option value="all">Todos los eventos</option>
              <option value="avisos">Avisos</option>
              <option value="reservas">Reservas</option>
              <option value="acceso">Acceso</option>
              <option value="visitas">Visitas</option>
              <option value="incidencias">Incidencias</option>
              <option value="notificaciones">Notificaciones</option>
            </select>
            <span className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-[#A3A3A3] text-xs font-semibold">
              {filtered.length} eventos visibles
            </span>
          </div>
        </div>
      </section>

      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="space-y-4">
          {filtered.length ? (
            filtered.map((event) => (
              <article key={event.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                <div className="flex items-start gap-4">
                  <SeverityDot severity={event.severity} />
                  <div className="flex-1">
                    <div className="flex items-center justify-between gap-3 flex-wrap">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{event.source}</Badge>
                          <Badge variant="soft">{event.actor}</Badge>
                        </div>
                        <h2 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{event.title}</h2>
                      </div>
                      <p className="text-xs text-[#737373]">{formatDate(event.createdAt)}</p>
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#5D554E]">{event.detail}</p>
                  </div>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No hay eventos para este filtro"
              description="Cuando generes cambios en avisos, reservas, acceso o actividad operativa, apareceran aqui."
            />
          )}
        </div>
      </section>
    </div>
  );
}

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[#E5E5E5]">Primero registra tu condominio</p>
        <p className="text-sm text-[#737373] mt-2">
          La auditoria se organiza por condominio para que el historial tenga sentido operativo.
        </p>
      </div>
    </div>
  );
}

function PageLoader({ label }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#D94F10]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#6F7B7B]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function SeverityDot({ severity }) {
  const color =
    severity === "success" ? "bg-[#2E7D52]" : severity === "warning" ? "bg-[#D94F10]" : "bg-[#1A6B9A]";
  return <span className={`mt-1 w-3 h-3 rounded-full flex-shrink-0 ${color}`} />;
}

function Badge({ children, variant = "strong" }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
        variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#EEF6FF] text-[#1A6B9A]"
      }`}
    >
      {children}
    </span>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function formatDate(value) {
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
