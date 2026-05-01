import ApartamentosPage from "./pages/Apartamentos";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import DashboardLayout from "./components/Dashboardlayout";
import ProtectedRoute from "./components/ProtectedRoute";
import RegistroCondominio from "./components/condominio/RegistroCondominio";
import { AuthProvider } from "./context/AuthContext";
import { CondominioProvider } from "./context/CondominioContext";
import EdificiosPage from "./pages/Edificios";
import Landing from "./pages/Landing";
import Login from "./pages/login";
import MiCondominio from "./pages/MiCondominio";
import OwnerIncidentsPage from "./pages/OwnerIncidentsPage";
import OwnerAccessControlPage from "./pages/OwnerAccessControlPage";
import OwnerAuditPage from "./pages/OwnerAuditPage";
import OwnerCommunicationsPage from "./pages/OwnerCommunicationsPage";
import OwnerDocumentsPage from "./pages/OwnerDocumentsPage";
import OwnerReservationsPage from "./pages/OwnerReservationsPage";
import OwnerNotificationsPage from "./pages/OwnerNotificationsPage";
import OwnerBillingPage from "./pages/OwnerBillingPage";
import OwnerDelinquencyPage from "./pages/OwnerDelinquencyPage";
import OwnerReportsPage from "./pages/OwnerReportsPage";
import OwnerRolesPage from "./pages/OwnerRolesPage";
import OwnersManagementPage from "./pages/OwnersManagementPage";
import OwnerSettingsPage from "./pages/OwnerSettingsPage";
import OwnerVehiclesPage from "./pages/OwnerVehiclesPage";
import OwnerVisitsPage from "./pages/OwnerVisitsPage";
import BillingPaymentsPage from "./pages/BillingPaymentsPage";
import BillingHistoryPage from "./pages/BillingHistoryPage";
import Register from "./pages/register";
import ResidentIncidentsPage from "./pages/ResidentIncidentsPage";
import PlansPage from "./pages/PlansPage";
import PropertyOwnerModulePage from "./components/PropertyOwnerModulePage";
import ResidentProfilePage from "./pages/ResidentProfilePage";
import ResidentVisitsPage from "./pages/ResidentVisitsPage";
import ResidentesPage from "./pages/Residentes";
import ResidentModulePage from "./components/ResidentModulePage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import {
  CondoAdminPage,
  SystemOwnerOnlyPage,
  DashboardHomeByRole,
  OwnerOnlyPage,
  PropertyOwnerOnlyPage,
  ResidentOnlyPage,
  SharedRolePage,
} from "./components/RoleDashboardPage";
import { toDashboardPath } from "./utils/dashboardPaths";

const LEGACY_DASHBOARD_ROUTES = [
  "mi-residencia",
  "condominio",
  "condominio/nuevo",
  "edificios",
  "apartamentos",
  "residentes",
  "propietarios",
  "roles",
  "cuotas",
  "morosidad",
  "reportes",
  "visitas",
  "incidencias",
  "avisos",
  "reservas",
  "acceso",
  "auditoria",
  "configuracion",
  "documentos",
  "notificaciones",
  "vehiculos",
  "planes",
  "pagos",
  "historial",
];

export default function App() {
  return (
    <AuthProvider>
      <CondominioProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/landing" element={<Landing />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/verify-email" element={<VerifyEmailPage />} />
            {LEGACY_DASHBOARD_ROUTES.map((route) => (
              <Route
                key={route}
                path={route}
                element={<Navigate to={toDashboardPath(route)} replace />}
              />
            ))}

            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }
            >
              <Route index element={<DashboardHomeByRole />} />
              <Route
                path="mi-residencia"
                element={
                  <ResidentOnlyPage>
                    <ResidentProfilePage />
                  </ResidentOnlyPage>
                }
              />
              <Route
                path="perfil"
                element={
                  <ProtectedRoute>
                    <ResidentProfilePage />
                  </ProtectedRoute>
                }
              />
              <Route
                path="condominio"
                element={
                  <OwnerOnlyPage>
                    <MiCondominio />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="condominio/nuevo"
                element={
                  <OwnerOnlyPage>
                    <RegistroCondominio />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="edificios"
                element={
                  <OwnerOnlyPage>
                    <EdificiosPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="apartamentos"
                element={
                  <OwnerOnlyPage>
                    <ApartamentosPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="residentes"
                element={
                  <OwnerOnlyPage>
                    <ResidentesPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="propietarios"
                element={
                  <OwnerOnlyPage>
                    <OwnersManagementPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="roles"
                element={
                  <SystemOwnerOnlyPage>
                    <OwnerRolesPage />
                  </SystemOwnerOnlyPage>
                }
              />
              <Route
                path="cuotas"
                element={
                  <CondoAdminPage>
                    <OwnerBillingPage />
                  </CondoAdminPage>
                }
              />
              <Route
                path="morosidad"
                element={
                  <CondoAdminPage>
                    <OwnerDelinquencyPage />
                  </CondoAdminPage>
                }
              />
              <Route
                path="reportes"
                element={
                  <CondoAdminPage>
                    <OwnerReportsPage />
                  </CondoAdminPage>
                }
              />
              <Route
                path="visitas"
                element={
                  <SharedRolePage
                    adminPage={<OwnerVisitsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="visitas" />}
                    residentPage={<ResidentVisitsPage />}
                  />
                }
              />
              <Route
                path="incidencias"
                element={
                  <SharedRolePage
                    adminPage={<OwnerIncidentsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="incidencias" />}
                    residentPage={<ResidentIncidentsPage />}
                  />
                }
              />
              <Route
                path="avisos"
                element={
                  <SharedRolePage
                    adminPage={<OwnerCommunicationsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="avisos" />}
                    residentPage={<ResidentModulePage moduleKey="avisos" />}
                  />
                }
              />
              <Route
                path="reservas"
                element={
                  <SharedRolePage
                    adminPage={<OwnerReservationsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="reservas" />}
                    residentPage={<ResidentModulePage moduleKey="reservas" />}
                  />
                }
              />
              <Route
                path="acceso"
                element={
                  <OwnerOnlyPage>
                    <OwnerAccessControlPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="auditoria"
                element={
                  <CondoAdminPage>
                    <OwnerAuditPage />
                  </CondoAdminPage>
                }
              />
              <Route
                path="configuracion"
                element={
                  <OwnerOnlyPage>
                    <OwnerSettingsPage />
                  </OwnerOnlyPage>
                }
              />
              <Route
                path="documentos"
                element={
                  <SharedRolePage
                    adminPage={<OwnerDocumentsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="documentos" />}
                    residentPage={<ResidentModulePage moduleKey="documentos" />}
                  />
                }
              />
              <Route
                path="notificaciones"
                element={
                  <SharedRolePage
                    adminPage={<OwnerNotificationsPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="notificaciones" />}
                    residentPage={<ResidentModulePage moduleKey="notificaciones" />}
                  />
                }
              />
              <Route
                path="vehiculos"
                element={
                  <SharedRolePage
                    adminPage={<OwnerVehiclesPage />}
                    ownerPage={<PropertyOwnerModulePage moduleKey="vehiculos" />}
                    residentPage={<ResidentModulePage moduleKey="vehiculos" />}
                  />
                }
              />
              <Route
                path="planes"
                element={
                  <PropertyOwnerOnlyPage>
                    <PlansPage />
                  </PropertyOwnerOnlyPage>
                }
              />
              <Route path="pagos" element={<BillingPaymentsPage />} />
              <Route path="historial" element={<BillingHistoryPage />} />
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </CondominioProvider>
    </AuthProvider>
  );
}
