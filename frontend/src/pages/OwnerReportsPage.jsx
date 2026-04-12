import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import { isSystemAdminRole } from "../utils/roles";

const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-card)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10";

export default function OwnerReportsPage() {
  const { condominio } = useCondominio();
  const { user } = useAuth();
  const isSystemAdmin = isSystemAdminRole(user?.role || user?.rol);
  const [summary, setSummary] = useState(null);
  const [exports, setExports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    reportType: "operativo",
    exportFormat: "xlsx",
    note: "",
  });

  const loadReports = useMemo(
    () => async () => {
        // Si no hay condominio seleccionado y el usuario NO es system-owner,
        // no intentamos cargar reportes (propietarios necesitan condominio).
        if (!condominio?.id && !isSystemAdmin) {
          setSummary(null);
          setExports([]);
          setLoading(false);
          return;
        }
      setLoading(true);
      try {
        const [summaryResponse, exportsResponse] = await Promise.all([
          // Pasar condominio.id sólo si existe; los endpoints owner pueden
          // devolver resumen global cuando no se especifica condominio_id.
          adminService.getReportsSummary(condominio?.id),
          adminService.listReportExports(condominio?.id),
        ]);
        setSummary(summaryResponse.data || null);
        setExports(exportsResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los reportes.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadReports();
  }, [loadReports]);

  // Polling para reportes pendientes
  useEffect(() => {
    const hasPending = exports.some(item => item.state === "requested");
    if (!hasPending) return;

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
    setError("");
    setSaving(true);
    try {
      await adminService.createReportExport({
        condominio_id: condominio.id,
        ...form,
      });
      setForm({ reportType: "operativo", exportFormat: "xlsx", note: "" });
      await loadReports();
    } catch (saveError) {
      setError(saveError.message || "No se pudo solicitar la exportacion.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--condome-orange)]">Reportes administrativos</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[var(--fg-primary)]">Resume el estado del condominio y ordena sus exportaciones.</h1>
            <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] max-w-3xl">
              Esta pantalla une la foto operativa del sistema con una bitacora de solicitudes de exportacion listas para descargar en PDF y otros formatos.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {(summary?.cards || []).map((card) => (
              <SummaryCard key={card.key} label={card.label} value={card.value} />
            ))}
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="grid gap-6 xl:grid-cols-[0.95fr_1.2fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--fg-tertiary)]">Nueva exportacion</p>
            <h2 className="mt-2 text-xl font-semibold text-[var(--fg-primary)]">Solicitud controlada</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={requestExport}>
            <Field label="Tipo de reporte">
              <select value={form.reportType} onChange={(event) => setForm((current) => ({ ...current, reportType: event.target.value }))} className={INPUT}>
                <option value="cobros">Reporte Financiero (Blanco/Naranja)</option>
                <option value="operativo">Operativo</option>
                <option value="comunidad">Comunidad</option>
                <option value="auditoria">Auditoria</option>
              </select>
            </Field>

            <Field label="Formato">
              <select value={form.exportFormat} onChange={(event) => setForm((current) => ({ ...current, exportFormat: event.target.value }))} className={INPUT}>
                <option value="xlsx">Excel</option>
                <option value="pdf">PDF</option>
                <option value="csv">CSV</option>
              </select>
            </Field>

            <Field label="Nota">
              <textarea value={form.note} onChange={(event) => setForm((current) => ({ ...current, note: event.target.value }))} className={`${INPUT} min-h-[110px] resize-none`} />
            </Field>

            <button type="submit" disabled={saving} className="w-full px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60 transition-transform active:scale-95" style={{ background: "linear-gradient(135deg, var(--condome-orange), #000)" }}>
              {saving ? "Solicitando..." : "Solicitar exportacion"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--fg-tertiary)]">Historial</p>
              <h2 className="mt-2 text-xl font-semibold text-[var(--fg-primary)]">Exportaciones registradas</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[var(--surface-0)] text-[var(--fg-secondary)] text-xs font-semibold border border-[var(--border-standard)]">
              {summary?.exports || 0} solicitudes
            </span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[var(--fg-tertiary)] text-center py-10">Cargando exportaciones...</p>
            ) : exports.length ? (
              exports.map((item) => (
                <article key={item.id} className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 hover:border-[var(--condome-orange)]/20 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1 min-w-[200px]">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{item.reportType}</Badge>
                        <Badge variant="soft">{item.exportFormat}</Badge>
                        <Badge variant="soft">{item.state}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[var(--fg-primary)]">{item.fileName || "Exportacion pendiente"}</h3>
                      <p className="mt-1 text-sm text-[var(--fg-secondary)]">{item.condominioNombre}</p>
                      <p className="mt-2 text-sm leading-6 text-[var(--fg-tertiary)]">{item.note || "Sin observaciones adicionales."}</p>
                      
                      {item.state === "ready" && (
                        <div className="mt-4 flex gap-3">
                          <a 
                            href={item.downloadUrl || "#"} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="px-4 py-2 rounded-lg bg-[var(--condome-orange)] text-white text-xs font-bold no-underline hover:brightness-110 transition-all flex items-center gap-2"
                          >
                            <IconDownload />
                            Descargar {item.exportFormat.toUpperCase()}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="text-right text-xs text-[var(--fg-muted)]">
                      <p>{item.requestedBy || "Sistema"}</p>
                      <p className="mt-1">{formatDateTime(item.requestedAt)}</p>
                    </div>
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

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[var(--fg-primary)]">Primero selecciona un condominio</p>
        <p className="text-sm text-[var(--fg-secondary)] mt-2">Los reportes administrativos requieren un contexto activo del condominio para cruzar datos financieros.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-0)] border border-[var(--border-standard)] px-4 py-4 text-center min-w-[110px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)]">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5">{label}</span>
      {children}
    </label>
  );
}

function Badge({ children, variant = "strong" }) {
  return (
    <span
      className={`px-3 py-1 rounded-full text-[11px] font-semibold ${
        variant === "soft"
          ? "bg-[var(--surface-0)] text-[var(--fg-tertiary)] border border-[var(--border-standard)]"
          : "bg-[var(--condome-orange)]/10 text-[var(--condome-orange)]"
      }`}
    >
      {children}
    </span>
  );
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--fg-primary)]">Todavia no hay exportaciones</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] max-w-sm mx-auto">Las solicitudes que hagas desde este panel se registraran aqui para trazabilidad y descarga.</p>
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
    second: "2-digit"
  });
}

function IconDownload() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  );
}
