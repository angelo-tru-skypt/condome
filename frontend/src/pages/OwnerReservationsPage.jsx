import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnerReservationsPage() {
  const { condominio, residentes } = useCondominio();
  const [areas, setAreas] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState({ visible: false, message: "", type: "success" });
  const [areaForm, setAreaForm] = useState({ name: "", capacity: "", schedule: "", rules: "" });
  const [requestForm, setRequestForm] = useState({
    areaId: "",
    residentId: "",
    date: "",
    timeRange: "",
    attendees: "1",
    purpose: "",
  });

  const selectedResident = useMemo(
    () => residentes.find((item) => String(item.id) === String(requestForm.residentId)),
    [residentes, requestForm.residentId]
  );

  const loadData = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setAreas([]);
        setReservations([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const [areasResponse, reservationsResponse] = await Promise.all([
          adminService.listCommonAreas(condominio.id),
          adminService.listReservations(condominio.id),
        ]);
        setAreas(areasResponse.data || []);
        setReservations(reservationsResponse.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar las reservas.");
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

  const summary = {
    areas: areas.length,
    pending: reservations.filter((item) => item.status === "pending").length,
    approved: reservations.filter((item) => item.status === "approved").length,
    rejected: reservations.filter((item) => item.status === "rejected").length,
  };

  const submitArea = async (event) => {
    event.preventDefault();
    setError("");
    if (!areaForm.name.trim()) {
      setError("El nombre del área es requerido.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createCommonArea({
        condominio_id: condominio.id,
        ...areaForm,
      });
      setAreaForm({ name: "", capacity: "", schedule: "", rules: "" });
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el área común.");
    } finally {
      setSaving(false);
    }
  };

  const submitRequest = async (event) => {
    event.preventDefault();
    setError("");
    if (!requestForm.areaId || !requestForm.residentId || !requestForm.date || !requestForm.timeRange) {
      setError("Completa área, residente, fecha y rango horario.");
      return;
    }
    setSaving(true);
    try {
      await adminService.createReservation({
        condominio_id: condominio.id,
        areaId: Number(requestForm.areaId),
        residentId: Number(requestForm.residentId),
        apartmentId: selectedResident?.apartamento_id || selectedResident?.apartmentId,
        date: requestForm.date,
        timeRange: requestForm.timeRange,
        attendees: Number(requestForm.attendees || 1),
        purpose: requestForm.purpose,
      });
      setRequestForm({
        areaId: areas[0]?.id ? String(areas[0].id) : "",
        residentId: "",
        date: "",
        timeRange: "",
        attendees: "1",
        purpose: "",
      });
      await loadData();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar la solicitud.");
    } finally {
      setSaving(false);
    }
  };

  const showToast = (message, type = "success") => {
    setToast({ visible: true, message, type });
    setTimeout(() => setToast({ visible: false, message: "", type: "success" }), 4000);
  };

  const updateStatus = async (reservationId, status) => {
    try {
      const response = await adminService.updateReservation(reservationId, { status });
      setReservations((current) =>
        current.map((item) => (item.id === reservationId ? response.data : item))
      );
      if (status === "approved") {
        showToast("Reserva aprobada — se envió confirmación por email al residente ✉️");
      } else if (status === "rejected") {
        showToast("Reserva rechazada", "info");
      }
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar la reserva.");
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast de notificación */}
      {toast.visible && (
        <div className={`fixed bottom-6 right-6 z-[200] px-5 py-4 rounded-2xl shadow-2xl border text-sm font-semibold flex items-center gap-3 transition-all animate-fade-up ${
          toast.type === "success"
            ? "bg-[#0D1F17] border-emerald-500/30 text-emerald-400"
            : "bg-[#1A1A1A] border-[#262626] text-[#A3A3A3]"
        }`}>
          <span>{toast.type === "success" ? "✅" : "ℹ️"}</span>
          {toast.message}
        </div>
      )}
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
              Reservas de áreas comunes
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              Ordena amenidades, turnos y aprobaciones desde una sola vista.
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Esta pantalla ayuda al administrador a definir las áreas comunes, registrar solicitudes y decidir rápido sin perder trazabilidad.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Áreas" value={summary.areas} />
            <SummaryCard label="Pendientes" value={summary.pending} />
            <SummaryCard label="Aprobadas" value={summary.approved} />
            <SummaryCard label="Rechazadas" value={summary.rejected} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Áreas comunes</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Configuración operativa</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-[#A3A3A3] text-xs font-semibold">
              Backend real
            </span>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={submitArea}>
            <Field label="Nombre del área">
              <input value={areaForm.name} onChange={(event) => setAreaForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Capacidad">
                <input type="number" min="1" value={areaForm.capacity} onChange={(event) => setAreaForm((current) => ({ ...current, capacity: event.target.value }))} className={INPUT} />
              </Field>

              <Field label="Horario">
                <input value={areaForm.schedule} onChange={(event) => setAreaForm((current) => ({ ...current, schedule: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <Field label="Reglas principales">
              <textarea value={areaForm.rules} onChange={(event) => setAreaForm((current) => ({ ...current, rules: event.target.value }))} className={`${INPUT} min-h-[110px] resize-none`} />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}>
              {saving ? "Guardando..." : "Registrar área común"}
            </button>
          </form>

          <div className="mt-6 space-y-3">
            {loading ? (
              <LoadingState label="Cargando áreas..." />
            ) : areas.length ? (
              areas.map((area) => (
                <article key={area.id} className="rounded-[22px] border border-[#262626] bg-[#141414] p-4">
                  <h3 className="text-base font-semibold text-[#E5E5E5]">{area.name}</h3>
                  <p className="mt-1 text-sm text-[#A3A3A3]">
                    Capacidad: {area.capacity || "Sin definir"} · Horario: {area.schedule || "Abierto"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-[#5D554E]">{area.rules || "Sin reglas registradas."}</p>
                </article>
              ))
            ) : (
              <EmptyState title="Todavía no hay áreas comunes" description="Registra la primera amenidad para empezar a ordenar las reservas." />
            )}
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Solicitudes</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Agenda y aprobaciones</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FFF0E7] text-[#B14F12] text-xs font-semibold">
              Flujo administrativo
            </span>
          </div>

          <form className="mt-6 grid gap-4" onSubmit={submitRequest}>
            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Área común">
                <select value={requestForm.areaId} onChange={(event) => setRequestForm((current) => ({ ...current, areaId: event.target.value }))} className={INPUT}>
                  <option value="">Selecciona un área</option>
                  {areas.map((area) => (
                    <option key={area.id} value={area.id}>
                      {area.name}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="Residente">
                <select value={requestForm.residentId} onChange={(event) => setRequestForm((current) => ({ ...current, residentId: event.target.value }))} className={INPUT}>
                  <option value="">Selecciona un residente</option>
                  {residentes.map((resident) => (
                    <option key={resident.id} value={resident.id}>
                      {resident.nombre_completo}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <Field label="Apartamento asociado">
              <input readOnly value={selectedResident?.apartamento_nombre || selectedResident?.apartmentName || ""} className={`${INPUT} bg-[#1A1A1A] text-[#A3A3A3]`} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Fecha">
                <input type="date" value={requestForm.date} onChange={(event) => setRequestForm((current) => ({ ...current, date: event.target.value }))} className={INPUT} />
              </Field>

              <Field label="Rango horario">
                <input value={requestForm.timeRange} onChange={(event) => setRequestForm((current) => ({ ...current, timeRange: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Asistentes">
                <input type="number" min="1" value={requestForm.attendees} onChange={(event) => setRequestForm((current) => ({ ...current, attendees: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Motivo">
                <input value={requestForm.purpose} onChange={(event) => setRequestForm((current) => ({ ...current, purpose: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
              {saving ? "Guardando..." : "Registrar solicitud"}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            {loading ? (
              <LoadingState label="Cargando reservas..." />
            ) : reservations.length ? (
              reservations.map((reservation) => (
                <article key={reservation.id} className="rounded-[22px] border border-[#262626] bg-[#141414] p-4">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Pill>{reservation.status}</Pill>
                        <Pill variant="soft">{reservation.areaName}</Pill>
                      </div>
                      <h3 className="mt-3 text-base font-semibold text-[#E5E5E5]">
                        {reservation.residentName} · {reservation.apartmentName || "Unidad sin definir"}
                      </h3>
                      <p className="mt-1 text-sm text-[#A3A3A3]">
                        {reservation.date} · {reservation.timeRange} · {reservation.attendees} asistentes
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#5D554E]">{reservation.purpose || "Sin detalle adicional."}</p>
                    </div>

                    <div className="flex gap-2">
                      <ActionChip onClick={() => updateStatus(reservation.id, "approved")}>Aprobar</ActionChip>
                      <ActionChip onClick={() => updateStatus(reservation.id, "rejected")}>Rechazar</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="No hay solicitudes todavía" description="Las reservas registradas aparecerán aquí para que puedas aprobarlas o rechazarlas." />
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
        <p className="text-sm text-[#737373] mt-2">La gestión de áreas comunes depende de una estructura base del condominio y de sus residentes.</p>
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

function Pill({ children, variant = "strong" }) {
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#EEF6FF] text-[#1A6B9A]"}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#E6DCD2] text-xs font-semibold text-[#A3A3A3] hover:border-[#D94F10]/30 hover:text-[#D94F10]">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function LoadingState({ label }) {
  return <p className="text-sm text-[#A3A3A3]">{label}</p>;
}
