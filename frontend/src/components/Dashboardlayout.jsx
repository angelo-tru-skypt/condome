import { useMemo, useState } from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import { getRoleLabel, isSystemAdminRole, isCondoAdminRole, isResidentRole, isPropertyOwnerRole } from "../utils/roles";

const ADMIN_NAV = [
  {
    section: "Gobierno",
    items: [
      {
        to: "/",
        icon: <IconGrid />,
        label: "Dashboard admin",
        description: "Centro de control, alertas y prioridades operativas del dia.",
      },
      {
        to: "/condominio",
        icon: <IconBuilding />,
        label: "Condominios",
        description: "Registro maestro, contexto multi-condominio y datos base.",
      },
    ],
  },
  {
    section: "Estructura",
    items: [
      {
        to: "/edificios",
        icon: <IconBlocks />,
        label: "Edificios",
        description: "Torres, bloques y niveles del condominio.",
      },
      {
        to: "/apartamentos",
        icon: <IconDoor />,
        label: "Apartamentos",
        description: "Unidades, estados y ocupacion.",
      },
    ],
  },
  {
    section: "Personas",
    items: [
      {
        to: "/propietarios",
        icon: <IconKey />,
        label: "Propietarios",
        description: "Responsables de cada unidad y relacion contractual.",
      },
      {
        to: "/residentes",
        icon: <IconUsers />,
        label: "Residentes",
        description: "Personas activas dentro del condominio.",
      },
      {
        to: "/roles",
        icon: <IconShield />,
        label: "Roles y permisos",
        description: "Control de acceso por perfil operativo.",
      },
      {
        to: "/visitas",
        icon: <IconEye />,
        label: "Visitas",
        description: "Ingresos temporales y autorizaciones.",
      },
      {
        to: "/vehiculos",
        icon: <IconCar />,
        label: "Vehiculos",
        description: "Parqueos, placas y autorizaciones.",
      },
    ],
  },
  {
    section: "Operacion",
    items: [
      {
        to: "/avisos",
        icon: <IconBell />,
        label: "Avisos",
        description: "Comunicados y cartelera del condominio.",
      },
      {
        to: "/reservas",
        icon: <IconCalendar />,
        label: "Reservas",
        description: "Areas comunes, horarios y aprobaciones.",
      },
      {
        to: "/incidencias",
        icon: <IconTool />,
        label: "Incidencias",
        description: "Reclamos, seguimiento y soporte.",
      },
      {
        to: "/documentos",
        icon: <IconFile />,
        label: "Documentos",
        description: "Biblioteca oficial del condominio.",
      },
    ],
  },
  {
    section: "Finanzas",
    items: [
      {
        to: "/cuotas",
        icon: <IconReceipt />,
        label: "Cuotas",
        description: "Cargos recurrentes y plan de cobranza.",
      },
      {
        to: "/pagos",
        icon: <IconCard />,
        label: "Pagos en linea",
        description: "Transacciones, conciliacion y seguimiento.",
      },
      {
        to: "/historial",
        icon: <IconHistory />,
        label: "Historial",
        description: "Pagos por unidad, persona o periodo.",
      },
      {
        to: "/morosidad",
        icon: <IconAlert />,
        label: "Morosidad",
        description: "Casos vencidos y recuperacion de deuda.",
      },
      {
        to: "/reportes",
        icon: <IconChart />,
        label: "Reportes",
        description: "Analitica y exportaciones de gestion.",
      },
    ],
  },
  {
    section: "Supervision",
    items: [
      {
        to: "/notificaciones",
        icon: <IconNotif />,
        label: "Notificaciones",
        description: "Reglas automaticas, alertas y seguimiento administrativo.",
      },
      {
        to: "/acceso",
        icon: <IconLock />,
        label: "Control de acceso",
        description: "Seguridad y trazabilidad de ingresos.",
      },
      {
        to: "/auditoria",
        icon: <IconAudit />,
        label: "Auditoria",
        description: "Bitacora de acciones y cambios relevantes.",
      },
      {
        to: "/configuracion",
        icon: <IconSettings />,
        label: "Configuracion",
        description: "Parametros generales del condominio.",
      },
    ],
  },
];

