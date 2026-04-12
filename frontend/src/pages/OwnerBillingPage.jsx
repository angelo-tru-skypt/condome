import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT_PANEL = "rounded-[20px] border border-[var(--border-subtle)] bg-[var(--canvas)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:bg-[var(--surface-2)] focus:ring-4 focus:ring-[var(--condome-orange)]/10";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-semibold text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.4rem] leading-tight font-semibold text-[var(--fg-primary)] tracking-tight";
const BODY_COPY = "text-[15px] leading-relaxed text-[var(--fg-secondary)]";

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
  const [chargeForm, setChargeForm] = useState(CHARGE_FORM);

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
      await adminService.createFeeTemplate({
        condominio_id: condominio.id,
        ...templateForm,
        amount: Number(templateForm.amount),
        apartamento_id: templateForm.apartamento_id ? Number(templateForm.apartamento_id) : undefined,
      });
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
      await adminService.createCharge({
        condominio_id: condominio.id,
        ...chargeForm,
        amount: Number(chargeForm.amount),
        apartamento_id: chargeForm.apartamento_id ? Number(chargeForm.apartamento_id) : undefined,
      });
      setChargeForm(CHARGE_FORM);
      await loadBilling();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el cargo.");
    } finally {
      setSaving(false);
    }
  };

  const updateChargeState = async (chargeId, state) => {
    try {
      const response = await adminService.updateCharge(chargeId, { state });
      setCharges((current) => current.map((item) => (item.id === chargeId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el cargo.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className={EYEBROW}>Control de cuotas</p>
            <h1 className={SECTION_TITLE}>Organiza plantillas de cobro y cargos reales del condominio.</h1>
            <p className={`mt-2 ${BODY_COPY} max-w-3xl`}>
              Esta capa queda lista para apoyarse luego en la contabilidad de Odoo sin mezclar la operacion diaria con facturacion compleja.
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Plantillas" value={summary?.templates || 0} />
            <SummaryCard label="Cargos" value={summary?.charges || 0} />
            <SummaryCard label="Pendientes" value={summary?.pendingCharges || 0} />
            <SummaryCard label="Pagados" value={summary?.paidCharges || 0} />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7 space-y-6`}>
          <div>
            <p className={EYEBROW}>Plantillas</p>
            <h2 className={SECTION_TITLE}>Cuotas recurrentes</h2>
          </div>

          <form className="space-y-4" onSubmit={saveTemplate}>
            <Field label="Nombre">
              <input value={templateForm.name} onChange={(event) => setTemplateForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Apartamento">
                <select value={templateForm.apartamento_id} onChange={(event) => setTemplateForm((current) => ({ ...current, apartamento_id: event.target.value }))} className={INPUT}>
                  <option value="">General del condominio</option>
                  {apartamentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} · {item.edificio_nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Monto">
                <input type="number" min="0" step="0.01" value={templateForm.amount} onChange={(event) => setTemplateForm((current) => ({ ...current, amount: event.target.value }))} className={INPUT} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Dia de vencimiento">
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
            <Field label="Nota">
              <textarea value={templateForm.note} onChange={(event) => setTemplateForm((current) => ({ ...current, note: event.target.value }))} className={`${INPUT} min-h-[100px] resize-none`} />
            </Field>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
              {saving ? "Guardando..." : "Guardar plantilla"}
            </button>
          </form>

          <div className="space-y-3">
            {loading ? (
              <LoadingState label="Cargando plantillas..." />
            ) : templates.length ? (
              templates.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{item.frequency}</Badge>
                    <Badge variant="soft">{item.apartamentoNombre || "general"}</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[var(--fg-primary)]">{item.name}</h3>
                  <p className="mt-1 text-sm text-[var(--fg-secondary)]">Monto: {formatMoney(item.amount)} · vence el dia {item.dueDay}</p>
                  <p className="mt-2 text-sm leading-6 text-[var(--fg-tertiary)]">{item.note || "Sin nota adicional."}</p>
                </article>
              ))
            ) : (
              <EmptyState title="Aun no hay plantillas" description="Crea la primera cuota base para empezar el control mensual." />
            )}
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7 space-y-6`}>
          <div>
            <p className={EYEBROW}>Cargos</p>
            <h2 className={SECTION_TITLE}>Registro operativo</h2>
          </div>

          <form className="space-y-4" onSubmit={saveCharge}>
            <Field label="Nombre del cargo">
              <input value={chargeForm.name} onChange={(event) => setChargeForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Apartamento">
                <select value={chargeForm.apartamento_id} onChange={(event) => setChargeForm((current) => ({ ...current, apartamento_id: event.target.value }))} className={INPUT}>
                  <option value="">General del condominio</option>
                  {apartamentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} · {item.edificio_nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Monto">
                <input type="number" min="0" step="0.01" value={chargeForm.amount} onChange={(event) => setChargeForm((current) => ({ ...current, amount: event.target.value }))} className={INPUT} />
              </Field>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Vencimiento">
                <input type="date" value={chargeForm.dueDate} onChange={(event) => setChargeForm((current) => ({ ...current, dueDate: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Periodo">
                <input value={chargeForm.periodLabel} onChange={(event) => setChargeForm((current) => ({ ...current, periodLabel: event.target.value }))} className={INPUT} />
              </Field>
            </div>
            <Field label="Nota">
              <textarea value={chargeForm.note} onChange={(event) => setChargeForm((current) => ({ ...current, note: event.target.value }))} className={`${INPUT} min-h-[100px] resize-none`} />
            </Field>
            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
              {saving ? "Guardando..." : "Registrar cargo"}
            </button>
          </form>

          <div className="space-y-3">
            {loading ? (
              <LoadingState label="Cargando cargos..." />
            ) : charges.length ? (
              charges.map((item) => (
                <article key={item.id} className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-4">
                  <div className="flex items-start justify-between gap-3 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{item.state}</Badge>
                        <Badge variant="soft">{item.apartamentoNombre || "general"}</Badge>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-[var(--fg-primary)]">{item.name}</h3>
                      <p className="mt-1 text-sm text-[var(--fg-secondary)]">{formatMoney(item.amount)} · vence {formatDate(item.dueDate)}</p>
                    </div>
                    <div className="flex gap-2">
                      <ActionChip onClick={() => updateChargeState(item.id, "paid")}>Marcar pagado</ActionChip>
                      <ActionChip onClick={() => updateChargeState(item.id, "overdue")}>Marcar vencido</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aun no hay cargos" description="Los cargos emitidos apareceran aqui para su seguimiento operativo." />
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
        <p className="text-sm text-[#737373] mt-2">La capa de cuotas necesita un condominio activo para asociar montos y unidades.</p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[var(--surface-0)] border border-[var(--border-standard)] px-4 py-4 text-center min-w-[110px]">
      <p className={EYEBROW}>{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[var(--fg-primary)] tracking-tighter">{value}</p>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className={EYEBROW}>{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Badge({ children, variant = "strong" }) {
  const classes = variant === "soft"
    ? "bg-[#262626] text-[#A3A3A3]"
    : "bg-blue-500/10 border border-blue-500/20 text-blue-400";
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${classes}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#262626] text-xs font-semibold text-[#737373] hover:border-[#D94F10]/40 hover:text-[#D94F10]">{children}</button>;
}

function LoadingState({ label }) {
  return <p className="text-sm text-[#A3A3A3]">{label}</p>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-8 text-center">
      <h3 className="text-lg font-semibold text-[var(--fg-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-tertiary)]">{description}</p>
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
