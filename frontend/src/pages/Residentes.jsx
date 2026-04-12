import { Link } from "react-router-dom";
import { useCondominio } from "../context/CondominioContext";

// ── Estilos reutilizables (Modo Claro) ───────────────────────────────────────
const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const INK_CARD = "rounded-[24px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-7 shadow-xl";

export default function ResidentesPage() {
  const { condominio, residentes, hasCondominio } = useCondominio();

  if (!hasCondominio) {
    return (
      <div className={`${SURFACE} p-12 text-center`}>
         <div className="w-20 h-20 bg-[#FFF4EE] rounded-full flex items-center justify-center mx-auto mb-6 text-3xl shadow-sm">👥</div>
        <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="text-2xl font-bold text-[#1A1A1A]">
          Primero registra tu condominio
        </h1>
        <p className="mt-4 text-sm leading-8 text-[#404040] font-medium max-w-sm mx-auto">
          El módulo de residentes se activa cuando ya existe un condominio base registrado en la plataforma.
        </p>
        <Link
          to="/condominio"
          className="inline-flex mt-8 px-10 py-4 rounded-2xl no-underline text-white font-black uppercase tracking-widest text-xs shadow-xl"
          style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
        >
          Ir a Registro
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
              Comunidad
            </p>
            <h1 style={{ fontFamily: "'Playfair Display', serif" }} className="mt-2 text-2xl font-bold text-[#1A1A1A]">
              Residentes del condominio
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#404040] font-medium max-w-2xl">
              Los residentes se registran desde cada apartamento. Aquí ves el listado consolidado de <strong>{condominio?.nombre}</strong>.
            </p>
          </div>
          <Link
            to="/apartamentos"
            className="px-8 py-4 rounded-2xl no-underline text-white text-[11px] font-black uppercase tracking-widest shadow-lg"
            style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
          >
            Registrar desde apartamentos
          </Link>
        </div>
      </section>

      <section className={`${SURFACE} p-6 md:p-8`}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-7">
          <h2 className="text-xl font-bold text-[#1A1A1A]">Listado consolidado</h2>
          <span className="px-4 py-1.5 rounded-full bg-[#FAF9F7] border border-[#E8DDD3] text-[#D94F10] text-[11px] font-bold uppercase tracking-wider">
            {residentes.length} residentes activos
          </span>
        </div>

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {residentes.length > 0 ? (
            residentes.map((item) => (
              <article key={item.id} className={`${SURFACE} p-7 group transition-all hover:translate-y-[-4px]`}>
                <div className="flex items-start justify-between gap-3 mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-[var(--canvas)] flex items-center justify-center text-xl group-hover:bg-[var(--condome-orange)]/10 transition-colors">
                    👤
                  </div>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${item.activo ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-gray-50 text-gray-500 border border-gray-100"}`}>
                    {item.activo ? "Activo" : "Inactivo"}
                  </span>
                </div>
                
                <h3 className="text-xl font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{item.nombre_completo}</h3>
                <p className="mt-1 text-xs font-black text-[var(--condome-orange-soft)] uppercase tracking-[0.1em]">{item.apartamento_nombre}</p>

                <div className="mt-6 space-y-4">
                  <MiniData label="Edificio" value={item.edificio_nombre} />
                  <MiniData label="Correo" value={item.email || "Sin correo"} />
                  <MiniData label="Teléfono" value={item.telefono || "Sin teléfono"} />
                </div>
                
                <div className="mt-8 pt-6 border-t border-[var(--border-standard)] flex items-center justify-between">
                   <div className="flex flex-col">
                      <span className="text-[9px] font-black text-[var(--fg-muted)] uppercase tracking-widest">Acceso</span>
                      <span className="text-[12px] font-bold text-[var(--fg-secondary)]">{item.login || "Pendiente"}</span>
                   </div>
                   <button className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest text-[var(--condome-orange)] bg-[var(--condome-orange)]/5 border-none cursor-pointer hover:bg-[var(--condome-orange)]/10 transition-colors">Ficha →</button>
                </div>
              </article>
            ))
          ) : (
            <div className="md:col-span-2 xl:col-span-3 rounded-[24px] border border-dashed border-[#E8DDD3] bg-[#FAF9F7] p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-bold text-[#1A1A1A]">No hay residentes todavía</h3>
              <p className="mt-3 text-sm leading-7 text-[#404040] font-medium max-w-sm mx-auto">
                Registra el primer residente desde el módulo de apartamentos para que aparezca en este listado global.
              </p>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function MiniData({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 py-1.5 border-b border-[#E8DDD3]/30 last:border-0">
      <span className="text-[10px] font-bold tracking-wider uppercase text-[#737373]">{label}</span>
      <span className="text-xs font-bold text-[#1A1A1A] text-right truncate max-w-[60%]">{value}</span>
    </div>
  );
}
