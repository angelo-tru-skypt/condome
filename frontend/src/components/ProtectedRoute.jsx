import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

function LoadingFallback() {
  return (
    <div className="min-h-[60vh] flex items-center justify-center text-sm text-[#737373]">
      Verificando sesión...
    </div>
  );
}

export default function ProtectedRoute({ children, redirectTo = "/login" }) {
  const { isAuth, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <LoadingFallback />;
  }

  if (!isAuth) {
    return <Navigate to={redirectTo} state={{ from: location }} replace />;
  }

  return children;
}
