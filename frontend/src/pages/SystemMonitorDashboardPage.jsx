import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import condominioService from "../utils/condominioService";
import residentPortalService from "../utils/residentPortalService";

const CARD = "bg-[#141414] border text-left border-[#262626] rounded-[24px] shadow-sm";

export default function SystemMonitorDashboardPage() {
  const { user } = useAuth();
  const { condominios, loading: ctxLoading } = useCondominio();
  const [globalStats, setGlobalStats] = useState(null);
  const [condoDetails, setCondoDetails] = useState([]);
  const [recentAudit, setRecentAudit] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const loadGlobal = async () => {
      try {
        const [summaryRes, auditRes] = await Promise.all([
          adminService.getDashboardSummary().catch(() => ({ data: null })),
          adminService.listAuditEntries().catch(() => ({ data: [] })),
        ]);

        setGlobalStats(summaryRes.data);
        setRecentAudit((auditRes.data || []).slice(0, 8));

        // Load per-condo summaries
        if (condominios.length) {
          const details = await Promise.all(
            condominios.map(async (condo) => {
              const [dash, buildings, apartments, residents] = await Promise.all([
                adminService.getDashboardSummary(condo.id).catch(() => ({ data: null })),
                condominioService.getEdificios(condo.id).catch(() => ({ data: [] })),
                condominioService.getApartamentos(condo.id).catch(() => ({ data: [] })),
                condominioService.getResidentes(condo.id).catch(() => ({ data: [] })),
              ]);
              return {
                ...condo,
                summary: dash.data,
                edificios: buildings.data?.length || 0,
                apartamentos: apartments.data?.length || 0,
                residentes: residents.data?.length || 0,
              };
            })
          );
          setCondoDetails(details);
        }
      } catch (err) {
        console.error("[SystemMonitor] Error loading data", err);
      } finally {
        setReady(true);
      }
    };

    if (!ctxLoading) loadGlobal();
  }, [condominios, ctxLoading]);

  if (ctxLoading || !ready) {
    return <MonitorLoader />;
  }

  const firstName = user?.name?.split(" ")[0] || "Administrador";
  const totals = globalStats?.totals || {};
  const queues = globalStats?.queues || {};

  const systemMetrics = [
    { label: "Condominios", value: totals.condominios ?? condominios.length, icon: "🏢", accent: "#FF7A30" },
    { label: "Edificios", value: totals.edificios ?? 0, icon: "🏗️", accent: "#D94F10" },
    { label: "Apartamentos", value: totals.apartamentos ?? 0, icon: "🚪", accent: "#F5D2BC" },
    { label: "Propietarios", value: totals.propietarios ?? 0, icon: "🔑", accent: "#B15A27" },
    { label: "Residentes", value: totals.residentes ?? 0, icon: "👥", accent: "#FF7A30" },
    { label: "Alertas activas", value: queues.notificaciones_no_leidas ?? 0, icon: "🔔", accent: "#D94F10" },
  ];

  return (
    <div className="space-y-6 min-h-screen">
      {/* ── Hero Banner ── */}
      <section
        className="rounded-[34px] overflow-hidden border border-[#262626] relative"
        style={{
          background: "linear-gradient(145deg, #0A0A0A 0%, #141414 42%, #1A1A1A 100%)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.4)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-10">
          {/* Ambient glow */}
          <div
            className="absolute inset-0 opacity-20 pointer-events-none"
            style={{
              background: "radial-gradient(ellipse at 80% 20%, rgba(217,79,16,0.5) 0%, transparent 60%), radial-gradient(ellipse at 20% 80%, rgba(255,122,48,0.3) 0%, transparent 60%)",
            }}
          />
          {/* Grid pattern overlay */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none"
            style={{
              backgroundImage: "linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)",
              backgroundSize: "40px 40px",
            }}
          />

          <div className="relative z-10">
            <div className="flex flex-wrap items-center gap-2 mb-4">
              <span className="px-3 py-1 rounded-full bg-[#D94F10]/10 border border-[#D94F10]/30 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#FF7A30]">
                Monitoreo Global
              </span>
              <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-[11px] font-semibold text-emerald-400">
                ● En línea
              </span>
              <span className="px-3 py-1 rounded-full bg-[#1A1A1A] border border-[#333333] text-[11px] font-medium text-[#A3A3A3]">
                {new Date().toLocaleDateString("es-DO", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-bold text-[#E5E5E5]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Centro de Control
            </h1>
            <p className="mt-3 text-[15px] leading-7 text-[#A3A3A3] max-w-3xl">
              Bienvenido, {firstName}. Vista consolidada de todos los condominios, movimientos y alertas del ecosistema Condome.
            </p>
          </div>
        </div>
      </section>

      {/* ── System Metrics ── */}
      <section className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3">
        {systemMetrics.map((metric) => (
          <div
            key={metric.label}
            className={`${CARD} p-5 text-center transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-[#D94F10]/40 group`}
          >
            <div className="w-12 h-12 mx-auto rounded-xl flex items-center justify-center transition-transform group-hover:scale-110" style={{ background: metric.accent + "1A" }}>
              <span className="text-2xl">{metric.icon}</span>
            </div>
            <p className="mt-4 text-3xl font-bold text-[#E5E5E5] tracking-tight">{metric.value}</p>
            <p className="mt-1.5 text-[11px] uppercase tracking-[0.18em] font-semibold text-[#A3A3A3] group-hover:text-[#D94F10] transition-colors">
              {metric.label}
            </p>
          </div>
        ))}
      </section>

      {/* ── Condominios Overview ── */}
      <section className={`${CARD} p-6 md:p-7`}>
        <div className="flex items-center justify-between gap-4 flex-wrap mb-6">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#D94F10]">
              Multi-Condominio
            </p>
            <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">
              Estado de cada condominio
            </h2>
          </div>
          <span className="px-3 py-1.5 rounded-full bg-[#1A1A1A] border border-[#333333] text-xs font-semibold text-[#D94F10]">
            {condoDetails.length} condominios registrados
          </span>
        </div>

        {condoDetails.length ? (
          <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {condoDetails.map((condo) => {
              const s = condo.summary?.totals || {};
              const q = condo.summary?.queues || {};
              return (
                <div
                  key={condo.id}
                  className="rounded-[20px] border border-[#262626] bg-[#1A1A1A] p-5 hover:border-[#D94F10]/50 hover:shadow-md transition-all duration-300"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="text-base font-bold text-[#E5E5E5]">{condo.nombre}</h3>
                      <p className="text-xs text-[#A3A3A3] mt-1">{condo.direccion || "Sin dirección"}</p>
                    </div>
                    <span className="px-2 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 uppercase tracking-widest">
                      Activo
                    </span>
                  </div>

                  <div className="mt-4 grid grid-cols-3 gap-2">
                    <CondoStat label="Edificios" value={condo.edificios} />
                    <CondoStat label="Aptos" value={condo.apartamentos} />
                    <CondoStat label="Residentes" value={condo.residentes} />
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {q.visitas_pendientes > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-amber-500/10 border border-amber-500/20 text-[10px] font-semibold text-amber-400">
                        {q.visitas_pendientes} visitas pend.
                      </span>
                    )}
                    {q.incidencias_abiertas > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-red-500/10 border border-red-500/20 text-[10px] font-semibold text-red-400">
                        {q.incidencias_abiertas} incidencias
                      </span>
                    )}
                    {q.notificaciones_no_leidas > 0 && (
                      <span className="px-2.5 py-1 rounded-md bg-[#D94F10]/10 border border-[#D94F10]/20 text-[10px] font-semibold text-[#FF7A30]">
                        {q.notificaciones_no_leidas} alertas
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <EmptyState
            title="Sin condominios registrados"
            description="Los propietarios que se registren en la plataforma crearán sus condominios y aparecerán aquí."
          />
        )}
      </section>

      {/* ── Activity & Audit ── */}
      <section className="grid gap-6 xl:grid-cols-2">
        {/* Audit */}
        <div className={`${CARD} p-6 md:p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">
            Auditoría global
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Actividad reciente del sistema</h2>
          <div className="mt-5 space-y-3">
            {recentAudit.length ? (
              recentAudit.map((item) => (
                <article key={item.id} className="rounded-[18px] border border-[#262626] bg-[#1A1A1A] p-4 transition-all hover:bg-[#202020] hover:border-[#D94F10]/40">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="px-2 py-0.5 rounded-md bg-[#D94F10]/10 border border-[#D94F10]/30 text-[10px] font-bold text-[#FF7A30] uppercase tracking-wider">
                      {item.category || "sistema"}
                    </span>
                    <span className="text-[10px] text-[#A3A3A3] font-medium">
                      {formatDate(item.createdAt)}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-[#E5E5E5]">{item.title}</h3>
                  <p className="mt-1.5 text-xs text-[#A3A3A3] line-clamp-2 leading-relaxed">{item.detail}</p>
                  <p className="mt-2.5 text-[10px] text-[#A3A3A3] font-medium uppercase tracking-wide border-t border-[#262626] pt-2">{item.actor}</p>
                </article>
              ))
            ) : (
              <EmptyState
                title="Sin registros de auditoría"
                description="La actividad del sistema aparecerá aquí a medida que los condominios operen."
              />
            )}
          </div>
        </div>

        {/* Quick Links */}
        <div className={`${CARD} p-6 md:p-7`}>
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#A3A3A3]">
            Acciones rápidas
          </p>
          <h2 className="mt-2 text-xl font-semibold text-[#E5E5E5]">Panel de control del sistema</h2>
          <div className="mt-6 grid gap-3 md:grid-cols-2">
            <QuickLink
              to="/condominio"
              title="Condominios"
              description="Ver y gestionar todos los condominios del sistema."
              accent="#D94F10"
            />
            <QuickLink
              to="/roles"
              title="Perfiles"
              description="Configurar el control de acceso."
              accent="#FF7A30"
            />
            <QuickLink
              to="/auditoria"
              title="Auditoría completa"
              description="Bitácora detallada de acciones del sistema."
              accent="#F5D2BC"
            />
            <QuickLink
              to="/reportes"
              title="Reportes globales"
              description="Analítica y exportaciones consolidadas."
              accent="#B15A27"
            />
            <QuickLink
              to="/configuracion"
              title="Configuración"
              description="Parámetros generales del sistema."
              accent="#D94F10"
            />
            <QuickLink
              to="/notificaciones"
              title="Notificaciones"
              description="Alertas y seguimiento administrativo."
              accent="#FF7A30"
            />
          </div>
        </div>
      </section>
    </div>
  );
}

function CondoStat({ label, value }) {
  return (
    <div className="text-center rounded-xl bg-[#202020] border border-[#333333] py-2.5 shadow-sm">
      <p className="text-lg font-bold text-[#E5E5E5]">{value}</p>
      <p className="text-[9px] uppercase tracking-[0.15em] font-bold text-[#A3A3A3] mt-0.5">{label}</p>
    </div>
  );
}

function QuickLink({ to, title, description, accent }) {
  return (
    <Link
      to={to}
      className="rounded-[18px] border border-[#262626] bg-[#1A1A1A] p-4 no-underline hover:border-[#D94F10]/50 hover:bg-[#202020] hover:-translate-y-0.5 hover:shadow-md transition-all duration-300 group"
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ backgroundColor: accent }} />
        <p className="text-[13px] font-bold text-[#E5E5E5] group-hover:text-[#FF7A30] transition-colors">{title}</p>
      </div>
      <p className="text-[11px] text-[#A3A3A3] leading-relaxed">{description}</p>
    </Link>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[20px] border border-dashed border-[#404040] bg-[#141414] p-8 text-center max-w-sm mx-auto">
      <div className="w-12 h-12 mx-auto rounded-full bg-[#1A1A1A] border border-[#333333] flex items-center justify-center mb-4 shadow-sm">
        <span className="text-[#A3A3A3] text-xl">ℹ️</span>
      </div>
      <h3 className="text-[15px] font-bold text-[#E5E5E5]">{title}</h3>
      <p className="mt-2 text-xs leading-6 text-[#A3A3A3]">{description}</p>
    </div>
  );
}

function MonitorLoader() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="flex flex-col items-center gap-3">
        <div
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#D94F10]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#A3A3A3]">Cargando panel...</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
