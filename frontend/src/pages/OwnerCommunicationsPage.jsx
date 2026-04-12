import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";
const FILTER_INPUT =
  "px-4 py-2.5 bg-[#1A1A1A] border border-[#262626] rounded-xl text-sm text-[#E5E5E5] outline-none focus:border-[#D94F10] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerCommunicationsPage() {
  const { condominio, edificios } = useCondominio();
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState({
    title: "",
    message: "",
    priority: "media",
    scope: "general",
    channel: "panel",
    status: "draft",
    scheduledFor: "",
    targetLabel: "Todo el condominio",
  });

  const loadCommunications = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setCommunications([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.listCommunications(condominio.id);
        setCommunications(response.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los comunicados.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadCommunications();
  }, [loadCommunications]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const filtered =
    filter === "all" ? communications : communications.filter((item) => item.status === filter);

  const summary = {
    total: communications.length,
    published: communications.filter((item) => item.status === "published").length,
    scheduled: communications.filter((item) => item.status === "scheduled").length,
    drafts: communications.filter((item) => item.status === "draft").length,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.title.trim() || !form.message.trim()) {
      setError("El título y el mensaje son requeridos.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createCommunication({
        ...form,
        condominio_id: condominio.id,
      });
      setForm({
        title: "",
        message: "",
        priority: "media",
        scope: "general",
        channel: "panel",
        status: "draft",
        scheduledFor: "",
        targetLabel: "Todo el condominio",
      });
      await loadCommunications();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el comunicado.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (communicationId, status) => {
    try {
      const response = await adminService.updateCommunication(communicationId, { status });
      setCommunications((current) =>
        current.map((item) => (item.id === communicationId ? response.data : item))
      );
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el comunicado.");
    }
  };

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] overflow-hidden border border-[#E9D5C6]"
        style={{
          background: "linear-gradient(135deg, #1A1612 0%, #2D231D 44%, #55321E 100%)",
          boxShadow: "0 18px 50px rgba(26,22,18,0.14)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#F5D2BC]">
                Avisos y comunicados
              </p>
              <h1 className="mt-3 text-3xl md:text-4xl text-white font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Comunica decisiones del condominio con contexto y trazabilidad.
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/72">
                Desde aquí puedes redactar avisos, priorizar el mensaje y orientar el comunicado a toda la comunidad o a un edificio puntual.
              </p>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <SummaryCard label="Comunicados" value={summary.total} />
              <SummaryCard label="Publicados" value={summary.published} />
              <SummaryCard label="Programados" value={summary.scheduled} />
              <SummaryCard label="Borradores" value={summary.drafts} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.05fr_1.25fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
                Nuevo comunicado
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Redacción operativa</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FFF0E7] text-[#B14F12] text-xs font-semibold">
              Conectado con Odoo
            </span>
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field label="Título">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={INPUT} />
            </Field>

            <Field label="Mensaje">
              <textarea value={form.message} onChange={(event) => setForm((current) => ({ ...current, message: event.target.value }))} className={`${INPUT} min-h-[140px] resize-none`} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Prioridad">
                <select value={form.priority} onChange={(event) => setForm((current) => ({ ...current, priority: event.target.value }))} className={INPUT}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                </select>
              </Field>

              <Field label="Estado inicial">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={INPUT}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicar ahora</option>
                  <option value="scheduled">Programado</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Audiencia">
                <select value={form.scope} onChange={(event) => setForm((current) => ({ ...current, scope: event.target.value }))} className={INPUT}>
                  <option value="general">Todo el condominio</option>
                  <option value="edificio">Edificio específico</option>
                  <option value="residentes">Solo residentes</option>
                  <option value="propietarios">Solo propietarios</option>
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
              <Field label="Destino visible">
                <input value={form.targetLabel} onChange={(event) => setForm((current) => ({ ...current, targetLabel: event.target.value }))} className={INPUT} list="communication-targets" />
              </Field>

              <Field label="Fecha programada">
                <input type="datetime-local" value={form.scheduledFor} onChange={(event) => setForm((current) => ({ ...current, scheduledFor: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <datalist id="communication-targets">
              <option value="Todo el condominio" />
              {edificios.map((item) => (
                <option key={item.id} value={item.nombre} />
              ))}
            </datalist>

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
              {saving ? "Guardando..." : "Guardar comunicado"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Historial</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Cartelera del condominio</h2>
            </div>
            <select value={filter} onChange={(event) => setFilter(event.target.value)} className={FILTER_INPUT}>
              <option value="all">Todos</option>
              <option value="published">Publicados</option>
              <option value="scheduled">Programados</option>
              <option value="draft">Borradores</option>
              <option value="archived">Archivados</option>
            </select>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <LoadingState label="Cargando comunicados..." />
            ) : filtered.length ? (
              filtered.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill>{item.priority}</Pill>
                        <Pill variant="soft">{item.scope}</Pill>
                        <Pill variant="soft">{item.status}</Pill>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#5D554E]">{item.message}</p>
                    </div>
                    <div className="text-right text-xs text-[#737373]">
                      <p>{item.targetLabel}</p>
                      <p className="mt-1">{item.channel}</p>
                      <p className="mt-1">{formatDate(item.scheduledFor || item.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <ActionChip onClick={() => updateStatus(item.id, "published")}>Publicar</ActionChip>
                    <ActionChip onClick={() => updateStatus(item.id, "scheduled")}>Programar</ActionChip>
                    <ActionChip onClick={() => updateStatus(item.id, "archived")}>Archivar</ActionChip>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No hay comunicados para este filtro" description="Crea un aviso nuevo o cambia el filtro para revisar el historial completo." />
            )}
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
        <p className="text-sm text-[#737373] mt-2">Necesitamos una ficha base del condominio para organizar comunicados por edificio y por comunidad.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[#262626] bg-[#333333] backdrop-blur-sm p-4">
      <p className="text-[11px] uppercase tracking-[0.2em] text-[#F5D2BC]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
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

function Pill({ children, variant = "strong" }) {
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#FFF0E7] text-[#B14F12]"}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#E6DCD2] text-xs font-semibold text-[#A3A3A3] hover:border-[#D94F10]/30 hover:text-[#D94F10]">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function LoadingState({ label }) {
  return <p className="text-sm text-[#A3A3A3]">{label}</p>;
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
