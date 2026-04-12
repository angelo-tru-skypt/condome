import { useEffect, useMemo, useState } from "react";
import residentPortalService from "../utils/residentPortalService";

const SURFACE = "bg-[#1A1A1A] border border-[#DCE7E7] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#F6FBFB] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#1A6B9A] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#1A6B9A]/10";
const LABEL = "block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#5D6B6A] mb-1.5";

export default function ResidentIncidentsPage() {
  const [context, setContext] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [form, setForm] = useState({
    titulo: "",
    descripcion: "",
    ubicacion_tipo: "apartamento",
    edificio_id: "",
    categoria: "mantenimiento",
    prioridad: "media",
    ubicacion_detalle: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const loadData = async () => {
    const [contextResponse, incidentsResponse] = await Promise.all([
      residentPortalService.getResidentContext(),
      residentPortalService.listResidentIncidents(),
    ]);
    setContext(contextResponse.data);
    setIncidents(incidentsResponse.data || []);
    setForm((current) => ({
      ...current,
      edificio_id: contextResponse.data?.edificio?.id ? String(contextResponse.data.edificio.id) : "",
    }));
  };

  useEffect(() => {
    loadData()
      .catch((loadError) => setError(loadError.message || "No se pudo cargar el módulo de incidencias"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const open = incidents.filter((item) => ["reportada", "en_revision"].includes(item.estado)).length;
    const solved = incidents.filter((item) => ["resuelta", "cerrada"].includes(item.estado)).length;
    return { total: incidents.length, open, solved };
  }, [incidents]);

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
      await residentPortalService.createResidentIncident({
        ...form,
        edificio_id: form.ubicacion_tipo === "edificio" ? Number(form.edificio_id) : undefined,
      });
      setForm((current) => ({
        ...current,
        titulo: "",
        descripcion: "",
        ubicacion_detalle: "",
      }));
      const incidentsResponse = await residentPortalService.listResidentIncidents();
      setIncidents(incidentsResponse.data || []);
      setSuccess("La incidencia fue enviada y ya está visible para el propietario.");
    } catch (submitError) {
      setError(submitError.message || "No se pudo reportar la incidencia");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <PageLoader label="Cargando tus incidencias..." />;
  }

  return (
    <div className="space-y-6">
      <section
        className="rounded-[32px] overflow-hidden border border-[#CFE3E3]"
        style={{
          background: "linear-gradient(135deg, #10243C 0%, #17375B 50%, #2274A5 100%)",
          boxShadow: "0 18px 50px rgba(14,36,51,0.16)",
        }}
      >
        <div className="px-7 py-8 md:px-10 md:py-9">
          <div className="grid gap-6 lg:grid-cols-[1.45fr_1fr]">
            <div>
              <p className="text-[11px] uppercase tracking-[0.28em] font-semibold text-[#C8EBFF]">
                Incidencias
              </p>
              <h1
                className="mt-3 text-3xl md:text-4xl text-white font-semibold"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Reporta lo que esté pasando en tu condominio
              </h1>
              <p className="mt-3 max-w-2xl text-sm md:text-[15px] leading-7 text-white/78">
                Puedes reportar problemas en tu apartamento o en un edificio específico. El propietario recibe el caso y actualiza su estado.
              </p>
            </div>
            <div className="rounded-[24px] bg-[#333333] border border-[#262626] backdrop-blur-sm p-5">
              <InfoTile label="Condominio" value={context?.condominio?.nombre || "Sin contexto"} />
              <InfoTile label="Edificio base" value={context?.edificio?.nombre || "Sin contexto"} />
              <InfoTile label="Apartamento" value={context?.apartamento?.nombre || "Sin contexto"} />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[440px_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#1A6B9A]">
            Nuevo reporte
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Abrir incidencia</h2>

          <div className="mt-5 grid grid-cols-3 gap-3">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Abiertas" value={summary.open} />
            <SummaryCard label="Resueltas" value={summary.solved} />
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
              <label className={LABEL}>Título</label>
              <input name="titulo" value={form.titulo} onChange={handleChange} className={INPUT} />
            </div>

            <div>
              <label className={LABEL}>Descripción</label>
              <textarea
                name="descripcion"
                value={form.descripcion}
                onChange={handleChange}
                className={`${INPUT} min-h-[130px] resize-none`}
                placeholder="Describe qué está ocurriendo y qué impacto tiene"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={LABEL}>Ubicación</label>
                <select name="ubicacion_tipo" value={form.ubicacion_tipo} onChange={handleChange} className={INPUT}>
                  <option value="apartamento">Mi apartamento</option>
                  <option value="edificio">Un edificio</option>
                </select>
              </div>
              <div>
                <label className={LABEL}>Prioridad</label>
                <select name="prioridad" value={form.prioridad} onChange={handleChange} className={INPUT}>
                  <option value="baja">Baja</option>
                  <option value="media">Media</option>
                  <option value="alta">Alta</option>
                  <option value="urgente">Urgente</option>
                </select>
              </div>
            </div>

            <div>
              <label className={LABEL}>Categoría</label>
              <select name="categoria" value={form.categoria} onChange={handleChange} className={INPUT}>
                <option value="mantenimiento">Mantenimiento</option>
                <option value="seguridad">Seguridad</option>
                <option value="limpieza">Limpieza</option>
                <option value="servicios">Servicios</option>
                <option value="otros">Otros</option>
              </select>
            </div>

            {form.ubicacion_tipo === "edificio" && (
              <div>
                <label className={LABEL}>Edificio afectado</label>
                <select name="edificio_id" value={form.edificio_id} onChange={handleChange} className={INPUT}>
                  <option value="">Selecciona un edificio</option>
                  {context?.edificios?.map((building) => (
                    <option key={building.id} value={building.id}>
                      {building.nombre}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className={LABEL}>Detalle de ubicación</label>
              <input
                name="ubicacion_detalle"
                value={form.ubicacion_detalle}
                onChange={handleChange}
                className={INPUT}
                placeholder="Ej: pasillo del nivel 2, escalera de emergencia, cocina del apto."
              />
            </div>

            <button
              type="submit"
              disabled={saving}
              className="w-full py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-50 cursor-pointer"
              style={{ background: "linear-gradient(135deg, #2274A5, #10243C)" }}
            >
              {saving ? "Enviando..." : "Reportar incidencia"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#5D6B6A]">
                Historial
              </p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Tus casos abiertos y cerrados</h2>
            </div>
          </div>

          <div className="mt-6 grid gap-4">
            {incidents.length ? (
              incidents.map((incident) => (
                <article key={incident.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-lg font-semibold text-[#E5E5E5]">{incident.titulo}</h3>
                      <p className="mt-1 text-sm text-[#6F7B7B]">
                        {incident.ubicacion_tipo === "apartamento" ? incident.apartamento_nombre : incident.edificio_nombre}
                      </p>
                    </div>
                    <StatusBadge status={incident.estado} />
                  </div>

                  <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                    <MiniRow label="Categoría" value={incident.categoria} />
                    <MiniRow label="Prioridad" value={incident.prioridad} />
                    <MiniRow label="Ubicación" value={incident.ubicacion_tipo} />
                    <MiniRow label="Reporte" value={formatDateTime(incident.fecha_reporte)} />
                  </div>

                  <div className="mt-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
                    <p className="text-[11px] uppercase tracking-[0.18em] text-[#A3A3A3]">Descripción</p>
                    <p className="mt-1 text-sm text-[#E5E5E5]">{incident.descripcion}</p>
                  </div>

                  {incident.respuesta_propietario && (
                    <div className="mt-4 rounded-2xl bg-[#FFF6EF] border border-[#F0DDCB] px-4 py-3">
                      <p className="text-[11px] uppercase tracking-[0.18em] text-[#B26A37]">Respuesta del propietario</p>
                      <p className="mt-1 text-sm text-[#5A3D26]">{incident.respuesta_propietario}</p>
                    </div>
                  )}
                </article>
              ))
            ) : (
              <EmptyState
                title="Todavía no hay incidencias reportadas"
                description="Cuando abras tu primer caso, podrás seguirlo desde este mismo panel."
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
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#2274A5]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#6F7B7B]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#F4FAFA] border border-[#262626] px-4 py-4 text-center">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#A3A3A3]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#E5E5E5]">{value}</p>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-[#262626] bg-black/10 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] text-white/45">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "resuelta" || status === "cerrada"
      ? "bg-[#EAF8EF] text-[#2E7D52]"
      : status === "en_revision"
        ? "bg-[#FFF0E7] text-[#B14F12]"
        : "bg-[#EEF6FF] text-[#1A6B9A]";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>{status}</span>;
}

function MiniRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#A3A3A3]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#E5E5E5]">{value}</p>
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
