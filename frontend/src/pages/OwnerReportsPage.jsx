import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import { isSystemAdminRole } from "../utils/roles";

const SURFACE =
  "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[30px] shadow-[var(--shadow-card)]";

const REPORT_TYPE_OPTIONS = [
  {
    value: "cobros",
    label: "Financiero",
    helper: "Cobros, pagos confirmados y balance actual.",
  },
  {
    value: "operativo",
    label: "Operativo",
    helper: "Inventario, ocupación y estado de unidades.",
  },
  {
    value: "comunidad",
    label: "Comunidad",
    helper: "Propietarios, residentes y acceso al portal.",
  },
  {
    value: "auditoria",
    label: "Auditoría",
    helper: "Incidencias, visitas y actividad reciente.",
  },
];

const EXPORT_FORMAT_OPTIONS = [
  { value: "pdf", label: "PDF" },
  { value: "xlsx", label: "Excel" },
  { value: "csv", label: "CSV" },
];

const STATUS_LABELS = {
  requested: "Solicitado",
  ready: "Listo",
  failed: "Fallido",
};

const TYPE_LABELS = {
  cobros: "Financiero",
  operativo: "Operativo",
  comunidad: "Comunidad",
  auditoria: "Auditoría",
};

export default function OwnerReportsPage() {
  const { condominio } = useCondominio();
  const { user } = useAuth();
  const isSystemAdmin = isSystemAdminRole(user?.role || user?.rol);

  const [summary, setSummary] = useState(null);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [downloadingId, setDownloadingId] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  
  const [form, setForm] = useState({
    reportType: "cobros",
    exportFormat: "pdf",
    note: "",
  });

  const activeReportType = useMemo(
    () => REPORT_TYPE_OPTIONS.find((item) => item.value === form.reportType) || REPORT_TYPE_OPTIONS[0],
    [form.reportType]
  );

  const canRequestExport = Boolean(condominio?.id);

  const loadReports = useMemo(
    () => async () => {
      if (!condominio?.id && !isSystemAdmin) {
        setSummary(null);
        setExports([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      try {
        const [summaryResponse, exportsResponse] = await Promise.all([
          adminService.getReportsSummary(condominio?.id),
          adminService.listReportExports(condominio?.id),
        ]);
        setSummary(summaryResponse.data || null);
        setExports(exportsResponse.data || []);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los reportes.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id, isSystemAdmin]
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  useEffect(() => {
    const hasPending = exports.some((item) => item.state === "requested");
    if (!hasPending) return undefined;

    const interval = setInterval(() => {
      loadReports();
    }, 5000);

    return () => clearInterval(interval);
  }, [exports, loadReports]);

  useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess("");
        setError("");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  if (!condominio?.id && !isSystemAdmin) {
    return <MissingCondominioState />;
  }

  const requestExport = async (event) => {
    event.preventDefault();
    if (!canRequestExport) {
      setError("Selecciona un condominio antes de solicitar una exportación.");
      return;
    }

    setError("");
    setSuccess("");
    setSaving(true);
    try {
      await adminService.createReportExport({
        condominio_id: condominio.id,
        ...form,
      });
      setForm((current) => ({ ...current, note: "" }));
      setSuccess("¡Reporte generado con éxito!");
      await loadReports();
    } catch (saveError) {
      setError(saveError.message || "No se pudo solicitar la exportación.");
    } finally {
      setSaving(false);
    }
  };

  const handleDownload = async (item) => {
    setError("");
    setDownloadingId(item.id);
    try {
      const file = await adminService.downloadReport(item.id);
      triggerBrowserDownload(file.blob, file.filename || item.fileName || `report-${item.id}`);
    } catch (downloadError) {
      setError(downloadError.message || "No se pudo descargar el reporte.");
    } finally {
      setDownloadingId(null);
    }
  };

  const handleDeleteExport = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      await adminService.deleteReportExport(deleteConfirm.id);
      setDeleteConfirm(null);
      await loadReports();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el reporte del historial.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <section
        className="rounded-[34px] overflow-hidden border border-[#E6D7CA] animate-reveal"
        style={{
          background:
            "linear-gradient(145deg, #1C1410 0%, #3D281D 45%, #D94F10 100%)",
          boxShadow: "0 26px 60px rgba(91, 53, 32, 0.16)",
        }}
      >
        <div className="grid gap-6 px-6 py-7 md:grid-cols-[1.2fr_0.88fr] md:px-8 md:py-8">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.28em] text-white/55">
              Reporting Workspace
            </p>
            <h1 className="mt-3 max-w-3xl text-3xl font-semibold text-white md:text-[2.6rem] md:leading-[1.1]">
              Genera reportes con branding, control tenant y descarga desde el panel.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              El flujo integra reportes financiero, operacional y comunidad con descarga autenticada
              y un historial visible para trazabilidad administrativa.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroInfoTile
                label="Unidad Seleccionada"
                value={condominio?.name || "Vista global"}
                helper={condominio?.direccion || "Exportación activa para Odoo."}
              />
              <HeroInfoTile
                label="Tipo de Salida"
                value={activeReportType.label}
                helper={activeReportType.helper}
              />
              <HeroInfoTile
                label="Layout & Format"
                value={form.exportFormat.toUpperCase()}
                helper="Documento estructurado con logo corporativo."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            {(summary?.cards || []).map((card, index) => (
              <SummaryCard key={card.key || card.label} card={card} index={index} />
            ))}
            <HighlightTile
              label="Historial Total"
              value={summary?.exports || 0}
              helper="Registros guardados en el servidor."
            />
            <HighlightTile
               label="Engine State"
               value={loading ? "..." : "Online"}
               color="text-emerald-300"
               helper="El generador de PDFs está funcionando."
            />
          </div>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}
      {success ? <SuccessBanner message={success} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.18fr]">
        <div className={`${SURFACE} p-6 md:p-8 h-fit sticky top-6`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-[var(--condome-orange)]">
                Configurador
              </p>
              <h2 className="mt-2 text-[1.8rem] leading-none font-bold text-[var(--fg-primary)] tracking-tight">
                Emitir Documento
              </h2>
            </div>
            <span className="px-3 py-2 rounded-xl bg-[var(--surface-0)] border border-[var(--border-standard)] text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">
              Auth: Admin
            </span>
          </div>

          <form className="mt-8 space-y-6" onSubmit={requestExport}>
            <div className="space-y-4">
              <p className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">Objetivo del reporte</p>
              <div className="grid gap-3">
                {REPORT_TYPE_OPTIONS.map((option) => {
                  const active = option.value === form.reportType;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, reportType: option.value }))}
                      className={`rounded-[24px] border px-4 py-4 text-left transition-all group relative cursor-pointer ${
                        active
                          ? "border-[var(--condome-orange)] bg-[var(--surface-1)] shadow-xl"
                          : "border-[var(--border-standard)] bg-[var(--surface-0)] hover:border-[var(--border-emphasis)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className={`text-sm font-bold ${active ? "text-[var(--condome-orange)]" : "text-[var(--fg-primary)]"}`}>{option.label}</p>
                          <p className="mt-1 text-xs leading-6 text-[var(--fg-tertiary)] font-medium">{option.helper}</p>
                        </div>
                        <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all ${active ? "border-[var(--condome-orange)]" : "border-[var(--border-standard)]"}`}>
                           {active && <div className="w-2.5 h-2.5 bg-[var(--condome-orange)] rounded-full"></div>}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">Formatos Disponibles</p>
              <div className="flex flex-wrap gap-2">
                {EXPORT_FORMAT_OPTIONS.map((option) => {
                  const active = option.value === form.exportFormat;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, exportFormat: option.value }))}
                      className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.2em] transition-all cursor-pointer ${
                        active
                          ? "bg-[var(--condome-orange)] text-white shadow-lg"
                          : "bg-[var(--surface-0)] text-[var(--fg-tertiary)] border border-[var(--border-standard)] hover:bg-[var(--surface-2)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
               <p className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)] mb-2">Comentario de trazabilidad</p>
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="w-full rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-0)] px-5 py-4 text-sm leading-7 text-[var(--fg-primary)] outline-none transition-all focus:border-[var(--condome-orange)] focus:shadow-sm resize-none min-h-[100px]"
                placeholder="Indica la razón de esta exportación..."
              />
            </label>

            <button
              type="submit"
              disabled={!canRequestExport || saving}
              className="w-full rounded-2xl border-none px-5 py-4 text-[11px] font-black uppercase tracking-[0.25em] text-white transition-all disabled:opacity-60 cursor-pointer shadow-xl active:scale-[0.98]"
              style={{
                background: "linear-gradient(135deg, #FF7A30 0%, #D94F10 64%)",
              }}
            >
              {saving ? "Solicitando..." : "Registrar y Generar"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-8 flex flex-col`}>
          <div className="flex items-center justify-between gap-4 flex-wrap mb-8">
            <div className="flex-1">
              <p className="text-[11px] font-black uppercase tracking-widest text-[var(--fg-tertiary)] opacity-60">
                Log Histórico
              </p>
              <h2 className="mt-1 text-2xl font-bold text-[var(--fg-primary)] tracking-tight">
                Consolidado de Archivos
              </h2>
            </div>
            <div className="px-4 py-2 rounded-xl bg-[var(--surface-0)] border border-[var(--border-standard)] text-[11px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">
              {exports.length} Registros
            </div>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LoaderState />
            ) : exports.length ? (
              exports.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-[28px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-6 transition-all hover:border-[var(--condome-orange)]/30 group animate-reveal"
                  style={{ animationDelay: `${index * 50}ms` }}
                >
                  <div className="flex items-start justify-between gap-6 flex-wrap">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <StatusBadge value={TYPE_LABELS[item.reportType] || item.reportType} tone="strong" />
                        <StatusBadge value={item.exportFormat.toUpperCase()} />
                        <StatusBadge value={STATUS_LABELS[item.state] || item.state} state={item.state} />
                      </div>
                      <h3 className="text-lg font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">
                        {item.fileName || "Snaphot Operativo #" + item.id}
                      </h3>
                      <p className="mt-1 text-xs font-bold text-[var(--fg-tertiary)] tracking-wide uppercase">{item.condominioNombre}</p>
                      <p className="mt-4 text-sm leading-7 text-[var(--fg-secondary)] italic">
                        "{item.note || "Sin nota técnica registrada."}"
                      </p>
                    </div>

                    <div className="text-right border-l border-[var(--border-standard)]/50 pl-6 hidden md:block">
                      <p className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)] mb-1">
                        Autor
                      </p>
                      <p className="text-xs font-bold text-[var(--fg-primary)]">
                        {item.requestedBy || "Admin"}
                      </p>
                      <p className="mt-3 text-[10px] text-[var(--fg-tertiary)] font-medium">
                        {formatDateTime(item.requestedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-6 pt-5 border-t border-[var(--border-standard)] flex items-center justify-between gap-4">
                     <div className="flex gap-2">
                        <button
                           type="button"
                           onClick={() => handleDownload(item)}
                           disabled={item.state !== "ready" || downloadingId === item.id}
                           className="inline-flex items-center gap-2 rounded-xl border-none bg-[var(--condome-orange)] px-5 py-2.5 text-[10px] font-black uppercase tracking-[0.16em] text-white transition-all cursor-pointer shadow-md disabled:opacity-40"
                        >
                           <IconDownload />
                           {downloadingId === item.id ? "..." : "Descargar"}
                        </button>
                        <button
                           type="button"
                           onClick={() => setDeleteConfirm(item)}
                           className="p-2.5 rounded-xl border border-red-500/20 bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-all cursor-pointer"
                           title="Eliminar de historial"
                        >
                           🗑️
                        </button>
                     </div>
                    <span className="text-[10px] font-bold text-[var(--fg-tertiary)] uppercase tracking-widest">
                      {item.generatedAt ? `Done: ${formatDateTime(item.generatedAt)}` : "En cola de Odoo"}
                    </span>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState />
            )}
          </div>
        </div>
      </section>

      {/* Modal Confirmación Delete */}
      {deleteConfirm && (
         <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-sm p-9 text-center border border-[var(--border-standard)] shadow-2xl animate-scale-up" onClick={e => e.stopPropagation()}>
               <div className="w-20 h-20 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-3xl">🗑️</div>
               <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-3">Limpiar historial</h2>
               <p className="text-sm text-[var(--fg-secondary)] leading-7 font-medium mb-8">
                  ¿Estás seguro de eliminar el registro del reporte "<strong>{deleteConfirm.fileName || 'Snapshot'}</strong>"? Esta acción eliminará el archivo del servidor y no podrá recuperarse.
               </p>
               <div className="flex gap-4">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-2xl border border-[var(--border-standard)] bg-transparent text-[11px] font-black uppercase tracking-widest text-[var(--fg-tertiary)] cursor-pointer hover:bg-[var(--surface-0)]">
                     Cancelar
                  </button>
                  <button onClick={handleDeleteExport} disabled={saving} className="flex-1 py-3.5 rounded-2xl border-none bg-red-600 text-white text-[11px] font-black uppercase tracking-widest cursor-pointer hover:bg-red-700 shadow-xl disabled:opacity-50">
                     {saving ? "..." : "Eliminar"}
                  </button>
               </div>
            </div>
         </div>
      )}
    </div>
  );
}

function triggerBrowserDownload(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function MissingCondominioState() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8 text-center bg-[var(--canvas)] rounded-[40px] border-2 border-dashed border-[var(--border-standard)]">
      <div className="w-24 h-24 bg-orange-500/10 rounded-full flex items-center justify-center mb-8 text-4xl shadow-inner">📊</div>
      <h1 className="text-3xl font-bold text-[var(--fg-primary)] tracking-tight">Acceso a Reportes Administrativos</h1>
      <p className="mt-4 text-sm leading-8 text-[var(--fg-secondary)] max-w-lg font-medium">
        Para auditar la gestión o exportar datos en PDF/Excel, debes seleccionar un condominio activo desde el selector superior.
      </p>
    </div>
  );
}

function SummaryCard({ card, index }) {
  return (
    <div
      className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-md shadow-sm"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/46">{card.label}</p>
      <p className="mt-2 text-[2.2rem] font-bold text-white tracking-tighter">{card.value}</p>
      <p className="mt-1 text-[10px] leading-5 text-white/50 font-medium">{card.helper || card.description}</p>
    </div>
  );
}

function HighlightTile({ label, value, helper, color = "text-white" }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/5 p-4 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/46">{label}</p>
      <p className={`mt-2 text-[1.8rem] font-bold tracking-tighter ${color}`}>{value}</p>
      <p className="mt-1 text-[10px] leading-5 text-white/40 font-medium">{helper}</p>
    </div>
  );
}

function HeroInfoTile({ label, value, helper }) {
  return (
    <div className="rounded-[22px] border border-white/10 bg-white/5 px-4 py-4 backdrop-blur-sm shadow-inner group transition-all hover:bg-white/10">
      <p className="text-[9px] font-black uppercase tracking-widest text-[#F5D2BC] opacity-70 group-hover:opacity-100 transition-opacity">{label}</p>
      <p className="mt-2 text-[13px] font-bold tracking-tight text-white">{value}</p>
      <p className="mt-1.5 text-[10px] leading-5 text-white/40 line-clamp-2">{helper}</p>
    </div>
  );
}

function StatusBadge({ value, tone = "soft", state = "" }) {
  const variant =
    state === "ready"
      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_15px_rgba(16,185,129,0.1)]"
      : state === "failed"
        ? "bg-red-500/10 text-red-500 border border-red-500/20"
        : tone === "strong"
          ? "bg-[var(--condome-orange)]/10 text-[var(--condome-orange)]"
          : "bg-[var(--surface-2)] text-[var(--fg-tertiary)] border border-[var(--border-standard)]";

  return (
    <span className={`px-3 py-1.5 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm ${variant}`}>
      {value}
    </span>
  );
}

function SuccessBanner({ message }) {
  return (
    <div className="rounded-[22px] border border-emerald-200 bg-emerald-50 px-6 py-4 text-sm font-bold text-emerald-700 shadow-sm flex items-center gap-3">
      <div className="w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center text-white text-[10px]">✓</div>
      {message}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-[22px] border border-red-200 bg-red-50 px-6 py-4 text-sm font-bold text-red-600 shadow-sm flex items-center gap-3">
       <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-[10px]">!</div>
      {message}
    </div>
  );
}

function LoaderState() {
  return (
    <div className="rounded-[30px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-16 text-center shadow-inner">
      <div className="w-10 h-10 border-4 border-[var(--condome-orange)] border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
      <p className="text-sm font-bold text-[var(--fg-primary)] uppercase tracking-widest">Sincronizando Historial</p>
      <p className="mt-3 text-xs text-[var(--fg-tertiary)] font-medium">Consultando registros generados en el servidor de Odoo...</p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[30px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-16 text-center shadow-inner">
      <div className="text-4xl mb-6 opacity-20">📂</div>
      <h3 className="text-xl font-bold text-[var(--fg-primary)]">Historial de Reportes Vacío</h3>
      <p className="mt-3 text-sm leading-8 text-[var(--fg-secondary)] max-w-sm mx-auto font-medium">
        Aquí aparecerán todos los documentos PDF y Excel solicitados para este condominio con fecha y autor.
      </p>
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

function IconDownload() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
