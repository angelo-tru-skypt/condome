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
    setSaving(true);
    try {
      await adminService.createReportExport({
        condominio_id: condominio.id,
        ...form,
      });
      setForm((current) => ({ ...current, note: "" }));
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
              Genera reportes con branding, control tenant y descarga real desde el panel de propietarios.
            </h1>
            <p className="mt-4 max-w-2xl text-sm leading-7 text-white/72">
              El flujo ya integra reporte financiero, operacional, comunidad y auditoría con descarga autenticada
              y un historial visible para seguimiento del condominio.
            </p>

            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              <HeroInfoTile
                label="Condominio Activo"
                value={condominio?.name || "Vista global"}
                helper={condominio?.direccion || "Selecciona un condominio para exportar."}
              />
              <HeroInfoTile
                label="Reporte Principal"
                value={activeReportType.label}
                helper={activeReportType.helper}
              />
              <HeroInfoTile
                label="Formato"
                value={form.exportFormat.toUpperCase()}
                helper="PDF con branding o exportación tabular."
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 self-start">
            {(summary?.cards || []).map((card, index) => (
              <SummaryCard key={card.key || card.label} card={card} index={index} />
            ))}
            <HighlightTile
              label="Exportaciones"
              value={summary?.exports || 0}
              helper="Solicitudes registradas en el historial."
            />
            <HighlightTile
              label="Disponibilidad"
              value={loading ? "..." : "Online"}
              helper="El módulo responde con render y descarga."
            />
          </div>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.18fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-[var(--condome-orange)]">
                Nueva exportación
              </p>
              <h2 className="mt-2 text-[1.8rem] leading-none font-semibold text-[var(--fg-primary)]">
                Diseña la salida
              </h2>
              <p className="mt-3 text-sm leading-7 text-[var(--fg-secondary)]">
                Escoge el tipo de reporte, define el formato y agrega una nota operativa para dejar contexto al
                historial.
              </p>
            </div>
            <span className="px-3 py-2 rounded-full bg-[var(--surface-0)] border border-[var(--border-standard)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--fg-tertiary)]">
              {canRequestExport ? "Ready" : "Select Condo"}
            </span>
          </div>

          <form className="mt-6 space-y-5" onSubmit={requestExport}>
            <div className="space-y-3">
              <FieldLabel label="Tipo de reporte" />
              <div className="grid gap-3">
                {REPORT_TYPE_OPTIONS.map((option) => {
                  const active = option.value === form.reportType;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, reportType: option.value }))}
                      className={`rounded-[22px] border px-4 py-4 text-left transition-all ${
                        active
                          ? "border-[var(--condome-orange)] bg-[linear-gradient(135deg,rgba(217,79,16,0.10),rgba(255,255,255,0.98))] shadow-[0_16px_36px_rgba(91,53,32,0.08)]"
                          : "border-[var(--border-standard)] bg-[var(--surface-0)] hover:border-[var(--border-emphasis)]"
                      }`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <p className="text-sm font-bold text-[var(--fg-primary)]">{option.label}</p>
                          <p className="mt-1 text-sm leading-6 text-[var(--fg-secondary)]">{option.helper}</p>
                        </div>
                        <span
                          className={`mt-1 h-3.5 w-3.5 rounded-full border ${
                            active
                              ? "border-[var(--condome-orange)] bg-[var(--condome-orange)]"
                              : "border-[var(--border-emphasis)] bg-transparent"
                          }`}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="space-y-3">
              <FieldLabel label="Formato" />
              <div className="flex flex-wrap gap-3">
                {EXPORT_FORMAT_OPTIONS.map((option) => {
                  const active = option.value === form.exportFormat;
                  return (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, exportFormat: option.value }))}
                      className={`px-4 py-2.5 rounded-full text-xs font-black uppercase tracking-[0.18em] transition-all ${
                        active
                          ? "bg-[var(--condome-orange)] text-white shadow-[0_18px_32px_rgba(217,79,16,0.22)]"
                          : "bg-[var(--surface-0)] text-[var(--fg-secondary)] border border-[var(--border-standard)]"
                      }`}
                    >
                      {option.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <label className="block">
              <FieldLabel label="Nota interna" />
              <textarea
                value={form.note}
                onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))}
                className="mt-2 min-h-[120px] w-full rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] px-4 py-3 text-sm leading-7 text-[var(--fg-primary)] outline-none transition-all focus:border-[var(--condome-orange)] focus:ring-4 focus:ring-[var(--condome-orange)]/10 resize-none"
                placeholder="Ejemplo: Reporte solicitado para la reunión del consejo del viernes."
              />
            </label>

            <div className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--canvas)] px-4 py-4">
              <p className="text-[10px] font-black uppercase tracking-[0.24em] text-[var(--fg-tertiary)]">
                Estado del flujo
              </p>
              <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">
                {canRequestExport
                  ? `La exportación se generará para ${condominio?.name}. El archivo quedará disponible en el historial al completarse.`
                  : "Selecciona un condominio para habilitar la solicitud del reporte."}
              </p>
            </div>

            <button
              type="submit"
              disabled={!canRequestExport || saving}
              className="w-full rounded-[22px] border-none px-5 py-4 text-xs font-black uppercase tracking-[0.22em] text-white transition-all disabled:opacity-60"
              style={{
                background: "linear-gradient(135deg, #FF7A30 0%, #D94F10 64%, #8F2F00 100%)",
                boxShadow: "0 22px 40px rgba(217, 79, 16, 0.24)",
              }}
            >
              {saving ? "Solicitando..." : "Generar exportación"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.24em] font-bold text-[var(--fg-tertiary)]">
                Historial
              </p>
              <h2 className="mt-2 text-[1.8rem] leading-none font-semibold text-[var(--fg-primary)]">
                Exportaciones listas para seguimiento
              </h2>
            </div>
            <span className="px-3 py-2 rounded-full bg-[var(--surface-0)] border border-[var(--border-standard)] text-[11px] font-bold uppercase tracking-[0.16em] text-[var(--fg-secondary)]">
              {summary?.exports || 0} solicitudes
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <LoaderState />
            ) : exports.length ? (
              exports.map((item, index) => (
                <article
                  key={item.id}
                  className="rounded-[26px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 animate-slide-up transition-all hover:border-[var(--condome-orange)]/20 hover:shadow-[var(--shadow-card)]"
                  style={{ animationDelay: `${index * 80}ms` }}
                >
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[220px]">
                      <div className="flex flex-wrap gap-2">
                        <StatusBadge value={item.reportType} tone="strong" />
                        <StatusBadge value={item.exportFormat.toUpperCase()} />
                        <StatusBadge value={STATUS_LABELS[item.state] || item.state} state={item.state} />
                      </div>
                      <h3 className="mt-4 text-lg font-semibold text-[var(--fg-primary)]">
                        {item.fileName || "Exportación pendiente"}
                      </h3>
                      <p className="mt-1 text-sm text-[var(--fg-secondary)]">{item.condominioNombre}</p>
                      <p className="mt-3 text-sm leading-7 text-[var(--fg-tertiary)]">
                        {item.note || "Sin observaciones adicionales."}
                      </p>
                    </div>

                    <div className="min-w-[170px] text-left md:text-right">
                      <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--fg-tertiary)]">
                        Solicitado por
                      </p>
                      <p className="mt-1 text-sm font-semibold text-[var(--fg-primary)]">
                        {item.requestedBy || "Sistema"}
                      </p>
                      <p className="mt-2 text-xs text-[var(--fg-tertiary)]">
                        {formatDateTime(item.requestedAt)}
                      </p>
                    </div>
                  </div>

                  <div className="mt-5 flex flex-wrap items-center gap-3">
                    <button
                      type="button"
                      onClick={() => handleDownload(item)}
                      disabled={item.state !== "ready" || downloadingId === item.id}
                      className="inline-flex items-center gap-2 rounded-full border-none bg-[var(--condome-orange)] px-4 py-2.5 text-xs font-black uppercase tracking-[0.16em] text-white transition-all disabled:opacity-55"
                    >
                      <IconDownload />
                      {downloadingId === item.id ? "Descargando..." : "Descargar"}
                    </button>

                    <span className="text-xs text-[var(--fg-tertiary)]">
                      {item.generatedAt ? `Generado ${formatDateTime(item.generatedAt)}` : "Pendiente de generación"}
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
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[var(--fg-primary)]">Primero selecciona un condominio</p>
        <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">
          Los reportes administrativos necesitan un contexto activo para generar exportaciones por condominio.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ card, index }) {
  return (
    <div
      className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-md"
      style={{ animationDelay: `${index * 80}ms` }}
    >
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/46">{card.label}</p>
      <p className="mt-3 text-[2rem] font-black text-white">{card.value}</p>
      <p className="mt-2 text-xs leading-6 text-white/62">{card.description}</p>
    </div>
  );
}