const PROPERTY_OWNER_NAV = [
  {
    section: "Arranque",
    items: [
      {
        to: "/",
        icon: <IconGrid />,
        label: "Panel del condominio",
        description: "Vista principal del propietario encargado y prioridades de gestion.",
      },
      {
        to: "/condominio/nuevo",
        icon: <IconCompass />,
        label: "Registro inicial",
        description: "Primer paso para crear y habilitar tu condominio en la plataforma.",
      },
      {
        to: "/condominio",
        icon: <IconBuilding />,
        label: "Mi condominio",
        description: "Ficha maestra, datos base y accesos de configuracion.",
      },
    ],
  },
  {
    section: "Estructura",
    items: [
      {
        to: "/edificios",
        icon: <IconBlocks />,
        label: "Edificios",
        description: "Torres, bloques y niveles registrados en el condominio.",
      },
      {
        to: "/apartamentos",
        icon: <IconDoor />,
        label: "Apartamentos",
        description: "Unidades, estados de ocupacion y contexto estructural.",
      },
      {
        to: "/residentes",
        icon: <IconUsers />,
        label: "Residentes",
        description: "Personas activas y relacion con cada unidad.",
      },
      {
        to: "/propietarios",
        icon: <IconKey />,
        label: "Propietarios",
        description: "Responsables por unidad y gestion comunitaria.",
      },
    ],
  },
  {
    section: "Operacion",
    items: [
      {
        to: "/avisos",
        icon: <IconBell />,
        label: "Avisos",
        description: "Comunicados, cartelera y publicaciones del condominio.",
      },
      {
        to: "/visitas",
        icon: <IconEye />,
        label: "Visitas",
        description: "Solicitudes de acceso, aprobaciones y seguimiento.",
      },
      {
        to: "/reservas",
        icon: <IconCalendar />,
        label: "Reservas",
        description: "Amenidades, aprobaciones y ocupacion de espacios.",
      },
      {
        to: "/incidencias",
        icon: <IconTool />,
        label: "Incidencias",
        description: "Soporte, reclamos y resolucion operativa.",
      },
      {
        to: "/documentos",
        icon: <IconFile />,
        label: "Documentos",
        description: "Biblioteca oficial, reglamentos y archivos clave.",
      },
      {
        to: "/vehiculos",
        icon: <IconCar />,
        label: "Vehiculos",
        description: "Registros de movilidad y autorizaciones de acceso.",
      },
    ],
  },
  {
    section: "Finanzas",
    items: [
      {
        to: "/cuotas",
        icon: <IconReceipt />,
        label: "Cuotas",
        description: "Plantillas de cobro, cargos y resumen financiero.",
      },
      {
        to: "/pagos",
        icon: <IconCard />,
        label: "Pagos",
        description: "Transacciones registradas y control de cobros.",
      },
      {
        to: "/historial",
        icon: <IconHistory />,
        label: "Historial",
        description: "Trazabilidad de pagos cerrados y referencias.",
      },
      {
        to: "/morosidad",
        icon: <IconAlert />,
        label: "Morosidad",
        description: "Deuda vencida, seguimiento y recuperacion.",
      },
      {
        to: "/reportes",
        icon: <IconChart />,
        label: "Reportes",
        description: "Indicadores, resumenes y exportaciones de gestion.",
      },
    ],
  },
  {
    section: "Control",
    items: [
      {
        to: "/notificaciones",
        icon: <IconNotif />,
        label: "Notificaciones",
        description: "Alertas del sistema, recordatorios y seguimiento.",
      },
      {
        to: "/acceso",
        icon: <IconLock />,
        label: "Control de acceso",
        description: "Politicas operativas y trazabilidad de ingresos.",
      },
      {
        to: "/auditoria",
        icon: <IconAudit />,
        label: "Auditoria",
        description: "Bitacora del condominio y movimientos recientes.",
      },
      {
        to: "/configuracion",
        icon: <IconSettings />,
        label: "Configuracion",
        description: "Parametros base, reglas y datos generales del condominio.",
      },
    ],
  },
];

