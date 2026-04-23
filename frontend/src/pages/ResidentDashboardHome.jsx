import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { RESIDENT_MODULES, RESIDENT_WORKSPACES } from "../data/residentModules";
import billingPortalService from "../utils/billingPortalService";
import residentPortalService from "../utils/residentPortalService";

const SURFACE = "rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const SOFT_PANEL = "rounded-[20px] border border-[var(--border-subtle)] bg-[var(--canvas)]";
const EYEBROW = "text-[10px] uppercase tracking-[0.24em] font-semibold text-[var(--fg-tertiary)]";
const SECTION_TITLE = "mt-2 text-[1.4rem] leading-tight font-semibold text-[var(--fg-primary)] tracking-tight";
const BODY_COPY = "text-[15px] leading-relaxed text-[var(--fg-secondary)]";
const INK_CARD = "rounded-[24px] border border-[#1A1612]/10 bg-[#1A1612] text-white p-7 shadow-xl";

export default function ResidentDashboardHome() {
  const { user } = useAuth();
  const [context, setContext] = useState(null);
  const [visits, setVisits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [payments, setPayments] = useState([]);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState("");
  const firstName = user?.name?.split(" ")[0] || "Residente";

  const quickActions = [
    { to: "/visitas", title: "Solicitar visita", helper: "Invita familiares, entregas o proveedores." },
    { to: "/pagos", title: "Pagar cuota", helper: "Consulta saldo y procesa tu pago desde aqui." },
    { to: "/reservas", title: "Reservar area", helper: "Agenda amenidades y revisa disponibilidad." },
    { to: "/incidencias", title: "Reportar incidencia", helper: "Abre un caso y dale seguimiento." },
  ];

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setReady(false);
      setError("");
      const requestErrors = [];

      const capture = async (promise, fallback = null) => {
        try {
          return await promise;
        } catch (requestError) {
          requestErrors.push(requestError);
          return { data: fallback };
        }
      };

      const [contextResponse, visitsResponse, incidentsResponse, paymentsResponse] = await Promise.all([
        capture(residentPortalService.getResidentContext(), null),
        capture(residentPortalService.listResidentVisits(), []),
        capture(residentPortalService.listResidentIncidents(), []),
        capture(billingPortalService.listResidentPayments(), []),
      ]);

      if (cancelled) return;

      setContext(contextResponse.data || null);
      setVisits(visitsResponse.data || []);
      setIncidents(incidentsResponse.data || []);
      setPayments(paymentsResponse.data || []);

      if (requestErrors.length) {
        setError("Algunos datos no pudieron actualizarse, pero el dashboard muestra la informacion disponible.");
      }
      setReady(true);
    }

    loadDashboard();
    return () => {
      cancelled = true;
    };
  }, []);

  const pendingPayments = useMemo(
    () => payments.filter((item) => ["pending", "overdue"].includes(item.state)),
    [payments]
  );
  const totalDue = useMemo(
    () => pendingPayments.reduce((acc, item) => acc + Number(item.amount || 0), 0),
    [pendingPayments]
  );
  const pendingVisits = useMemo(
    () => visits.filter((item) => item.estado === "pendiente"),
    [visits]
  );
  const approvedVisits = useMemo(
    () => visits.filter((item) => item.estado === "aprobada"),
    [visits]
  );
  const openIncidents = useMemo(
    () => incidents.filter((item) => ["reportada", "en_revision"].includes(item.estado)),
    [incidents]
  );
  const solvedIncidents = useMemo(
    () => incidents.filter((item) => ["resuelta", "cerrada"].includes(item.estado)),
    [incidents]
  );

  const areaCards = [
    {
      label: "Pagos",
      title: pendingPayments.length ? `${pendingPayments.length} pendiente(s)` : "Sin cargos pendientes",
      helper: pendingPayments.length
        ? `${formatMoney(totalDue)} por atender desde tu panel.`
        : "Tu saldo actual no tiene cargos pendientes.",
      color: "#D94F10",
    },
    {
      label: "Visitas",
      title: `${visits.length} solicitud(es)`,
      helper: pendingVisits.length
        ? `${pendingVisits.length} esperando decision y ${approvedVisits.length} aprobadas.`
        : "No tienes visitas pendientes ahora mismo.",
      color: "#2E7D52",
    },
    {
      label: "Incidencias",
      title: `${openIncidents.length} activa(s)`,
      helper: solvedIncidents.length
        ? `${solvedIncidents.length} ya fueron resueltas o cerradas.`
        : "Todavia no hay incidencias cerradas.",
      color: "#8F5A26",
    },
    {
      label: "Mi residencia",
      title: context?.apartamento?.nombre || "Sin contexto",
      helper: context?.condominio?.nombre || "No se pudo cargar el contexto del condominio.",
      color: "#B86A2D",
    },
  ];

  const workspaceStatus = {
    "Mi residencia": context?.edificio?.nombre
      ? `${context.apartamento?.nombre || "Unidad"} · ${context.edificio.nombre}`
      : "Consulta la informacion base de tu unidad y del condominio.",
    "Accesos y movilidad": pendingVisits.length
      ? `${pendingVisits.length} visita(s) pendientes de respuesta.`
      : "No hay visitas pendientes por ahora.",
    "Pagos y soporte": pendingPayments.length || openIncidents.length
      ? `${pendingPayments.length} pago(s) pendiente(s) y ${openIncidents.length} incidencia(s) abierta(s).`
      : "Tus pagos e incidencias estan bajo control por ahora.",
  };

  const residentPriorities = [
    pendingPayments.length
      ? `Resuelve ${pendingPayments.length} pago(s) pendiente(s) por ${formatMoney(totalDue)}.`
      : "Consulta avisos y reglas de convivencia antes de gestionar otras tareas.",
    pendingVisits.length
      ? `Da seguimiento a ${pendingVisits.length} visita(s) pendiente(s) antes de la fecha programada.`
      : "Usa el modulo de visitas cuando necesites autorizar invitados o entregas.",
    openIncidents.length
      ? `Revisa ${openIncidents.length} incidencia(s) activa(s) y valida las respuestas del propietario.`
      : "Reporta incidencias con contexto claro si surge un problema en tu unidad o edificio.",
    context?.apartamento?.nombre
      ? `Ten a mano los datos de ${context.apartamento.nombre} para pagos, visitas y soporte.`
      : "Verifica tu contexto de residencia para operar con menos friccion en el portal.",
  ];

  if (!ready) {
    return <PageLoader label="Cargando tu dashboard..." />;
  }

  return (
    <div className="space-y-6 md:space-y-7">
      <section
        className="rounded-[34px] overflow-hidden border border-[rgba(30,26,23,0.08)] animate-reveal"
        style={{
          background:
            "linear-gradient(145deg, #121110 0%, #241B16 45%, #121110 100%)",
          boxShadow: "0 24px 60px rgba(14,36,51,0.16)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-10">
          <div
            className="absolute inset-y-0 right-0 w-[45%] opacity-30 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 70% 35%, rgba(102,226,212,0.9) 0, rgba(102,226,212,0) 60%)",
            }}
          />
          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-white/5 border border-white/10 text-[10px] font-semibold tracking-[0.24em] uppercase text-white/60">
                  Centro del residente
                </span>
                <span className="px-3 py-1 rounded-full bg-[var(--condome-orange)]/10 text-[var(--condome-orange-soft)] text-[10px] font-bold uppercase tracking-widest border border-[var(--condome-orange)]/20">
                  Accesos & Finanzas
                </span>
              </div>

              <h1
                className="mt-4 text-3xl md:text-[3.05rem] leading-tight font-semibold text-white"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Hola, {firstName}. Desde aqui podras manejar visitas, pagos, reservas e incidencias.
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-white/74">
                Esta experiencia esta pensada para que el residente resuelva sus gestiones mas
                frecuentes con pocos pasos, contexto claro y acceso a la informacion principal de
                su unidad.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                {quickActions.slice(0, 2).map((action) => (
                  <Link
                    key={action.to}
                    to={action.to}
                    className="px-6 py-4 rounded-full no-underline text-xs font-bold uppercase tracking-widest text-white transition-all hover:scale-[1.02]"
                    style={
                      action.to === "/visitas"
                        ? {
                            background: "linear-gradient(135deg, var(--condome-orange-soft), var(--condome-orange))",
                            color: "white",
                          }
                        : { background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }
                    }
                  >
                    {action.title}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/10 backdrop-blur-sm p-5">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#C4F0EC]">
                Contexto de tu residencia
              </p>
              <div className="mt-4 space-y-3">
                <InfoTile label="Condominio" value={context?.condominio?.nombre || "Sin contexto"} />
                <InfoTile label="Edificio" value={context?.edificio?.nombre || "Sin contexto"} />
                <InfoTile label="Apartamento" value={context?.apartamento?.nombre || "Sin contexto"} />
                <InfoTile
                  label="Saldo pendiente"
                  value={pendingPayments.length ? formatMoney(totalDue) : "Sin cargos pendientes"}
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {error ? <ErrorBanner message={error} /> : null}

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4 md:gap-5">
        {areaCards.map((stat, idx) => (
          <article
            key={stat.label}
            className={`${SURFACE} p-5 animate-slide-up hover:border-[var(--condome-orange)]/30 hover:shadow-xl transition-all duration-300 cursor-default group`}
            style={{ 
              boxShadow: "0 1px 3px rgba(14,36,51,0.06)",
              animationDelay: `${idx * 100}ms`
            }}
          >
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center transition-transform group-hover:scale-110"
              style={{ background: `${stat.color}15`, color: stat.color }}
            >
              <MetricIcon />
            </div>
            <p className="mt-4 text-sm font-semibold text-[#10212D]">{stat.title}</p>
            <p className="mt-1 text-[11px] uppercase tracking-[0.24em] font-bold" style={{ color: stat.color }}>
              {stat.label}
            </p>
            <p className="mt-2 text-sm leading-6 text-[#5B6B71]">{stat.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.5fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className={EYEBROW}>Espacios de trabajo</p>
              <h2 className={SECTION_TITLE}>Todo lo que el residente debe poder resolver</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[rgba(217,79,16,0.1)] text-[var(--condome-orange)] text-xs font-semibold">
              Interfaz dedicada por rol
            </span>
          </div>
          <p className={`mt-3 max-w-3xl ${BODY_COPY}`}>
            La informacion se agrupa por acciones diarias para que el residente entienda rapido
            donde resolver cada tarea y vea el estado actual sin perderse en modulos tecnicos.
          </p>

          <div className="mt-6 grid gap-4 lg:grid-cols-2">
            {RESIDENT_WORKSPACES.map((workspace) => (
              <article key={workspace.title} className={`${SOFT_PANEL} p-5`}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h3 className="text-lg font-semibold text-[#10212D]">{workspace.title}</h3>
                    <p className="mt-2 text-sm leading-6 text-[#5B6B71]">{workspace.description}</p>
                  </div>
                  <span className="w-3 h-12 rounded-full" style={{ backgroundColor: workspace.color }} />
                </div>

                <p className="mt-4 text-sm leading-6 text-[#355654]">{workspaceStatus[workspace.title]}</p>

                <div className="mt-4 flex flex-wrap gap-2">
                  {workspace.routes.map((route) => {
                    const label =
                      route === "mi-residencia"
                        ? "Mi residencia"
                        : RESIDENT_MODULES[route]?.title || route;
                    return (
                      <Link
                        key={route}
                        to={`/${route}`}
                        className="px-3 py-2 rounded-full bg-[var(--surface-0)] border border-[var(--border-standard)] no-underline text-xs font-bold text-[var(--fg-secondary)] hover:border-[var(--condome-orange)]/30 hover:text-[var(--condome-orange)] transition-colors"
                      >
                        {label}
                      </Link>
                    );
                  })}
                </div>
              </article>
            ))}
          </div>
        </div>

        <div className={`${SURFACE} p-6`}>
          <p className={EYEBROW}>Ruta sugerida</p>
          <h2 className={SECTION_TITLE}>Orden natural de uso para hoy</h2>
          <p className={`mt-3 ${BODY_COPY}`}>
            Este bloque usa tu informacion real para priorizar lo urgente y dejar a mano el flujo
            que probablemente debas seguir primero.
          </p>
          <div className="mt-5 space-y-4">
            {residentPriorities.map((item, index) => (
              <div key={item} className={`${SOFT_PANEL} p-4`}>
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-2xl bg-[#1A1612] text-white flex items-center justify-center text-sm font-bold">
                    {String(index + 1).padStart(2, "0")}
                  </div>
                  <p className="text-sm leading-7 text-[var(--fg-secondary)]">{item}</p>
                </div>
              </div>
            ))}
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
          className="w-10 h-10 rounded-full border-2 border-[rgba(30,26,23,0.1)] border-t-[var(--condome-orange)]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#5B6B71]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function InfoTile({ label, value }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md px-4 py-3 hover:bg-white/10 transition-colors cursor-default group">
      <p className="text-[10px] uppercase tracking-[0.22em] font-bold text-white/40 group-hover:text-white/60 transition-colors">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white tracking-wide">{value}</p>
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="px-4 py-3 rounded-2xl bg-[rgba(217,79,16,0.08)] border border-[rgba(217,79,16,0.16)] text-sm text-[var(--condome-orange)]">
      {message}
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

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(Number(value || 0));
}
