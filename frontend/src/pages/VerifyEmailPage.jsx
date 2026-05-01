import { useEffect, useState, useCallback } from "react";
import { useSearchParams, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import apiClient from "../utils/ApiClient.js";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token");
  const { verifyEmail, user, refreshSession } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const emailFromState = location.state?.email || "";
  const displayEmail = emailFromState || user?.email || "";

  const [status, setStatus] = useState(token ? "verifying" : "waiting");
  const [error, setError] = useState("");
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState(null);

  useEffect(() => {
    if (token || !user?.email_verified) return undefined;

    setStatus("success");
    const role = user?.role;
    const hasOnboarding = user?.has_completed_onboarding;
    const timeout = setTimeout(() => {
      if ((role === "owner" || role === "propietario") && !hasOnboarding) {
        navigate("/dashboard/planes");
      } else {
        navigate("/dashboard");
      }
    }, 900);

    return () => clearTimeout(timeout);
  }, [navigate, token, user]);

  // Verificar con token del enlace
  useEffect(() => {
    if (!token) return;

    const handleVerification = async () => {
      try {
        const result = await verifyEmail(token);
        setStatus("success");

        const verifiedUser = result?.user;
        const role = verifiedUser?.role;
        const hasOnboarding = verifiedUser?.has_completed_onboarding;

        setTimeout(() => {
          if ((role === "owner" || role === "propietario") && !hasOnboarding) {
            navigate("/dashboard/planes");
          } else {
            navigate("/dashboard");
          }
        }, 2000);
      } catch (err) {
        setStatus("error");
        setError(err.message || "No se pudo verificar el correo. El enlace puede haber expirado.");
      }
    };

    handleVerification();
  }, [token, verifyEmail, navigate]);

  // "Ya verifiqué mi cuenta" — refresca sesión del servidor y navega si está verificado
  const handleAlreadyVerified = useCallback(async () => {
    setError("");
    try {
      const updatedUser = await refreshSession();
      if (updatedUser?.email_verified) {
        const role = updatedUser?.role;
        const hasOnboarding = updatedUser?.has_completed_onboarding;
        if ((role === "owner" || role === "propietario") && !hasOnboarding) {
          navigate("/dashboard/planes");
        } else {
          navigate("/dashboard");
        }
      } else {
        setError("Tu correo aún no ha sido verificado. Revisa tu bandeja de entrada.");
      }
    } catch {
      navigate("/login");
    }
  }, [refreshSession, navigate]);

  // Reenviar email de verificación
  const handleResend = useCallback(async () => {
    if (!displayEmail) {
      setResendResult({ ok: false, message: "No se encontró el correo. Intenta iniciar sesión de nuevo." });
      return;
    }
    setResending(true);
    setResendResult(null);
    try {
      const response = await apiClient.post(
        "/condome_auth/resend_verification",
        { email: displayEmail },
        { timeout: 15000, maxRetries: 0 } // sin retry — el SMTP puede tardar
      );
      if (response?.ok === false) {
        setResendResult({ ok: false, message: response.message || "No se pudo enviar el correo." });
      } else {
        setResendResult({ ok: true, message: response?.message || "Correo reenviado. Revisa tu bandeja de entrada." });
      }
    } catch (err) {
      setResendResult({ ok: false, message: "No se pudo conectar con el servidor. Intenta de nuevo." });
    } finally {
      setResending(false);
    }
  }, [displayEmail]);

  return (
    <div className="min-h-screen bg-[#F6F2EC] flex flex-col items-center justify-center p-6 font-sans">
      <div className="w-full max-w-lg bg-white border border-[#E9E1D8] rounded-[32px] shadow-[0_24px_60px_rgba(30,26,23,0.08)] p-10 md:p-14 text-center">

        {/* Logo */}
        <div className="mb-10 flex justify-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#D94F10] rounded-xl flex items-center justify-center shadow-lg shadow-[#D94F10]/20">
              <div className="w-4 h-4 bg-white rounded-sm" />
            </div>
            <span className="text-2xl font-bold tracking-tight text-[#121110]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Condome
            </span>
          </div>
        </div>

        {/* Icono de estado */}
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 rounded-full bg-[#FAF9F7] border border-[#E9E1D8] flex items-center justify-center">
            {status === "verifying" && (
              <div className="w-8 h-8 rounded-full border-2 border-[#D94F10] border-t-transparent animate-spin" />
            )}
            {status === "success" && (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#10b981" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12" />
              </svg>
            )}
            {status === "error" && (
              <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#ef4444" strokeWidth="2.5" strokeLinecap="round">
                <line x1="18" y1="6" x2="6" y2="18" />
                <line x1="6" y1="6" x2="18" y2="18" />
              </svg>
            )}
            {status === "waiting" && <span className="text-4xl">✉️</span>}
          </div>
        </div>

        {/* Título */}
        <h1 className="text-3xl font-bold text-[#121110] mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
          {status === "verifying" && "Confirmando identidad"}
          {status === "success" && "Acceso verificado"}
          {status === "error" && "Error de validación"}
          {status === "waiting" && "Revisa tu correo"}
        </h1>

        {/* Descripción */}
        <p className="text-[#8C8076] text-base leading-relaxed max-w-sm mx-auto">
          {status === "verifying" && "Estamos procesando tus credenciales en los servidores de Condome."}
          {status === "success" && "Tu cuenta ha sido activada con éxito. En unos instantes accederás a tu panel operativo."}
          {status === "error" && error}
          {status === "waiting" && (
            <>
              Hemos enviado un enlace de verificación a{" "}
              {displayEmail
                ? <strong className="text-[#121110]">{displayEmail}</strong>
                : "tu correo electrónico"
              }. Haz clic en el enlace para activar tu cuenta.
            </>
          )}
        </p>

        {/* Error inline (cuando "ya verifiqué" falla) */}
        {error && status === "waiting" && (
          <p className="mt-4 text-sm text-red-500 font-medium">{error}</p>
        )}

        {/* Resultado de reenvío */}
        {resendResult && (
          <p className={`mt-4 text-sm font-medium ${resendResult.ok ? "text-emerald-600" : "text-red-500"}`}>
            {resendResult.message}
          </p>
        )}

        {/* Acciones */}
        <div className="mt-10 pt-8 border-t border-[#F0EBE5] space-y-3">
          {status === "error" && (
            <>
              <button
                onClick={() => navigate("/register")}
                className="w-full py-4 px-6 bg-[#D94F10] hover:bg-[#BF450D] text-white rounded-2xl font-bold transition-all shadow-xl shadow-[#D94F10]/20 active:scale-[0.98]"
              >
                Intentar registro de nuevo
              </button>
              <button
                onClick={() => navigate("/login")}
                className="w-full py-4 px-6 bg-[#121110] hover:bg-[#201D1A] text-white rounded-2xl font-bold transition-all shadow-xl active:scale-[0.98]"
              >
                Ir al inicio de sesión
              </button>
            </>
          )}

          {status === "waiting" && (
            <>
              <button
                onClick={handleAlreadyVerified}
                className="w-full py-4 px-6 bg-[#D94F10] hover:bg-[#BF450D] text-white rounded-2xl font-bold transition-all shadow-xl shadow-[#D94F10]/20 active:scale-[0.98]"
              >
                Ya verifiqué mi cuenta
              </button>
              {displayEmail && (
                <button
                  onClick={handleResend}
                  disabled={resending}
                  className="w-full py-3 px-6 border border-[#E9E1D8] bg-white hover:bg-[#FAF9F7] text-[#8C8076] rounded-2xl font-semibold text-sm transition-all disabled:opacity-50"
                >
                  {resending ? "Reenviando..." : "Reenviar correo de verificación"}
                </button>
              )}
              <button
                onClick={() => navigate("/login")}
                className="text-sm font-semibold text-[#8C8076] hover:text-[#121110] transition-colors pt-1 block w-full"
              >
                Volver al inicio de sesión
              </button>
            </>
          )}

          {status === "success" && (
            <div className="flex items-center justify-center gap-3 text-[#D94F10] font-bold text-sm uppercase tracking-widest">
              <div className="w-2 h-2 bg-[#D94F10] rounded-full animate-ping" />
              Redirigiendo...
            </div>
          )}
        </div>
      </div>

      <p className="mt-8 text-[11px] text-[#8C8076] uppercase tracking-[0.2em] font-bold">
        &copy; 2026 CONDOME PLATFORM &bull; INFRAESTRUCTURA SEGURA
      </p>
    </div>
  );
}
