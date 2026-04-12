import { useEffect, useState } from "react";
import adminService from "../utils/adminService";

const SURFACE = "bg-[#FFFFFF] border border-[#E8DDD3] rounded-[28px] shadow-sm";

export default function OwnerRolesPage() {
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    adminService
      .listRoles()
      .then((response) => setRoles(response.data || []))
      .catch((loadError) => setError(loadError.message || "No se pudo cargar el catalogo de roles."))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">Roles y permisos</p>
            <h1 className="mt-2 text-2xl md:text-3xl font-bold text-[#1A1A1A]">Mapa funcional de acceso del condominio.</h1>
            <p className="mt-2 text-sm leading-7 text-[#404040] max-w-3xl font-medium">
              Esta vista ayuda a validar cuantas personas hay en cada rol y que alcance operativo tiene cada uno dentro del producto.
            </p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <SummaryCard label="Roles" value={roles.length} />
            <SummaryCard label="Usuarios" value={roles.reduce((total, item) => total + (item.users || 0), 0)} />
            <SummaryCard label="Activos" value={roles.filter((item) => item.users > 0).length} />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className="grid gap-5 xl:grid-cols-3">
        {loading ? (
          <LoadingState />
        ) : roles.length ? (
          roles.map((role) => (
            <article key={role.key} className={`${SURFACE} p-6`}>
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#D94F10] font-bold">{role.key}</p>
                  <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">{role.label}</h2>
                </div>
                <span className="px-3 py-1.5 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold">
                  {role.users} usuarios
                </span>
              </div>

              <p className="mt-4 text-sm leading-7 text-[#5D554E]">{role.description}</p>

              <div className="mt-5 flex flex-wrap gap-2">
                {role.permissions?.map((permission) => (
                  <span key={permission} className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333333] text-[#A3A3A3] text-[11px] font-semibold">
                    {permission}
                  </span>
                ))}
              </div>
            </article>
          ))
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function SummaryCard({ label, value }) {
  return (
    <div className="rounded-2xl bg-[#FAF9F7] border border-[#E8DDD3] px-4 py-4 text-center min-w-[110px] shadow-sm">
      <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[#B15A27]">{label}</p>
      <p className="mt-2 text-2xl font-bold text-[#1A1A1A]">{value}</p>
    </div>
  );
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-500 text-sm">{message}</div>;
}

function LoadingState() {
  return <p className="text-sm text-[#A3A3A3]">Cargando roles del sistema...</p>;
}

function EmptyState() {
  return (
    <div className={`${SURFACE} p-8 text-center`}>
      <h3 className="text-lg font-semibold text-[#E5E5E5]">No hay roles disponibles</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">Cuando el catalogo este listo o los grupos existan, apareceran aqui.</p>
    </div>
  );
}