const RESIDENT_NAV = [
  {
    section: "Panorama",
    items: [
      {
        to: "/",
        icon: <IconGrid />,
        label: "Centro del residente",
        description: "Resumen personal y accesos rapidos para tu dia a dia.",
      },
      {
        to: "/mi-residencia",
        icon: <IconBuilding />,
        label: "Mi residencia",
        description: "Informacion base de tu unidad y gestiones conectadas.",
      },
    ],
  },
  {
    section: "Gestiones",
    items: [
      {
        to: "/visitas",
        icon: <IconEye />,
        label: "Visitas",
        description: "Autoriza invitados, entregas y accesos temporales.",
      },
      {
        to: "/vehiculos",
        icon: <IconCar />,
        label: "Vehiculos",
        description: "Consulta y organiza los vehiculos de tu unidad.",
      },
      {
        to: "/reservas",
        icon: <IconCalendar />,
        label: "Reservas",
        description: "Solicita amenidades y revisa disponibilidad.",
      },
      {
        to: "/incidencias",
        icon: <IconTool />,
        label: "Incidencias",
        description: "Reporta problemas y sigue su avance.",
      },
    ],
  },
  {
    section: "Comunidad",
    items: [
      {
        to: "/avisos",
        icon: <IconBell />,
        label: "Avisos",
        description: "Recibe comunicados y novedades del condominio.",
      },
      {
        to: "/documentos",
        icon: <IconFile />,
        label: "Documentos",
        description: "Consulta reglamentos y archivos compartidos.",
      },
      {
        to: "/notificaciones",
        icon: <IconNotif />,
        label: "Notificaciones",
        description: "Alertas de pagos, visitas y seguimiento personal.",
      },
    ],
  },
  {
    section: "Finanzas",
    items: [
      {
        to: "/pagos",
        icon: <IconCard />,
        label: "Pagos",
        description: "Realiza tus pagos y valida el estado de cuenta.",
      },
      {
        to: "/historial",
        icon: <IconHistory />,
        label: "Historial",
        description: "Revisa comprobantes y transacciones previas.",
      },
    ],
  },
];

const SYSTEM_MONITOR_NAV = [
  {
    section: "Monitor",
    items: [
      {
        to: "/",
        icon: <IconGrid />,
        label: "Centro de monitoreo",
        description: "Vista consolidada de todo el ecosistema.",
      },
      {
        to: "/condominio",
        icon: <IconBuilding />,
        label: "Condominios",
        description: "Todos los condominios registrados en la plataforma.",
      },
    ],
  },
  {
    section: "Supervision",
    items: [
      {
        to: "/auditoria",
        icon: <IconAudit />,
        label: "Auditoria",
        description: "Bitacora global de acciones del sistema.",
      },
      {
        to: "/reportes",
        icon: <IconChart />,
        label: "Reportes",
        description: "Analitica consolidada multi-condominio.",
      },
      {
        to: "/notificaciones",
        icon: <IconNotif />,
        label: "Notificaciones",
        description: "Alertas y seguimiento del sistema.",
      },
    ],
  },
  {
    section: "Control",
    items: [
      {
        to: "/roles",
        icon: <IconShield />,
        label: "Roles y permisos",
        description: "Control de acceso global por perfil.",
      },
      {
        to: "/acceso",
        icon: <IconLock />,
        label: "Politicas de acceso",
        description: "Seguridad y trazabilidad de ingresos.",
      },
      {
        to: "/configuracion",
        icon: <IconSettings />,
        label: "Configuracion",
        description: "Parametros generales del sistema.",
      },
    ],
  },
];

