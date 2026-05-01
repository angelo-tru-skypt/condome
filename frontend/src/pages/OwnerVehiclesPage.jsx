import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

const DEFAULT_FORM = {
  residentId: "",
  placa: "",
  marca: "",
  modelo: "",
  color: "",
  ano: "",
  tipo: "auto",
  estado: "pendiente",
  ownerName: "",
  ownerPhone: "",
  ownerDocument: "",
  notes: "",
};

const TYPE_OPTIONS = [
  { value: "auto", label: "Auto" },
  { value: "moto", label: "Moto" },
  { value: "bicicleta", label: "Bicicleta" },
  { value: "otro", label: "Otro" },
];

const STATUS_OPTIONS = [
  { value: "pendiente", label: "Pendiente" },
  { value: "activo", label: "Aprobado" },
  { value: "restringido", label: "Restringido" },
  { value: "inactivo", label: "Liberado" },
];

export default function OwnerVehiclesPage() {
  const { condominio, residentes, refreshCondominio } = useCondominio();
  const [vehicles, setVehicles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState(DEFAULT_FORM);

  const selectedResident = useMemo(
    () => residentes.find((item) => String(item.id) === String(form.residentId)),
    [residentes, form.residentId]
  );

  const loadVehicles = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setVehicles([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.listVehicles(condominio.id);
        setVehicles(response.data || []);
        setError("");
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los vehículos.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const syncVehicleWorkspace = async () => {
    await Promise.all([loadVehicles(), refreshCondominio()]);
  };

  const approvedVehicles = vehicles.filter((item) => item.estado === "activo").length;
  const pendingVehicles = vehicles.filter((item) => item.estado === "pendiente").length;
  const restrictedVehicles = vehicles.filter((item) => item.estado === "restringido" || item.estado === "suspendido").length;
  const availableSpaces = condominio.parking_spaces_available ?? Math.max((condominio.parking_spaces_total ?? 0) - approvedVehicles, 0);

  const summary = {
    total: vehicles.length,
    approved: approvedVehicles,
    pending: pendingVehicles,
    restricted: restrictedVehicles,
    availableSpaces,
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");
    if (!form.residentId || !form.placa.trim() || !form.marca.trim()) {
      setError("Residente, placa y marca son requeridos.");
      return;
    }

    setSaving(true);
    try {
      await adminService.createVehicle({
        condominio_id: condominio.id,
        residenteId: Number(form.residentId),
        placa: form.placa,
        marca: form.marca,
        modelo: form.modelo,
        color: form.color,
        year: form.ano ? Number(form.ano) : undefined,
        type: form.tipo,
        status: form.estado,
        ownerName: form.ownerName,
        ownerPhone: form.ownerPhone,
        ownerDocument: form.ownerDocument,
        notes: form.notes,
      });
      setForm(DEFAULT_FORM);
      await syncVehicleWorkspace();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el vehículo.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (vehicleId, status) => {
    setSaving(true);
    setError("");
    try {
      await adminService.updateVehicle(vehicleId, { status });
      await syncVehicleWorkspace();
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el vehículo.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div className="max-w-3xl">
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Registro de vehículos</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              Administra aprobaciones de vehículos y el cupo real del estacionamiento.
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">
              Cada vehículo aprobado ocupa un espacio disponible. Cuando lo liberas, el sistema devuelve ese cupo automáticamente al inventario del condominio.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Vehículos" value={summary.total} />
            <SummaryCard label="Aprobados" value={summary.approved} />
            <SummaryCard label="Pendientes" value={summary.pending} />
            <SummaryCard label="Espacios libres" value={summary.availableSpaces} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Nuevo vehículo</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Alta y control de parqueo</h2>
          </div>

          <div className="mt-5 rounded-[22px] border border-[#262626] bg-[#141414] p-4">
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-[#B15A27]">Capacidad del condominio</p>
            <p className="mt-2 text-sm text-[#E5E5E5]">
              {condominio.parking_spaces_total ?? 0} espacios totales · {availableSpaces} disponibles · {condominio.parking_spaces_occupied ?? approvedVehicles} ocupados
            </p>
            {(condominio.parking_spaces_total ?? 0) <= 0 ? (
              <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
                Aún no has configurado espacios de estacionamiento. Puedes registrar solicitudes en pendiente y luego definir la capacidad desde{" "}
                <Link to="/dashboard/condominio" className="text-[#FF7A30] no-underline">
                  Mi condominio
                </Link>.
              </p>
            ) : null}
          </div>

          <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
            <Field label="Residente asociado">
              <select
                value={form.residentId}
                onChange={(event) => setForm((current) => ({ ...current, residentId: event.target.value }))}
                className={INPUT}
              >
                <option value="">Selecciona un residente</option>
                {residentes.map((resident) => (
                  <option key={resident.id} value={resident.id}>
                    {resident.nombre_completo}
                  </option>
                ))}
              </select>
            </Field>

            <Field label="Apartamento asociado">
              <input
                readOnly
                value={selectedResident?.apartamento_nombre || ""}
                className={`${INPUT} bg-[#1A1A1A] text-[#A3A3A3]`}
              />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Placa">
                <input value={form.placa} onChange={(event) => setForm((current) => ({ ...current, placa: event.target.value.toUpperCase() }))} className={INPUT} />
              </Field>
              <Field label="Marca">
                <input value={form.marca} onChange={(event) => setForm((current) => ({ ...current, marca: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Modelo">
                <input value={form.modelo} onChange={(event) => setForm((current) => ({ ...current, modelo: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Color">
                <input value={form.color} onChange={(event) => setForm((current) => ({ ...current, color: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Field label="Año">
                <input type="number" min="1900" value={form.ano} onChange={(event) => setForm((current) => ({ ...current, ano: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Tipo">
                <select value={form.tipo} onChange={(event) => setForm((current) => ({ ...current, tipo: event.target.value }))} className={INPUT}>
                  {TYPE_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Estado inicial">
                <select value={form.estado} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))} className={INPUT}>
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Titular del vehículo">
                <input value={form.ownerName} onChange={(event) => setForm((current) => ({ ...current, ownerName: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Teléfono del titular">
                <input value={form.ownerPhone} onChange={(event) => setForm((current) => ({ ...current, ownerPhone: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <Field label="Documento del titular">
              <input value={form.ownerDocument} onChange={(event) => setForm((current) => ({ ...current, ownerDocument: event.target.value }))} className={INPUT} />
            </Field>

            <Field label="Notas">
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={`${INPUT} min-h-[110px] resize-none`} />
            </Field>

            {error && <ErrorBanner message={error} />}

            <button
              type="submit"
              disabled={saving}
              className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60"
              style={{ background: "linear-gradient(135deg, #1A6B9A, #0E2433)" }}
            >
              {saving ? "Guardando..." : "Registrar vehículo"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Inventario vehicular</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Solicitudes y vehículos autorizados</h2>
            </div>
            <div className="rounded-full border border-[#262626] bg-[#141414] px-4 py-2 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#B15A27]">
              {summary.approved} ocupando espacio
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando vehículos...</p>
            ) : vehicles.length ? (
              vehicles.map((vehicle) => (
                <article key={vehicle.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div className="flex-1">
                      <div className="flex flex-wrap gap-2">
                        <Badge>{labelForType(vehicle.tipo)}</Badge>
                        <Badge variant={badgeVariant(vehicle.estado)}>{labelForStatus(vehicle.estado)}</Badge>
                        <Badge variant="soft">{vehicle.apartamento_nombre || "Sin unidad"}</Badge>
                        {vehicle.parkingSpaceAssigned ? <Badge variant="space">Ocupa espacio</Badge> : null}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{vehicle.placa}</h3>
                      <p className="mt-1 text-sm text-[#A3A3A3]">
                        {vehicle.marca} {vehicle.modelo ? `· ${vehicle.modelo}` : ""} {vehicle.color ? `· ${vehicle.color}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#5D554E]">
                        {vehicle.residente_nombre} · {vehicle.propietario_nombre || "Titular no especificado"}
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <ActionChip onClick={() => updateStatus(vehicle.id, "activo")}>Aprobar</ActionChip>
                      <ActionChip onClick={() => updateStatus(vehicle.id, "restringido")}>Restringir</ActionChip>
                      <ActionChip onClick={() => updateStatus(vehicle.id, "inactivo")}>Liberar</ActionChip>
                      <ActionChip onClick={() => updateStatus(vehicle.id, "pendiente")}>Pendiente</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aún no hay vehículos" description="Registra el primer vehículo para conectarlo con control de acceso, aprobación y disponibilidad de parqueos." />
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
        <p className="text-sm text-[#737373] mt-2">El registro vehicular depende del condominio, sus residentes y la estructura base de acceso.</p>
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
  const className =
    variant === "soft"
      ? "bg-[#262626] text-[#6F655B]"
      : variant === "warning"
        ? "bg-[#3B2714] text-[#FFB067]"
        : variant === "danger"
          ? "bg-[#2C1616] text-[#FF8A8A]"
          : variant === "space"
            ? "bg-[#0E2433] text-[#72C4F0]"
            : "bg-[#EEF6FF] text-[#1A6B9A]";
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${className}`}>{children}</span>;
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

function labelForStatus(status) {
  if (status === "activo") return "Aprobado";
  if (status === "pendiente") return "Pendiente";
  if (status === "restringido" || status === "suspendido") return "Restringido";
  if (status === "inactivo") return "Liberado";
  return status || "Sin estado";
}

function labelForType(type) {
  if (type === "auto") return "Auto";
  if (type === "moto") return "Moto";
  if (type === "bicicleta") return "Bicicleta";
  if (type === "otro") return "Otro";
  return type || "Vehículo";
}

function badgeVariant(status) {
  if (status === "activo") return "space";
  if (status === "pendiente") return "warning";
  if (status === "restringido" || status === "suspendido") return "danger";
  return "soft";
}
