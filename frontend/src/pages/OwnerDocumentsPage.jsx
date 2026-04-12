import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerDocumentsPage() {
  const { condominio } = useCondominio();
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    title: "",
    category: "reglamento",
    audience: "todos",
    status: "vigente",
    source: "",
    description: "",
  });

  const loadDocuments = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setDocuments([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.listDocuments(condominio.id);
        setDocuments(response.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los documentos.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadDocuments();
  }, [loadDocuments]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const summary = {
    total: documents.length,
    active: documents.filter((item) => item.status === "vigente").length,
    archived: documents.filter((item) => item.status === "archivado").length,
    shared: documents.filter((item) => item.audience === "todos").length,
  };

  const saveDocument = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.title.trim()) {
      setError("El nombre del documento es requerido.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createDocument({
        condominio_id: condominio.id,
        ...form,
      });
      setForm({
        title: "",
        category: "reglamento",
        audience: "todos",
        status: "vigente",
        source: "",
        description: "",
      });
      await loadDocuments();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el documento.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (documentId, status) => {
    try {
      const response = await adminService.updateDocument(documentId, { status });
      setDocuments((current) => current.map((item) => (item.id === documentId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el documento.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Documentos del condominio</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Ordena reglamentos, actas y archivos clave de la comunidad.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">Esta biblioteca administrativa te permite clasificar documentos por audiencia, estado y origen para que todo quede localizable.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Documentos" value={summary.total} />
            <SummaryCard label="Vigentes" value={summary.active} />
            <SummaryCard label="Archivados" value={summary.archived} />
            <SummaryCard label="Compartidos" value={summary.shared} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Nuevo documento</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Registro documental</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={saveDocument}>
            <Field label="Título">
              <input value={form.title} onChange={(event) => setForm((current) => ({ ...current, title: event.target.value }))} className={INPUT} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Categoría">
                <select value={form.category} onChange={(event) => setForm((current) => ({ ...current, category: event.target.value }))} className={INPUT}>
                  <option value="reglamento">Reglamento</option>
                  <option value="acta">Acta</option>
                  <option value="contrato">Contrato</option>
                  <option value="finanzas">Finanzas</option>
                  <option value="manual">Manual</option>
                  <option value="general">General</option>
                </select>
              </Field>
              <Field label="Audiencia">
                <select value={form.audience} onChange={(event) => setForm((current) => ({ ...current, audience: event.target.value }))} className={INPUT}>
                  <option value="todos">Todos</option>
                  <option value="propietarios">Propietarios</option>
                  <option value="residentes">Residentes</option>
                  <option value="admin">Solo administración</option>
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={INPUT}>
                  <option value="vigente">Vigente</option>
                  <option value="revision">En revisión</option>
                  <option value="archivado">Archivado</option>
                </select>
              </Field>
              <Field label="Origen o referencia">
                <input value={form.source} onChange={(event) => setForm((current) => ({ ...current, source: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <Field label="Descripción">
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${INPUT} min-h-[130px] resize-none`} />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
              {saving ? "Guardando..." : "Registrar documento"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Biblioteca</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Documentos disponibles</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando documentos...</p>
            ) : documents.length ? (
              documents.map((document) => (
                <article key={document.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{document.category}</Badge>
                        <Badge variant="soft">{document.audience}</Badge>
                        <Badge variant="soft">{document.status}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{document.title}</h3>
                      <p className="mt-1 text-sm text-[#A3A3A3]">{document.source || "Sin referencia"}</p>
                      <p className="mt-2 text-sm leading-6 text-[#5D554E]">{document.description || "Sin descripción adicional."}</p>
                    </div>
                    <div className="flex gap-2">
                      <ActionChip onClick={() => updateStatus(document.id, "vigente")}>Vigente</ActionChip>
                      <ActionChip onClick={() => updateStatus(document.id, "archivado")}>Archivar</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aún no hay documentos" description="Carga el primer reglamento o acta para empezar la biblioteca del condominio." />
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
        <p className="text-sm text-[#737373] mt-2">Necesitamos un condominio activo para clasificar y contextualizar la biblioteca documental.</p>
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
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}
