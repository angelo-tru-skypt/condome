import { useEffect, useMemo, useState } from "react";
import residentPortalService from "../utils/residentPortalService";

const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-whisper)]";
const INPUT =
  "w-full px-4 py-3 bg-[var(--surface-2)] border border-[var(--border-standard)] rounded-xl text-[var(--fg-primary)] text-sm outline-none transition-all focus:border-[var(--condome-orange)] focus:ring-4 focus:ring-[var(--condome-orange)]/5";
const LABEL = "block text-[10px] font-bold tracking-[0.14em] uppercase text-[var(--fg-tertiary)] mb-1.5";

function todayDate() {
  return new Date().toISOString().slice(0, 10);
}

export default function ResidentVisitsPage() {
  const [context, setContext] = useState(null);
  const [visits, setVisits] = useState([]);
  const [form, setForm] = useState({
    visitante_nombre: "",
    visitante_documento: "",
    visitante_telefono: "",
    fecha_visita: todayDate(),
    hora_ingreso: "",
    hora_salida: "",
    cantidad_personas: 1,
    motivo: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const [contextResponse, visitsResponse] = await Promise.all([
      residentPortalService.getResidentContext(),
      residentPortalService.listResidentVisits(),
    ]);
    setContext(contextResponse.data);
    setVisits(visitsResponse.data || []);
  };

  useEffect(() => {
    loadData()
      .catch((loadError) => setError(loadError.message || "No se pudo cargar el módulo de visitas"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const pending = visits.filter((item) => item.estado === "pendiente").length;
    const approved = visits.filter((item) => item.estado === "aprobada").length;
    const rejected = visits.filter((item) => item.estado === "rechazada").length;
    return { total: visits.length, pending, approved, rejected };
  }, [visits]);

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (error) setError("");
    if (success) setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await residentPortalService.createResidentVisit({
        ...form,
        cantidad_personas: Number(form.cantidad_personas || 1),
      });
      setForm({
        visitante_nombre: "",
        visitante_documento: "",
        visitante_telefono: "",
        fecha_visita: todayDate(),
        hora_ingreso: "",
        hora_salida: "",
        cantidad_personas: 1,
        motivo: "",
      });
      await loadData();
      setSuccess("La solicitud fue enviada al propietario para aprobación.");
    } catch (submitError) {
      setError(submitError.message || "No se pudo registrar la visita");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Cargando tus solicitudes de visita..." />;
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] overflow-hidden border border-[#CFE3E3] animate-reveal"
        style={{
          background: "linear-gradient(135deg, #0E2433 0%, #143349 46%, #1A6B9A 100%)",
          boxShadow: "0 18px 50px rgba(14,36,51,0.16)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#BCECEA]">
                Visitas
              </p>
              <h1
                className="mt-3 text-3xl md:text-4xl text-white font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Solicita acceso para tus invitados
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/78">
                Cada solicitud llega al propietario del condominio para que decida si autoriza o rechaza la entrada del invitado.
              </p>
            </div>
            <div className="rounded-[24px] bg-white/5 border border-white/10 backdrop-blur-md p-5 flex flex-col gap-3">
              <InfoTile label="Condominio" value={context?.condominio?.nombre || "Sin contexto"} />
              <InfoTile label="Edificio" value={context?.edificio?.nombre || "Sin contexto"} />
              <InfoTile label="Apartamento" value={context?.apartamento?.nombre || "Sin contexto"} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[430px_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#1A6B9A]">
            Nueva solicitud
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Registrar invitado</h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SummaryCard label="Total" value={summary.total} color="var(--fg-primary)" />
            <SummaryCard label="Pendientes" value={summary.pending} color="var(--condome-orange)" />
            <SummaryCard label="Aprobadas" value={summary.approved} color="#2E7D52" />
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            {error && (
              <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
                {error}
              </div>
            )}
            {success && (
              <div className="px-4 py-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm">
                {success}
              </div>
            )}

            <div>
              <label className={LABEL}>Nombre del invitado</label>
              <input name="visitante_nombre" value={form.visitante_nombre} onChange={handleChange} className={INPUT} />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Documento</label>
                <input name="visitante_documento" value={form.visitante_documento} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Teléfono</label>
                <input name="visitante_telefono" value={form.visitante_telefono} onChange={handleChange} className={INPUT} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Fecha</label>
                <input name="fecha_visita" type="date" value={form.fecha_visita} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Cantidad de personas</label>
                <input
                  name="cantidad_personas"
                  type="number"
                  min="1"
                  value={form.cantidad_personas}
                  onChange={handleChange}
                  className={INPUT}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Hora de ingreso</label>
                <input name="hora_ingreso" type="time" value={form.hora_ingreso} onChange={handleChange} className={INPUT} />
              </div>
              <div>
                <label className={LABEL}>Hora de salida</label>
                <input name="hora_salida" type="time" value={form.hora_salida} onChange={handleChange} className={INPUT} />
              </div>
            </div>

            <div>
              <label className={LABEL}>Motivo</label>
              <textarea
                name="motivo"
                value={form.motivo}
                onChange={handleChange}
                className={`${INPUT} min-h-[110px] resize-none`}
                placeholder="Ej: visita familiar, entrega, soporte técnico"
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-4 rounded-xl text-white text-xs font-bold uppercase tracking-widest border-none disabled:opacity-50 cursor-pointer hover:brightness-110 shadow-lg active:scale-[0.98] transition-all"
              style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
            >
              {saving ? "Enviando..." : "Enviar solicitud"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[var(--fg-tertiary)]">
                Seguimiento
              </p>
              <h2 className="mt-2 text-xl font-bold text-[var(--fg-primary)]">Tus solicitudes recientes</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#EAF5FA] text-[#1A6B9A] text-xs font-semibold">
              {summary.rejected} rechazadas
            </span>
          </div>

          <div className="mt-6 grid gap-4">
            {visits.length ? (
              visits.map((visit, idx) => (
                <article 
                  key={visit.id} 
                  className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-2)] p-5 animate-slide-up group hover:shadow-md transition-shadow"
                  style={{ animationDelay: `${idx * 100}ms` }}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-bold text-[var(--fg-primary)]">{visit.visitante_nombre}</h3>
                      <p className="mt-1 text-xs font-medium text-[var(--fg-tertiary)] uppercase tracking-wider">
                        {formatDate(visit.fecha_visita)} · {visit.hora_ingreso || "Sin hora"}
                      </p>
                    </div>
                    <StatusBadge status={visit.estado} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2">
                    <MiniRow label="Apartamento" value={visit.apartamento_nombre} />
                    <MiniRow label="Cantidad" value={visit.cantidad_personas} />
                    <MiniRow label="Documento" value={visit.visitante_documento || "Sin documento"} />
                    <MiniRow label="Teléfono" value={visit.visitante_telefono || "Sin teléfono"} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-[var(--canvas)] border border-[var(--border-subtle)] px-4 py-3">
                    <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--fg-tertiary)]">Motivo</p>
                    <p className="mt-1 text-sm leading-relaxed text-[var(--fg-secondary)]">{visit.motivo || "Sin detalles adicionales."}</p>
                  </div>

                  {visit.notas_propietario && (
                    <div className="mt-4 rounded-2xl bg-[#FFF6EF] border border-[#F0DDCB] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#B26A37]">Respuesta del propietario</p>
                      <p className="mt-1 text-sm text-[#5A3D26]">{visit.notas_propietario}</p>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <EmptyState
                title="Todavía no has solicitado visitas"
                description="Tu historial aparecerá aquí cuando registres el primer invitado."
              />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

function PageLoader({ label }) {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#1A6B9A]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#6F7B7B]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, color }) {
  return (
    <div className="rounded-2xl border border-[var(--border-standard)] px-4 py-4 text-center group bg-[var(--canvas)]">
      <p className="text-[10px] uppercase tracking-[0.18em] font-bold text-[var(--fg-tertiary)]">{label}</p>
      <p className="mt-2 text-2xl font-black font-serif" style={{ color }}>{value}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 hover:bg-white/10 transition-colors group cursor-default">
      <p className="text-[10px] uppercase tracking-[0.2em] font-bold text-white/40 group-hover:text-white/60 transition-colors">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white tracking-wide">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "aprobada"
      ? "bg-[#EAF8EF] text-[#2E7D52]"
      : status === "rechazada"
        ? "bg-[#FFF0E7] text-[#B14F12]"
        : status === "cancelada"
          ? "bg-[#F3EEF8] text-[#6F4FA7]"
          : "bg-[#EAF5FA] text-[#1A6B9A]";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>{status}</span>;
}

function MiniRow({ label, value }) {
  return (
    <div className="rounded-xl bg-[var(--canvas)]/50 border border-[var(--border-subtle)] px-3 py-2">
      <p className="text-[10px] uppercase tracking-[0.14em] font-bold text-[var(--fg-tertiary)]">{label}</p>
      <p className="mt-0.5 text-xs font-semibold text-[var(--fg-secondary)]">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#D6E4E4] bg-[#141414] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#6F7B7B]">{description}</p>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(`${value}T00:00:00`).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}
