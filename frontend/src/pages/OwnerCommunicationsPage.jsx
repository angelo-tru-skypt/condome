import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";
const FILTER_INPUT =
  "px-4 py-2.5 bg-[#1A1A1A] border border-[#262626] rounded-xl text-sm text-[#E5E5E5] outline-none focus:border-[#D94F10] focus:ring-4 focus:ring-[#D94F10]/10";

const INITIAL_FORM = {
  title: "",
  message: "",
  priority: "media",
  scope: "general",
  channel: "panel",
  status: "draft",
  scheduledFor: "",
  targetLabel: "Todo el condominio",
};

export default function OwnerCommunicationsPage() {
  const { condominio, edificios } = useCondominio();
  const [communications, setCommunications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [filter, setFilter] = useState("all");
  const [form, setForm] = useState(INITIAL_FORM);
  const [editItem, setEditItem] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

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
      if (editItem) {
        await adminService.updateCommunication(editItem.id, form);
        setEditItem(null);
      } else {
        await adminService.createCommunication({
          ...form,
          condominio_id: condominio.id,
        });
      }
      setForm(INITIAL_FORM);
      await loadCommunications();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar el comunicado.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await adminService.deleteCommunication(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadCommunications();
    } catch (delError) {
      setError(delError.message || "No se pudo eliminar el comunicado.");
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

  const handleEdit = (item) => {
    setEditItem(item);
    setForm({
      title: item.title || "",
      message: item.message || "",
      priority: item.priority || "media",
      scope: item.scope || "general",
      channel: item.channel || "panel",
      status: item.status || "draft",
      scheduledFor: item.scheduledFor ? item.scheduledFor.slice(0, 16) : "",
      targetLabel: item.targetLabel || "Todo el condominio",
    });
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const cancelEdit = () => {
    setEditItem(null);
    setForm(INITIAL_FORM);
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
        <div className={`${SURFACE} p-6 md:p-7 h-fit sticky top-6`}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
                {editItem ? "Editar comunicado" : "Nuevo comunicado"}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">
                {editItem ? "Modificar aviso" : "Redacción operativa"}
              </h2>
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

              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={INPUT}>
                  <option value="draft">Borrador</option>
                  <option value="published">Publicar ahora</option>
                  <option value="scheduled">Programado</option>
                  <option value="archived">Archivado</option>
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

            <div className="flex gap-3">
              {editItem && (
                <button type="button" onClick={cancelEdit} className="px-5 py-3 rounded-xl bg-[#262626] text-[#A3A3A3] text-sm font-semibold border-none cursor-pointer">
                  Cancelar
                </button>
              )}
              <button type="submit" disabled={saving} className="flex-1 px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60 cursor-pointer" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
                {saving ? "Guardando..." : editItem ? "Actualizar cambios" : "Guardar comunicado"}
              </button>
            </div>
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
                <article key={item.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5 hover:border-[#D94F10]/30 transition-all group">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Pill priority={item.priority}>{item.priority}</Pill>
                        <Pill variant="soft">{item.scope}</Pill>
                        <Pill variant="status" status={item.status}>{item.status}</Pill>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5] group-hover:text-[#D94F10] transition-colors">{item.title}</h3>
                      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{item.message}</p>
                    </div>
                    <div className="text-right text-[11px] text-[#737373] font-medium min-w-[120px]">
                      <p className="text-[#F5D2BC] uppercase tracking-wider">{item.targetLabel}</p>
                      <p className="mt-1">{item.channel}</p>
                      <p className="mt-1 text-[#555]">{formatDate(item.scheduledFor || item.createdAt)}</p>
                    </div>
                  </div>

                  <div className="mt-5 pt-4 border-t border-[#262626] flex flex-wrap items-center justify-between gap-3">
                    <div className="flex flex-wrap gap-2">
                      {item.status !== "published" && (
                        <ActionChip onClick={() => updateStatus(item.id, "published")}>Publicar</ActionChip>
                      )}
                      {item.status !== "archived" && (
                        <ActionChip onClick={() => updateStatus(item.id, "archived")}>Archivar</ActionChip>
                      )}
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => handleEdit(item)} className="px-4 py-2 rounded-xl bg-[#262626] text-[#A3A3A3] text-[11px] font-bold uppercase tracking-wider hover:bg-[#333] hover:text-white transition-all border-none cursor-pointer">
                        Editar
                      </button>
                      <button onClick={() => setDeleteConfirm(item)} className="px-4 py-2 rounded-xl bg-red-500/10 text-red-500 text-[11px] font-bold uppercase tracking-wider hover:bg-red-500/20 transition-all border-none cursor-pointer">
                        Eliminar
                      </button>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No hay comunicados para este filtro" description="Crea un aviso nuevo o cambia el filtro para revisar el historial completo." />
            )}
          </div>
        </div>
      </section>

      {/* Modal Confirmar Eliminar */}
      {deleteConfirm && (
        <div className="fixed inset-0 bg-black/80 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-[#1A1A1A] rounded-[32px] w-full max-w-sm p-8 text-center border border-[#262626] shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-red-500/20">🗑️</div>
            <h2 className="text-xl font-bold text-white mb-2">Eliminar comunicado</h2>
            <p className="text-sm text-[#A3A3A3] leading-6 mb-8 font-medium">
              ¿Estás seguro de eliminar "<strong>{deleteConfirm.title}</strong>"? Esta acción eliminará el aviso permanentemente de la cartelera de los residentes.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-xl border border-[#262626] bg-transparent text-sm font-bold text-[#A3A3A3] cursor-pointer hover:bg-[#262626]">
                Cancelar
              </button>
              <button onClick={handleDelete} disabled={saving} className="flex-1 py-3.5 rounded-xl border-none bg-red-600 text-white text-sm font-bold cursor-pointer hover:bg-red-700 disabled:opacity-50">
                {saving ? "Eliminando..." : "Eliminar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <div className="w-16 h-16 bg-[#FFF4EE]/5 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🏠</div>
        <p className="text-lg font-semibold text-white">Primero selecciona tu condominio</p>
        <p className="text-sm text-[#737373] mt-3 leading-7">Necesitamos una ficha base del condominio para organizar comunicados por edificio y por comunidad.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-[22px] border border-[#ffffff10] bg-[#ffffff05] backdrop-blur-md p-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-[#F5D2BC] font-medium opacity-80">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-white tracking-tight">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-bold tracking-[0.15em] uppercase text-[#737373] mb-2">{label}</span>
      {children}
    </label>
  );
}

function Pill({ children, variant = "strong", priority = "", status = "" }) {
  let colors = "bg-[#262626] text-[#A3A3A3]";
  if (priority === "alta") colors = "bg-red-500/10 text-red-500 border border-red-500/20";
  else if (priority === "media") colors = "bg-orange-500/10 text-orange-400 border border-orange-500/20";
  else if (variant === "strong") colors = "bg-[#D94F10]/10 text-[#D94F10] border border-[#D94F10]/20";

  if (variant === "status") {
    if (status === "published") colors = "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20";
    if (status === "draft") colors = "bg-[#262626] text-[#737373] border border-[#333]";
    if (status === "archived") colors = "bg-gray-500/10 text-gray-500 border border-gray-500/20";
  }

  return <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${colors}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-1.5 rounded-lg bg-transparent border border-[#262626] text-[10px] font-bold uppercase tracking-widest text-[#737373] hover:border-[#D94F10]/40 hover:text-[#D94F10] transition-colors cursor-pointer">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-xs font-semibold">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#262626] bg-[#00000020] p-12 text-center">
      <div className="text-3xl mb-4 opacity-20">📭</div>
      <h3 className="text-base font-semibold text-white">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#737373] max-w-sm mx-auto">{description}</p>
    </div>
  );
}

function LoadingState({ label }) {
  return (
    <div className="py-12 text-center">
      <div className="w-8 h-8 border-2 border-[#D94F10] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-xs font-bold uppercase tracking-widest text-[#737373]">{label}</p>
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
