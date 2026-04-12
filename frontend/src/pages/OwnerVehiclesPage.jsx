import { useEffect, useMemo, useState } from "react";
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
  estado: "activo",
  ownerName: "",
  ownerPhone: "",
  ownerDocument: "",
  notes: "",
};

export default function OwnerVehiclesPage() {
  const { condominio, residentes } = useCondominio();
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

  const summary = {
    total: vehicles.length,
    active: vehicles.filter((item) => item.estado === "activo").length,
    restricted: vehicles.filter((item) => item.estado === "restringido").length,
    motorcycles: vehicles.filter((item) => item.tipo === "moto").length,
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
      await loadVehicles();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el vehículo.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async (vehicleId, status) => {
    try {
      const response = await adminService.updateVehicle(vehicleId, { status });
      setVehicles((current) => current.map((item) => (item.id === vehicleId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el vehículo.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Registro de vehículos</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Controla placas autorizadas y su vínculo con cada residente.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Este panel conecta el inventario vehicular con el control de acceso para que portería y administración trabajen sobre el mismo dato.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Vehículos" value={summary.total} />
            <SummaryCard label="Activos" value={summary.active} />
            <SummaryCard label="Restringidos" value={summary.restricted} />
            <SummaryCard label="Motos" value={summary.motorcycles} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.15fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Nuevo vehículo</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Alta de acceso vehicular</h2>
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
                <input value={form.placa} onChange={(event) => setForm((current) => ({ ...current, placa: event.target.value }))} className={INPUT} />
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
                  <option value="auto">Auto</option>
                  <option value="moto">Moto</option>
                  <option value="camioneta">Camioneta</option>
                  <option value="otro">Otro</option>
                </select>
              </Field>
              <Field label="Estado">
                <select value={form.estado} onChange={(event) => setForm((current) => ({ ...current, estado: event.target.value }))} className={INPUT}>
                  <option value="activo">Activo</option>
                  <option value="restringido">Restringido</option>
                  <option value="inactivo">Inactivo</option>
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
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Vehículos autorizados</h2>
            </div>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando vehículos...</p>
            ) : vehicles.length ? (
              vehicles.map((vehicle) => (
                <article key={vehicle.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{vehicle.tipo}</Badge>
                        <Badge variant="soft">{vehicle.estado}</Badge>
                        <Badge variant="soft">{vehicle.apartamento_nombre || "Sin unidad"}</Badge>
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{vehicle.placa}</h3>
                      <p className="mt-1 text-sm text-[#A3A3A3]">
                        {vehicle.marca} {vehicle.modelo ? `· ${vehicle.modelo}` : ""} {vehicle.color ? `· ${vehicle.color}` : ""}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-[#5D554E]">
                        {vehicle.residente_nombre} · {vehicle.propietario_nombre || "Titular no especificado"}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <ActionChip onClick={() => updateStatus(vehicle.id, "activo")}>Activar</ActionChip>
                      <ActionChip onClick={() => updateStatus(vehicle.id, "restringido")}>Restringir</ActionChip>
                      <ActionChip onClick={() => updateStatus(vehicle.id, "inactivo")}>Inactivar</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aún no hay vehículos" description="Registra el primer vehículo para conectarlo con control de acceso y trazabilidad." />
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
