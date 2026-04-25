import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import { isSystemAdminRole } from "../utils/roles";
import adminService from "../utils/adminService";

const SURFACE = "rounded-[28px] border border-[#26201B] bg-[#11100F] shadow-[0_18px_42px_rgba(0,0,0,0.22)]";
const EYEBROW = "text-[11px] uppercase tracking-[0.22em] font-semibold text-[#FF8B4A]";
const SECTION_TITLE = "mt-2 text-[1.55rem] leading-tight font-semibold text-[#F6F0E9]";
const BODY_COPY = "text-sm md:text-[15px] leading-7 text-[#B8AA9E]";

export default function AdminDashboardPage() {
  const { user } = useAuth();
  const isSystemAdmin = isSystemAdminRole(user?.role || user?.rol);
  const { condominio, edificios, apartamentos, residentes, hasCondominio, loading } = useCondominio();
  const [summaryData, setSummaryData] = useState(null);
  const [communications, setCommunications] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [policies, setPolicies] = useState([]);
  const [owners, setOwners] = useState([]);
  const [documents, setDocuments] = useState([]);
  const [notificationRules, setNotificationRules] = useState([]);
  const [auditEntries, setAuditEntries] = useState([]);
  const [visits, setVisits] = useState([]);
  const [incidents, setIncidents] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Si no hay condominio activo y el usuario no es system-owner, no cargamos
    // el dashboard administrativo. Los system-owners (owner) pueden ver datos
    // agregados globales sin seleccionar un condominio.
    if (!condominio?.id && !isSystemAdmin) {
      setSummaryData(null);
      setCommunications([]);
      setReservations([]);
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

    Promise.all([
      adminService.getDashboardSummary(condominio?.id).catch(() => ({ data: null })),
      adminService.listCommunications(condominio?.id).catch(() => ({ data: [] })),
      adminService.listReservations(condominio?.id).catch(() => ({ data: [] })),
      adminService.listAccessPolicies(condominio?.id).catch(() => ({ data: [] })),
      adminService.listOwners(condominio?.id).catch(() => ({ data: [] })),
      adminService.listDocuments(condominio?.id).catch(() => ({ data: [] })),
      adminService.listNotificationRules(condominio?.id).catch(() => ({ data: [] })),
      adminService.listAuditEntries(condominio?.id).catch(() => ({ data: [] })),
      adminService.listNotifications(condominio?.id).catch(() => ({ data: [] })),
      adminService.listVisits().catch(() => ({ data: [] })),
      adminService.listIncidents().catch(() => ({ data: [] })),
    ])
      .then(([
        summaryResponse,
        communicationsResponse,
        reservationsResponse,
        policiesResponse,
        ownersResponse,
        documentsResponse,
        rulesResponse,
        auditResponse,
        notificationsResponse,
        visitsResponse,
        incidentsResponse,
      ]) => {
        setSummaryData(summaryResponse.data || null);
        setCommunications(communicationsResponse.data || []);
        setReservations(reservationsResponse.data || []);
        setPolicies(policiesResponse.data || []);
        setOwners(ownersResponse.data || []);
        setDocuments(documentsResponse.data || []);
        setNotificationRules(rulesResponse.data || []);
        setAuditEntries(auditResponse.data || []);
        setNotifications(notificationsResponse.data || []);
        setVisits(visitsResponse.data || []);
        setIncidents(incidentsResponse.data || []);
      })
      .finally(() => setReady(true));
  }, [condominio?.id]);

  if (loading || !ready) {
    return <PageLoader label="Preparando dashboard administrativo..." />;
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
  const registeredDocuments = summaryTotals.documentos ?? documents.length;
  const accessPolicies = policies.length;
  const rulesCount = notificationRules.length;
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
      to: hasCondominio ? "/condominio" : "/condominio/nuevo",
      title: "Condominios y configuracion base",
      helper: hasCondominio ? "Ficha principal y contexto de operacion" : "Pendiente de inicializar",
    },
    {
      to: hasCondominio ? "/propietarios" : "/condominio/nuevo",
      title: "Comunidad administrativa",
      helper: `${registeredOwners} propietarios y ${summaryTotals.residentes ?? residentes.length} residentes`,
    },
    {
      to: hasCondominio ? "/configuracion" : "/condominio/nuevo",
      title: "Configuracion y reglas",
      helper: `${rulesCount} reglas autom. y ${accessPolicies} politicas`,
    },
    {
      to: hasCondominio ? "/auditoria" : "/condominio/nuevo",
      title: "Auditoria y trazabilidad",
      helper: `${auditEntries.length} eventos internos registrados`,
    },
  ];

  const recentAudit = [...auditEntries]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5);

  return (
    <div className="space-y-6 md:space-y-7">
      <section
        className="rounded-[34px] overflow-hidden border border-[#1A1A1A]"
        style={{
          background: "linear-gradient(145deg, #050505 0%, #0E1116 50%, #050505 100%)",
          boxShadow: "0 24px 60px rgba(0,0,0,0.45)",
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
                  Administración Central
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

              <p className="mt-4 max-w-2xl text-sm md:text-[15px] leading-7 text-[#A3A3A3]">
                Supervisa el estado operativo, financiero y comunitario de las unidades bajo tu
                gestión con visibilidad total y herramientas de auditoría avanzada.
              </p>

              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  to={hasCondominio ? "/condominio" : "/condominio/nuevo"}
                  className="px-5 py-3 rounded-2xl no-underline text-xs font-bold uppercase tracking-widest text-[#E5E5E5] transition-all hover:brightness-110"
                  style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)", boxShadow: "0 8px 16px rgba(217,79,16,0.2)" }}
                >
                  {hasCondominio ? "Gestión de Condominio" : "Registrar Base"}
                </Link>
                <Link
                  to="/configuracion"
                  className="px-5 py-3 rounded-2xl no-underline text-xs font-bold uppercase tracking-widest text-white/80 border border-white/10 bg-white/5 backdrop-blur-sm transition-all hover:bg-white/10"
                >
                  Configuración Maestra
                </Link>
              </div>
            </div>

            <div className="rounded-[24px] border border-white/5 bg-white/[0.02] backdrop-blur-xl p-5 shadow-2xl">
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

      <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 md:gap-5">
        {commandCards.map((card) => (
          <article key={card.label} className={`${SURFACE} p-5 md:p-6`}>
            <div
              className="w-11 h-11 rounded-2xl flex items-center justify-center"
              style={{ background: `${card.color}14`, color: card.color }}
            >
              <MetricIcon />
            </div>
            <p className="mt-4 text-[2rem] leading-tight font-semibold text-[#F6F0E9]">{card.value}</p>
            <p className="mt-1 text-sm font-semibold text-[#F6F0E9]">{card.label}</p>
            <p className="mt-2 text-sm leading-6 text-[#B8AA9E]">{card.helper}</p>
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
            <span className="px-3 py-1.5 rounded-full bg-[#1A1715] text-[#D9CBBF] text-xs font-semibold border border-[#2D2620]">
              Solo modulos de gobierno y control
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
                className="rounded-[24px] border border-[#2D2620] bg-[#171513] p-5 no-underline hover:border-[#D94F10]/35 hover:bg-[#1D1916] transition-colors"
              >
                <p className="text-sm font-semibold text-[#E5E5E5]">{item.title}</p>
                <p className="mt-2 text-sm leading-7 text-[#B8AA9E]">{item.helper}</p>
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
                <article key={item.id} className="rounded-[22px] border border-[#2D2620] bg-[#171513] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3]">{item.targetLabel}</p>
                  <h3 className="mt-2 text-base font-semibold text-[#E5E5E5]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#B8AA9E] line-clamp-3">{item.message}</p>
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
              to={hasCondominio ? "/edificios" : "/condominio/nuevo"}
            />
            <QueueCard
              title="Comunidad"
              description={
                registeredOwners || (summaryTotals.residentes ?? residentes.length)
                  ? `${registeredOwners} propietarios y ${summaryTotals.residentes ?? residentes.length} residentes requieren administracion continua.`
                  : "Aun no hay comunidad administrativa registrada."
              }
              to="/propietarios"
            />
            <QueueCard
              title="Seguridad y control"
              description={
                unreadNotifications || accessPolicies
                  ? `${unreadNotifications} alertas sin leer y ${accessPolicies} politicas de acceso configuradas.`
                  : "Todavia no hay alertas ni politicas registradas."
              }
              to="/acceso"
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
                  <article key={item.id} className="rounded-[22px] border border-[#2D2620] bg-[#171513] p-4">
                  <p className="text-xs uppercase tracking-[0.18em] text-[#A3A3A3]">{item.category}</p>
                  <h3 className="mt-2 text-base font-semibold text-[#E5E5E5]">{item.title}</h3>
                  <p className="mt-2 text-sm leading-6 text-[#B8AA9E]">{item.detail}</p>
                  <p className="mt-2 text-xs text-[#8C7D71]">
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
          className="w-10 h-10 rounded-full border-2 border-[#262626] border-t-[#D94F10]"
          style={{ animation: "spin 0.8s linear infinite" }}
        />
        <p className="text-sm text-[#737373]">{label}</p>
        <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      </div>
    </div>
  );
}

function StatusTile({ label, value, helper }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3 hover:bg-white/5 transition-colors">
      <p className="text-[10px] uppercase tracking-[0.2em] text-[#FF7A30] font-bold">{label}</p>
      <p className="mt-1 text-sm font-semibold text-white">{value}</p>
      <p className="mt-1 text-[11px] leading-5 text-[#A3A3A3]">{helper}</p>
    </div>
  );
}

function QueueCard({ title, description, to }) {
  return (
    <Link
      to={to}
      className="rounded-[22px] border border-white/10 bg-white/[0.02] p-5 no-underline hover:border-[#D94F10]/50 hover:bg-white/[0.05] transition-all"
    >
      <p className="text-sm font-semibold text-white/95">{title}</p>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
    </Link>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[24px] border border-dashed border-white/10 bg-white/[0.01] p-6 text-center">
      <h3 className="text-base font-semibold text-white/80">{title}</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">{description}</p>
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
