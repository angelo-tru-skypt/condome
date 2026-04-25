import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT_PANEL = "rounded-[20px] border border-[var(--border-subtle)] bg-[var(--canvas)]";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-semibold text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.4rem] leading-tight font-semibold text-[var(--fg-primary)] tracking-tight";
const BODY_COPY = "text-[15px] leading-relaxed text-[var(--fg-secondary)]";

const MANAGEMENT_AREAS = [
  {
    title: "Base del condominio",
    description: "Primero define la ficha madre del condominio y deja el contexto listo para operar.",
    routes: [
      { to: "/condominio/nuevo", label: "Registro inicial", color: "#D94F10" },
      { to: "/condominio", label: "Mi condominio", color: "#A45120" },
      { to: "/configuracion", label: "Configuracion", color: "#B86A2D" },
    ],
  },
  {
    title: "Estructura y comunidad",
    description: "Luego ordena torres, unidades y personas para que el resto del sistema tenga sentido.",
    routes: [
      { to: "/edificios", label: "Edificios", color: "#B5590A" },
      { to: "/apartamentos", label: "Apartamentos", color: "#B86A2D" },
      { to: "/residentes", label: "Residentes", color: "#2E7D52" },
      { to: "/propietarios", label: "Propietarios", color: "#8F5A26" },
    ],
  },
  {
    title: "Operacion y control",
    description: "Cuando la base este lista, administra accesos, avisos, reservas, incidencias y finanzas.",
    routes: [
      { to: "/avisos", label: "Avisos", color: "#D94F10" },
      { to: "/visitas", label: "Visitas", color: "#B86A2D" },
      { to: "/reservas", label: "Reservas", color: "#2E7D52" },
      { to: "/incidencias", label: "Incidencias", color: "#A45120" },
      { to: "/cuotas", label: "Cuotas", color: "#8F5A26" },
      { to: "/pagos", label: "Pagos", color: "#0F766E" },
    ],
  },
];

