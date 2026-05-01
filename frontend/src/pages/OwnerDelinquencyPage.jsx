import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";

export default function OwnerDelinquencyPage() {
  const { condominio } = useCondominio();
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [actionStatus, setActionStatus] = useState({ id: null, action: "", loading: false });

  const loadDelinquency = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setSummary(null);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.getDelinquency(condominio.id);
        setSummary(response.data || null);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la morosidad.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadDelinquency();
  }, [loadDelinquency]);

  useEffect(() => {
    if (!success && !error) return undefined;
    const timer = setTimeout(() => {
      setSuccess("");
      setError("");
    }, 4500);
    return () => clearTimeout(timer);
  }, [success, error]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const runAction = async (chargeId, action) => {
    if (action === "remove_resident" && !window.confirm("Esta acción eliminará al residente del sistema. ¿Deseas continuar?")) {
      return;
    }
    setActionStatus({ id: chargeId, action, loading: true });
    try {
      const response = await adminService.runDelinquencyAction(condominio.id, {
        charge_id: chargeId,
        action,
      });
      setSuccess(response.message || "Acción aplicada correctamente.");
      await loadDelinquency();
    } catch (actionError) {
      setError(actionError.message || "No se pudo completar la acción.");
    } finally {
      setActionStatus({ id: null, action: "", loading: false });
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Gestion de morosidad</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Identifica rapido las cuentas vencidas del condominio.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Este tablero separa los cargos en atraso para apoyar el seguimiento administrativo antes de automatizar penalidades o cobranzas.
            </p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Cargos vencidos" value={summary?.total || 0} />
            <SummaryCard label="Monto vencido" value={formatMoney(summary?.amount || 0)} compact />
            <SummaryCard label="Por vencer (<2 días)" value={summary?.upcomingCount || 0} />
            <SummaryCard label="Saldo próximo" value={formatMoney(summary?.upcomingAmount || 0)} compact />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <section className={`${SURFACE} p-6 md:p-7`}>
        {loading ? (
          <p className="text-sm text-[#A3A3A3]">Cargando cartera vencida...</p>
        ) : summary?.items?.length ? (
          <div className="space-y-4">
            {summary.items.map((item) => (
              <article key={item.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>vencido</Badge>
                      <Badge variant="soft">{item.apartamentoNombre || "general"}</Badge>
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{item.name}</h2>
                    <p className="mt-1 text-sm text-[#A3A3A3]">Vence {formatDate(item.dueDate)}</p>
                    <p className="mt-2 text-sm text-[#D6C3B7]">
                      Residente: <strong className="text-[#F2E7DE]">{item.residenteNombre || "Sin asignar"}</strong>
                    </p>
                    {item.residenteEmail ? <p className="mt-1 text-xs text-[#8F8176]">{item.residenteEmail}</p> : null}
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-semibold text-[#B45309]">{formatMoney(item.amountResidual || item.amount)}</p>
                    <p className="mt-1 text-[11px] uppercase tracking-[0.18em] text-[#73675F]">
                      {item.delinquencyNotifiedAt ? "Avisado" : "Sin aviso"}
                    </p>
                  </div>
                </div>

                <div className="mt-5 flex flex-wrap gap-2 border-t border-[#262626] pt-4">
                  <ActionChip
                    variant="email"
                    onClick={() => runAction(item.id, "notify")}
                    disabled={actionStatus.loading && actionStatus.id === item.id}
                  >
                    {actionStatus.loading && actionStatus.id === item.id && actionStatus.action === "notify"
                      ? "Enviando..."
                      : "Avisar moroso"}
                  </ActionChip>
                  <ActionChip
                    variant="warning"
                    onClick={() => runAction(item.id, "rollover")}
                    disabled={(actionStatus.loading && actionStatus.id === item.id) || item.canRollOver === false}
                  >
                    {actionStatus.loading && actionStatus.id === item.id && actionStatus.action === "rollover"
                      ? "Acumulando..."
                      : "Acumular próxima cuota"}
                  </ActionChip>
                  <ActionChip
                    variant="danger"
                    onClick={() => runAction(item.id, "remove_resident")}
                    disabled={
                      (actionStatus.loading && actionStatus.id === item.id) || item.canRemoveResident === false
                    }
                  >
                    {actionStatus.loading && actionStatus.id === item.id && actionStatus.action === "remove_resident"
                      ? "Eliminando..."
                      : "Eliminar residente"}
                  </ActionChip>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[#E5E5E5]">Primero registra tu condominio</p>
        <p className="text-sm text-[#737373] mt-2">La morosidad depende de cargos asociados a un condominio real.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] px-4 py-4 text-center min-w-[120px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className={`mt-2 font-semibold text-[#E5E5E5] ${compact ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function Badge({ children, variant = "strong" }) {
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#FFF0E7] text-[#B14F12]"}`}>{children}</span>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function SuccessBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-sm">{message}</div>;
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">No hay morosidad registrada</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">Los cargos vencidos apareceran aqui automaticamente cuando existan atrasos.</p>
    </div>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

function ActionChip({ children, onClick, variant = "default", disabled = false }) {
  const base =
    "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border disabled:opacity-50 disabled:cursor-not-allowed";
  const styles = {
    default: "bg-[#1C1C1C] border-[#2F2F2F] text-[#D5C1B3] hover:border-[#B15A27]",
    email: "bg-[#1A6B9A]/10 border-[#1A6B9A]/30 text-[#6CB7E0] hover:bg-[#1A6B9A]/20",
    warning: "bg-[#D97706]/10 border-[#D97706]/20 text-[#F59E0B] hover:bg-[#D97706]/20",
    danger: "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20",
  };
  return (
    <button type="button" onClick={onClick} disabled={disabled} className={`${base} ${styles[variant] || styles.default}`}>
      {children}
    </button>
  );
}
