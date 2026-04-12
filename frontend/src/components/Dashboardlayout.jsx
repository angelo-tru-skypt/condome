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

  const nav = isSystemAdmin
    ? SYSTEM_MONITOR_NAV
    : isCondoAdmin
      ? ADMIN_NAV
      : isResident
        ? RESIDENT_NAV
        : PROPERTY_OWNER_NAV;

  const theme = isSystemAdmin
    ? {
        sidebar: "#080808",
        brand: "linear-gradient(135deg, #FF7A30, #D94F10)",
        activeBg: "rgba(217,79,16,0.16)",
        badgeBg: "rgba(217,79,16,0.16)",
        badgeText: "#FFB184",
        mainBg: "#060606",
        shellBackground: "radial-gradient(circle at top left, rgba(255,122,48,0.08), transparent 28%), #060606",
        mainTextColor: "#F7F2EC",
        mutedTextColor: "#B2A497",
        headerBg: "rgba(10,10,10,0.94)",
        headerBorder: "#241D18",
        headerLabelColor: "#FF9A63",
        panelLabel: "System Monitor",
        panelCopy: "Monitorea todos los condominios, movimientos y alertas del ecosistema sin perder trazabilidad.",
        pageChip: "Vista de monitoreo global del sistema",
        panelLabelColor: "#FFBE98",
        panelCopyColor: "#CDBFB2",
        panelBg: "#121212",
        panelBorder: "#2B231E",
        sidebarText: "#A8998E",
        sidebarTextActive: "#F8F2EC",
        navSectionText: "#7C7169",
        navDivider: "#211B17",
        userPanelBg: "#111111",
        userPanelBorder: "#29211C",
        controlBg: "#111111",
        controlHoverBg: "#181411",
        controlBorder: "#29211C",
        headerChipBg: "#131313",
        headerChipText: "#DDD0C3",
        surfaceShadow: "0 18px 42px rgba(0,0,0,0.28)",
      }
    : isCondoAdmin
      ? {
          sidebar: "#0F0F0F",
          brand: "linear-gradient(135deg, #FF7A30, #D94F10)",
          activeBg: "rgba(217,79,16,0.15)",
          badgeBg: "rgba(217,79,16,0.14)",
          badgeText: "#FFAA79",
          mainBg: "#090909",
          shellBackground: "radial-gradient(circle at top left, rgba(255,122,48,0.07), transparent 24%), #090909",
          mainTextColor: "#F6F0E9",
          mutedTextColor: "#B5A79B",
          headerBg: "rgba(16,16,16,0.94)",
          headerBorder: "#28201B",
          headerLabelColor: "#FF8B4A",
          panelLabel: "Administracion del condominio",
          panelCopy: "Organiza la operacion del condominio con un panel mas legible, ordenado y centrado en decisiones rapidas.",
          pageChip: "Panel administrativo de condominio",
          panelLabelColor: "#FFB184",
          panelCopyColor: "#CDBFB2",
          panelBg: "#151515",
          panelBorder: "#2A221C",
          sidebarText: "#A99B90",
          sidebarTextActive: "#F6F0E9",
          navSectionText: "#7D7269",
          navDivider: "#231D18",
          userPanelBg: "#121212",
          userPanelBorder: "#2A221C",
          controlBg: "#131313",
          controlHoverBg: "#1A1612",
          controlBorder: "#2A221C",
          headerChipBg: "#151515",
          headerChipText: "#D9CBBF",
          surfaceShadow: "0 18px 42px rgba(0,0,0,0.24)",
        }
      : isResident
        ? {
            sidebar: "#FBF6F0",
            brand: "linear-gradient(135deg, #1FA7A0, #1A6B9A)",
            activeBg: "rgba(26,107,154,0.10)",
            badgeBg: "rgba(26,107,154,0.11)",
            badgeText: "#16616B",
            mainBg: "#F5F1EA",
            shellBackground: "radial-gradient(circle at top left, rgba(26,107,154,0.06), transparent 28%), #F5F1EA",
            mainTextColor: "#1F1A16",
            mutedTextColor: "#6A6A67",
            headerBg: "rgba(255,252,248,0.96)",
            headerBorder: "#E3D9CF",
            headerLabelColor: "#16616B",
            panelLabel: "Centro del residente",
            panelCopy: "Resuelve visitas, pagos y reservas desde una interfaz mas clara y descansada visualmente.",
            pageChip: "Modo residente",
            panelLabelColor: "#16616B",
            panelCopyColor: "#5F5B56",
            panelBg: "#FFFBF8",
            panelBorder: "#E5DAD0",
            sidebarText: "#5E5750",
            sidebarTextActive: "#1F1A16",
            navSectionText: "#8A8178",
            navDivider: "#E6DBD2",
            userPanelBg: "#FFF9F3",
            userPanelBorder: "#E5DAD0",
            controlBg: "#FFF9F3",
            controlHoverBg: "#F1E9E1",
            controlBorder: "#E5DAD0",
            headerChipBg: "#EEF6F5",
            headerChipText: "#355654",
            surfaceShadow: "0 18px 42px rgba(71,52,38,0.08)",
          }
        : {
            sidebar: "linear-gradient(180deg, #050505 0%, #1A1612 85%, #D94F10 160%)",
            brand: "linear-gradient(135deg, #FF7A30 0%, #D94F10 100%)",
            activeBg: "linear-gradient(90deg, #D94F10 0%, #FF7A30 100%)",
            badgeBg: "rgba(217,79,16,0.12)",
            badgeText: "#D94F10",
            mainBg: "#F6F1EB",
            shellBackground:
              "radial-gradient(circle at top left, rgba(217,79,16,0.08), transparent 28%), radial-gradient(circle at 82% 12%, rgba(26,107,154,0.06), transparent 32%), #F6F1EB",
            mainTextColor: "#1F1A16",
            mutedTextColor: "#6D625A",
            headerBg: "rgba(255,252,249,0.96)",
            headerBorder: "#E4D7CB",
            headerLabelColor: "#B15A27",
            panelLabel: "Propietario encargado",
            panelCopy: "Administra el arranque, la operacion y la supervision de tu condominio desde un entorno claro y profesional.",
            pageChip: "Gestion del condominio",
            panelLabelColor: "#D94F10",
            panelCopyColor: "#6D625A",
            panelBg: "#FFFFFF",
            panelBorder: "#E6D9CD",
            sidebarText: "#8C8177",
            sidebarTextActive: "#FFFFFF",
            navSectionText: "#4E4640",
            navDivider: "rgba(255,255,255,0.05)",
            userPanelBg: "rgba(255,255,255,0.05)",
            userPanelBorder: "rgba(255,255,255,0.1)",
            controlBg: "#FFFFFF",
            controlHoverBg: "#F8F1EA",
            controlBorder: "#E6D9CD",
            headerChipBg: "#F4ECE4",
            headerChipText: "#5E5248",
            surfaceShadow: "0 18px 42px rgba(71,52,38,0.08)",
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
          return item;
        }
      }
    }
    return nav[0].items[0];
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
    <div className="flex h-screen overflow-hidden" style={{ background: theme.shellBackground, color: theme.mainTextColor }}>
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-20 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`
          flex flex-col z-30 flex-shrink-0
          transition-all duration-300 ease-in-out fixed lg:relative h-full
          ${mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"}
          ${collapsed ? "w-[78px]" : "w-[294px]"}
        `}
        style={{
          background: theme.sidebar,
          borderRight: `1px solid ${theme.headerBorder}`,
          boxShadow: theme.surfaceShadow,
        }}
      >
        <div
          className={`flex items-center min-h-[72px] px-4 ${collapsed ? "justify-center" : "justify-between"}`}
          style={{ borderBottom: `1px solid ${theme.headerBorder}` }}
        >
          {!collapsed ? (
            <div className="flex items-center gap-3">
              <div
                className="w-10 h-10 rounded-[18px] flex items-center justify-center flex-shrink-0 shadow-sm"
                style={{ background: theme.brand }}
              >
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white" />
                </svg>
              </div>
              <div>
                <p
                  className="text-[15px] font-semibold tracking-wide"
                  style={{ fontFamily: "'Playfair Display', serif", color: theme.mainTextColor }}
                >
                  Condome
                </p>
                <p className="text-[10px] uppercase tracking-[0.24em]" style={{ color: theme.mutedTextColor }}>
                  Workspace
                </p>
              </div>
            </div>
          ) : (
            <div
              className="w-10 h-10 rounded-[18px] flex items-center justify-center shadow-sm"
              style={{ background: theme.brand }}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 01-1 1H4a1 1 0 01-1-1V9.5z" fill="white" />
              </svg>
            </div>
          )}

          {!collapsed && (
            <button
              onClick={() => setCollapsed(true)}
              className="p-2 rounded-xl transition-colors bg-transparent border-none cursor-pointer"
              style={{ color: theme.mutedTextColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.controlHoverBg;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <IconChevronLeft />
            </button>
          )}
        </div>

        {!collapsed && (
          <div className="px-4 py-4" style={{ borderBottom: `1px solid ${theme.headerBorder}` }}>
            <div
              className="rounded-[24px] p-4"
              style={{
                backgroundColor: theme.panelBg,
                border: `1px solid ${theme.panelBorder}`,
              }}
            >
              <p
                className="text-[10px] uppercase tracking-[0.24em] font-semibold"
                style={{ color: theme.panelLabelColor }}
              >
                {theme.panelLabel}
              </p>
              <p className="mt-2 text-sm leading-6" style={{ color: theme.panelCopyColor }}>
                {theme.panelCopy}
              </p>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto py-4 px-2.5 space-y-2 scrollbar-hide">
          {nav.map((group) => (
            <div key={group.section}>
              {!collapsed ? (
                <p
                  className="text-[10px] font-semibold tracking-[0.18em] uppercase px-3 py-2 mt-1"
                  style={{ color: theme.navSectionText }}
                >
                  {group.section}
                </p>
              ) : (
                <div className="h-px mx-2 my-3" style={{ backgroundColor: theme.navDivider }} />
              )}

              {group.items.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  end={item.to === "/"}
                  className={({ isActive }) =>
                    `
                    flex items-center gap-3 px-3.5 py-3.5 rounded-[22px] transition-all duration-150 group relative
                    ${collapsed ? "justify-center" : ""}
                  `
                  }
                  style={({ isActive }) =>
                    isActive
                      ? {
                          background: theme.activeBg,
                          color: theme.sidebarTextActive,
                          boxShadow: "inset 0 0 0 1px rgba(255,255,255,0.04)",
                        }
                      : { backgroundColor: "transparent", color: theme.sidebarText }
                  }
                  onClick={() => setMobileOpen(false)}
                >
                  <span className="flex-shrink-0 w-4 h-4">{item.icon}</span>
                  {!collapsed && (
                    <div className="min-w-0">
                      <p className="text-[13px] font-semibold truncate">{item.label}</p>
                      <p className="mt-0.5 text-[11px] leading-5 truncate text-current/65">{item.description}</p>
                    </div>
                  )}
                  {collapsed && (
                    <span
                      className="absolute left-full ml-2 px-2.5 py-1.5 text-xs rounded-xl opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-lg"
                      style={{
                        backgroundColor: theme.userPanelBg,
                        border: `1px solid ${theme.userPanelBorder}`,
                        color: theme.mainTextColor,
                      }}
                    >
                      {item.label}
                    </span>
                  )}
                </NavLink>
              ))}
            </div>
          ))}
        </nav>

        <div className={`p-3 ${collapsed ? "flex justify-center" : ""}`} style={{ borderTop: `1px solid ${theme.headerBorder}` }}>
          {!collapsed ? (
            <div
              className="rounded-[22px] p-3 shadow-sm"
              style={{
                backgroundColor: theme.userPanelBg,
                border: `1px solid ${theme.userPanelBorder}`,
              }}
            >
              <div className="flex items-center gap-2.5">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0 shadow-sm"
                  style={{ background: theme.brand }}
                >
                  {user?.name?.charAt(0)?.toUpperCase() || "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-semibold truncate" style={{ color: theme.mainTextColor }}>
                    {user?.name || "Usuario"}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: theme.mutedTextColor }}>{safeRole}</p>
                </div>
                <button
                  onClick={handleLogout}
                  className="p-2 rounded-xl transition-colors bg-transparent border-none cursor-pointer flex-shrink-0"
                  title="Cerrar sesion"
                  style={{ color: theme.mutedTextColor }}
                  onMouseEnter={(event) => {
                    event.currentTarget.style.backgroundColor = theme.controlHoverBg;
                    event.currentTarget.style.color = theme.headerLabelColor;
                  }}
                  onMouseLeave={(event) => {
                    event.currentTarget.style.backgroundColor = "transparent";
                    event.currentTarget.style.color = theme.mutedTextColor;
                  }}
                >
                  <IconLogout />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="p-2 rounded-xl transition-colors bg-transparent border-none cursor-pointer"
              title="Cerrar sesion"
              style={{ color: theme.mutedTextColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.controlHoverBg;
                event.currentTarget.style.color = theme.headerLabelColor;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
                event.currentTarget.style.color = theme.mutedTextColor;
              }}
            >
              <IconLogout />
            </button>
          )}
        </div>

        {collapsed && (
          <button
            onClick={() => setCollapsed(false)}
            className="absolute -right-3 top-20 w-7 h-7 rounded-full flex items-center justify-center shadow-lg border-none cursor-pointer transition-colors"
            style={{
              backgroundColor: theme.userPanelBg,
              color: theme.headerLabelColor,
              border: `1px solid ${theme.userPanelBorder}`,
            }}
          >
            <IconChevronRight />
          </button>
        )}
      </aside>

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header
          className="h-[96px] flex items-center px-5 md:px-6 xl:px-8 gap-4 flex-shrink-0 backdrop-blur-sm"
          style={{
            background: theme.headerBg,
            borderBottom: `1px solid ${theme.headerBorder}`,
            boxShadow: theme.surfaceShadow,
          }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="lg:hidden p-2.5 rounded-xl bg-transparent border-none cursor-pointer"
            style={{ color: theme.mutedTextColor }}
            onMouseEnter={(event) => {
              event.currentTarget.style.backgroundColor = theme.controlHoverBg;
            }}
            onMouseLeave={(event) => {
              event.currentTarget.style.backgroundColor = "transparent";
            }}
          >
            <IconMenu />
          </button>

          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] uppercase tracking-[0.22em] font-semibold"
              style={{ color: theme.headerLabelColor }}
            >
              {currentPage.label}
            </p>
            <h2 className="mt-1 text-[1.35rem] md:text-[1.55rem] leading-tight font-semibold" style={{ color: theme.mainTextColor }}>
              Bienvenido, {firstName}
            </h2>
            <p className="mt-1 text-sm truncate" style={{ color: `${theme.mutedTextColor}E6` }}>
              {currentPage.description}
            </p>
          </div>

          <div className="hidden md:flex items-center gap-2.5">
            {!isResident && condominios.length ? (
              <label
                className="flex items-center gap-2.5 px-3.5 py-2.5 rounded-full"
                style={{ backgroundColor: theme.controlBg, border: `1px solid ${theme.controlBorder}` }}
              >
                <span className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color: theme.mutedTextColor }}>
                  Condominio
                </span>
                {condominios.length > 1 ? (
                  <select
                    value={activeCondominioId || ""}
                    onChange={(event) => setCondominioActivo(event.target.value)}
                    className="bg-transparent text-sm font-semibold border-none outline-none"
                    style={{ color: theme.mainTextColor }}
                  >
                    {condominios.map((item) => (
                      <option key={item.id} value={item.id} style={{ backgroundColor: theme.controlBg, color: theme.mainTextColor }}>
                        {item.nombre}
                      </option>
                    ))}
                  </select>
                ) : (
                  <span className="text-sm font-semibold" style={{ color: theme.mainTextColor }}>
                    {condominio?.nombre || condominios[0]?.nombre}
                  </span>
                )}
              </label>
                ) : null}
            {!isResident && !condominios.length ? (
              <NavLink
                to="/condominio/nuevo"
                className="px-3.5 py-2 rounded-full text-xs font-semibold no-underline"
                style={{
                  backgroundColor: theme.badgeBg,
                  color: theme.badgeText,
                  border: `1px solid ${theme.controlBorder}`,
                }}
              >
                Registrar condominio
              </NavLink>
            ) : null}
            <span
              className="px-3.5 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: theme.badgeBg, color: theme.badgeText }}
            >
              {safeRole}
            </span>
            <span
              className="px-3.5 py-2 rounded-full text-xs font-semibold"
              style={{ backgroundColor: theme.headerChipBg, color: theme.headerChipText }}
            >
              {theme.pageChip}
            </span>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              className="relative p-2.5 rounded-xl bg-transparent border-none cursor-pointer transition-colors"
              style={{ color: theme.mutedTextColor }}
              onMouseEnter={(event) => {
                event.currentTarget.style.backgroundColor = theme.controlHoverBg;
              }}
              onMouseLeave={(event) => {
                event.currentTarget.style.backgroundColor = "transparent";
              }}
            >
              <IconBell />
              <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-[#D94F10] rounded-full" />
            </button>
            <div
              className="w-10 h-10 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-sm"
              style={{ background: theme.brand }}
            >
              {user?.name?.charAt(0)?.toUpperCase() || "U"}
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-y-auto px-4 py-5 md:px-6 md:py-6 xl:px-8" style={{ color: theme.mainTextColor }}>
          <div className="mx-auto w-full max-w-[1480px]">
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
