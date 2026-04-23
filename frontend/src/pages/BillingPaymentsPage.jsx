import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import billingPortalService from "../utils/billingPortalService";
import { isSystemAdminRole, isResidentRole, isCondoAdminRole, isPropertyOwnerRole } from "../utils/roles";
import StripePaymentModal from "../components/StripePaymentModal";

const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-card)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10";

const DEFAULT_PAYMENT_FORM = {
  paymentMethod: "stripe",
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
  const [templates, setTemplates] = useState([]);
  const [showTemplates, setShowTemplates] = useState(false);

  // Estados de Stripe
  const [stripeIntent, setStripeIntent] = useState(null);

  const isResident = isResidentRole(user?.role || user?.rol);
  const isAdmin =
    isSystemAdminRole(user?.role || user?.rol) ||
    isCondoAdminRole(user?.role || user?.rol);

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
        const fetchTemplates = !isAdmin
          ? (isResident ? billingPortalService.listResidentTemplates() : billingPortalService.listPropertyOwnerTemplates())
          : Promise.resolve({ data: [] });

        const [paymentsResponse, methodsResponse, templatesResponse] = await Promise.all([
          isAdmin
            ? adminService.listPayments(condominio.id)
            : isResident
              ? billingPortalService.listResidentPayments()
              : billingPortalService.listPropertyOwnerPayments(),
          adminService.getPaymentMethods(condominio?.id),
          fetchTemplates
        ]);
        setRecords(paymentsResponse.data || []);
        setPaymentMethods(methodsResponse.data || []);
        setTemplates(templatesResponse.data || []);
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
      if (form.paymentMethod === "stripe") {
        // Iniciar flujo Stripe
        const response = await adminService.initiatePayment({
          charge_ids: [chargeId],
          method: "stripe",
        });

        if (response.ok && response.client_secret) {
          const methodData = paymentMethods.find(m => m.id === "stripe");
          setStripeIntent({
            clientSecret: response.client_secret,
            publishedKey: methodData?.published_key,
            amount: response.amount,
            chargeId: chargeId
          });
        } else {
          throw new Error(response.error || "No se pudo iniciar la pasarela de Stripe.");
        }
      } else {
        // Flujo Manual
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
        setSuccess("Pago registrado correctamente. Pendiente de validación administrativa.");
        await loadPayments();
      }
    } catch (saveError) {
      setError(saveError.message || "No se pudo procesar el pago.");
    } finally {
      setSavingChargeId(null);
    }
  };

  const handleStripeSuccess = async (paymentIntent) => {
    setStripeIntent(null);
    setSuccess("¡Pago procesado con éxito a través de Stripe! Tus saldos han sido actualizados.");
    await loadPayments();
    setTimeout(() => setSuccess(""), 8000);
  };

  if (isAdmin && !condominio?.id) {
    return <MissingCondominioState message="Los pagos administrativos requieren un condominio activo." />;
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <h1 className="mt-2 text-[2.4rem] font-bold text-[var(--fg-primary)] tracking-tighter leading-none">
              {isAdmin ? "Control de ingresos" : "Cajero Automático"}
            </h1>
            <p className="mt-4 text-[15px] font-medium text-[var(--fg-tertiary)] max-w-2xl leading-8">
              {isAdmin
                ? "Supervisa los cobros realizados por Stripe y comprobantes bancarios registrados por los residentes."
                : "Cancela tus cuotas de mantenimiento y cargos extras. Aceptamos tarjetas de crédito mediante Stripe y transferencias bancarias."}
            </p>
          </div>
          {!isAdmin && templates.length > 0 && (
            <button
              onClick={() => setShowTemplates(!showTemplates)}
              className="px-6 py-3 rounded-2xl bg-[var(--surface-0)] border border-[var(--border-standard)] text-[11px] font-black uppercase tracking-widest text-[var(--fg-secondary)] hover:border-[var(--condome-orange)]/40 transition-all shadow-lg active:scale-95 cursor-pointer"
            >
              {showTemplates ? "Ver Deuda Pendiente" : `Log de Cuotas (${templates.length})`}
            </button>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <SummaryCard label="Registros" value={summary.total} />
            <SummaryCard label="Cartera" value={formatMoney(summary.totalAmount)} accent />
            <SummaryCard label="Vencidos" value={summary.overdue} color="text-red-400" />
            <SummaryCard label="Pagados" value={summary.paid} color="text-emerald-400" />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}
      {success && <SuccessBanner message={success} />}

      <section className={`${SURFACE} p-6 md:p-8 overflow-hidden relative`}>
        {/* Decoración premium */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--condome-orange)]/5 blur-[120px] rounded-full -translate-y-1/2 translate-x-1/2"></div>
        
        {loading ? (
          <div className="py-20 text-center">
             <div className="w-10 h-10 border-4 border-[var(--condome-orange)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
             <p className="text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">Auditando transacciones...</p>
          </div>
        ) : showTemplates ? (
          <div className="space-y-4 animate-reveal">
             <div className="mb-6 flex items-center justify-between">
                <div>
                   <h3 className="text-xl font-bold text-[var(--fg-primary)] tracking-tight">Suscripción activa</h3>
                   <p className="text-sm text-[var(--fg-tertiary)] font-medium">Ciclo recurrente de cobros por unidad.</p>
                </div>
                <Badge variant="soft">Automatic Engine</Badge>
             </div>
             <div className="grid gap-3">
              {templates.map((template) => (
                  <article key={template.id} className="rounded-[28px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-6 transition-all hover:border-[var(--border-emphasis)] group">
                    <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant="soft">{template.frequency || "Mensual"}</Badge>
                        <Badge variant="soft">{template.apartamentoNombre || "Global"}</Badge>
                    </div>
                    <h3 className="text-lg font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{template.name}</h3>
                    <p className="mt-1 text-sm font-bold text-[var(--fg-tertiary)]">Costo: {formatMoney(template.amount)} <span className="mx-2 text-[var(--border-standard)]">|</span> Día {template.dueDay}</p>
                  </article>
              ))}
             </div>
          </div>
        ) : records.length ? (
          <div className="space-y-5 relative">
            {records.map((record) => {
              const form = paymentForms[record.id] || DEFAULT_PAYMENT_FORM;
              const isPaid = record.state === "paid";
              const selectedMethod = paymentMethods.find(m => m.id === form.paymentMethod);
              return (
                <article key={record.id} className={`rounded-[30px] border transition-all animate-reveal ${isPaid ? "border-[var(--border-standard)] bg-[var(--surface-0)] opacity-60" : "border-[var(--border-standard)] bg-[var(--surface-2)] shadow-md hover:border-[var(--condome-orange)]/40"}`}>
                  <div className="flex items-center justify-between gap-6 p-6 md:p-8 flex-wrap">
                    <div className="flex-1 min-w-[280px]">
                      <div className="flex flex-wrap gap-2 mb-4">
                        <Badge variant={isPaid ? "soft" : "strong"} status={record.state}>{record.state}</Badge>
                        <Badge variant="soft">{record.apartamentoNombre || "Cuerpo Central"}</Badge>
                      </div>
                      <h2 className="text-2xl font-bold text-[var(--fg-primary)] tracking-tight leading-none mb-3">{record.name}</h2>
                      <div className="flex items-center gap-2 mb-4">
                         <span className="text-[1.4rem] font-black text-[var(--condome-orange)]">{formatMoney(record.amount)}</span>
                         <span className="text-[var(--fg-muted)]">•</span>
                         <span className="text-xs font-bold text-[var(--fg-tertiary)] uppercase tracking-widest">Vence {formatDate(record.dueDate)}</span>
                      </div>
                      <p className="text-sm leading-7 text-[var(--fg-secondary)] max-w-lg font-medium opacity-80">
                        {record.note || "Cargo registrado por la administración según el consumo mensual."}
                      </p>
                      {record.paymentReference && (
                        <div className="mt-4 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[var(--surface-1)] border border-[var(--border-standard)] text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">
                          <span>Ref: {record.paymentReference}</span>
                          <span className="opacity-30">|</span>
                          <span>{record.paymentMethod}</span>
                        </div>
                      )}
                    </div>

                    {!isAdmin && !isPaid ? (
                      <div className="w-full max-w-[340px] rounded-[32px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-24 h-24 bg-[var(--condome-orange)]/5 blur-3xl -translate-y-1/2 translate-x-1/2"></div>
                        
                        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--fg-tertiary)] mb-5">Checkout Seguro</p>
                        <div className="space-y-4">
                          <label className="block">
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
                              className={`${INPUT} cursor-pointer font-bold`}
                            >
                                {paymentMethods.map((m) => (
                                  <option key={m.id} value={m.id}>{m.name}</option>
                                ))}
                            </select>
                          </label>
                          
                          {form.paymentMethod === "transferencia" && selectedMethod?.bank_info && (
                            <div className="animate-reveal p-4 rounded-2xl bg-[var(--surface-1)] border border-[var(--condome-orange)]/20 mb-4">
                              <p className="text-[9px] font-black uppercase tracking-widest text-[var(--condome-orange)] mb-2">Instrucciones de Depósito</p>
                              <div className="space-y-1.5">
                                <p className="text-xs font-bold text-[var(--fg-primary)]">{selectedMethod.bank_info.bank_name}</p>
                                <p className="text-[13px] font-black text-[var(--fg-primary)] tracking-tight">{selectedMethod.bank_info.account_number}</p>
                                <p className="text-[10px] font-medium text-[var(--fg-tertiary)] uppercase">{selectedMethod.bank_info.account_type} • {selectedMethod.bank_info.account_holder}</p>
                              </div>
                            </div>
                          )}

                          {form.paymentMethod !== "stripe" && (
                            <label className="block animate-reveal">
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
                                className={`${INPUT} ${!form.paymentReference && "border-amber-400/50"}`}
                                placeholder="Número de comprobante..."
                              />
                              {!form.paymentReference && (
                                <p className="mt-1.5 text-[9px] font-bold text-amber-500 uppercase tracking-tighter">Ingrese el número de confirmación</p>
                              )}
                            </label>
                          )}
                          
                          <button
                            type="button"
                            onClick={() => submitPayment(record.id)}
                            disabled={savingChargeId === record.id || (form.paymentMethod !== "stripe" && !form.paymentReference)}
                            className="w-full px-6 py-4 rounded-2xl text-white text-[11px] font-black uppercase tracking-widest border-none disabled:opacity-40 transition-all active:scale-[0.97] cursor-pointer shadow-xl"
                            style={{ 
                                background: form.paymentMethod === "stripe" 
                                    ? "linear-gradient(135deg, #635bff, #ac50ef)" 
                                    : "linear-gradient(135deg, var(--condome-orange), #000)",
                                boxShadow: form.paymentMethod === "stripe" ? "0 10px 20px rgba(99,91,255,0.2)" : ""
                            }}
                          >
                            {savingChargeId === record.id ? "Procesando..." : form.paymentMethod === "stripe" ? "Pagar con Tarjeta" : "Registrar Pago"}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="rounded-[28px] border border-[var(--border-standard)] bg-[var(--surface-1)] px-8 py-6 text-center min-w-[200px] flex flex-col items-center gap-3">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${isPaid ? "bg-emerald-500/10 text-emerald-500" : "bg-[var(--surface-2)] text-[var(--fg-tertiary)]"}`}>
                            {isPaid ? "✓" : "⌛"}
                         </div>
                        <div>
                           <p className="text-[10px] uppercase font-black tracking-widest text-[var(--fg-tertiary)]">{isPaid ? "Completado" : "Pendiente"}</p>
                           <p className="mt-1 text-sm font-bold text-[var(--fg-primary)] tracking-tight">
                              {isPaid ? "Solvente" : "En Auditoría"}
                           </p>
                        </div>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title={isAdmin ? "Cero ingresos por ahora" : "Cuentas al día"}
            description={
              isAdmin
                ? "Cuando un residente registre un pago aparecerá aquí para que puedas validarlo."
                : "No hemos encontrado cargos pendientes asociados a tu unidad. ¡Felicidades por tu solvencia!"
            }
          />
        )}
      </section>

      {/* Modal De Stripe Elements */}
      <StripePaymentModal
        show={!!stripeIntent}
        clientSecret={stripeIntent?.clientSecret}
        publishedKey={stripeIntent?.publishedKey}
        amount={stripeIntent?.amount}
        onClose={() => setStripeIntent(null)}
        onSuccess={handleStripeSuccess}
        onError={(err) => setError(err)}
      />
    </div>
  );
}

function MissingCondominioState({ message }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-12 text-center border-dashed border-2`}>
        <div className="w-20 h-20 bg-[var(--surface-0)] rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">🔎</div>
        <p className="text-xl font-bold text-[var(--fg-primary)]">Falta de Contexto Operativo</p>
        <p className="text-sm text-[var(--fg-tertiary)] mt-3 leading-8 font-medium">{message}</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, accent = false, color = "text-[var(--fg-primary)]" }) {
  return (
    <div className="rounded-[24px] bg-[var(--surface-0)] border border-[var(--border-standard)] px-4 py-5 text-center min-w-[120px] flex-1 group hover:border-[var(--condome-orange)]/30 transition-all">
      <p className="text-[10px] font-black uppercase tracking-[0.25em] text-[var(--fg-tertiary)] opacity-60 mb-3 group-hover:opacity-100 transition-opacity">{label}</p>
      <p className={`font-black tracking-tighter ${accent ? "text-xl text-[var(--condome-orange)]" : `text-2xl ${color}`}`}>{value}</p>
    </div>
  );
}

function Badge({ children, variant = "strong", status = "" }) {
  let colors = "bg-[var(--surface-0)] text-[var(--fg-tertiary)] border-[var(--border-standard)]";
  
  if (status === "paid") {
    colors = "bg-emerald-500/10 text-emerald-500 border-emerald-500/20";
  } else if (status === "overdue") {
    colors = "bg-red-500/10 text-red-500 border-red-500/20";
  } else if (variant === "strong") {
    colors = "bg-[var(--condome-orange)]/10 text-[var(--condome-orange)] border-[var(--condome-orange)]/20";
  }

  return (
    <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border ${colors}`}>
      {children}
    </span>
  );
}

function SuccessBanner({ message }) {
  return (
    <div className="px-6 py-4 rounded-[22px] bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 text-sm font-bold flex items-center gap-3 animate-in fade-in duration-500">
       <div className="w-6 h-6 bg-emerald-500 text-white rounded-lg flex items-center justify-center text-[10px]">✓</div>
       {message}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="px-6 py-4 rounded-[22px] bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold flex items-center gap-3 animate-reveal">
       <div className="w-6 h-6 bg-red-500 text-white rounded-lg flex items-center justify-center text-[10px]">!</div>
       {message}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[40px] border-2 border-dashed border-[var(--border-standard)] bg-[var(--surface-0)]/20 p-20 text-center">
      <div className="text-5xl mb-8 opacity-10 grayscale">🏢</div>
      <h3 className="text-2xl font-bold text-[var(--fg-primary)] tracking-tight">{title}</h3>
      <p className="mt-4 text-sm leading-8 text-[var(--fg-tertiary)] max-w-sm mx-auto font-medium">{description}</p>
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
