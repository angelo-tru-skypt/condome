import { useEffect, useMemo, useState } from "react";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";

export default function OwnerVisitsPage() {
  const [visits, setVisits] = useState([]);
  const [notes, setNotes] = useState({});
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState(null);
  const [error, setError] = useState("");

  const loadVisits = async () => {
    const response = await adminService.listVisits();
    setVisits(response.data || []);
  };

  useEffect(() => {
    loadVisits()
      .catch((loadError) => setError(loadError.message || "No se pudieron cargar las solicitudes"))
      .finally(() => setLoading(false));
  }, []);

  const summary = useMemo(() => {
    const pending = visits.filter((item) => item.estado === "pendiente").length;
    const approved = visits.filter((item) => item.estado === "aprobada").length;
    const rejected = visits.filter((item) => item.estado === "rechazada").length;
    return { total: visits.length, pending, approved, rejected };
  }, [visits]);

  const decideVisit = async (visitId, estado) => {
    setSavingId(visitId);
    setError("");
    try {
      await adminService.decideVisit(visitId, {
        estado,
        notas_propietario: notes[visitId] || "",
      });
      await loadVisits();
    } catch (decisionError) {
      setError(decisionError.message || "No se pudo actualizar la solicitud");
    } finally {
      setSavingId(null);
    }
  };

  if (loading) {
    return <PageLoader label="Cargando solicitudes de invitados..." />;
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
              Control de visitas
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              Solicitudes que requieren tu decisión
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Aquí validas si un invitado puede entrar al condominio. Cada solicitud viene desde un residente y queda registrada con su estado final.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Total" value={summary.total} />
            <SummaryCard label="Pendientes" value={summary.pending} />
            <SummaryCard label="Aprobadas" value={summary.approved} />
            <SummaryCard label="Rechazadas" value={summary.rejected} />
          </div>
        </div>
      </section>

      <section className={`${SURFACE} p-6 md:p-7`}>
        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">
            {error}
          </div>
        )}

        <div className="grid gap-4">
          {visits.length ? (
            visits.map((visit) => (
              <article key={visit.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold text-[#E5E5E5]">{visit.visitante_nombre}</h2>
                    <p className="mt-1 text-sm text-[#A3A3A3]">
                      {visit.residente_nombre} · {visit.apartamento_nombre} · {visit.edificio_nombre}
                    </p>
                  </div>
                  <StatusBadge status={visit.estado} />
                </div>

                <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                  <MiniRow label="Fecha" value={formatDate(visit.fecha_visita)} />
                  <MiniRow label="Ingreso" value={visit.hora_ingreso || "Sin hora"} />
                  <MiniRow label="Documento" value={visit.visitante_documento || "Sin documento"} />
                  <MiniRow label="Personas" value={visit.cantidad_personas} />
                </div>

                <div className="mt-4 rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">Motivo</p>
                  <p className="mt-1 text-sm text-[#A3A3A3]">{visit.motivo || "Sin motivo especificado."}</p>
                </div>

                <div className="mt-4">
                  <label className="block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#A3A3A3] mb-1.5">
                    Nota para el residente
                  </label>
                  <textarea
                    value={notes[visit.id] ?? visit.notas_propietario ?? ""}
                    onChange={(event) =>
                      setNotes((current) => ({
                        ...current,
                        [visit.id]: event.target.value,
                      }))
                    }
                    className="w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10 min-h-[110px] resize-none"
                    placeholder="Agrega una observación para la respuesta"
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    disabled={savingId === visit.id}
                    onClick={() => decideVisit(visit.id, "aprobada")}
                    className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-50 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #1D8F5A, #125C39)" }}
                  >
                    {savingId === visit.id ? "Guardando..." : "Aprobar entrada"}
                  </button>
                  <button
                    type="button"
                    disabled={savingId === visit.id}
                    onClick={() => decideVisit(visit.id, "rechazada")}
                    className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-50 cursor-pointer"
                    style={{ background: "linear-gradient(135deg, #D76A2E, #A94410)" }}
                  >
                    {savingId === visit.id ? "Guardando..." : "Rechazar entrada"}
                  </button>
                </div>
              </article>
            ))
          ) : (
            <EmptyState
              title="No hay solicitudes de invitados"
              description="Cuando un residente solicite acceso para un invitado, aparecerá aquí para que puedas decidir."
            />
          )}
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
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#D94F10]"
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
    <div className="rounded-2xl bg-[#141414] border border-[#262626] px-4 py-4 text-center min-w-[110px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-[#E5E5E5]">{value}</p>
    </div>
  );
}

function StatusBadge({ status }) {
  const classes =
    status === "aprobada"
      ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-500"
      : status === "rechazada"
        ? "bg-orange-500/10 border border-orange-500/20 text-orange-500"
        : status === "cancelada"
          ? "bg-purple-500/10 border border-purple-500/20 text-purple-400"
          : "bg-blue-500/10 border border-blue-500/20 text-blue-400";
  return <span className={`px-3 py-1 rounded-full text-xs font-semibold ${classes}`}>{status}</span>;
}

function MiniRow({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#1A1A1A] border border-[#262626] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className="mt-1 text-sm font-semibold text-[#E5E5E5]">{value}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
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
