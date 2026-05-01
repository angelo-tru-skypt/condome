import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import mailService from "../utils/mailService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

const DEFAULT_FORM = {
  currency: "DOP",
  timezone: "America/Santo_Domingo",
  language: "es-DO",
  reservationLeadHours: 24,
  reservationWindowDays: 30,
  incidentSlaHours: 24,
  lateFeeGraceDays: 5,
  supportEmail: "",
  automaticAccessValidation: true,
};

export default function OwnerSettingsPage() {
  const { condominio, edificios, apartamentos, residentes } = useCondominio();
  const [form, setForm] = useState(DEFAULT_FORM);
  const [savedAt, setSavedAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [smtpTest, setSmtpTest] = useState({ loading: false, result: null });

  const loadSettings = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setForm(DEFAULT_FORM);
        setSavedAt("");
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.getSettings(condominio.id);
        const data = response.data || DEFAULT_FORM;
        setForm(data);
        setSavedAt(data.updatedAt || "");
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar la configuración.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadSettings();
  }, [loadSettings]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const saveSettings = async (event) => {
    event.preventDefault();
    setError("");
    setSaving(true);
    try {
      const response = await adminService.updateSettings({
        condominio_id: condominio.id,
        ...form,
      });
      const data = response.data || form;
      setForm(data);
      setSavedAt(data.updatedAt || "");
    } catch (saveError) {
      setError(saveError.message || "No se pudo guardar la configuración.");
    } finally {
      setSaving(false);
    }
  };

  const testSmtp = async () => {
    setSmtpTest({ loading: true, result: null });
    try {
      const response = await mailService.testSmtp(form.supportEmail || "");
      setSmtpTest({
        loading: false,
        result: {
          ok: true,
          message: response?.message || "Correo de prueba enviado correctamente.",
          transport: response?.transport || null,
        },
      });
    } catch (err) {
      setSmtpTest({ loading: false, result: { ok: false, message: err.message || "No se pudo conectar al servidor SMTP." } });
    }
    setTimeout(() => setSmtpTest({ loading: false, result: null }), 6000);
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Configuración general</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Define los parámetros base del condominio y de la operación.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">Aquí ajustas idioma, moneda, ventanas operativas y reglas transversales para reservas, incidencias y cobranza.</p>
          </div>
          <div className="rounded-[22px] border border-[#262626] bg-[#141414] px-4 py-4 min-w-[220px]">
            <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">Último guardado</p>
            <p className="mt-2 text-sm font-semibold text-[#E5E5E5]">{savedAt ? formatDate(savedAt) : "Aún sin cambios"}</p>
          </div>
        </div>
      </section>

      <form className="grid gap-6 xl:grid-cols-[1.2fr_1fr]" onSubmit={saveSettings}>
        <div className={`${SURFACE} p-6 md:p-7 space-y-5`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Parámetros del sistema</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Base operativa</h2>
          </div>

          {error && <ErrorBanner message={error} />}

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Moneda">
              <select value={form.currency} onChange={(event) => setForm((current) => ({ ...current, currency: event.target.value }))} className={INPUT}>
                <option value="DOP">DOP</option>
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
              </select>
            </Field>
            <Field label="Zona horaria">
              <input value={form.timezone} onChange={(event) => setForm((current) => ({ ...current, timezone: event.target.value }))} className={INPUT} />
            </Field>
          </div>

          <Field label="Idioma">
            <select value={form.language} onChange={(event) => setForm((current) => ({ ...current, language: event.target.value }))} className={INPUT}>
              <option value="es-DO">Español (DO)</option>
              <option value="es-ES">Español (ES)</option>
              <option value="en-US">Inglés (US)</option>
            </select>
          </Field>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="Horas mínimas para reservar">
              <input type="number" min="1" value={form.reservationLeadHours} onChange={(event) => setForm((current) => ({ ...current, reservationLeadHours: Number(event.target.value || 0) }))} className={INPUT} />
            </Field>
            <Field label="Días máximos de ventana de reserva">
              <input type="number" min="1" value={form.reservationWindowDays} onChange={(event) => setForm((current) => ({ ...current, reservationWindowDays: Number(event.target.value || 0) }))} className={INPUT} />
            </Field>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <Field label="SLA de incidencias (horas)">
              <input type="number" min="1" value={form.incidentSlaHours} onChange={(event) => setForm((current) => ({ ...current, incidentSlaHours: Number(event.target.value || 0) }))} className={INPUT} />
            </Field>
            <Field label="Gracia para mora (días)">
              <input type="number" min="0" value={form.lateFeeGraceDays} onChange={(event) => setForm((current) => ({ ...current, lateFeeGraceDays: Number(event.target.value || 0) }))} className={INPUT} />
            </Field>
          </div>

          <Field label="Correo de soporte">
            <input type="email" value={form.supportEmail} onChange={(event) => setForm((current) => ({ ...current, supportEmail: event.target.value }))} className={INPUT} />
          </Field>

          <label className="flex items-center gap-3 rounded-xl border border-[#262626] px-4 py-3">
            <input type="checkbox" checked={form.automaticAccessValidation} onChange={(event) => setForm((current) => ({ ...current, automaticAccessValidation: event.target.checked }))} />
            <span className="text-sm text-[#E5E5E5]">Validación automática de acceso en portería</span>
          </label>

          <div className="pt-4 border-t border-[#262626] space-y-5">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Información Bancaria</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Cuentas para Transferencias</h2>
              <p className="text-[11px] text-[#737373] mt-1">Estos datos se mostrarán a los residentes al momento de realizar pagos manuales.</p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Nombre del Banco">
                <input value={form.bankName || ""} onChange={(event) => setForm((current) => ({ ...current, bankName: event.target.value }))} className={INPUT} placeholder="Ej. Banco Popular" />
              </Field>
              <Field label="Número de Cuenta">
                <input value={form.bankAccountNumber || ""} onChange={(event) => setForm((current) => ({ ...current, bankAccountNumber: event.target.value }))} className={INPUT} placeholder="0000000000" />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo de Cuenta">
                <select value={form.bankAccountType || "corriente"} onChange={(event) => setForm((current) => ({ ...current, bankAccountType: event.target.value }))} className={INPUT}>
                  <option value="ahorros">Cuenta de Ahorros</option>
                  <option value="corriente">Cuenta Corriente</option>
                </select>
              </Field>
              <Field label="Titular de la Cuenta">
                <input value={form.bankAccountHolder || ""} onChange={(event) => setForm((current) => ({ ...current, bankAccountHolder: event.target.value }))} className={INPUT} placeholder="Nombre completo" />
              </Field>
            </div>
          </div>

          <button type="submit" disabled={saving || loading} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
            {saving ? "Guardando..." : "Guardar configuración"}
          </button>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Contexto actual</p>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Condominio" value={condominio.nombre} />
              <SummaryRow label="Edificios" value={String(edificios.length)} />
              <SummaryRow label="Apartamentos" value={String(apartamentos.length)} />
              <SummaryRow label="Residentes" value={String(residentes.length)} />
            </div>
          </div>

          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Impacto de estos ajustes</p>
            <ul className="mt-4 space-y-3">
              {[
                "Las reservas respetarán la anticipación y la ventana operativa definidas.",
                "Las incidencias podrán medirse frente al SLA configurado.",
                "El soporte y las automatizaciones usarán el correo administrativo configurado.",
              ].map((item) => (
                <li key={item} className="flex gap-3">
                  <span className="mt-1.5 w-2.5 h-2.5 rounded-full bg-[#D94F10] flex-shrink-0" />
                  <span className="text-sm leading-7 text-[#A3A3A3]">{item}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Panel de prueba SMTP */}
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Notificaciones por email</p>
            <h3 className="mt-2 text-base font-semibold text-[#E5E5E5]">Servidor SMTP</h3>
            <p className="mt-2 text-xs leading-6 text-[#737373]">
              El sistema envía emails automáticos usando la configuración activa del servidor. En desarrollo, Condome puede usar el relay interno del stack para evitar fallos de red externa.
            </p>
            <div className="mt-4 space-y-3">
              <SummaryRow
                label="Servidor"
                value={smtpTest.result?.transport?.host ? `${smtpTest.result.transport.host}:${smtpTest.result.transport.port}` : "Configuración del servidor"}
              />
              <SummaryRow
                label="Modo"
                value={smtpTest.result?.transport?.mode === "internal" ? "SMTP interno" : "SMTP del entorno"}
              />
              <SummaryRow label="Destino prueba" value={form.supportEmail || "Correo del usuario actual"} />
            </div>
            {smtpTest.result && (
              <div className={`mt-4 px-4 py-3 rounded-xl text-xs font-semibold border ${
                smtpTest.result.ok
                  ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400"
                  : "bg-red-500/10 border-red-500/20 text-red-400"
              }`}>
                {smtpTest.result.ok ? "✅ " : "❌ "}{smtpTest.result.message}
              </div>
            )}
            <button
              type="button"
              onClick={testSmtp}
              disabled={smtpTest.loading}
              className="mt-4 w-full px-4 py-3 rounded-xl text-sm font-semibold border border-[#262626] bg-transparent text-[#A3A3A3] hover:border-[#1A6B9A]/50 hover:text-[#1A6B9A] transition-all disabled:opacity-50 cursor-pointer"
            >
              {smtpTest.loading ? "Enviando prueba..." : "✉ Enviar correo de prueba"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[#E5E5E5]">Primero registra tu condominio</p>
        <p className="text-sm text-[#737373] mt-2">La configuración general necesita un condominio base para tener contexto operativo.</p>
      </div>
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

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#141414] border border-[#262626] px-4 py-3">
      <span className="text-sm text-[#A3A3A3]">{label}</span>
      <span className="text-sm font-semibold text-[#E5E5E5] text-right">{value}</span>
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function formatDate(value) {
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
