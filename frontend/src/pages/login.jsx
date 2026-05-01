import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../public/img/logo.svg";
import logoWhite from "../public/img/logo-white.svg";
import { useAuth } from "../context/AuthContext";

const INPUT =
  "w-full rounded-[20px] border border-[var(--control-border)] bg-[var(--control-bg-inset)] px-4 py-3.5 text-sm text-[var(--fg-primary)] outline-none transition-all placeholder:text-[var(--fg-muted)] focus:border-[var(--control-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--focus-ring)]";
const INPUT_ERR =
  "w-full rounded-[20px] border border-red-300 bg-[var(--control-bg-inset)] px-4 py-3.5 text-sm text-[var(--fg-primary)] outline-none transition-all placeholder:text-[var(--fg-muted)] focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100";

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [userName, setUserName] = useState("");

  useEffect(() => {
    if (!success) return;
    // Siempre ir al dashboard — DashboardHomeByRole decide qué mostrar según el rol
    // El ProtectedRoute maneja el gate de onboarding si aplica
    const timeout = setTimeout(() => navigate("/dashboard"), 1200);
    return () => clearTimeout(timeout);
  }, [success, navigate]);

  const validate = () => {
    const nextErrors = {};

    if (!form.email) nextErrors.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Correo invalido";

    if (!form.password) nextErrors.password = "Requerido";

    return nextErrors;
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
    if (globalError) setGlobalError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      const data = await login({ email: form.email, password: form.password });
      setUserName(data?.name?.split(" ")[0] || "");
      setSuccess(true);
    } catch (error) {
      const msg = error.message || "";
      // Mensajes de error más claros según el tipo
      if (msg.toLowerCase().includes("contraseña") || msg.toLowerCase().includes("password") || msg.toLowerCase().includes("inválido")) {
        setGlobalError("Correo o contraseña incorrectos. Verifica tus datos.");
      } else if (msg.toLowerCase().includes("sesión") || msg.toLowerCase().includes("session")) {
        setGlobalError("No se pudo iniciar sesión. Intenta de nuevo.");
      } else {
        setGlobalError(msg || "Correo o contraseña incorrectos.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FBF8F4_0%,#F2ECE5_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,48,0.14),_transparent_68%)]" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(217,79,16,0.1),_transparent_68%)]" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle, rgba(18,17,16,0.08) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      </div>

      <div
        className={`dark-surface-readable fixed left-1/2 top-6 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 rounded-[24px] bg-[#121110] px-5 py-4 text-white shadow-[0_24px_50px_rgba(18,17,16,0.24)] transition-all duration-500 ${
          success ? "translate-y-0 opacity-100" : "-translate-y-4 opacity-0 pointer-events-none"
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[linear-gradient(135deg,#FF7A30,#D94F10)]">
            <IconCheck />
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold">{userName ? `Bienvenido, ${userName}` : "Bienvenido"}</p>
            <p className="text-xs text-white/54">Estamos preparando tu panel principal.</p>
          </div>
          <div className="h-1.5 w-16 overflow-hidden rounded-full bg-white/10">
            <div
              className="h-full rounded-full bg-[linear-gradient(90deg,#FF7A30,#D94F10)]"
              style={{ animation: success ? "progress 1.8s linear forwards" : "none" }}
            />
          </div>
        </div>
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen gap-6 px-3 py-4 sm:gap-8 sm:px-4 sm:py-6 md:px-8 lg:max-w-7xl lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
        <section className="dark-surface-readable hidden rounded-[28px] bg-[linear-gradient(150deg,#121110_0%,#241B16_52%,#121110_100%)] p-6 text-white shadow-[0_30px_80px_rgba(18,17,16,0.18)] lg:block lg:p-9 xl:p-10">
          <Link to="/landing" className="flex items-center gap-3 no-underline">
            <div className="flex h-10 sm:h-12 items-center px-3 sm:px-4 py-2 rounded-[18px] sm:rounded-[22px] bg-white/5 border border-white/10 backdrop-blur-md">
              <img src={logoWhite} alt="Condome" className="h-6 sm:h-8 w-auto opacity-90" />
            </div>
          </Link>

          <div className="mt-10 sm:mt-14 max-w-xl">
            <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.22em] sm:tracking-[0.26em] text-[#FFB184]">Inicio de sesion</p>
            <h1 className="mt-4 sm:mt-5 text-[2rem] sm:text-[2.8rem] md:text-[3.5rem] font-semibold leading-[1.02]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Un acceso mas claro para un panel mas profesional.
            </h1>
            <p className="mt-4 sm:mt-6 text-[13px] sm:text-[14px] md:text-[15px] leading-6 sm:leading-7 text-white/90">
              El sistema ahora se apoya en una capa visual mas limpia, con mejor jerarquia y una experiencia mucho mas agradable para administrar condominios.
            </p>
          </div>

          <div className="mt-8 sm:mt-12 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
            {[
              ["Orden", "navegacion por areas reales de trabajo"],
              ["Claridad", "datos con jerarquia mas consistente"],
              ["Confianza", "blanco, negro y naranja como lenguaje comun"],
            ].map(([title, copy]) => (
              <div key={title} className="rounded-[18px] sm:rounded-[24px] border border-white/10 bg-white/6 p-3 sm:p-4 backdrop-blur-sm">
                <p className="text-sm sm:text-lg font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {title}
                </p>
                <p className="mt-1.5 sm:mt-2 text-[11px] sm:text-sm leading-5 sm:leading-6 text-white/75">{copy}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="architectural-panel mx-auto w-full max-w-[420px] sm:max-w-[480px] md:max-w-[520px] rounded-[24px] sm:rounded-[28px] md:rounded-[36px] p-4 sm:p-5 md:p-6 lg:p-8">
          <div className="flex items-center justify-between gap-3 sm:gap-4">
            <Link to="/landing" className="no-underline">
              <img src={logo} alt="Condome" className="h-7 sm:h-8 md:h-9 w-auto" />
            </Link>
            <Link to="/register" className="rounded-full bg-[rgba(217,79,16,0.1)] px-3 sm:px-3.5 py-1.5 sm:py-2 text-[10px] sm:text-xs font-semibold text-[var(--condome-orange)] no-underline">
              Crear cuenta
            </Link>
          </div>

          <div className="mt-8 sm:mt-10">
            <p className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[var(--condome-orange)]">Cuenta existente</p>
            <h1 className="mt-2 sm:mt-3 text-[1.6rem] sm:text-[2rem] md:text-[2.2rem] font-semibold leading-tight text-[var(--fg-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Iniciar sesion
            </h1>
            <p className="mt-2 sm:mt-3 text-xs sm:text-sm leading-6 sm:leading-7 text-[var(--fg-secondary)]">
              Entra a tu panel para continuar con cobros, comunidad, accesos y seguimiento del condominio.
            </p>
          </div>

          {globalError && (
            <div className="mt-5 sm:mt-6 flex items-center gap-2.5 sm:gap-3 rounded-[18px] sm:rounded-[22px] border border-red-200 bg-red-50 px-3 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-red-600">
              <IconWarn />
              <span>{globalError}</span>
            </div>
          )}

          <form className="mt-6 sm:mt-8 space-y-4 sm:space-y-5" onSubmit={handleSubmit} noValidate>
            <div>
              <label className="mb-1.5 sm:mb-2 block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[var(--fg-tertiary)]">
                Correo electronico
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                className={errors.email ? INPUT_ERR : INPUT}
                placeholder="correo@ejemplo.com"
                autoComplete="email"
              />
              {errors.email ? <p className="mt-1 text-[10px] sm:text-[11px] text-red-500">{errors.email}</p> : null}
            </div>

            <div>
              <div className="mb-1.5 sm:mb-2 flex items-center justify-between gap-3">
                <label className="block text-[9px] sm:text-[10px] font-semibold uppercase tracking-[0.16em] sm:tracking-[0.18em] text-[var(--fg-tertiary)]">
                  Contrasena
                </label>
                <a href="#" className="text-[10px] sm:text-[11px] text-[var(--fg-tertiary)] transition-colors hover:text-[var(--condome-orange)]">
                  Recuperar acceso
                </a>
              </div>
              <div className="relative">
                <input
                  type={showPass ? "text" : "password"}
                  name="password"
                  value={form.password}
                  onChange={handleChange}
                  className={`${errors.password ? INPUT_ERR : INPUT} pr-10 sm:pr-12`}
                  placeholder="••••••••"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  className="absolute right-2.5 sm:right-3 top-1/2 -translate-y-1/2 rounded-xl sm:rounded-2xl border-none bg-transparent p-1 sm:p-1.5 text-[var(--fg-tertiary)] transition-colors hover:text-[var(--condome-orange)]"
                  onClick={() => setShowPass((current) => !current)}
                >
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password ? <p className="mt-1 text-[10px] sm:text-[11px] text-red-500">{errors.password}</p> : null}
            </div>

            <button
              type="submit"
              disabled={loading || success}
              className="flex w-full items-center justify-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,#FF7A30,#D94F10)] px-4 sm:px-5 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-white shadow-[0_16px_32px_rgba(217,79,16,0.2)] transition-transform hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <>
                  <Spinner />
                  Verificando
                </>
              ) : success ? (
                <>
                  <IconCheck />
                  Sesion iniciada
                </>
              ) : (
                "Entrar al panel"
              )}
            </button>
          </form>

          <div className="mt-6 sm:mt-8 rounded-[20px] sm:rounded-[26px] border border-[var(--border-subtle)] bg-white/72 p-4 sm:p-5">
            <p className="text-[9px] sm:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[var(--condome-orange)]">Acceso rapido</p>
            <p className="mt-1.5 sm:mt-2 text-xs sm:text-sm leading-6 sm:leading-7 text-[var(--fg-secondary)]">
              El nuevo shell prioriza navegacion, contexto del usuario y mejor lectura de la informacion en desktop y mobile.
            </p>
          </div>
        </section>
      </div>

      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }

        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function IconEye() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
    </svg>
  );
}

function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5" />
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function Spinner() {
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "spin 0.7s linear infinite" }} />;
}
