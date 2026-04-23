import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-black text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.4rem] leading-tight font-bold text-[var(--fg-primary)] tracking-tight";
const BODY_COPY = "text-[14px] leading-relaxed text-[var(--fg-secondary)]";

const TEMPLATE_FORM = {
  name: "",
  apartamento_id: "",
  amount: "",
  dueDay: "5",
  frequency: "monthly",
  note: "",
};

const CHARGE_FORM = {
  name: "",
  apartamento_id: "",
  amount: "",
  dueDate: "",
  periodLabel: "",
  state: "pending",
  note: "",
};

export default function OwnerBillingPage() {
  const { condominio, apartamentos } = useCondominio();
  const [summary, setSummary] = useState(null);
  const [templates, setTemplates] = useState([]);
  const [charges, setCharges] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  const [templateForm, setTemplateForm] = useState(TEMPLATE_FORM);
  const [editTemplate, setEditTemplate] = useState(null);
  
  const [chargeForm, setChargeForm] = useState(CHARGE_FORM);
  const [editCharge, setEditCharge] = useState(null);
  
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const loadBilling = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setSummary(null);
        setTemplates([]);
        setCharges([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [summaryResponse, templatesResponse, chargesResponse] = await Promise.all([
          adminService.getBillingSummary(condominio.id),
          adminService.listFeeTemplates(condominio.id),
          adminService.listCharges(condominio.id),
        ]);
        setSummary(summaryResponse.data || null);
        setTemplates(templatesResponse.data || []);
        setCharges(chargesResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el modulo de cuotas.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadBilling();
  }, [loadBilling]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const saveTemplate = async (event) => {
    event.preventDefault();
    setError("");
    if (!templateForm.name.trim() || !templateForm.amount) {
      setError("Nombre y monto de la plantilla son requeridos.");
      return;
    }
    setSaving(true);
    try {
      if (editTemplate) {
        await adminService.updateFeeTemplate(editTemplate.id, {
          ...templateForm,
          amount: Number(templateForm.amount),
          apartamento_id: templateForm.apartamento_id ? Number(templateForm.apartamento_id) : null,
        });
        setEditTemplate(null);
      } else {
        await adminService.createFeeTemplate({
          condominio_id: condominio.id,
          ...templateForm,
          amount: Number(templateForm.amount),
          apartamento_id: templateForm.apartamento_id ? Number(templateForm.apartamento_id) : undefined,
        });
      }
      setTemplateForm(TEMPLATE_FORM);
      await loadBilling();
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la plantilla.");
    } finally {
      setSaving(false);
    }
  };

  const saveCharge = async (event) => {
    event.preventDefault();
    setError("");
    if (!chargeForm.name.trim() || !chargeForm.amount || !chargeForm.dueDate) {
      setError("Nombre, monto y fecha de vencimiento son requeridos.");
      return;
    }
    setSaving(true);
    try {
      if (editCharge) {
        await adminService.updateCharge(editCharge.id, {
          ...chargeForm,
          amount: Number(chargeForm.amount),
          apartamento_id: chargeForm.apartamento_id ? Number(chargeForm.apartamento_id) : null,
        });
        setEditCharge(null);
      } else {
        await adminService.createCharge({
          condominio_id: condominio.id,
          ...chargeForm,
          amount: Number(chargeForm.amount),
          apartamento_id: chargeForm.apartamento_id ? Number(chargeForm.apartamento_id) : undefined,
        });
      }
      setChargeForm(CHARGE_FORM);
      await loadBilling();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el cargo.");
    } finally {
      setSaving(false);
    }
  };

  const handleEditTemplate = (item) => {
    setEditTemplate(item);
    setTemplateForm({
      name: item.name || "",
      apartamento_id: item.apartamentoId || "",
      amount: item.amount || "",
      dueDay: item.dueDay || "5",
      frequency: item.frequency || "monthly",
      note: item.note || "",
    });
    window.scrollTo({ top: 300, behavior: 'smooth' });
  };

  const handleEditCharge = (item) => {
    setEditCharge(item);
    setChargeForm({
      name: item.name || "",
      apartamento_id: item.apartamentoId || "",
      amount: item.amount || "",
      dueDate: item.dueDate ? item.dueDate.split('T')[0] : "",
      periodLabel: item.periodLabel || "",
      state: item.state || "pending",
      note: item.note || "",
    });
    window.scrollTo({ top: 500, behavior: 'smooth' });
  };

  const handleDeleteItem = async () => {
    if (!deleteConfirm) return;
    setSaving(true);
    try {
      if (deleteConfirm.type === 'template') {
        await adminService.deleteFeeTemplate(deleteConfirm.id);
      } else {
        await adminService.deleteCharge(deleteConfirm.id);
      }
      setDeleteConfirm(null);
      await loadBilling();
    } catch (err) {
      setError(err.message || "No se pudo eliminar el elemento.");
    } finally {
      setSaving(false);
    }
  };

  const updateChargeState = async (chargeId, state) => {
    try {
      const response = await adminService.updateCharge(chargeId, { state });
      setCharges((current) => current.map((item) => (item.id === chargeId ? response.data : item)));
      await loadBilling(); // Cargar resumen actualizado
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el cargo.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div className="flex-1">
            <p className={EYEBROW}>Control de cuotas</p>
            <h1 className={SECTION_TITLE}>Organiza la facturación operativa del condominio.</h1>
            <p className={`mt-3 ${BODY_COPY} max-w-2xl`}>
              Gestiona plantillas de cuotas recurrentes y registra cargos únicos. Los saldos se reflejan en el portal del residente para facilitar la transparencia.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full md:w-auto">
            <SummaryCard label="Plantillas" value={summary?.templates || 0} />
            <SummaryCard label="Cargos" value={summary?.charges || 0} />
            <SummaryCard label="Pendientes" value={summary?.pendingCharges || 0} color="text-orange-500" />
            <SummaryCard label="Pagados" value={summary?.paidCharges || 0} color="text-emerald-500" />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className={`${SURFACE} p-6 md:p-7 flex flex-col gap-8`}>
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
               <div>
                  <p className={EYEBROW}>Suscripciones</p>
                  <h2 className={SECTION_TITLE}>{editTemplate ? "Editar plantilla" : "Cuotas recurrentes"}</h2>
               </div>
               <span className="px-3 py-1.5 rounded-lg bg-[var(--condome-orange)]/10 text-[var(--condome-orange)] text-[10px] font-black uppercase tracking-widest border border-[var(--condome-orange)]/20">Sync Odoo</span>
            </div>

            <form className="space-y-5 bg-[var(--canvas)] p-5 rounded-[22px] border border-[var(--border-standard)]" onSubmit={saveTemplate}>
              <Field label="Nombre del cargo principal">
                <input value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} placeholder="Ej: Mantenimiento Mensual..." />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Unidad Destino">
                  <select value={templateForm.apartamento_id} onChange={(event) => setTemplateForm((current) => ({ ...current, apartamento_id: event.target.value }))} className={INPUT}>
                    <option value="">Cuota General (Todo el condominio)</option>
                    {apartamentos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} · {item.edificio_nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Monto Sugerido">
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--fg-tertiary)]">$</span>
                    <input type="number" min="0" step="0.01" value={templateForm.amount} onChange={(event) => setTemplateForm((current) => ({ ...current, amount: event.target.value }))} className={`${INPUT} pl-8`} placeholder="0.00" />
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Día de emisión">
                  <input type="number" min="1" max="31" value={templateForm.dueDay} onChange={(event) => setTemplateForm((current) => ({ ...current, dueDay: event.target.value }))} className={INPUT} />
                </Field>
                <Field label="Frecuencia">
                  <select value={templateForm.frequency} onChange={(event) => setTemplateForm((current) => ({ ...current, frequency: event.target.value }))} className={INPUT}>
                    <option value="monthly">Mensual</option>
                    <option value="quarterly">Trimestral</option>
                    <option value="annual">Anual</option>
                  </select>
                </Field>
              </div>
              <Field label="Observación para el recibo">
                <textarea value={templateForm.note} onChange={(event) => setTemplateForm((current) => ({ ...current, note: event.target.value }))} className={`${INPUT} min-h-[80px] resize-none`} placeholder="Nota que aparecerá en el portal..." />
              </Field>
              <div className="flex gap-3 pt-2">
                {editTemplate && (
                  <button type="button" onClick={() => { setEditTemplate(null); setTemplateForm(TEMPLATE_FORM); }} className="px-5 py-3 rounded-xl border border-[var(--border-standard)] bg-transparent text-[var(--fg-tertiary)] text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-[var(--surface-0)] transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={saving} className="flex-1 px-5 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest border-none disabled:opacity-60 cursor-pointer shadow-lg" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
                  {saving ? "Procesando..." : editTemplate ? "Actualizar" : "Crear Plantilla"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LoadingState label="Cargando plantillas..." />
            ) : templates.length ? (
              <div className="grid gap-3">
                {templates.map((item) => (
                  <article key={item.id} className="group rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 hover:border-[var(--condome-orange)]/40 transition-all">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <div className="flex-1">
                        <div className="flex gap-2 mb-3">
                          <Badge>{item.frequency}</Badge>
                          <Badge variant="soft">{item.apartamentoNombre || "Cuota Global"}</Badge>
                        </div>
                        <h3 className="text-base font-bold text-[var(--fg-primary)]">{item.name}</h3>
                        <p className="mt-1 text-sm font-bold text-[var(--condome-orange)]">{formatMoney(item.amount)} <span className="text-[var(--fg-tertiary)] font-medium text-xs">/ {item.dueDay} de cada mes</span></p>
                      </div>
                      <div className="flex gap-1.5 self-start">
                         <button onClick={() => handleEditTemplate(item)} className="p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-standard)] text-[var(--fg-tertiary)] hover:text-[var(--condome-orange)] transition-colors cursor-pointer">✏️</button>
                         <button onClick={() => setDeleteConfirm({ type:'template', id: item.id, name: item.name })} className="p-2 rounded-lg bg-[var(--surface-1)] border border-[var(--border-standard)] text-red-400 hover:text-red-500 hover:border-red-500/30 transition-colors cursor-pointer">🗑️</button>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin estructuras tarifarias" description="Define las cuotas base para empezar la facturación automatizada." />
            )}
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7 flex flex-col gap-8 bg-[var(--canvas)]`}>
          <div>
            <div className="flex items-center justify-between gap-3 mb-4">
              <div>
                <p className={EYEBROW}>Cargos Púntuales</p>
                <h2 className={SECTION_TITLE}>{editCharge ? "Editar cargo" : "Registro de consumo"}</h2>
              </div>
              <span className="px-3 py-1.5 rounded-lg bg-[var(--fg-primary)]/5 text-[var(--fg-primary)] text-[10px] font-black uppercase tracking-widest border border-[var(--border-standard)]">Manual Entry</span>
            </div>

            <form className="space-y-5 bg-[var(--surface-1)] p-5 rounded-[22px] border border-[var(--border-standard)] shadow-sm" onSubmit={saveCharge}>
              <Field label="Motivo o Concepto del cargo">
                <input value={chargeForm.name} onChange={(event) => setChargeForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} placeholder="Ej: Reserva Casa Club, Gasto Extra..." />
              </Field>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Unidad Responsable">
                  <select value={chargeForm.apartamento_id} onChange={(event) => setChargeForm((current) => ({ ...current, apartamento_id: event.target.value }))} className={INPUT}>
                    <option value="">General (División por alícuota)</option>
                    {apartamentos.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre} · {item.edificio_nombre}
                      </option>
                    ))}
                  </select>
                </Field>
                <Field label="Monto del Cargo">
                   <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-xs font-bold text-[var(--fg-tertiary)]">$</span>
                    <input type="number" min="0" step="0.01" value={chargeForm.amount} onChange={(event) => setChargeForm((current) => ({ ...current, amount: event.target.value }))} className={`${INPUT} pl-8`} />
                  </div>
                </Field>
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <Field label="Vencimiento Real">
                  <input type="date" value={chargeForm.dueDate} onChange={(event) => setChargeForm((current) => ({ ...current, dueDate: event.target.value }))} className={INPUT} />
                </Field>
                <Field label="Período Aplicable">
                  <input value={chargeForm.periodLabel} onChange={(event) => setChargeForm((current) => ({ ...current, periodLabel: event.target.value }))} className={INPUT} placeholder="Ej: Mayo 2026..." />
                </Field>
              </div>
               <div className="flex gap-3 pt-2">
                {editCharge && (
                  <button type="button" onClick={() => { setEditCharge(null); setChargeForm(CHARGE_FORM); }} className="px-5 py-3 rounded-xl border border-[var(--border-standard)] bg-transparent text-[var(--fg-tertiary)] text-xs font-black uppercase tracking-widest cursor-pointer hover:bg-[var(--surface-0)] transition-colors">
                    Cancelar
                  </button>
                )}
                <button type="submit" disabled={saving} className="flex-1 px-5 py-3 rounded-xl text-white text-xs font-black uppercase tracking-widest border-none disabled:opacity-60 cursor-pointer shadow-lg" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
                  {saving ? "Emitiendo..." : editCharge ? "Guardar" : "Emitir Cargo"}
                </button>
              </div>
            </form>
          </div>

          <div className="space-y-4">
            {loading ? (
              <LoadingState label="Consultando histórico..." />
            ) : charges.length ? (
              <div className="grid gap-3">
                {charges.map((item) => (
                  <article key={item.id} className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-1)] p-5 hover:shadow-md transition-all">
                    <div className="flex items-start justify-between gap-4 flex-wrap">
                      <div className="flex-1">
                        <div className="flex flex-wrap gap-2 mb-3">
                          <Badge state={item.state}>{item.state}</Badge>
                          <Badge variant="soft">{item.apartamentoNombre || "global"}</Badge>
                        </div>
                        <h3 className="text-base font-bold text-[var(--fg-primary)]">{item.name}</h3>
                        <p className="mt-1 text-sm font-medium text-[var(--fg-secondary)]">{formatMoney(item.amount)} <span className="text-[var(--fg-tertiary)] mx-1">·</span> <span className="text-xs">Vence {formatDate(item.dueDate)}</span></p>
                      </div>
                      <div className="flex flex-col gap-2 min-w-[120px]">
                        <div className="flex gap-1 justify-end">
                           <button onClick={() => handleEditCharge(item)} className="p-1.5 rounded-lg bg-[var(--surface-0)] border border-[var(--border-standard)] text-xs hover:text-[var(--condome-orange)] cursor-pointer">✏️</button>
                           <button onClick={() => setDeleteConfirm({ type:'charge', id: item.id, name: item.name })} className="p-1.5 rounded-lg bg-[var(--surface-0)] border border-[var(--border-standard)] text-xs text-red-500 hover:border-red-500/40 cursor-pointer">🗑️</button>
                        </div>
                        <div className="flex flex-col gap-1.5">
                          {item.state !== 'paid' && <ActionChip variant="success" onClick={() => updateChargeState(item.id, "paid")}>Marcar Pagado</ActionChip>}
                          {item.state === 'pending' && <ActionChip onClick={() => updateChargeState(item.id, "overdue")}>Vencido</ActionChip>}
                        </div>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <EmptyState title="Sin cargos activos" description="Los consumos o cuotas emitidas con este condominio aparecerán aquí." />
            )}
          </div>
        </div>
      </section>

      {/* Modal Confirmación Borrado */}
      {deleteConfirm && (
         <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm" onClick={() => setDeleteConfirm(null)}>
            <div className="bg-[var(--surface-1)] rounded-[32px] w-full max-w-sm p-8 text-center border border-[var(--border-standard)] shadow-2xl" onClick={e => e.stopPropagation()}>
               <div className="w-16 h-16 bg-red-500/10 rounded-full flex items-center justify-center mx-auto mb-6 text-2xl border border-red-500/20">🗑️</div>
               <h2 className="text-xl font-bold text-[var(--fg-primary)] mb-2">Eliminar {deleteConfirm.type === 'template' ? 'plantilla' : 'cargo'}</h2>
               <p className="text-sm text-[var(--fg-secondary)] leading-6 mb-8 font-medium">
                  ¿Estás seguro de eliminar "<strong>{deleteConfirm.name}</strong>"? {deleteConfirm.type === 'charge' ? 'Esta acción solo es posible si el cargo no ha sido pagado.' : ''}
               </p>
               <div className="flex gap-3">
                  <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3.5 rounded-xl border border-[var(--border-standard)] bg-transparent text-sm font-bold text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--surface-0)]">
                  Cancelar
                  </button>
                  <button onClick={handleDeleteItem} disabled={saving} className="flex-1 py-3.5 rounded-xl border-none bg-red-600 text-white text-sm font-bold cursor-pointer hover:bg-red-700 disabled:opacity-50">
                  {saving ? "..." : "Eliminar"}
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
      <div className={`${SURFACE} max-w-xl p-10 text-center`}>
        <div className="w-20 h-20 bg-[var(--condome-orange)]/10 rounded-full flex items-center justify-center mx-auto mb-8 text-4xl">💰</div>
        <p className="text-xl font-bold text-[var(--fg-primary)]">Activa el módulo de cuotas</p>
        <p className="text-sm text-[var(--fg-secondary)] mt-4 leading-8 max-w-sm mx-auto">Selecciona tu condominio para gestionar plantillas de pago, cargos únicos y el historial financiero operativo.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color = "text-[var(--fg-primary)]" }) {
  return (
    <div className="rounded-2xl border border-[var(--border-standard)] bg-[var(--surface-0)] px-3 py-4 text-center min-w-[100px] flex-1">
      <p className={EYEBROW}>{label}</p>
      <p className={`mt-2 text-2xl font-black tracking-tighter ${color}`}>{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={EYEBROW}>{label}</span>
      <div className="mt-1.5">{children}</div>
    </label>
  );
}

function Badge({ children, variant = "strong", state = "" }) {
  let styles = "bg-[var(--surface-2)] text-[var(--fg-tertiary)]";
  if (state === 'paid') styles = "bg-emerald-500/10 text-emerald-500 border border-emerald-500/20";
  else if (state === 'overdue') styles = "bg-red-500/10 text-red-500 border border-red-500/20";
  else if (state === 'pending') styles = "bg-orange-500/10 text-orange-500 border border-orange-500/20";
  else if (variant === 'strong') styles = "bg-blue-500/10 text-blue-500 border border-blue-500/20";
  
  return <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest border border-transparent ${styles}`}>{children}</span>;
}

function ActionChip({ children, onClick, variant = "default" }) {
  const base = "px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all cursor-pointer border";
  const styles = variant === "success" 
    ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-600 hover:bg-emerald-500 hover:text-white"
    : "bg-[var(--surface-0)] border-[var(--border-standard)] text-[var(--fg-tertiary)] hover:border-[var(--condome-orange)] hover:text-[var(--condome-orange)]";

  return <button type="button" onClick={onClick} className={`${base} ${styles}`}>{children}</button>;
}

function LoadingState({ label }) {
  return <div className="py-10 text-center"><div className="w-6 h-6 border-2 border-[var(--condome-orange)] border-t-transparent rounded-full animate-spin mx-auto mb-3"></div><p className="text-[10px] font-bold uppercase tracking-widest text-[var(--fg-tertiary)]">{label}</p></div>;
}

function ErrorBanner({ message }) {
  return <div className="px-5 py-4 rounded-2xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm font-bold shadow-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)]/50 p-10 text-center">
      <h3 className="text-base font-bold text-[var(--fg-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-tertiary)] max-w-xs mx-auto">{description}</p>
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
