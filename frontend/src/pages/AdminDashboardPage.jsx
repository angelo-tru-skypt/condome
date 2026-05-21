import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import { isSystemAdminRole } from "../utils/roles";
import adminService from "../utils/adminService";
import { toDashboardPath } from "../utils/dashboardPaths";

const SURFACE = "rounded-[28px] border border-[var(--border-standard)] bg-[var(--surface-1)] shadow-[var(--shadow-card)]";
const EYEBROW = "text-[11px] uppercase tracking-[0.22em] font-semibold text-[var(--condome-orange-soft)]";
const SECTION_TITLE = "mt-2 text-[1.55rem] leading-tight font-semibold text-[var(--fg-primary)]";
const BODY_COPY = "text-sm md:text-[15px] leading-7 text-[var(--fg-secondary)]";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSystemAdmin = isSystemAdminRole(user?.role || user?.rol);
  const { condominio, edificios, apartamentos, residentes, hasCondominio, loading } = useCondominio();
  const [summaryData, setSummaryData] = useState(null);
  const [billingSummary, setBillingSummary] = useState(null);
  const [delinquencyData, setDelinquencyData] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [owners, setOwners] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notificationRules, setNotificationRules] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [visits, setVisits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);
  const [sendingPaymentAlerts, setSendingPaymentAlerts] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setReady(false);

      // Si no hay condominio activo y el usuario no es system-owner, no cargamos
      // el dashboard administrativo. Los system-owners (owner) pueden ver datos
      // agregados globales sin seleccionar un condominio.
      if (!condominio?.id && !isSystemAdmin) {
        if (cancelled) return;
        setSummaryData(null);
        setBillingSummary(null);
        setDelinquencyData(null);
        setCommunications([]);
        setPolicies([]);
        setOwners([]);
        setDocuments([]);
        setNotificationRules([]);
        setAuditEntries([]);
        setVisits([]);
        setIncidents([]);
        setNotifications([]);
        setReady(true);
        return;
      }

      const responses = await Promise.all([
        adminService.getDashboardSummary(condominio?.id).catch(() => ({ data: null })),
        adminService.getBillingSummary(condominio?.id).catch(() => ({ data: null })),
        adminService.getDelinquency(condominio?.id).catch(() => ({ data: null })),
        adminService.listCommunications(condominio?.id).catch(() => ({ data: [] })),
        adminService.listAccessPolicies(condominio?.id).catch(() => ({ data: [] })),
        adminService.listOwners(condominio?.id).catch(() => ({ data: [] })),
        adminService.listDocuments(condominio?.id).catch(() => ({ data: [] })),
        adminService.listNotificationRules(condominio?.id).catch(() => ({ data: [] })),
        adminService.listAuditEntries(condominio?.id).catch(() => ({ data: [] })),
        adminService.listNotifications(condominio?.id).catch(() => ({ data: [] })),
        adminService.listVisits().catch(() => ({ data: [] })),
        adminService.listIncidents().catch(() => ({ data: [] })),
      ]);

      if (cancelled) return;

      const [
        summaryResponse,
        billingResponse,
        delinquencyResponse,
        communicationsResponse,
        policiesResponse,
        ownersResponse,
        documentsResponse,
        rulesResponse,
        auditResponse,
        notificationsResponse,
        visitsResponse,
        incidentsResponse,
      ] = responses;

      setSummaryData(summaryResponse.data || null);
      setBillingSummary(billingResponse.data || null);
      setDelinquencyData(delinquencyResponse.data || null);
      setCommunications(communicationsResponse.data || []);
      setPolicies(policiesResponse.data || []);
      setOwners(ownersResponse.data || []);
      setDocuments(documentsResponse.data || []);
      setNotificationRules(rulesResponse.data || []);
      setAuditEntries(auditResponse.data || []);
      setNotifications(notificationsResponse.data || []);
      setVisits(visitsResponse.data || []);
      setIncidents(incidentsResponse.data || []);
      setReady(true);
    }

    loadDashboard();

    return () => {
      cancelled = true;
    };
  }, [condominio?.id, isSystemAdmin]);

  useEffect(() => {
    if (!feedback.message) return undefined;

    const timer = setTimeout(() => {
      setFeedback({ type: "", message: "" });
    }, 4500);

    return () => clearTimeout(timer);
  }, [feedback]);

  if (loading || !ready) {
    return <PageLoader label="Preparando tu panel..." />;
  }

  const summaryTotals = summaryData?.totals || {};
  const summaryQueues = summaryData?.queues || {};
  const pendingVisits = summaryQueues.visitas_pendientes ?? visits.filter((item) => item.estado === "pendiente").length;
  const openIncidents =
    summaryQueues.incidencias_abiertas ??
    incidents.filter((item) => item.estado !== "cerrada" && item.estado !== "resuelta").length;
  const publishedCommunications = communications.filter((item) => item.status === "published");
  const unreadNotifications =
    summaryQueues.notificaciones_no_leidas ?? notifications.filter((item) => !item.read).length;
  const occupiedApartments = apartamentos.filter((item) => item.estado === "ocupado").length;
  const registeredOwners = summaryTotals.propietarios ?? owners.length;
  const registeredResidents = summaryTotals.residentes ?? residentes.length;
  const registeredDocuments = summaryTotals.documentos ?? documents.length;
  const accessPolicies = policies.length;
  const rulesCount = notificationRules.length;
  const pendingCharges = billingSummary?.pendingCharges ?? 0;
  const paidCharges = billingSummary?.paidCharges ?? 0;
  const overdueCharges = delinquencyData?.total ?? billingSummary?.overdueCharges ?? 0;
  const overdueAmount = delinquencyData?.amount ?? billingSummary?.overdueAmount ?? 0;
  const upcomingCount = delinquencyData?.upcomingCount ?? 0;
  const residentsNeedingAttention = overdueCharges + upcomingCount;
  const firstName = user?.name?.split(" ")[0] || "Admin";

  const commandCards = [
    {
      label: "Condominios",
      value: summaryTotals.condominios ?? (hasCondominio ? 1 : 0),
      helper: hasCondominio ? "Contexto administrativo activo" : "Pendiente de registrar",
      color: "#0E5A7A",
    },
    {
      label: "Edificios",
      value: summaryTotals.edificios ?? edificios.length,
      helper: "Infraestructura gestionada",
      color: "#23B5C3",
    },
    {
      label: "Apartamentos",
      value: summaryTotals.apartamentos ?? apartamentos.length,
      helper: `${occupiedApartments} ocupados`,
      color: "#1A6B9A",
    },
    {
      label: "Propietarios",
      value: registeredOwners,
      helper: "Responsables registrados",
      color: "#0F766E",
    },
    {
      label: "Residentes",
      value: summaryTotals.residentes ?? residentes.length,
      helper: "Comunidad con acceso",
      color: "#4F46E5",
    },
    {
      label: "Incidencias abiertas",
      value: openIncidents,
      helper: "Seguimiento administrativo",
      color: "#B45309",
    },
  ];

  const priorityLinks = [
    {
      to: toDashboardPath(hasCondominio ? "condominio" : "condominio/nuevo"),
      title: "Condominios y configuracion base",
      helper: hasCondominio ? "Ficha principal y contexto de operacion" : "Pendiente de inicializar",
    },
    {
      to: toDashboardPath(hasCondominio ? "propietarios" : "condominio/nuevo"),
      title: "Comunidad administrativa",
      helper: `${registeredOwners} propietarios y ${registeredResidents} residentes`,
    },
    {
      to: toDashboardPath(hasCondominio ? "configuracion" : "condominio/nuevo"),
      title: "Configuracion y reglas",
      helper: `${rulesCount} reglas autom. y ${accessPolicies} politicas`,
    },
    {
      to: toDashboardPath(hasCondominio ? "auditoria" : "condominio/nuevo"),
      title: "Auditoria y trazabilidad",
      helper: `${auditEntries.length} eventos internos registrados`,
    },
  ];

  const quickActions = [
    {
      to: toDashboardPath(hasCondominio ? "cuotas" : "condominio/nuevo"),
      title: "Cuotas y cargos",
      helper: hasCondominio
        ? `${pendingCharges} cargos pendientes por gestionar.`
        : "Registra primero el condominio para abrir la facturacion.",
      accent: "#D94F10",
    },
    {
      to: toDashboardPath(hasCondominio ? "pagos" : "condominio/nuevo"),
      title: "Pagos confirmados",
      helper: hasCondominio
        ? `${paidCharges} pagos ya aparecen conciliados.`
        : "Activa el contexto operativo para revisar cobros.",
      accent: "#0F766E",
    },
    {
      to: toDashboardPath(hasCondominio ? "morosidad" : "condominio/nuevo"),
      title: "Morosidad",
      helper: hasCondominio
        ? `${overdueCharges} casos en mora por ${formatMoney(overdueAmount)}.`
        : "Todavia no hay seguimiento financiero disponible.",
      accent: "#B45309",
    },
    {
      to: toDashboardPath(hasCondominio ? "reportes" : "condominio/nuevo"),
      title: "Reportes y cierre",
      helper: hasCondominio
        ? `${auditEntries.length} eventos listos para exportar y auditar.`
        : "Selecciona o crea un condominio para exportar reportes.",
      accent: "#1A6B9A",
    },
  ];

  const recentAudit = [...auditEntries]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);

  const sendPaymentAlerts = async () => {
    if (!condominio?.id) {
      setFeedback({
        type: "error",
        message: "Selecciona un condominio para enviar avisos de pago.",
      });
      return;
    }

    setSendingPaymentAlerts(true);
    setFeedback({ type: "", message: "" });
    try {
      const response = await adminService.runDelinquencyAction(condominio.id, {
        action: "notify",
        audience: "residentes",
      });
      setFeedback({
        type: "success",
        message:
          response.message ||
          `Se enviaron avisos de pago a ${response.sent || 0} residente(s).`,
      });
      const [billingResponse, delinquencyResponse] = await Promise.all([
        adminService.getBillingSummary(condominio.id).catch(() => ({ data: null })),
        adminService.getDelinquency(condominio.id).catch(() => ({ data: null })),
      ]);
      setBillingSummary(billingResponse.data || null);
      setDelinquencyData(delinquencyResponse.data || null);
    } catch (actionError) {
      setFeedback({
        type: "error",
        message: actionError.message || "No se pudieron enviar los avisos de pago.",
      });
    } finally {
      setSendingPaymentAlerts(false);
    }
  };

  return (
    <div className="space-y-6 md:space-y-7">
      <section
        className="dark-surface-readable rounded-[34px] overflow-hidden border border-[var(--border-standard)]"
        style={{
          background: "linear-gradient(145deg, #090A0C 0%, #141920 48%, #090A0C 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.34)",
        }}
      >
        <div className="relative px-7 py-8 md:px-10 md:py-10">
          <div
            className="absolute inset-y-0 right-0 w-[45%] opacity-15 pointer-events-none"
            style={{
              background:
                "radial-gradient(circle at 70% 30%, #D94F10 0, transparent 65%)",
            }}
          />

          <div className="relative z-10 grid gap-6 lg:grid-cols-[1.55fr_1fr]">
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-1 rounded-full bg-[#D94F10]/10 border border-[#D94F10]/40 text-[11px] font-semibold tracking-[0.2em] uppercase text-[#FF7A30]">
                  Centro de Control
                </span>
                <span className="px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 text-xs font-semibold">
                  {condominio?.nombre || "Sistema Maestro"}
                </span>
              </div>

              <h1
                className="mt-4 text-3xl md:text-[3.05rem] leading-tight font-semibold text-white/95"
                style={{ fontFamily: "'Playfair Display', serif" }}
              >
                Bienvenido al Centro de Control, {firstName}.
              </h1>

              <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-white/74">
                Supervisa el estado operativo, financiero y comunitario de las unidades bajo tu
                gestión con visibilidad total y herramientas de auditoría avanzada.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={toDashboardPath(hasCondominio ? "condominio" : "condominio/nuevo")}
                  className="px-5 py-3 rounded-2xl no-underline text-xs font-bold uppercase tracking-widest text-[#E5E5E5] transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)", boxShadow: "0 8px 16px rgba(217,79,16,0.2)" }}
                >
                  {hasCondominio ? "Gestión de Condominio" : "Registrar Base"}
                </Link>
                <Link
                  to={toDashboardPath("configuracion")}
                  className="px-5 py-3 rounded-2xl no-underline text-xs font-bold uppercase tracking-widest text-white/80 border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Configuración Maestra
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/10 bg-white/[0.04] backdrop-blur-xl p-5 shadow-2xl">
              <p className="text-[11px] uppercase tracking-[0.2em] font-semibold text-[#FF7A30]">
                Métricas de Supervisión
              </p>
              <div className="mt-4 space-y-3">
                <StatusTile
                  label="Visitas en Cola"
                  value={pendingVisits}
                  helper="Solicitudes activas en portería"
                />
                <StatusTile
                  label="Incidencias Críticas"
                  value={openIncidents}
                  helper="Casos que requieren resolución"
                />
                <StatusTile
                  label="Alertas de Red"
                  value={unreadNotifications}
                  helper="Avisos del sistema sin procesar"
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {feedback.message ? (
        feedback.type === "success" ? (
          <SuccessBanner message={feedback.message} />
        ) : (
          <ErrorBanner message={feedback.message} />
        )
      ) : null}

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
        {quickActions.map((item) => (
          <QuickActionCard
            key={item.title}
            to={item.to}
            title={item.title}
            helper={item.helper}
            accent={item.accent}
          />
        ))}
      </section>

      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-5 flex-wrap">
          <div className="max-w-3xl">
            <p className={EYEBROW}>Cobranza inmediata</p>
            <h2 className={SECTION_TITLE}>Envía avisos de pago desde el panel principal</h2>
            <p className={`mt-3 ${BODY_COPY}`}>
              Usa este atajo para notificar a los residentes con cargos por vencer o ya vencidos
              sin salir del dashboard.
            </p>
          </div>
          <button
            type="button"
            onClick={sendPaymentAlerts}
            disabled={sendingPaymentAlerts || !hasCondominio || !residentsNeedingAttention}
            className="rounded-2xl border-none px-5 py-3 text-xs font-bold uppercase tracking-[0.18em] text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            style={{
              background: "linear-gradient(135deg, #D94F10, #8F2D04)",
            }}
          >
            {sendingPaymentAlerts ? "Enviando avisos..." : "Enviar avisos de pago"}
          </button>
        </div>

        <div className="mt-6 grid gap-4 md:grid-cols-3">
          <InfoStatCard
            label="Casos vencidos"
            value={overdueCharges}
            helper={`${formatMoney(overdueAmount)} en atraso actual.`}
            accent="#B45309"
          />
          <InfoStatCard
            label="Por vencer"
            value={upcomingCount}
            helper="Cargos que entran en recordatorio preventivo."
            accent="#1A6B9A"
          />
          <InfoStatCard
            label="Avisos listos"
            value={residentsNeedingAttention}
            helper={
              residentsNeedingAttention
                ? "Hay residentes que deben recibir aviso de pago."
                : "No hay residentes pendientes de aviso ahora mismo."
            }
            accent="#0F766E"
          />
        </div>
      </section>

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {commandCards.map((card) => (
          <article key={card.label} className={`${SURFACE} p-5 md:p-6`}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: `${card.color}14`, color: card.color }}
            >
              <MetricIcon />
            </div>
            <p className="mt-4 text-[2rem] leading-tight font-semibold text-[var(--fg-primary)]">{card.value}</p>
            <p className="mt-1 text-sm font-semibold text-[var(--fg-primary)]">{card.label}</p>
            <p className="mt-2 text-sm leading-6 text-[var(--fg-secondary)]">{card.helper}</p>
          </article>
        ))}
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.25fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <div className="flex items-center justify-between gap-4 flex-wrap">
            <div>
              <p className={EYEBROW}>
                Mapa administrativo
              </p>
              <h2 className={SECTION_TITLE}>Frentes de gestion del admin</h2>
            </div>
            <span className="px-3 py-1.5 rounded-full bg-[var(--surface-2)] text-[var(--fg-secondary)] text-xs font-semibold border border-[var(--border-standard)]">
              Gestión integral
            </span>
          </div>
          <p className={`mt-3 max-w-3xl ${BODY_COPY}`}>
            Este bloque prioriza decisiones, contexto y trazabilidad para que el admin no tenga
            que leer de mas antes de actuar.
          </p>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            {priorityLinks.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 no-underline hover:border-[var(--control-border-strong)] hover:bg-[var(--surface-2)] transition-colors"
              >
                <p className="text-sm font-semibold text-[var(--fg-primary)]">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">{item.helper}</p>
              </Link>
            ))}
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className={EYEBROW}>
            Gobierno documental
          </p>
          <h2 className={SECTION_TITLE}>Publicaciones y soporte documental</h2>
          <div className="mt-5 space-y-3">
            {publishedCommunications.length || registeredDocuments ? (
              [...publishedCommunications.slice(0, 2), ...Array.from({ length: Math.min(registeredDocuments, 1) }).map((_, index) => ({ id: `doc-${index}`, targetLabel: "Biblioteca", title: "Documentos del condominio", message: `${registeredDocuments} documentos cargados y disponibles para gestion.` }))].slice(0, 3).map((item) => (
                <article key={item.id} className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">{item.targetLabel}</p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--fg-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--fg-secondary)] line-clamp-3">{item.message}</p>
                </article>
              ))
            ) : (
              <EmptyState
                title="Todavia no hay publicaciones administrativas"
                description="Usa avisos, documentos y comunicados para ordenar la operacion y el gobierno del condominio."
              />
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 xl:grid-cols-[1.1fr_1fr]">
        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className={EYEBROW}>
            Cola de supervision
          </p>
          <h2 className={SECTION_TITLE}>Atencion inmediata del admin</h2>
          <p className={`mt-3 max-w-3xl ${BODY_COPY}`}>
            Cada tarjeta resume un frente de trabajo para que el equipo detecte rapido donde
            hay que entrar hoy.
          </p>

          <div className="mt-6 grid gap-4">
            <QueueCard
              title="Estructura"
              description={
                hasCondominio
                  ? `${edificios.length} edificios y ${apartamentos.length} apartamentos bajo gestion.`
                  : "Todavia no hay una base estructural registrada."
              }
              to={toDashboardPath(hasCondominio ? "edificios" : "condominio/nuevo")}
            />
            <QueueCard
              title="Comunidad"
              description={
                registeredOwners || (summaryTotals.residentes ?? residentes.length)
                  ? `${registeredOwners} propietarios y ${registeredResidents} residentes requieren administracion continua.`
                  : "Aun no hay comunidad administrativa registrada."
              }
              to={toDashboardPath("propietarios")}
            />
            <QueueCard
              title="Seguridad y control"
              description={
                unreadNotifications || accessPolicies
                  ? `${unreadNotifications} alertas sin leer y ${accessPolicies} politicas de acceso configuradas.`
                  : "Todavia no hay alertas ni politicas registradas."
              }
              to={toDashboardPath("acceso")}
            />
            <QueueCard
              title="Cobranza"
              description={
                pendingCharges || overdueCharges
                  ? `${pendingCharges} cargos pendientes y ${overdueCharges} casos en mora por ${formatMoney(overdueAmount)}.`
                  : "La cobranza se mantiene al dia en este momento."
              }
              to={toDashboardPath("morosidad")}
            />
          </div>
        </div>

        <div className={`${SURFACE} p-6 md:p-7`}>
          <p className={EYEBROW}>
            Trazabilidad
          </p>
          <h2 className={SECTION_TITLE}>Actividad reciente</h2>
          <div className="mt-5 space-y-3">
            {recentAudit.length ? (
              recentAudit.map((item) => (
                  <article key={item.id} className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">{item.category}</p>
                  <h3 className="mt-2 text-base font-semibold text-[var(--fg-primary)]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[var(--fg-secondary)]">{item.detail}</p>
                  <p className="mt-2 text-xs text-[var(--fg-muted)]">
                    {item.actor} · {formatDate(item.createdAt)}
                  </p>
                </article>
              ))
            ) : (
              <EmptyState
                title="Sin auditoria interna todavia"
                description="A medida que uses avisos, reservas y acceso, esta bitacora empezara a poblarse."
              />
            )}
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
          className="w-10 h-10 rounded-full border-2 border-[var(--border-standard)] border-t-[var(--condome-orange)]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[var(--fg-tertiary)]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function StatusTile({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.05] px-4 py-3 hover:bg-white/10 transition-colors">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#FF7A30] font-bold">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-white/64">{helper}</p>
    </div>
  );
}