function HighlightTile({ label, value, helper }) {
  return (
    <div className="rounded-[24px] border border-white/12 bg-white/8 p-4 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-[0.2em] text-white/46">{label}</p>
      <p className="mt-3 text-[1.8rem] font-black text-white">{value}</p>
      <p className="mt-2 text-xs leading-6 text-white/62">{helper}</p>
    </div>
  );
}

function HeroInfoTile({ label, value, helper }) {
  return (
    <div className="rounded-[22px] border border-white/12 bg-white/8 px-4 py-4 backdrop-blur-md">
      <p className="text-[10px] font-black uppercase tracking-[0.22em] text-white/46">{label}</p>
      <p className="mt-2 text-sm font-bold tracking-wide text-white">{value}</p>
      <p className="mt-2 text-xs leading-6 text-white/62">{helper}</p>
    </div>
  );
}

function FieldLabel({ label }) {
  return <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[var(--fg-tertiary)]">{label}</p>;
}

function StatusBadge({ value, tone = "soft", state = "" }) {
  const variant =
    state === "ready"
      ? "bg-emerald-50 text-emerald-700 border border-emerald-100"
      : state === "failed"
        ? "bg-red-50 text-red-600 border border-red-100"
        : tone === "strong"
          ? "bg-[var(--condome-orange)]/12 text-[var(--condome-orange)]"
          : "bg-[var(--canvas)] text-[var(--fg-secondary)] border border-[var(--border-standard)]";

  return (
    <span className={`px-3 py-1.5 rounded-full text-[11px] font-bold uppercase tracking-[0.14em] ${variant}`}>
      {value}
    </span>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-[24px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
      {message}
    </div>
  );
}

function LoaderState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-10 text-center">
      <p className="text-sm font-semibold text-[var(--fg-primary)]">Cargando exportaciones...</p>
      <p className="mt-2 text-sm text-[var(--fg-secondary)]">
        Estamos consultando el historial y el estado actual de generación.
      </p>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--fg-primary)]">Todavía no hay exportaciones</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] max-w-md mx-auto">
        Las solicitudes que hagas desde este panel quedarán registradas aquí para trazabilidad, descarga y seguimiento.
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
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
