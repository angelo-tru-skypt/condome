import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import { DASHBOARD_FOCUS, OWNER_MODULES, OWNER_WORKSPACES } from "../data/ownerModules";
import { getCountryLabel } from "../data/countries";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT_PANEL = "rounded-[20px] border border-[var(--border-subtle)] bg-[var(--canvas)]";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-bold text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.45rem] leading-tight font-bold text-[var(--fg-primary)] tracking-tight";
const INK_CARD = "rounded-[24px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-7 shadow-xl";

export default function DashboardHome() {
  const { user } = useAuth();
  const { condominio, edificios, apartamentos, loading, hasCondominio } = useCondominio();

  const disponibles = apartamentos.filter((item) => item.estado === "disponible").length;
  const ocupados = Math.max(apartamentos.length - disponibles, 0);
  const role = normalizeRole(user?.role || user?.rol);

  if (loading && !hasCondominio) {
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-4">
        <div
          className="w-12 h-12 rounded-full border-2 border-[var(--border-standard)] border-t-[var(--condome-orange)]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm font-bold uppercase tracking-widest text-[var(--fg-tertiary)]">Iniciando Workspace...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  }

  const heroStats = [
    {
      label: "Edificios configurados",
      value: edificios.length,
      helper: "Base estructural del condominio",
      color: "#D94F10",
    },
    {
      label: "Unidades registradas",
      value: apartamentos.length,
      helper: "Inventario operativo del propietario",
      color: "#1A6B9A",
    },
    {
      label: "Unidades disponibles",
      value: disponibles,
      helper: "Espacios listos para asignacion",
      color: "#2E7D52",
    },
    {
      label: "Unidades ocupadas",
      value: ocupados,
      helper: "Ocupacion actual del proyecto",
      color: "#B5590A",
    },
  ];

  const startupPlan = [
    {
      title: "Registrar el condominio",
      description: "Completa la ficha base y define la identidad del proyecto.",
      to: "/condominio",
      ready: hasCondominio,
    },
    {
      title: "Preparar edificios y unidades",
      description: "Organiza torres, bloques y apartamentos para abrir la operacion.",
      to: "/edificios",
      ready: edificios.length > 0 || apartamentos.length > 0,
    },
    {
      title: "Construir la comunidad",
      description: "Incorpora propietarios, residentes y sus permisos de acceso.",
      to: "/propietarios",
      ready: false,
    },
    {
      title: "Activar finanzas y soporte",
      description: "Pon en marcha cuotas, avisos, reclamos y control operativo.",
      to: "/cuotas",
      ready: false,
    },
  ];

  return (
    <div className="space-y-6">
      <section
        className="rounded-[34px] overflow-hidden border border-[#E9D5C6]"
        style={{
          background:
            "linear-gradient(145deg, #1A1612 0%, #2A221D 45%, #56311E 100%)",
          boxShadow: "0 20px 60px rgba(26,22,18,0.14)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-9">
          <div
            className="absolute inset-y-0 right-0 w-[45%] opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 70% 35%, rgba(255,122,48,0.95) 0, rgba(255,122,48,0) 60%)",
            }}
          />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-bold tracking-[0.24em] uppercase text-white/50">
                  Centro del propietario
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--condome-orange)]/10 text-[var(--condome-orange-soft)] text-[10px] font-black uppercase tracking-[0.1em] border border-[var(--condome-orange)]/20">
                  Panel Activo
                </span>
              </div>

              <h1
                className="mt-4 text-3xl md:text-4xl font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Gestiona tu condominio con una vista clara de comunidad, finanzas y operacion.
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-white/72">
                Este dashboard esta reorganizado para que el propietario avance por flujos reales:
                estructura, comunidad, cobranzas, soporte y control del condominio.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={hasCondominio ? "/condominio" : "/condominio/nuevo"}
                  className="px-8 py-4 rounded-full no-underline text-xs font-black uppercase tracking-widest text-white shadow-xl transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
                >
                  {hasCondominio ? "Mi Condominio" : "Registrar ahora"}
                </Link>
                <Link
                  to="/cuotas"
                  className="px-8 py-4 rounded-full no-underline text-xs font-black uppercase tracking-widest text-white border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
                >
                  Finanzas
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-[#E9D5C6]/30 bg-white/10 backdrop-blur-sm p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-[#F5D2BC]">
                Estado actual
              </p>
              <div className="mt-4 space-y-3">
                <StatusTile
                  label="Condominio"
                  value={condominio?.nombre || "Pendiente de registro"}
                  helper={condominio?.ciudad || "Completa la ficha principal para activar el resto del flujo"}
                />
                <StatusTile
                  label="Tipo de operacion"
                  value={formatType(condominio?.tipo)}
                  helper="Base de configuracion para los modulos del propietario"
                />
                <StatusTile
                  label="Proximo foco"
                  value={hasCondominio ? "Estructura y comunidad" : "Puesta en marcha"}
                  helper="Siguiente bloque recomendado para avanzar sin retrabajo"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
        {heroStats.map((stat) => (
          <article
            key={stat.label}
            className={`${SURFACE} p-6`}
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm"
              style={{ background: `${stat.color}15`, color: stat.color }}
            >
              <MetricIcon />
            </div>
            <p className="mt-5 text-4xl font-black text-[var(--fg-primary)] tracking-tight">{stat.value}</p>
            <p className="mt-1 text-[10px] font-black uppercase tracking-widest text-[var(--fg-tertiary)]">{stat.label}</p>
            <p className="mt-3 text-xs leading-relaxed text-[var(--fg-secondary)] font-medium">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
                RF del propietario
              </p>
              <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">
                Interfaces agrupadas por espacios de trabajo
              </h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[#FAF9F7] text-[#404040] text-xs font-bold border border-[#E8DDD3]">
              Cobertura visual de los modulos clave
            </span>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {OWNER_WORKSPACES.map((workspace) => (
              <article
                key={workspace.title}
                className="rounded-[24px] border border-[#E8DDD3] bg-[#FAF9F7] p-5 shadow-sm"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#E5E5E5]">{workspace.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#A3A3A3]">
                      {workspace.description}
                    </p>
                  </div>
                  <span
                    className="w-3 h-12 rounded-full"
                    style={{ backgroundColor: workspace.color }}
                  />
                </div>

                <div className="mt-4 flex flex-wrap gap-2">
                  {workspace.routes.map((route) => (
                    <Link
                      key={route}
                      to={`/${route}`}
                      className="px-3 py-2 rounded-full bg-[#FFFFFF] border border-[#D94F10]/20 no-underline text-xs font-semibold text-[#D94F10] hover:bg-[#D94F10] hover:text-[#FFFFFF] transition-all"
                    >
                      {OWNER_MODULES[route]?.title || route}
                    </Link>
                  ))}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${SURFACE} p-6`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
            Ruta sugerida
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">
            Orden recomendado para construir el condominio
          </h2>
          <div className="mt-5 space-y-4">
            {startupPlan.map((step, index) => (
              <Link
                key={step.title}
                to={step.to}
                className="block rounded-[22px] border border-[#E8DDD3] bg-white p-4 no-underline hover:border-[#D94F10] hover:shadow-md transition-all"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-bold ${
                      step.ready ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-600" : "bg-[#F2ECE6] text-[#B15A27]"
                    }`}
                  >
                    {step.ready ? "OK" : String(index + 1).padStart(2, "0")}
                  </div>
                  <div>
                    <p className="text-sm font-bold text-[#1A1A1A]">{step.title}</p>
                    <p className="mt-1 text-xs leading-6 text-[#404040]">
                      {step.description}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.35fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
            Prioridades del dashboard
          </p>
          <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">
            Bloques de trabajo para avanzar sin perder el orden
          </h2>

          <div className="mt-6 grid gap-5">
            {DASHBOARD_FOCUS.map((group) => (
              <article
                key={group.title}
                className={`${SURFACE} p-7`}
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-1.5 h-6 bg-[var(--condome-orange)] rounded-full" />
                  <h3 className="text-xl font-bold text-[var(--fg-primary)]">{group.title}</h3>
                </div>
                <p className="text-sm leading-relaxed text-[var(--fg-secondary)] mb-6 font-medium">{group.description}</p>
                <div className="grid gap-4 md:grid-cols-2">
                  {group.routes.map((route) => {
                    const module = OWNER_MODULES[route];
                    return (
                      <Link
                        key={route}
                        to={route === "condominioNuevo" ? "/condominio/nuevo" : `/${route}`}
                        className={`${SOFT_PANEL} p-5 no-underline hover:border-[var(--condome-orange)]/40 hover:shadow-md transition-all group`}
                      >
                        <p className="text-sm font-bold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors">{module.title}</p>
                        <p className="mt-2 text-xs leading-relaxed text-[var(--fg-tertiary)]">
                          {module.description}
                        </p>
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <div className={`${SURFACE} p-6`}>
            <p className="text-[11px] uppercase tracking-[0.22em] font-bold text-[#D94F10]">
              Condominio
            </p>
            <h2 className="mt-2 text-xl font-bold text-[#1A1A1A]">
              Resumen rapido del proyecto
            </h2>
            <div className="mt-4 space-y-3">
              <SummaryRow label="Nombre" value={condominio?.nombre || "Aun sin registrar"} />
              <SummaryRow label="Tipo" value={formatType(condominio?.tipo)} />
              <SummaryRow label="Ciudad" value={condominio?.ciudad || "Sin definir"} />
              <SummaryRow label="Pais" value={getCountryLabel(condominio?.pais) || "Sin definir"} />
            </div>
          </div>

          <div className={`${INK_CARD} p-8`}>
            <p className="text-[10px] uppercase tracking-[0.22em] font-black text-[var(--condome-orange-soft)]">
              Estatus de Vision
            </p>
            <h2 className="mt-3 text-2xl font-bold text-white tracking-tight">
              Core Administrativo
            </h2>
            <ul className="mt-6 space-y-4">
              {[
                "Panel de entrada de alto impacto.",
                "Rutas optimizadas por arquitectura de roles.",
                "Sistemas de diseño por tokens (Cream & Ink).",
                "Navegacion fluida sin friccion de rutas.",
              ].map((item) => (
                <li key={item} className="flex gap-4">
                  <span className="mt-1.5 w-2 h-2 rounded-full bg-[var(--condome-orange)] flex-shrink-0" />
                  <span className="text-xs leading-relaxed text-white/60 font-medium">{item}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </div>
  );
}

function StatusTile({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.2em] font-bold text-white/70">{label}</p>
      <p className="mt-1 text-sm font-bold text-white">{value}</p>
      <p className="mt-1 text-xs leading-6 text-white/50">{helper}</p>
    </div>
  );
}

function SummaryRow({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-4 rounded-2xl bg-[#FAF9F7] border border-[#E8DDD3]/60 px-4 py-3">
      <span className="text-sm font-bold text-[#D94F10]">{label}</span>
      <span className="text-sm font-bold text-[#1A1A1A] text-right">{value}</span>
    </div>
  );
}

function MetricIcon() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5">
      <path d="M5 19V9" />
      <path d="M12 19V5" />
      <path d="M19 19v-7" />
    </svg>
  );
}

function normalizeRole(role) {
  const safeRole = (role || "").toLowerCase();
  if (safeRole === "owner" || safeRole === "admin") return "Owner";
  if (safeRole === "propietario") return "Propietario";
  if (safeRole === "encargado") return "Encargado";
  if (safeRole === "residente") return "Residente";
  return "Propietario";
}

function formatType(type) {
  if (type === "comercial") return "Comercial";
  if (type === "mixto") return "Mixto";
  if (type === "residencial") return "Residencial";
  return "Pendiente";
}
