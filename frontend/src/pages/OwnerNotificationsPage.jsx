import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerNotificationsPage() {
  const { condominio, residentes } = useCondominio();
  const [notifications, setNotifications] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [sendingNotification, setSendingNotification] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", ok: true });

  const showToast = (message, ok = true) => {
    setToast({ visible: true, message, ok });
    setTimeout(() => setToast({ visible: false, message: "", ok: true }), 4000);
  };
  const [form, setForm] = useState({
    name: "",
    trigger: "incidencia_reportada",
    channel: "panel-email",
    audience: "owner",
    enabled: true,
    template: "",
  });
  const [notificationForm, setNotificationForm] = useState({
    message: "",
    residentId: "",
  });

  const loadData = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setNotifications([]);
        setRules([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [notificationsResponse, rulesResponse] = await Promise.all([
          adminService.listNotifications(condominio.id),
          adminService.listNotificationRules(condominio.id),
        ]);
        setNotifications(notificationsResponse.data || []);
        setRules(rulesResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar las notificaciones.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const unreadCount = notifications.filter((item) => !item.read).length;
  const enabledCount = rules.filter((item) => item.enabled).length;

  const saveRule = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.template.trim()) {
      setError("El nombre de la regla y la plantilla son requeridos.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createNotificationRule({
        condominio_id: condominio.id,
        ...form,
      });
      setForm({
        name: "",
        trigger: "incidencia_reportada",
        channel: "panel-email",
        audience: "owner",
        enabled: true,
        template: "",
      });
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la regla.");
    } finally {
      setSaving(false);
    }
  };

  const toggleRule = async (ruleId, enabled) => {
    try {
      const response = await adminService.updateNotificationRule(ruleId, { enabled });
      setRules((current) => current.map((item) => (item.id === ruleId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la regla.");
    }
  };

  const markAsRead = async (notificationId) => {
    try {
      const response = await adminService.updateNotification(notificationId, { read: true });
      setNotifications((current) =>
        current.map((item) => (item.id === notificationId ? response.data : item))
      );
    } catch (updateError) {
      setError(updateError.message || "No se pudo marcar la alerta como leída.");
    }
  };

  const sendNotification = async (event) => {
    event.preventDefault();
    setError("");
    if (!notificationForm.message.trim()) {
      setError("El mensaje de la alerta es requerido.");
      return;
    }

    setSendingNotification(true);
    try {
      const response = await adminService.createNotification({
        condominio_id: condominio.id,
        message: notificationForm.message,
        residente_id: notificationForm.residentId ? Number(notificationForm.residentId) : undefined,
      });
      setNotifications((current) => [response.data, ...current]);

      if (response.emailSent) {
        showToast("Alerta enviada al panel y por email ✉️");
      } else if (notificationForm.residentId) {
        showToast("Alerta enviada al panel, pero el email no pudo salir", false);
      } else {
        showToast("Alerta enviada al panel correctamente");
      }

      setNotificationForm({ message: "", residentId: "" });
    } catch (sendError) {
      setError(sendError.message || "No se pudo enviar la alerta.");
    } finally {
      setSendingNotification(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 animate-fade-up ${
          toast.ok
            ? "bg-[#0D1F17] border-emerald-500/30 text-emerald-400"
            : "bg-[#1A1A1A] border-[#262626] text-[#A3A3A3]"
        }`}>
          {toast.ok ? "✅" : "⚠️"} {toast.message}
        </div>
      )}
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Notificaciones automáticas</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Diseña reglas de alertas y monitorea su efecto operativo.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">Define qué eventos deben disparar avisos, por qué canal y hacia qué audiencia dentro del condominio.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Reglas" value={rules.length} />
            <SummaryCard label="Activas" value={enabledCount} />
            <SummaryCard label="Alertas" value={notifications.length} />
            <SummaryCard label="Sin leer" value={unreadCount} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Nueva regla</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Automatización</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={saveRule}>
            <Field label="Nombre de la regla">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Disparador">
                <select value={form.trigger} onChange={(event) => setForm((current) => ({ ...current, trigger: event.target.value }))} className={INPUT}>
                  <option value="incidencia_reportada">Incidencia reportada</option>
                  <option value="reserva_pendiente">Reserva pendiente</option>
                  <option value="visita_pendiente">Visita pendiente</option>
                  <option value="documento_publicado">Documento publicado</option>
                </select>
              </Field>
              <Field label="Canal">
                <select value={form.channel} onChange={(event) => setForm((current) => ({ ...current, channel: event.target.value }))} className={INPUT}>
                  <option value="panel">Panel</option>
                  <option value="panel-email">Panel + email</option>
                  <option value="panel-sms">Panel + SMS</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Audiencia">
                <select value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} className={INPUT}>
                  <option value="owner">Administración</option>
                  <option value="propietarios">Propietarios</option>
                  <option value="residentes">Residentes</option>
                  <option value="todos">Todos</option>
                </select>
              </Field>
              <label className="flex items-center gap-3 rounded-xl border border-[#262626] px-4 py-3 mt-[22px]">
                <input type="checkbox" checked={form.enabled} onChange={(event) => setForm((current) => ({ ...current, enabled: event.target.checked }))} />
                <span className="text-sm text-[#E5E5E5]">Regla habilitada</span>
              </label>
            </div>

            <Field label="Plantilla del mensaje">
              <textarea value={form.template} onChange={(event) => setForm((current) => ({ ...current, template: event.target.value }))} className={`${INPUT} min-h-[120px] resize-none`} />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
              {saving ? "Guardando..." : "Guardar regla"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-[#EAE1D7]">
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Alerta manual</p>
            <h3 className="mt-2 text-lg font-semibold text-[#E5E5E5]">Enviar notificación directa</h3>
            <form className="mt-4 space-y-4" onSubmit={sendNotification}>
              <Field label="Destinatario">
                <select
                  value={notificationForm.residentId}
                  onChange={(event) =>
                    setNotificationForm((current) => ({ ...current, residentId: event.target.value }))
                  }
                  className={INPUT}
                >
                  <option value="">Administración general</option>
                  {residentes.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.nombre_completo}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Mensaje">
                <textarea
                  value={notificationForm.message}
                  onChange={(event) =>
                    setNotificationForm((current) => ({ ...current, message: event.target.value }))
                  }
                  className={`${INPUT} min-h-[100px] resize-none`}
                />
              </Field>

              <button
                type="submit"
                disabled={sendingNotification}
                className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}
              >
                {sendingNotification ? "Enviando..." : "Enviar alerta"}
              </button>
            </form>
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6 md:p-7`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Reglas configuradas</p>
            <div className="mt-5 space-y-4">
              {loading ? (
                <p className="text-sm text-[#A3A3A3]">Cargando reglas...</p>
              ) : rules.length ? (
                rules.map((rule) => (
                  <article key={rule.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div>
                        <div className="flex flex-wrap gap-2">
                          <Badge>{rule.trigger}</Badge>
                          <Badge variant="soft">{rule.channel}</Badge>
                          <Badge variant="soft">{rule.audience}</Badge>
                        </div>
                        <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{rule.name}</h3>
                        <p className="mt-2 text-sm leading-6 text-[#5D554E]">{rule.template}</p>
                      </div>
                      <div className="flex gap-2">
                        <ActionChip onClick={() => toggleRule(rule.id, true)}>Activar</ActionChip>
                        <ActionChip onClick={() => toggleRule(rule.id, false)}>Pausar</ActionChip>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <EmptyState title="Aún no hay reglas" description="Crea la primera automatización para empezar a estandarizar alertas del condominio." />
              )}
            </div>
          </div>

          <div className={`${SURFACE} p-6 md:p-7`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Alertas reales del sistema</p>
            <div className="mt-5 space-y-3">
              {loading ? (
                <p className="text-sm text-[#A3A3A3]">Cargando alertas...</p>
              ) : notifications.length ? (
                notifications.slice(0, 8).map((notification) => (
                  <article key={notification.id} className="rounded-[22px] border border-[#262626] bg-[#141414] p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{notification.read ? "leída" : "nueva"}</Badge>
                      </div>
                      {!notification.read && <ActionChip onClick={() => markAsRead(notification.id)}>Marcar leída</ActionChip>}
                    </div>
                    <p className="mt-3 text-sm leading-7 text-[#A3A3A3]">{notification.message}</p>
                    <p className="mt-2 text-xs text-[#737373]">{formatDate(notification.fecha_creacion)}</p>
                  </article>
                ))
              ) : (
                <EmptyState title="No hay alertas activas" description="Cuando una incidencia u otro evento genere notificaciones, aparecerán aquí." />
              )}
            </div>
          </div>
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
        <p className="text-sm text-[#737373] mt-2">Las reglas automáticas necesitan el contexto del condominio para organizar sus destinatarios y eventos.</p>
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

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#A3A3A3] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Badge({ children, variant = "strong" }) {
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#EEF6FF] text-[#1A6B9A]"}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#E6DCD2] text-xs font-semibold text-[#A3A3A3] hover:border-[#D94F10]/30 hover:text-[#D94F10]">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-6 text-center">
      <h3 className="text-base font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
