import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import billingPortalService from "../utils/billingPortalService";
import { isSystemAdminRole, isResidentRole, isCondoAdminRole, isPropertyOwnerRole } from "../utils/roles";

const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-card)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10";

const DEFAULT_PAYMENT_FORM = {
  paymentMethod: "portal",
  paymentReference: "",
};

export default function BillingPaymentsPage() {
  const { user } = useAuth();
  const { condominio } = useCondominio();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [savingChargeId, setSavingChargeId] = useState(null);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [paymentForms, setPaymentForms] = useState({});
  const [paymentMethods, setPaymentMethods] = useState([]);

  const isResident = isResidentRole(user?.role || user?.rol);
  const isAdmin =
    isSystemAdminRole(user?.role || user?.rol) ||
    isCondoAdminRole(user?.role || user?.rol) ||
    isPropertyOwnerRole(user?.role || user?.rol);
  const isCondoAdmin = isCondoAdminRole(user?.role || user?.rol);

  const loadPayments = useMemo(
    () => async () => {
      if (isAdmin && !condominio?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const [paymentsResponse, methodsResponse] = await Promise.all([
          isAdmin
            ? adminService.listPayments(condominio.id)
            : isResident
              ? billingPortalService.listResidentPayments()
              : billingPortalService.listPropertyOwnerPayments(),
          adminService.getPaymentMethods(condominio?.id)
        ]);
        setRecords(paymentsResponse.data || []);
        setPaymentMethods(methodsResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los pagos.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id, isAdmin, isResident]
  );

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);

  const summary = {
    total: records.length,
    totalAmount: records.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    overdue: records.filter((item) => item.state === "overdue").length,
    paid: records.filter((item) => item.state === "paid").length,
  };

  const submitPayment = async (chargeId) => {
    const form = paymentForms[chargeId] || DEFAULT_PAYMENT_FORM;
    setSavingChargeId(chargeId);
    setError("");
    setSuccess("");
    try {
      // Flujo Manual Odoo (Única vía por el momento)
      if (isResident) {
          await billingPortalService.registerResidentPayment({
            charge_id: chargeId,
            payment_method: form.paymentMethod,
            payment_reference: form.paymentReference,
          });
        } else {
          await billingPortalService.registerPropertyOwnerPayment({
            charge_id: chargeId,
            payment_method: form.paymentMethod,
            payment_reference: form.paymentReference,
          });
        }
        setSuccess("Pago registrado correctamente. Pendiente de validacion administrativa.");
      setPaymentForms((current) => ({ ...current, [chargeId]: DEFAULT_PAYMENT_FORM }));
      await loadPayments();
      // Limpiar mensaje de éxito después de unos segundos
      setTimeout(() => setSuccess(""), 6000);
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el pago.");
    } finally {
      setSavingChargeId(null);
    }
  };

  if (isAdmin && !condominio?.id) {
    return <MissingCondominioState message="Los pagos administrativos requieren un condominio activo." />;
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--condome-orange)]">
              {isAdmin ? "Pagos confirmados" : "Pagos en linea"}
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[var(--fg-primary)]">
              {isAdmin
                ? "Revisa los pagos ya registrados para el condominio activo."
                : "Gestiona tus cargos pendientes y registra el pago desde tu panel."}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] max-w-3xl">
              {isAdmin
                ? "Esta vista consolida las transacciones marcadas como pagadas para trazabilidad y seguimiento."
                : "Utiliza este modulo para registrar tus pagos via transferencia o deposito siguiendo el flujo de Odoo."}
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Registros" value={summary.total} />
            <SummaryCard label="Monto" value={formatMoney(summary.totalAmount)} compact />
            <SummaryCard label="Vencidos" value={summary.overdue} />
            <SummaryCard label="Pagados" value={summary.paid} />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <section className={`${SURFACE} p-6 md:p-7`}>
        {loading ? (
          <p className="text-sm text-[var(--fg-tertiary)] text-center py-10">Cargando pagos...</p>
        ) : records.length ? (
          <div className="space-y-4">
            {records.map((record) => {
              const form = paymentForms[record.id] || DEFAULT_PAYMENT_FORM;
              return (
                <article key={record.id} className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 hover:border-[var(--condome-orange)]/20 transition-all">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{record.state}</Badge>
                        <Badge variant="soft">{record.apartamentoNombre || "general"}</Badge>
                        {record.periodLabel ? <Badge variant="soft">{record.periodLabel}</Badge> : null}
                      </div>
                      <h2 className="mt-3 text-lg font-semibold text-[var(--fg-primary)]">{record.name}</h2>
                      <p className="mt-1 text-sm text-[var(--fg-secondary)]">
                        {formatMoney(record.amount)} · vence {formatDate(record.dueDate)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[var(--fg-tertiary)]">
                        {record.note || "Sin observaciones adicionales."}
                      </p>
                      {record.paymentReference ? (
                        <p className="mt-2 text-xs text-[var(--fg-muted)]">
                          Ref. {record.paymentReference} · {record.paymentMethod || "sin método"}
                        </p>
                      ) : null}
                    </div>

                    {!isAdmin && record.state !== "paid" ? (
                      <div className="w-full max-w-sm rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-1)] p-4 shadow-sm">
                        <p className="text-sm font-semibold text-[var(--fg-primary)]">Registrar pago</p>
                        <div className="mt-3 space-y-3">
                          <label className="block">
                            <span className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5">
                              Método
                            </span>
                            <select
                              value={form.paymentMethod}
                              onChange={(event) =>
                                setPaymentForms((current) => ({
                                  ...current,
                                  [record.id]: {
                                    ...form,
                                    paymentMethod: event.target.value,
                                  },
                                }))
                              }
                              className={INPUT}
                            >
                                <option value="">Seleccione un método</option>
                                {paymentMethods.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                          </label>
                          <label className="block">
                            <span className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[var(--fg-tertiary)] mb-1.5">
                              Referencia
                            </span>
                            <input
                              value={form.paymentReference}
                              onChange={(event) =>
                                setPaymentForms((current) => ({
                                  ...current,
                                  [record.id]: {
                                    ...form,
                                    paymentReference: event.target.value,
                                  },
                                }))
                              }
                              className={INPUT}
                              placeholder="Numero de transaccion o comprobante"
                            />
                          </label>
                          <button
                            type="button"
                            onClick={() => submitPayment(record.id)}
                            disabled={savingChargeId === record.id}
                            className="w-full px-4 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60 transition-transform active:scale-95"
                            style={{ background: "linear-gradient(135deg, var(--condome-orange), #000)" }}
                          >
                            {savingChargeId === record.id ? "Procesando..." : "Pagar ahora"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-1)] px-4 py-3 text-center min-w-[160px]">
                        <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-muted)]">Estado</p>
                        <p className="mt-2 text-sm font-semibold text-[var(--fg-primary)]">
                          {record.state === "paid" ? "Pago registrado" : "Monitoreo administrativo"}
                        </p>
                        {record.paidAt ? (
                          <p className="mt-1 text-xs text-[var(--fg-muted)]">Pagado el {formatDateTime(record.paidAt)}</p>
                        ) : null}
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={isAdmin ? "Todavia no hay pagos confirmados" : "No tienes cargos pendientes"}
            description={
              isAdmin
                ? "Los pagos marcados como completados apareceran aqui para trazabilidad."
                : "Cuando exista una cuota o cargo asociado a tu perfil, la veras aqui para pagarla."
            }
          />
        )}
      </section>
    </div>
  );
}

function MissingCondominioState({ message }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[#E5E5E5]">Primero selecciona o registra un condominio</p>
        <p className="text-sm text-[#737373] mt-2">{message}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-0)] border border-[var(--border-standard)] px-4 py-4 text-center min-w-[110px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">{label}</p>
      <p className={`mt-2 font-semibold text-[var(--fg-primary)] ${compact ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
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

function SuccessBanner({ message }) {
  return (
    <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-100 text-emerald-700 text-sm animate-in fade-in slide-in-from-top-2 duration-300">
      {message}
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-10 text-center">
      <h3 className="text-lg font-semibold text-[var(--fg-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)] max-w-sm mx-auto">{description}</p>
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
