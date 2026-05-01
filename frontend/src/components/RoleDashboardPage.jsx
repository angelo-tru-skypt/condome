import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import AdminDashboardPage from "../pages/AdminDashboardPage";
import SystemMonitorDashboardPage from "../pages/SystemMonitorDashboardPage";
import DashboardHome from "../pages/Dashboardhome";
import PropertyOwnerDashboardPage from "../pages/PropertyOwnerDashboardPage";
import ResidentDashboardHome from "../pages/ResidentDashboardHome";
import { isCondoAdminRole, isPropertyOwnerRole, isResidentRole, isSystemAdminRole } from "../utils/roles";
import OwnerModulePage from "./OwnerModulePage";
import PropertyOwnerModulePage from "./PropertyOwnerModulePage";
import ResidentModulePage from "./ResidentModulePage";

export function DashboardHomeByRole() {
  const { user } = useAuth();
  const role = user?.role || user?.rol;

  if (isResidentRole(role)) {
    return <ResidentDashboardHome />;
  }

  // Owner (super admin) → monitor global del sistema en dark mode
  if (isSystemAdminRole(role)) {
    return <SystemMonitorDashboardPage />;
  }

  // Admin de condominio → dashboard administrativo de su condominio (Dark)
  if (isCondoAdminRole(role)) {
    return <AdminDashboardPage />;
  }

  if (isPropertyOwnerRole(role)) {
    return <PropertyOwnerDashboardPage />;
  }

  // Fallback para roles heredados o inesperados.
  return <DashboardHome />;
}

export function ModulePageByRole({ ownerKey, residentKey = ownerKey }) {
  const { user } = useAuth();
  const roleValue = user?.role || user?.rol;

  if (isResidentRole(roleValue)) {
    return <ResidentModulePage moduleKey={residentKey} />;
  }

  // Vista administrativa para administradores
  if (isSystemAdminRole(roleValue) || isCondoAdminRole(roleValue) || isPropertyOwnerRole(roleValue)) {
    return <OwnerModulePage moduleKey={ownerKey} />;
  }

  // Vista del propietario para propietarios de unidad
  return <PropertyOwnerModulePage moduleKey={ownerKey} />;
}

// Acceso exclusivo al administrador del condominio o super admin
export function OwnerOnlyPage({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  if (isResidentRole(user?.role || user?.rol)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

export function PropertyOwnerOnlyPage({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  if (!isPropertyOwnerRole(user?.role || user?.rol)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

// Acceso a páginas administrativas del condominio
export function CondoAdminPage({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  if (
    !(
      isSystemAdminRole(user?.role || user?.rol) ||
      isCondoAdminRole(user?.role || user?.rol) ||
      isPropertyOwnerRole(user?.role || user?.rol)
    )
  ) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

// Acceso exclusivo a administradores del sistema (owner).
export function SystemOwnerOnlyPage({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  if (!isSystemAdminRole(user?.role || user?.rol)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}

export function SharedRolePage({ adminPage, ownerPage, residentPage }) {
  const { user } = useAuth();
  if (isResidentRole(user?.role || user?.rol)) {
    return residentPage;
  }
  if (
    isSystemAdminRole(user?.role || user?.rol) ||
    isCondoAdminRole(user?.role || user?.rol) ||
    isPropertyOwnerRole(user?.role || user?.rol)
  ) {
    return adminPage ?? ownerPage;
  }
  return ownerPage;
}

export function ResidentOnlyPage({ children, redirectTo = "/" }) {
  const { user } = useAuth();
  if (!isResidentRole(user?.role || user?.rol)) {
    return <Navigate to={redirectTo} replace />;
  }
  return children;
}