export default function PropertyOwnerDashboardPage() {
  const { user } = useAuth();
  const {
    condominios,
    condominio,
    edificios,
    apartamentos,
    residentes,
    loading: condoLoading,
  } = useCondominio();
  const [summaryData, setSummaryData] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");

  const firstName = user?.name?.split(" ")[0] || "Propietario";
  const hasCondominio = Boolean(condominio?.id);
  const managementAreas = useMemo(
    () =>
      MANAGEMENT_AREAS.map((area) => ({
        ...area,
        routes: area.routes.filter((route) => (route.to === "/condominio/nuevo" ? !hasCondominio : true)),
      })),
    [hasCondominio]
  );

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setReady(false);
      setError("");

      if (!condominio?.id) {
        setSummaryData(null);
        setCommunications([]);
        setNotifications([]);
        setAuditEntries([]);
        setReady(true);
        return;
      }

      const requestErrors = [];
      const capture = async (promise, fallback = []) => {
        try {
          return await promise;
        } catch (requestError) {
          requestErrors.push(requestError);
          return { data: fallback };
        }
      };

      const [summaryResponse, communicationsResponse, notificationsResponse, auditResponse] = await Promise.all([
        capture(adminService.getDashboardSummary(condominio.id), null),
        capture(adminService.listCommunications(condominio.id), []),
        capture(adminService.listNotifications(condominio.id), []),
        capture(adminService.listAuditEntries(condominio.id), []),
      ]);

      if (cancelled) return;

      setSummaryData(summaryResponse.data || null);
      setCommunications(communicationsResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setAuditEntries(auditResponse.data || []);

      if (requestErrors.length) {
        setError("Algunos indicadores no pudieron actualizarse, pero el panel conserva la informacion principal.");
      }

      setReady(true);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, [condominio?.id]);

  const totals = summaryData?.totals || {};
  const queues = summaryData?.queues || {};
  const publishedCommunications = useMemo(
    () => communications.filter((item) => item.status === "published"),
    [communications]
  );
  const unreadNotifications = useMemo(
    () => notifications.filter((item) => !item.read),
    [notifications]
  );
  const setupSteps = [
    {
      title: "Registrar condominio",
      description: hasCondominio
        ? "La ficha principal del condominio ya existe y puede seguir refinandose."
        : "Crea la base del condominio para habilitar el resto de las interfaces.",
      complete: hasCondominio,
      to: hasCondominio ? "/condominio" : "/condominio/nuevo",
      action: hasCondominio ? "Ver ficha" : "Registrar ahora",
      color: "#D94F10",
    },
    {
      title: "Cargar estructura",
      description: edificios.length || apartamentos.length
        ? `${edificios.length} edificio(s) y ${apartamentos.length} apartamento(s) ya forman parte de la estructura.`
        : "Agrega edificios y apartamentos para organizar el condominio por unidades reales.",
      complete: Boolean(edificios.length || apartamentos.length),
      to: edificios.length ? "/apartamentos" : "/edificios",
      action: edificios.length ? "Gestionar unidades" : "Crear estructura",
      color: "#B86A2D",
    },
    {
      title: "Activar comunidad",
      description: residentes.length
        ? `${residentes.length} residente(s) ya estan vinculados a la operacion del condominio.`
        : "Registra residentes y responsables para activar visitas, incidencias y seguimiento.",
      complete: Boolean(residentes.length),
      to: "/residentes",
      action: residentes.length ? "Ver comunidad" : "Registrar residentes",
      color: "#2E7D52",
    },
  ].filter((step) => (step.title === "Registrar condominio" ? !hasCondominio : true));

  const setupCompleted = setupSteps.filter((step) => step.complete).length;
  const setupProgress = Math.round((setupCompleted / setupSteps.length) * 100);

  const commandCards = [
    {
      label: "Condominios",
      value: totals.condominios ?? condominios.length,
      helper: hasCondominio ? "Base administrativa activa" : "Aun falta registrar el primero",
      accent: "#D94F10",
    },
    {
      label: "Estructura",
      value: `${totals.edificios ?? edificios.length} / ${totals.apartamentos ?? apartamentos.length}`,
      helper: "Edificios y apartamentos bajo gestion",
      accent: "#B86A2D",
    },
    {
      label: "Comunidad",
      value: totals.residentes ?? residentes.length,
      helper: "Residentes activos en el sistema",
      accent: "#2E7D52",
    },
    {
      label: "Operacion",
      value: queues.visitas_pendientes ?? unreadNotifications.length,
      helper: "Señales que hoy piden atencion",
      accent: "#8F5A26",
    },
  ];

  const condoGraph = [
    { label: "Condominios", value: totals.condominios ?? condominios.length, color: "#D94F10" },
    { label: "Estructura", value: (totals.edificios ?? edificios.length) + (totals.apartamentos ?? apartamentos.length), color: "#B86A2D" },
    { label: "Comunidad", value: totals.residentes ?? residentes.length, color: "#2E7D52" },
    { label: "Operacion", value: queues.visitas_pendientes ?? unreadNotifications.length, color: "#8F5A26" },
  ];

  const recentSignals = useMemo(() => {
    const communicationItems = publishedCommunications.map((item) => ({
      id: `communication-${item.id}`,
      label: "Aviso publicado",
      title: item.title,
      detail: item.message,
      timestamp: item.createdAt || item.scheduledFor,
      color: "#D94F10",
    }));

    const notificationItems = unreadNotifications.map((item) => ({
      id: `notification-${item.id}`,
      label: "Notificacion",
      title: item.incidencia_titulo || "Alerta administrativa",
      detail: item.message,
      timestamp: item.fecha_creacion,
      color: "#B86A2D",
    }));

    const auditItems = auditEntries.map((item) => ({
      id: `audit-${item.id}`,
      label: item.category || "Actividad",
      title: item.title,
      detail: item.detail,
      timestamp: item.createdAt,
      color: item.severity === "warning" ? "#B5590A" : "#2E7D52",
    }));

    return [...communicationItems, ...notificationItems, ...auditItems]
      .filter((item) => item.timestamp)
      .sort((left, right) => new Date(right.timestamp) - new Date(left.timestamp))
      .slice(0, 5);
  }, [auditEntries, publishedCommunications, unreadNotifications]);

  if (condoLoading || !ready) {
    return <PageLoader label="Preparando panel del propietario..." />;
  }

  return (
    <div className="space-y-6 md:space-y-7">      <section
        className="rounded-[32px] overflow-hidden border border-[var(--border-standard)]"
        style={{
          background:
            "linear-gradient(140deg, #0F0D0C 0%, #261B16 50%, #0F0D0C 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.3)",
        }}
      >
        <div className="relative px-7 py-10 md:px-12 md:py-14">
          <div
            className="absolute inset-y-0 right-0 w-[50%] opacity-25 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 60% 30%, var(--condome-orange-soft) 0, transparent 70%), radial-gradient(circle at 80% 80%, rgba(217,79,16,0.3) 0, transparent 60%)",
            }}
          />

          <div className="relative z-10 grid gap-8 lg:grid-cols-[1.6fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/10 border border-white/20 text-[10px] font-semibold tracking-[0.24em] uppercase text-white/90">
                  Propiedad & Gestión
                </span>
                {hasCondominio && (
                  <span className="px-3 py-1 rounded-full bg-[var(--condome-orange)]/20 text-[#FFB184] text-[10px] font-bold uppercase tracking-widest border border-[var(--condome-orange)]/30">
                    {condominio.nombre}
                  </span>
                )}
              </div>

              <h1
                className="mt-6 text-4xl md:text-[3.6rem] leading-[1.1] font-medium text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Bienvenido, <span className="italic">{firstName}</span>.
              </h1>

              <p className="mt-6 max-w-2xl text-[16px] md:text-[18px] leading-relaxed text-white/85 font-light">
                Coordina el arranque, la vitalidad operativa y la transparencia financiera de tu condominio desde este centro de mando unificado.
              </p>

              <div className="mt-8 flex flex-wrap gap-4">
                <Link
                  to={hasCondominio ? "/condominio" : "/condominio/nuevo"}
                  className="px-7 py-4 rounded-full no-underline text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02]"
                  style={{ background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))" }}
                >
                  {hasCondominio ? "Explorar Condominio" : "Registrar Nueva Propiedad"}
                </Link>
                <Link
                  to="/cuotas"
                  className="px-7 py-4 rounded-full no-underline text-xs font-bold uppercase tracking-widest text-white/80 border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Finanzas & Cobros
                </Link>
              </div>
            </div>

            <div className="rounded-[32px] border border-white/10 bg-white/[0.05] backdrop-blur-xl p-6 md:p-8">
              <p className="text-[10px] uppercase tracking-[0.24em] font-bold text-white/70">
                Resumen de Implementación
              </p>
              <div className="mt-6">
                <div className="flex items-end justify-between gap-3">
                  <span className="text-3xl font-light text-white">{setupProgress}%</span>
                  <p className="text-[10px] uppercase tracking-widest text-white/50 font-bold mb-2">
                    {setupCompleted}/{setupSteps.length} Hitos
                  </p>
                </div>
                <div className="mt-3 h-1.5 rounded-full bg-white/5 overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000 ease-out"
                    style={{
                      width: `${setupProgress}%`,
                      background: "linear-gradient(90deg, var(--condome-orange), var(--condome-orange-soft))",
                    }}
                  />
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {setupSteps.map((step) => (
                  <div
                    key={step.title}
                    className={`rounded-[20px] border transition-all ${step.complete ? "border-white/10 bg-white/5" : "border-white/5 bg-transparent opacity-60"}`}
                  >
                    <div className="flex items-center justify-between gap-4 p-4">
                      <div className="flex items-center gap-3">
                        <div className={`w-2 h-2 rounded-full ${step.complete ? "bg-[var(--condome-orange)] shadow-[0_0_12px_var(--condome-orange)]" : "bg-white/20"}`} />
                        <p className={`text-sm ${step.complete ? "font-medium text-white" : "text-white/60"}`}>{step.title}</p>
                      </div>
                      {step.complete && (
                        <svg className="w-4 h-4 text-[var(--condome-orange)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="3">
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>


      {error ? <ErrorBanner message={error} /> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {commandCards.map((item) => (
          <article key={item.label} className={`${SURFACE} hover-glow-orange p-6 relative overflow-hidden group transition-all hover:translate-y-[-4px]`}>
            <div
              className="absolute top-0 right-0 w-24 h-24 opacity-[0.03] pointer-events-none translate-x-8 translate-y-[-8px]"
              style={{ backgroundColor: item.accent }}
            />
            <div className="flex items-center justify-between mb-6">
              <div
                className="w-11 h-11 rounded-2xl flex items-center justify-center shadow-sm"
                style={{ backgroundColor: `${item.accent}12`, color: item.accent }}
              >
                <MetricIcon />
              </div>
              <div className="flex gap-1">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-1 h-1 rounded-full bg-[var(--border-emphasis)]" />
                ))}
              </div>
            </div>
            <p className="text-[2.2rem] leading-none font-medium text-[var(--fg-primary)] tracking-tighter">
              {item.value}
            </p>
            <p className="mt-2 text-[11px] uppercase tracking-[0.24em] font-bold text-[var(--fg-tertiary)]">{item.label}</p>
            
            <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
              <p className="text-[13px] leading-relaxed text-[var(--fg-secondary)] flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: item.accent }} />
                {item.helper}
              </p>
            </div>
          </article>
        ))}
      </section>

      <section className="grid gap-7 xl:grid-cols-[1.24fr_0.76fr]">
        <div className={`${SURFACE} hover-glow-orange p-8 animate-soft-pop`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <span className={EYEBROW}>Grafico operativo</span>
              <h2 className={SECTION_TITLE}>Profundidad visual del estado del condominio</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[var(--signal-orange-fog)] text-[var(--condome-orange)] text-xs font-semibold">
              Panel en movimiento
            </span>
          </div>

          <div className="mt-7 rounded-[28px] border border-[var(--border-subtle)] bg-[linear-gradient(180deg,#FFFDFC,#FFF5EC)] p-6 shadow-[var(--shadow-whisper)]">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.18em] font-bold text-[var(--condome-orange)]">
                  Lectura consolidada
                </p>
                <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">
                  Estructura, comunidad y operacion resumidas en una sola lectura.
                </p>
              </div>
              <div className="animate-float-soft rounded-[22px] bg-[rgba(217,79,16,0.1)] px-4 py-3 text-right">
                <p className="text-[10px] uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">Hitos visibles</p>
                <p className="mt-1 text-2xl font-semibold text-[var(--fg-primary)]">{setupCompleted}/{setupSteps.length}</p>
              </div>
            </div>

            <div className="mt-7">
              <OwnerPulseChart items={condoGraph} />
            </div>
          </div>
        </div>

        <div className={`${SURFACE} hover-glow-orange p-8 animate-soft-pop`}>
          <span className={EYEBROW}>Capas del sistema</span>
          <h2 className={SECTION_TITLE}>Profundidad de trabajo</h2>
          <div className="mt-6 space-y-4">
            {condoGraph.map((item) => (
              <div key={item.label} className="rounded-[22px] border border-[var(--border-subtle)] bg-[var(--surface-3)] p-4 shadow-[var(--shadow-whisper)]">
                <div className="flex items-center justify-between gap-3">
                  <p className="text-sm font-semibold text-[var(--fg-primary)]">{item.label}</p>
                  <p className="text-lg font-semibold" style={{ color: item.color }}>{item.value}</p>
                </div>
                <div className="mt-3 h-2 overflow-hidden rounded-full bg-white">
                  <div
                    className="h-full rounded-full transition-all duration-700"
                    style={{
                      width: `${Math.max((item.value / Math.max(...condoGraph.map((entry) => entry.value), 1)) * 100, item.value ? 18 : 0)}%`,
                      background: `linear-gradient(90deg, ${item.color}, #FFB184)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid gap-7 xl:grid-cols-[1.5fr_1fr]">
        <div className={`${SURFACE} p-8 md:p-10 flex flex-col`}>
          <div className="flex items-center gap-3">
             <EYEBROW_TAG>Workflow Operativo</EYEBROW_TAG>
             <div className="h-px flex-1 bg-[var(--border-subtle)]" />
          </div>
          <h2 className={SECTION_TITLE}>Estructura los cimientos de la propiedad.</h2>
          <p className={`mt-4 max-w-2xl ${BODY_COPY}`}>
            Navega por las interfaces clave para organizar edificios, residentes y la administración financiera del condominio.
          </p>

          <div className="mt-10 grid gap-6 flex-1">
            {managementAreas.map((area) => (
              <article key={area.title} className="group p-1 transition-all">
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-12 rounded-full bg-[var(--border-emphasis)] group-hover:bg-[var(--condome-orange)] transition-colors" />
                  <div>
                    <h3 className="text-[17px] font-semibold text-[var(--fg-primary)]">{area.title}</h3>
                    <p className="mt-1 text-sm text-[var(--fg-muted)] leading-relaxed">{area.description}</p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {area.routes.map((route) => (
                        <Link
                          key={route.to}
                          to={route.to}
                          className="px-4 py-2.5 rounded-[12px] bg-[var(--surface-0)] border border-[var(--border-standard)] text-[12px] font-bold text-[var(--fg-secondary)] no-underline transition-all hover:bg-[var(--surface-2)] hover:border-[var(--condome-orange)]/30 hover:text-[var(--condome-orange)] uppercase tracking-wider"
                        >
                          {route.label}
                        </Link>
                      ))}
                    </div>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className="space-y-7">
          <div className={`${SURFACE} p-8`}>
            <EYEBROW_TAG>Señales Prioritarias</EYEBROW_TAG>
            <h2 className={SECTION_TITLE}>Atención hoy</h2>
            <div className="mt-8 space-y-4">
              {recentSignals.length ? (
                recentSignals.map((item) => (
                  <article key={item.id} className="relative pl-6 py-1 group">
                    <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-[var(--border-subtle)] group-hover:bg-[var(--condome-orange)]/40 transition-colors" />
                    <div className="flex items-center justify-between gap-4">
                      <p className="text-[10px] uppercase tracking-widest font-black" style={{ color: item.color }}>
                        {item.label}
                      </p>
                      <span className="text-[10px] text-[var(--fg-muted)] font-medium">{formatDateShort(item.timestamp)}</span>
                    </div>
                    <h3 className="mt-2 text-[15px] font-semibold text-[var(--fg-primary)] group-hover:text-[var(--condome-orange)] transition-colors cursor-pointer">{item.title}</h3>
                    <p className="mt-1 text-[13px] leading-relaxed text-[var(--fg-tertiary)] line-clamp-2">{item.detail || "Sin detalle."}</p>
                  </article>
                ))
              ) : (
                <EmptyState
                  title="Sin señales activas"
                  description="Todo fluye con normalidad. Los eventos recientes aparecerán aquí."
                />
              )}
            </div>
            {recentSignals.length > 0 && (
               <Link to="/auditoria" className="mt-8 block text-center py-3 rounded-xl border border-[var(--border-subtle)] text-[11px] uppercase tracking-widest font-bold text-[var(--fg-tertiary)] no-underline hover:bg-[var(--canvas)] transition-colors">
                  Ver Log de Auditoría Completo
               </Link>
            )}
          </div>

          <div className={`${SURFACE} p-8 bg-gradient-to-br from-[var(--surface-1)] to-[var(--canvas)]`}>
             <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-2xl bg-white shadow-sm flex items-center justify-center">
                   <svg className="w-5 h-5 text-[var(--condome-orange)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                   </svg>
                </div>
                <div>
                   <p className="text-xs font-bold text-[var(--fg-primary)]">Soporte Express</p>
                   <p className="text-[11px] text-[var(--fg-muted)]">Asistencia directa para propietarios</p>
                </div>
             </div>
             <p className="text-sm leading-relaxed text-[var(--fg-secondary)]">
                ¿Necesitas ayuda con el registro de cuotas o la configuración de edificios?
             </p>
             <button className="mt-6 w-full py-3 rounded-xl bg-[var(--fg-primary)] text-white text-[11px] uppercase tracking-widest font-black transition-all hover:bg-black">
                Hablar con Soporte
             </button>
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
          className="w-10 h-10 rounded-full border-2 border-[#E8DDD3] border-t-[#D94F10]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#6D625A]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="px-4 py-3 rounded-2xl border border-[#F1D3C3] bg-[#FFF6F0] text-sm text-[#9B4B1F]">
      {message}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[22px] border border-dashed border-[#E8DDD3] bg-[#F8F1EA] p-6 text-center">
      <h3 className="text-base font-semibold text-[#1F1A16]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[#6D625A]">{description}</p>
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

function OwnerPulseChart({ items }) {
  const width = 340;
  const height = 160;
  const maxValue = Math.max(...items.map((item) => item.value), 1);
  const points = items.map((item, index) => {
    const x = 26 + (index * (width - 52)) / Math.max(items.length - 1, 1);
    const y = height - 24 - (item.value / maxValue) * (height - 54);
    return { ...item, x, y };
  });
  const path = points.map((point, index) => `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full">
      {[0.25, 0.5, 0.75].map((line) => (
        <line
          key={line}
          x1="16"
          x2={width - 16}
          y1={height - 24 - line * (height - 54)}
          y2={height - 24 - line * (height - 54)}
          stroke="rgba(30,26,23,0.08)"
          strokeDasharray="4 6"
        />
      ))}
      <path d={path} fill="none" stroke="#D94F10" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      {points.map((point) => (
        <g key={point.label}>
          <circle cx={point.x} cy={point.y} r="6" fill="white" stroke={point.color} strokeWidth="3" />
          <text x={point.x} y={height - 6} textAnchor="middle" fontSize="10" fill="#8c8076" style={{ textTransform: "uppercase", letterSpacing: "0.12em" }}>
            {point.label}
          </text>
        </g>
      ))}
    </svg>
  );
}

function formatDateShort(value) {
  if (!value) return "";
  return new Date(value).toLocaleDateString("es-DO", {
    day: "2-digit",
    month: "short",
  });
}

function EYEBROW_TAG({ children }) {
  return (
    <span className="px-2.5 py-1 rounded-lg bg-[var(--canvas)] border border-[var(--border-standard)] text-[9px] uppercase tracking-[0.2em] font-black text-[var(--fg-tertiary)]">
      {children}
    </span>
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
