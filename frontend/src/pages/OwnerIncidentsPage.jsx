import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";

export default function OwnerIncidentsPage() {
  const { condominio } = useCondominio();
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [drafts, setDrafts] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "" });

  const showToast = (message) => {
    setToast({ visible: true, message });
    setTimeout(() => setToast({ visible: false, message: "" }), 4000);
  };

  const loadIncidents = async () => {
    const response = await adminService.listIncidents();
    setIncidents(response.data || []);
  };

  const loadNotifications = async () => {
    if (!condominio?.id) {
      setNotifications([]);
      return;
    }
    const response = await adminService.listNotifications(condominio.id);
    setNotifications(response.data || []);
  };

  useEffect(() => {
    if (!condominio?.id) {
      setIncidents([]);
      setNotifications([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    Promise.all([loadIncidents(), loadNotifications()])
      .catch((loadError) => setError(loadError.message || "No se pudieron cargar las incidencias"))
      .finally(() => setLoading(false));
  }, [condominio?.id]);

  const summary = useMemo(() => {
    const reported = incidents.filter((item) => item.estado === "reportada").length;
    const inReview = incidents.filter((item) => item.estado === "en_revision").length;
    const solved = incidents.filter((item) => item.estado === "resuelta").length;
    return { total: incidents.length, reported, inReview, solved };
  }, [incidents]);

  const getDraft = (incident) =>
    drafts[incident.id] || {
      estado: incident.estado,
      respuesta_propietario: incident.respuesta_propietario || "",
    };

  const updateDraft = (incident, changes) => {
    setDrafts((current) => ({
      ...current,
      [incident.id]: {
        ...getDraft(incident),
        ...changes,
      },
    }));
  };

  const saveIncident = async (incident) => {
    setSavingId(incident.id);
    setError("");
    try {
      const draft = getDraft(incident);
      await adminService.updateIncident(incident.id, draft);
      await loadIncidents();
      if (draft.estado === "resuelta" || draft.estado === "cerrada") {
        showToast(`Incidencia marcada como "${draft.estado}" — se notificó al residente por email ✉️`);
      }
    } catch (saveError) {
      setError(saveError.message || "No se pudo actualizar la incidencia");
    } finally {
      setSavingId(null);
    }
  };

  const markNotification = async (notificationId) => {
    setSavingId(notificationId);
    try {
      await adminService.updateNotification(notificationId, { read: true });
      await loadNotifications();
    } catch (markError) {
      setError(markError.message || "No se pudo marcar la notificación");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <PageLoader label="Cargando incidencias del condominio..." />;
  }

  return (
    <div className="space-y-6">
      {/* Toast de notificación */}
      {toast.visible && (
        <div className="fixed bottom-6 right-6 z-[200] px-5 py-4 rounded-2xl shadow-2xl border bg-[#0D1F17] border-emerald-500/30 text-emerald-400 text-sm font-semibold flex items-center gap-3 animate-fade-up">
          ✅ {toast.message}
        </div>
      )}
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
              Incidencias
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              Seguimiento de reportes del condominio
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Revisa los casos enviados por los residentes, responde desde este tablero y mueve cada incidencia según su avance operativo.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Reportadas" value={summary.reported} />
            <SummaryCard label="En revisión" value={summary.inReview} />
            <SummaryCard label="Resueltas" value={summary.solved} />
          </div>
        </div>
      </section>

      <section className={`${SURFACE} p-6 md:p-7`}>
        <h3 className="text-base font-semibold text-[#E5E5E5] mb-4">Notificaciones recientes</h3>
        <div className="space-y-3">
          {notifications.length ? (
            notifications.map((notification) => (
              <article
                key={notification.id}
                className="rounded-[18px] border border-[#262626] bg-[#141414] px-4 py-3 flex items-start justify-between gap-3"
              >
                <div>
                  <p className="text-xs uppercase tracking-[0.2em] text-[#737373]">Incidencia</p>
                  <p className="text-sm text-[#6F7B7B]">
                    {notification.fecha_creacion
                      ? new Date(notification.fecha_creacion).toLocaleString("es-DO")
                      : "Sin fecha"}
                  </p>
                  <p className="mt-1 text-base font-semibold text-[#E5E5E5]">{notification.message}</p>
                </div>
                {!notification.read && (
                  <button
                    type="button"
                    disabled={savingId === notification.id}
                    onClick={() => markNotification(notification.id)}
                    className="px-4 py-2 rounded-xl text-sm font-semibold text-white"
                    style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}
                  >
                    {savingId === notification.id ? "Guardando..." : "Marcar leída"}
                  </button>
                )}
              </article>
            ))
          ) : (
            <p className="text-sm text-[#7C7C7C]">
              No hay notificaciones nuevas. Las incidencias que reporten los residentes aparecerán aquí automáticamente.
            </p>
          )}
        </div>
      </section>

      <section className={`${SURFACE} p-6 md:p-7`}>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {incidents.length ? (
            incidents.map((incident) => {
              const draft = getDraft(incident);
              return (
                <article key={incident.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-lg font-semibold text-[#E5E5E5]">{incident.titulo}</h2>
                      <p className="mt-1 text-sm text-[#A3A3A3]">
                        {incident.residente_nombre} · {incident.apartamento_nombre} · {incident.edificio_nombre}
                      </p>
                    </div>
                    <StatusBadge status={incident.estado} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MiniRow label="Ubicación" value={incident.ubicacion_tipo} />
                    <MiniRow label="Categoría" value={incident.categoria} />
                    <MiniRow label="Prioridad" value={incident.prioridad} />
                    <MiniRow label="Reporte" value={formatDateTime(incident.fecha_reporte)} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">Descripción</p>
                    <p className="mt-1 text-sm text-[#A3A3A3]">{incident.descripcion}</p>
                  </div>

                  <div className="mt-4 grid gap-4 xl:grid-cols-[220px_1fr]">
                    <div>
                      <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#A3A3A3] mb-1.5">
                        Estado
                      </label>
                      <select
                        value={draft.estado}
                        onChange={(event) => updateDraft(incident, { estado: event.target.value })}
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10"
                      >
                        <option value="reportada">Reportada</option>
                        <option value="en_revision">En revisión</option>
                        <option value="resuelta">Resuelta</option>
                        <option value="cerrada">Cerrada</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#A3A3A3] mb-1.5">
                        Respuesta del propietario
                      </label>
                      <textarea
                        value={draft.respuesta_propietario}
                        onChange={(event) =>
                          updateDraft(incident, { respuesta_propietario: event.target.value })
                        }
                        className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10 min-h-[120px] resize-none"
                        placeholder="Explica qué se hará, si ya se atendió o cuál es el próximo paso"
                      />
                    </div>
                  </div>

                  <div className="mt-4">
                    <button
                      type="button"
                      disabled={savingId === incident.id}
                      onClick={() => saveIncident(incident)}
                      className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-50 cursor-pointer"
                      style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
                    >
                      {savingId === incident.id ? "Guardando..." : "Guardar seguimiento"}
                    </button>
                  </div>
                </article>
              );
            })
          ) : (
            <EmptyState
              title="No hay incidencias registradas"
              description="Cuando un residente reporte un problema, aparecerá aquí para darle seguimiento."
            />
          )}
        </div>
      </section>
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

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] px-4 py-4 text-center min-w-[110px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#E5E5E5]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "resuelta" || status === "cerrada"
      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
      : status === "en_revision"
        ? "bg-orange-500/10 border border-orange-500/20 text-orange-500"
        : "bg-blue-500/10 border border-blue-500/20 text-blue-400";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>{status}</span>;
}

function MiniRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#E5E5E5]">{value}</p>
    </div>
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

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
