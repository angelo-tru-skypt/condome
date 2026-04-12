import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerAccessControlPage() {
  const { condominio } = useCondominio();
  const [policies, setPolicies] = useState([]);
  const [visits, setVisits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    type: "visita",
    appliesTo: "Portería principal",
    description: "",
    status: "active",
  });

  const loadData = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setPolicies([]);
        setVisits([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [policiesResponse, visitsResponse] = await Promise.all([
          adminService.listAccessPolicies(condominio.id),
          adminService.listVisits(),
        ]);
        setPolicies(policiesResponse.data || []);
        setVisits(visitsResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el control de acceso.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const pendingVisits = visits.filter((item) => item.estado === "pendiente");
  const approvedVisits = visits.filter((item) => item.estado === "aprobada");
  const blockedPolicies = policies.filter((item) => item.status === "blocked");

  const savePolicy = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.name.trim() || !form.description.trim()) {
      setError("Nombre y descripción son requeridos.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createAccessPolicy({
        condominio_id: condominio.id,
        ...form,
      });
      setForm({
        name: "",
        type: "visita",
        appliesTo: "Portería principal",
        description: "",
        status: "active",
      });
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar la política.");
    } finally {
      setSaving(false);
    }
  };

  const updatePolicyStatus = async (policyId, status) => {
    try {
      const response = await adminService.updateAccessPolicy(policyId, { status });
      setPolicies((current) => current.map((item) => (item.id === policyId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la política.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Control de acceso</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Conecta políticas del condominio con visitas y puntos de ingreso.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">Usa este panel para centralizar reglas, vigilar solicitudes pendientes y decidir qué accesos requieren atención inmediata.</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Políticas" value={policies.length} />
            <SummaryCard label="Pendientes" value={pendingVisits.length} />
            <SummaryCard label="Aprobadas" value={approvedVisits.length} />
            <SummaryCard label="Bloqueos" value={blockedPolicies.length} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Políticas</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Marco operativo</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={savePolicy}>
            <Field label="Nombre de la política">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Tipo">
                <select value={form.type} onChange={(event) => setForm((current) => ({ ...current, type: event.target.value }))} className={INPUT}>
                  <option value="visita">Visita</option>
                  <option value="vehiculo">Vehículo</option>
                  <option value="proveedor">Proveedor</option>
                  <option value="emergencia">Emergencia</option>
                </select>
              </Field>

              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={INPUT}>
                  <option value="active">Activa</option>
                  <option value="review">En revisión</option>
                  <option value="blocked">Bloqueada</option>
                </select>
              </Field>
            </div>

            <Field label="Aplica en">
              <input value={form.appliesTo} onChange={(event) => setForm((current) => ({ ...current, appliesTo: event.target.value }))} className={INPUT} />
            </Field>

            <Field label="Descripción">
              <textarea value={form.description} onChange={(event) => setForm((current) => ({ ...current, description: event.target.value }))} className={`${INPUT} min-h-[120px] resize-none`} />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
              {saving ? "Guardando..." : "Registrar política"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando políticas...</p>
            ) : policies.length ? (
              policies.map((policy) => (
                <article key={policy.id} className="rounded-[22px] border border-[#262626] bg-[#141414] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>{policy.type}</Badge>
                    <Badge variant="soft">{policy.status}</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#E5E5E5]">{policy.name}</h3>
                  <p className="mt-1 text-sm text-[#A3A3A3]">{policy.appliesTo}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5D554E]">{policy.description}</p>
                  <div className="mt-4 flex gap-2">
                    <ActionChip onClick={() => updatePolicyStatus(policy.id, "active")}>Activar</ActionChip>
                    <ActionChip onClick={() => updatePolicyStatus(policy.id, "review")}>Revisar</ActionChip>
                    <ActionChip onClick={() => updatePolicyStatus(policy.id, "blocked")}>Bloquear</ActionChip>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aún no hay políticas" description="Crea la primera política para ordenar el control de acceso del condominio." />
            )}
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Solicitudes recientes</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Vista de portería</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FFF0E7] text-[#B14F12] text-xs font-semibold">Integrado con visitas</span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando visitas...</p>
            ) : pendingVisits.length ? (
              pendingVisits.map((visit) => (
                <article key={visit.id} className="rounded-[22px] border border-[#262626] bg-[#141414] p-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge>pendiente</Badge>
                    <Badge variant="soft">{visit.apartamento_nombre}</Badge>
                  </div>
                  <h3 className="mt-3 text-base font-semibold text-[#E5E5E5]">{visit.visitante_nombre}</h3>
                  <p className="mt-1 text-sm text-[#A3A3A3]">{visit.residente_nombre} · {visit.edificio_nombre}</p>
                  <p className="mt-2 text-sm leading-6 text-[#5D554E]">{formatDate(visit.fecha_visita)} · Entrada: {visit.hora_ingreso}</p>
                </article>
              ))
            ) : (
              <EmptyState title="No hay visitas pendientes" description="Las nuevas solicitudes de invitados aparecerán aquí para supervisión operativa." />
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
        <p className="text-sm text-[#737373] mt-2">El control de acceso necesita la estructura del condominio y las solicitudes de visitas activas.</p>
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

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#E6DCD2] text-xs font-semibold text-[#A3A3A3] hover:border-[#D94F10]/30 hover:text-[#D94F10]">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