export default function DashboardLayout() {
  const { user, logout } = useAuth();
  const { condominios, condominio, activeCondominioId, setCondominioActivo } = useCondominio();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const roleValue = user?.role || user?.rol;
  const isResident = isResidentRole(roleValue);
  const isSystemAdmin = isSystemAdminRole(roleValue);
  const isCondoAdmin = isCondoAdminRole(roleValue);
  const isPropertyOwner = isPropertyOwnerRole(roleValue);
  const hasRegisteredCondominio = Boolean(condominio?.id || activeCondominioId || condominios.length);

  const nav = useMemo(() => {
    const baseNav = isSystemAdmin
      ? SYSTEM_MONITOR_NAV
      : isCondoAdmin
        ? ADMIN_NAV
        : isResident
          ? RESIDENT_NAV
          : PROPERTY_OWNER_NAV;

    if (!isPropertyOwner) return baseNav;

    return baseNav
      .map((group) => ({
        ...group,
        items: group.items.filter((item) => {
          if (item.to === "/condominio/nuevo") {
            return !hasRegisteredCondominio;
          }
          return true;
        }),
      }))
      .filter((group) => group.items.length > 0);
  }, [hasRegisteredCondominio, isCondoAdmin, isPropertyOwner, isResident, isSystemAdmin]);
  const shellMeta = isSystemAdmin
    ? {
        panelLabel: "Monitoreo global",
        panelCopy: "Supervisa condominios, movimientos y alertas con una vista clara y ejecutiva.",
        pageChip: "Supervisor del sistema",
      }
    : isCondoAdmin
      ? {
          panelLabel: "Administracion activa",
          panelCopy: "Organiza operacion, finanzas y comunidad desde un panel mas estructurado.",
          pageChip: "Administrador de condominio",
        }
      : isResident
        ? {
            panelLabel: "Portal residencial",
            panelCopy: "Resuelve visitas, pagos y soporte desde una experiencia mas limpia y directa.",
            pageChip: "Experiencia del residente",
          }
        : {
            panelLabel: "Gestion del propietario",
            panelCopy: "Controla estructura, comunidad y seguimiento del condominio con mejor jerarquia visual.",
            pageChip: "Propietario gestor",
          };

  const currentPage = useMemo(() => {
    const normalizedPath = location.pathname.replace(/\/+$/, "") || "/";
    for (const group of nav) {
      for (const item of group.items) {
        const normalizedTarget = item.to.replace(/\/+$/, "") || "/";
        const matchesRoot = normalizedTarget === "/" && (normalizedPath === "/" || normalizedPath.endsWith("/dashboard"));
        const matchesPath =
          normalizedPath === normalizedTarget ||
          (normalizedTarget !== "/" && normalizedPath.endsWith(normalizedTarget));

        if (matchesRoot || matchesPath) {
          return { ...item, section: group.section };
        }
      }
    }
    return { ...nav[0].items[0], section: nav[0].section };
  }, [location.pathname, nav]);

  const handleLogout = async () => {
    await logout();
    navigate("/login");
  };

  const safeRole = getRoleLabel(roleValue);
  const firstName =
    user?.name?.split(" ")[0] ||
    (isResident ? "Residente" : isSystemAdmin ? "Admin" : isCondoAdmin ? "Admin" : isPropertyOwner ? "Propietario" : "Usuario");

  return (
    <div className="relative flex h-screen overflow-hidden text-[var(--fg-primary)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-10rem] h-[28rem] w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,48,0.16),_transparent_68%)]" />
        <div className="absolute right-[-10rem] top-[5rem] h-[24rem] w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(217,79,16,0.12),_transparent_68%)]" />
        <div className="absolute bottom-[-10rem] right-[8%] h-[20rem] w-[20rem] rounded-full bg-[radial-gradient(circle,_rgba(18,17,16,0.06),_transparent_70%)]" />
      </div>

      {mobileOpen && (
        <div
          className="fixed inset-0 z-30 bg-[#121110]/35 backdrop-blur-sm lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          fixed inset-y-0 left-0 z-40 flex h-full flex-col overflow-hidden
          transition-all duration-300 ease-in-out lg:relative lg:h-full
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[92px]" : "w-[332px]"}
        `}
        style={{
          background: "linear-gradient(180deg, #080808 0%, #17120F 52%, #D94F10 165%)",
          borderRight: "1px solid rgba(255,255,255,0.08)",
          boxShadow: "18px 0 48px rgba(18,17,16,0.18)",
        }}
      >
        <div
          className={`flex min-h-[82px] items-center border-b border-white/10 px-4 ${collapsed ? "justify-center" : "justify-between"}`}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="signal-ring flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-white"
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white" />
                </svg>
              </div>
              <div>
                <p className="text-[1.05rem] font-semibold tracking-wide text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  Condome
                </p>
                <p className="text-[10px] uppercase tracking-[0.26em] text-white/45">
                  Navegacion principal
                </p>
              </div>
            </div>
          ) : (
            <div className="signal-ring flex h-11 w-11 items-center justify-center rounded-[18px] bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white" />
              </svg>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="cursor-pointer rounded-2xl border-none bg-transparent p-2.5 text-white/58 transition-colors hover:bg-white/10 hover:text-white"
            >
              <IconChevronLeft />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="border-b border-white/10 px-4 py-3">
            <p className="text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FFB184]">
              {shellMeta.panelLabel}
            </p>
            <p className="mt-2 text-[13px] leading-6 text-white/70">
              {currentPage.section} · {currentPage.label}
            </p>
          </div>
        )}

        <nav className="scrollbar-hide flex-1 space-y-3 overflow-y-auto px-3 py-3">
          {nav.map((group) => (
            <section
              key={group.section}
              className={`rounded-[20px] border border-white/8 bg-white/[0.04] p-2 ${
                collapsed ? "px-1.5" : ""
              }`}
            >
              {!collapsed ? (
                <p className="mt-0.5 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-[0.22em] text-[#FFB184]">
                  {group.section}
                </p>
              ) : (
                <div className="mx-3 my-2.5 h-px bg-white/10" />
              )}

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    [
                      "group relative flex items-center gap-3 rounded-[18px] border px-3 py-2.5 transition-all duration-200 hover-glow-orange",
                      collapsed ? "justify-center" : "",
                      isActive
                        ? "translate-x-1 border-white/12 bg-[linear-gradient(135deg,rgba(255,122,48,0.24),rgba(217,79,16,0.34))] text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)]"
                        : "border-transparent text-white hover:border-white/10 hover:bg-white/8 hover:text-white",
                    ].join(" ")
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span
                    className={`flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-2xl ${
                      collapsed ? "" : "shadow-sm"
                    } bg-white/10 text-white group-hover:bg-[rgba(255,122,48,0.16)] group-hover:text-white`}
                  >
                    {item.icon}
                  </span>
                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="truncate text-[14px] font-semibold">{item.label}</p>
                      <p className="mt-0.5 truncate text-[11px] leading-5 text-white/68">{item.description}</p>
                    </div>
                  )}
                  {collapsed && (
                    <span
                      className="pointer-events-none absolute left-full z-50 ml-2 whitespace-nowrap rounded-2xl border border-white/10 bg-[#121110] px-3 py-2 text-xs text-white opacity-0 shadow-[0_14px_28px_rgba(0,0,0,0.2)] transition-opacity group-hover:opacity-100"
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </section>
          ))}
        </nav>

        <div className={`border-t border-white/10 p-3 ${collapsed ? "flex justify-center" : ""}`}>
          {!collapsed ? (
            <div className="rounded-[22px] border border-white/10 bg-white/[0.06] p-3">
              <div className="flex items-center gap-2.5">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-xs font-bold text-white shadow-[0_10px_20px_rgba(217,79,16,0.18)]">
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-[13px] font-semibold text-white">
                    {user?.name || "Usuario"}
                  </p>
                  <p className="truncate text-[10px] text-white/52">{safeRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="flex-shrink-0 cursor-pointer rounded-2xl border-none bg-transparent p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
                  title="Cerrar sesion"
                >
                  <IconLogout />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="cursor-pointer rounded-2xl border-none bg-transparent p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
              title="Cerrar sesion"
            >
              <IconLogout />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-24 flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-[#121110] text-white shadow-[0_14px_28px_rgba(0,0,0,0.18)] transition-colors hover:bg-[#1D1A18]"
          >
            <IconChevronRight />
          </button>
        )}
      </aside>

      <div className="relative flex min-w-0 flex-1 flex-col overflow-hidden">
        <div className="z-20 px-3 pt-3 md:px-5 xl:pl-8 xl:pr-8">
          <header className="architectural-panel flex min-h-[104px] items-center gap-4 rounded-[30px] px-5 py-4 md:px-6 xl:px-8">
          <button
            onClick={() => setMobileOpen(true)}
            className="cursor-pointer rounded-2xl border-none bg-transparent p-2.5 text-[var(--fg-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--fg-primary)] lg:hidden"
          >
            <IconMenu />
          </button>

          <div className="flex-1 min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--condome-orange)]">
              {currentPage.label}
            </p>
            <h2 className="mt-1 text-[1.35rem] font-semibold leading-tight text-[var(--fg-primary)] md:text-[1.7rem]">
              Bienvenido, {firstName}
            </h2>
            <p className="mt-1 truncate text-sm text-[var(--fg-secondary)]">
              {currentPage.description}
            </p>
          </div>

          <div className="hidden items-center gap-2.5 md:flex">
            {!isResident && condominios.length ? (
              <label
                className="flex items-center gap-2.5 rounded-full border border-[var(--border-standard)] bg-white px-3.5 py-2.5 shadow-[var(--shadow-whisper)]"
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-tertiary)]">
                  Condominio
                </span>
                {condominios.length > 1 ? (
                  <select
                    value={activeCondominioId || ""}
                    onChange={(event) => setCondominioActivo(event.target.value)}
                    className="border-none bg-transparent pr-8 text-sm font-semibold outline-none"
                    style={{
                      backgroundImage:
                        "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='6' viewBox='0 0 10 6' fill='none'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238C8076' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
                      backgroundPosition: "right 0.2rem center",
                      backgroundRepeat: "no-repeat",
                    }}
                  >
                    {condominios.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-semibold text-[var(--fg-primary)]">
                    {condominio?.nombre || condominios[0]?.nombre}
                  </span>
                )}
              </label>
            ) : null}
            {!isResident && !condominios.length ? (
              <NavLink
                to="/condominio/nuevo"
                className="rounded-full border border-[var(--control-border-strong)] bg-[var(--signal-orange-fog)] px-3.5 py-2 text-xs font-semibold text-[var(--condome-orange)] no-underline"
              >
                Registrar condominio
              </NavLink>
            ) : null}
            <span className="rounded-full bg-[var(--signal-orange-fog)] px-3.5 py-2 text-xs font-semibold text-[var(--condome-orange)]">
              {safeRole}
            </span>
            <span className="rounded-full border border-[var(--border-standard)] bg-white px-3.5 py-2 text-xs font-semibold text-[var(--fg-secondary)]">
              {shellMeta.pageChip}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              className="relative cursor-pointer rounded-2xl border-none bg-transparent p-2.5 text-[var(--fg-secondary)] transition-colors hover:bg-[var(--surface-3)] hover:text-[var(--fg-primary)]"
            >
              <IconBell />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D94F10] rounded-full" />
            </button>
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-xs font-bold text-white shadow-[0_10px_20px_rgba(217,79,16,0.18)]">
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>
        </div>

        <main className="flex-1 overflow-y-auto px-3 pb-6 pt-4 md:px-5 md:pb-8 md:pt-5 xl:px-8">
          <div key={location.pathname} className="mx-auto w-full max-w-[1480px] animate-soft-pop">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}

function IconGrid() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></svg>;
}
function IconBuilding() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 21V7a2 2 0 012-2h14a2 2 0 012 2v14" /><path d="M3 21h18M9 21V11h6v10" /></svg>;
}
function IconCompass() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="9" /><path d="M14.8 9.2L9 15l1.8-5.8L16.6 7.4 14.8 9.2z" /></svg>;
}
function IconBlocks() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="2" y="14" width="8" height="8" rx="1" /><rect x="14" y="14" width="8" height="8" rx="1" /><rect x="8" y="2" width="8" height="8" rx="1" /></svg>;
}
function IconDoor() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16" /><path d="M3 21h18" /><circle cx="15" cy="12" r="1" fill="currentColor" /></svg>;
}
function IconKey() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="7.5" cy="15.5" r="4.5" /><path d="M21 2l-9.6 9.6M15 8l2 2" /></svg>;
}
function IconUsers() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg>;
}
function IconShield() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" /></svg>;
}
function IconReceipt() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1z" /><path d="M9 7h6M9 11h6M9 15h4" /></svg>;
}
function IconCard() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="1" y="4" width="22" height="16" rx="2" /><path d="M1 10h22" /></svg>;
}
function IconHistory() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M3 12a9 9 0 109-9 9 9 0 00-9 9" /><path d="M3 12V6M3 12H9" /><path d="M12 7v5l3 3" /></svg>;
}
function IconAlert() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /><line x1="12" y1="9" x2="12" y2="13" /><line x1="12" y1="17" x2="12.01" y2="17" /></svg>;
}
function IconBell() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>;
}
function IconCalendar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>;
}
function IconEye() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" /><circle cx="12" cy="12" r="3" /></svg>;
}
function IconCar() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M5 17H3v-5l2-6h14l2 6v5h-2" /><path d="M5 17a2 2 0 104 0 2 2 0 00-4 0zM15 17a2 2 0 104 0 2 2 0 00-4 0z" /><path d="M5 12h14" /></svg>;
}
function IconTool() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14.7 6.3a1 1 0 000 1.4l1.6 1.6a1 1 0 001.4 0l3.77-3.77a6 6 0 01-7.94 7.94l-6.91 6.91a2.12 2.12 0 01-3-3l6.91-6.91a6 6 0 017.94-7.94l-3.76 3.76z" /></svg>;
}
function IconFile() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" /><polyline points="14,2 14,8 20,8" /><line x1="16" y1="13" x2="8" y2="13" /><line x1="16" y1="17" x2="8" y2="17" /><polyline points="10,9 9,9 8,9" /></svg>;
}
function IconChart() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" /></svg>;
}
function IconNotif() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M22 17H2a3 3 0 004-3V9a8 8 0 0116 0v5a3 3 0 004 3" /><path d="M13.73 21a2 2 0 01-3.46 0" /></svg>;
}
function IconLock() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><rect x="3" y="11" width="18" height="11" rx="2" /><path d="M7 11V7a5 5 0 0110 0v4" /></svg>;
}
function IconAudit() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9 11l3 3L22 4" /><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11" /></svg>;
}
function IconSettings() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-2 2 2 2 0 01-2-2v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83 0 2 2 0 010-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 01-2-2 2 2 0 012-2h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 010-2.83 2 2 0 012.83 0l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 012-2 2 2 0 012 2v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 0 2 2 0 010 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 012 2 2 2 0 01-2 2h-.09a1.65 1.65 0 00-1.51 1z" /></svg>;
}
function IconLogout() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" /></svg>;
}
function IconChevronLeft() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5"><path d="M15 18l-6-6 6-6" /></svg>;
}
function IconChevronRight() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3"><path d="M9 18l6-6-6-6" /></svg>;
}
function IconMenu() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-5 h-5"><path d="M3 12h18M3 6h18M3 18h18" /></svg>;
}
