import { useEffect, useMemo, useState } from "react";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";
const INPUT =
  "w-full px-4 py-3 bg-[#1A1A1A] border border-[#262626] rounded-xl text-[#E5E5E5] text-sm outline-none transition-all focus:border-[#D94F10] focus:bg-[#1A1A1A] focus:ring-4 focus:ring-[#D94F10]/10";

export default function OwnersManagementPage() {
  const { condominio, apartamentos } = useCondominio();
  const [owners, setOwners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [credentials, setCredentials] = useState(null);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    apartmentId: "",
    status: "active",
    portalAccess: true,
    notes: "",
  });

  const selectedApartment = useMemo(
    () => apartamentos.find((item) => String(item.id) === String(form.apartmentId)),
    [apartamentos, form.apartmentId]
  );

  const loadOwners = useMemo(
    () => async () => {
      if (!condominio?.id) {
        setOwners([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const response = await adminService.listOwners(condominio.id);
        setOwners(response.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudieron cargar los propietarios.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id]
  );

  useEffect(() => {
    loadOwners();
  }, [loadOwners]);

  if (!condominio?.id) {
    return <MissingCondominioState />;
  }

  const summary = {
    total: owners.length,
    active: owners.filter((item) => item.status === "active").length,
    inactive: owners.filter((item) => item.status === "inactive").length,
    withPortal: owners.filter((item) => item.portalAccess).length,
  };

  const saveOwner = async (event) => {
    event.preventDefault();
    setError("");
    setCredentials(null);
    if (!form.name.trim() || !form.apartmentId) {
      setError("El nombre del propietario y la unidad son requeridos.");
      return;
    }
    setSaving(true);
    try {
      const response = await adminService.createOwner({
        condominio_id: condominio.id,
        name: form.name,
        email: form.email,
        phone: form.phone,
        apartmentId: Number(form.apartmentId),
        status: form.status,
        portalAccess: form.portalAccess,
        notes: form.notes,
      });
      setCredentials(response.credenciales || null);
      setForm({
        name: "",
        email: "",
        phone: "",
        apartmentId: "",
        status: "active",
        portalAccess: true,
        notes: "",
      });
      await loadOwners();
    } catch (saveError) {
      setError(saveError.message || "No se pudo registrar el propietario.");
    } finally {
      setSaving(false);
    }
  };

  const toggleStatus = async (ownerId, status) => {
    try {
      const response = await adminService.updateOwner(ownerId, { status });
      setOwners((current) => current.map((item) => (item.id === ownerId ? response.data : item)));
    } catch (updateError) {
      setError(updateError.message || "No se pudo actualizar el propietario.");
    }
  };

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">Gestión de propietarios</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">Administra responsables de unidades y su nivel de acceso.</h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Este panel ayuda al administrador a registrar titulares, asignar unidades reales y verificar si ya tienen acceso operativo al sistema.
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <SummaryCard label="Propietarios" value={summary.total} />
            <SummaryCard label="Activos" value={summary.active} />
            <SummaryCard label="Inactivos" value={summary.inactive} />
            <SummaryCard label="Con portal" value={summary.withPortal} />
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1fr_1.2fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Nuevo propietario</p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Alta administrativa</h2>
          </div>

          <form className="mt-6 space-y-4" onSubmit={saveOwner}>
            <Field label="Nombre completo">
              <input value={form.name} onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))} className={INPUT} />
            </Field>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Correo">
                <input type="email" value={form.email} onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))} className={INPUT} />
              </Field>
              <Field label="Teléfono">
                <input value={form.phone} onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))} className={INPUT} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Apartamento">
                <select value={form.apartmentId} onChange={(event) => setForm((current) => ({ ...current, apartmentId: event.target.value }))} className={INPUT}>
                  <option value="">Selecciona una unidad</option>
                  {apartamentos.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.nombre} · {item.edificio_nombre}
                    </option>
                  ))}
                </select>
              </Field>
              <Field label="Edificio">
                <input readOnly value={selectedApartment?.edificio_nombre || ""} className={`${INPUT} bg-[#1A1A1A] text-[#A3A3A3]`} />
              </Field>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm((current) => ({ ...current, status: event.target.value }))} className={INPUT}>
                  <option value="active">Activo</option>
                  <option value="inactive">Inactivo</option>
                  <option value="pending">Pendiente</option>
                </select>
              </Field>

              <label className="flex items-center gap-3 rounded-xl border border-[#262626] px-4 py-3 mt-[22px]">
                <input type="checkbox" checked={form.portalAccess} onChange={(event) => setForm((current) => ({ ...current, portalAccess: event.target.checked }))} />
                <span className="text-sm text-[#E5E5E5]">Habilitar acceso al portal</span>
              </label>
            </div>

            <Field label="Notas administrativas">
              <textarea value={form.notes} onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))} className={`${INPUT} min-h-[120px] resize-none`} />
            </Field>

            {credentials && (
              <div className="rounded-xl border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-400">
                <p className="font-semibold">Acceso temporal generado</p>
                <p className="mt-1">Login: {credentials.login}</p>
                <p>Contraseña temporal: {credentials.password_temporal}</p>
              </div>
            )}

            {error && <ErrorBanner message={error} />}

            <button type="submit" disabled={saving} className="px-5 py-3 rounded-xl text-white text-sm font-semibold border-none disabled:opacity-60" style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
              {saving ? "Guardando..." : "Registrar propietario"}
            </button>
          </form>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">Titulares y responsables</p>
              <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Vista administrativa</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#1A1A1A] text-[#A3A3A3] text-xs font-semibold">Asignación por unidad</span>
          </div>

          <div className="mt-6 space-y-4">
            {loading ? (
              <p className="text-sm text-[#A3A3A3]">Cargando propietarios...</p>
            ) : owners.length ? (
              owners.map((owner) => (
                <article key={owner.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                  <div className="flex items-start justify-between gap-4 flex-wrap">
                    <div>
                      <div className="flex flex-wrap gap-2">
                        <Badge>{owner.status}</Badge>
                        <Badge variant="soft">{owner.apartmentName || "Sin unidad"}</Badge>
                        {owner.portalAccess && <Badge variant="soft">portal activo</Badge>}
                      </div>
                      <h3 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{owner.name}</h3>
                      <p className="mt-1 text-sm text-[#A3A3A3]">{owner.email || "Sin correo"} · {owner.phone || "Sin teléfono"}</p>
                      <p className="mt-2 text-sm leading-6 text-[#5D554E]">{owner.buildingName || "Edificio sin definir"} · {owner.notes || "Sin observaciones"}</p>
                    </div>

                    <div className="flex gap-2">
                      <ActionChip onClick={() => toggleStatus(owner.id, "active")}>Activar</ActionChip>
                      <ActionChip onClick={() => toggleStatus(owner.id, "inactive")}>Inactivar</ActionChip>
                    </div>
                  </div>
                </article>
              ))
            ) : (
              <EmptyState title="Aún no hay propietarios" description="Registra el primer titular para empezar a vincular acceso y unidades." />
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
        <p className="text-sm text-[#737373] mt-2">La gestión de propietarios depende de la estructura del condominio y sus unidades registradas.</p>
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
  const classes = variant === "soft"
    ? "bg-[#262626] text-[#A3A3A3]"
    : "bg-orange-500/10 border border-orange-500/20 text-orange-500";
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${classes}`}>{children}</span>;
}

function ActionChip({ children, onClick }) {
  return <button type="button" onClick={onClick} className="px-3 py-2 rounded-full bg-[#1A1A1A] border border-[#262626] text-xs font-semibold text-[#737373] hover:border-[#D94F10]/40 hover:text-[#D94F10]">{children}</button>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{message}</div>;
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </div>
  );
}