function QueueCard({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5 no-underline hover:border-[var(--control-border-strong)] hover:bg-[var(--surface-2)] transition-all"
    >
      <p className="text-sm font-semibold text-[var(--fg-primary)]">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">{description}</p>
    </Link>
  );
}

function QuickActionCard({ to, title, helper, accent }) {
  return (
    <Link
      to={to}
      className="rounded-[24px] border border-[var(--border-standard)] bg-[var(--surface-1)] p-5 no-underline shadow-[var(--shadow-card)] transition-all hover:-translate-y-0.5 hover:border-[var(--control-border-strong)]"
    >
      <div
        className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `${accent}14`, color: accent }}
      >
        Accion rapida
      </div>
      <h3 className="mt-4 text-lg font-semibold text-[var(--fg-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-6 text-[var(--fg-secondary)]">{helper}</p>
    </Link>
  );
}

function InfoStatCard({ label, value, helper, accent }) {
  return (
    <div className="rounded-[22px] border border-[var(--border-standard)] bg-[var(--surface-0)] p-5">
      <div
        className="inline-flex rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-[0.2em]"
        style={{ backgroundColor: `${accent}14`, color: accent }}
      >
        {label}
      </div>
      <p className="mt-4 text-[2rem] font-semibold leading-none text-[var(--fg-primary)]">{value}</p>
      <p className="mt-2 text-sm leading-6 text-[var(--fg-secondary)]">{helper}</p>
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-[var(--border-standard)] bg-[var(--surface-0)] p-6 text-center">
      <h3 className="text-base font-semibold text-[var(--fg-primary)]">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[var(--fg-secondary)]">{description}</p>
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

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", {
    style: "currency",
    currency: "DOP",
  }).format(Number(value || 0));
}

function SuccessBanner({ message }) {
  return (
    <div className="rounded-[22px] border border-emerald-500/20 bg-emerald-500/10 px-5 py-4 text-sm font-semibold text-emerald-600">
      {message}
    </div>
  );
}

function ErrorBanner({ message }) {
  return (
    <div className="rounded-[22px] border border-red-500/20 bg-red-500/10 px-5 py-4 text-sm font-semibold text-red-500">
      {message}
    </div>
  );
}
