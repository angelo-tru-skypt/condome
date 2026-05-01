import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { isPropertyOwnerRole } from "../utils/roles";

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#737373]">
      Verificando sesión...
    </div>
  );
}

export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { isAuth, loading, user } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuth) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  const roleValue = user?.role || user?.rol;

  // Gate 1: verificación de email — solo bloquea si email_verified es explícitamente false
  // (no bloquea si el campo no existe o es undefined)
  if (user?.email_verified === false && location.pathname !== "/verify-email") {
    return <Navigate to="/verify-email" replace />;
  }

  // Gate 2: onboarding de planes — solo para propietarios de unidad (propietario)
  // El rol "owner" (super admin) no necesita pasar por planes
  // NOTA: Comentado temporalmente para permitir acceso al menú durante onboarding
  // const needsOnboarding =
  //   user?.has_completed_onboarding === false &&
  //   isPropertyOwnerRole(roleValue);
  //
  // if (needsOnboarding && location.pathname !== "/dashboard/planes") {
  //   return <Navigate to="/dashboard/planes" replace />;
  // }

  return children;
}
