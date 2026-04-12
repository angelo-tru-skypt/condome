import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../public/img/logo.svg";
import { useAuth } from "../context/AuthContext";

const INPUT     = "w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E0D8] rounded-xl text-[#1A1612] text-sm outline-none transition-all duration-200 placeholder:text-[#C8C0B4] focus:border-[#D94F10] focus:bg-white focus:ring-4 focus:ring-[#D94F10]/10";
const INPUT_ERR = "w-full px-4 py-3 bg-[#F7F5F2] border border-red-400 rounded-xl text-[#1A1612] text-sm outline-none transition-all duration-200 placeholder:text-[#C8C0B4] focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/10";
const LABEL     = "block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#6B6158] mb-1.5";
const BTN       = "w-full py-3.5 bg-gradient-to-br from-[#FF7A30] to-[#D94F10] text-white text-[13px] font-semibold tracking-[0.1em] uppercase rounded-xl cursor-pointer border-none transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2";

export default function Login() {
  const { login }    = useAuth();
  const navigate     = useNavigate();

  const [form, setForm]               = useState({ email: "", password: "" });
  const [errors, setErrors]           = useState({});
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass]       = useState(false);
  const [loading, setLoading]         = useState(false);
  const [success, setSuccess]         = useState(false);
  const [userName, setUserName]       = useState("");

  // Redirige al dashboard después de mostrar el toast
  useEffect(() => {
    if (!success) return;
    const t = setTimeout(() => navigate("/dashboard"), 1800);
    return () => clearTimeout(t);
  }, [success, navigate]);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Correo inválido";
    if (!form.password) e.password = "Requerido";
    return e;
  };

  const handleChange = ({ target: { name, value } }) => {
    setForm(f => ({ ...f, [name]: value }));
    if (errors[name]) setErrors(e => ({ ...e, [name]: "" }));
    if (globalError)  setGlobalError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError("");

    try {
      const data = await login({ email: form.email, password: form.password });
      setUserName(data?.name?.split(" ")[0] || "");
      setSuccess(true);
    } catch (err) {
      setGlobalError(err.message || "Correo o contraseña incorrectos");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Dot pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-60"
        style={{ backgroundImage: "radial-gradient(circle, #1A161215 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Glow */}
      <div className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(217,79,16,0.08) 0%, transparent 65%)" }} />

      {/* ── Toast de éxito ── */}
      <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-50 transition-all duration-500
        ${success ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-4 pointer-events-none"}`}>
        <div className="flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl text-white"
          style={{
            background: "linear-gradient(135deg, #1A1612, #2D2318)",
            boxShadow: "0 8px 32px rgba(26,22,18,0.25), 0 0 0 1px rgba(255,255,255,0.06)"
          }}>
          {/* Ícono animado */}
          <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
              <polyline points="20,6 9,17 4,12"/>
            </svg>
          </div>
          <div>
            <p className="text-[13px] font-semibold">
              {userName ? `¡Bienvenido, ${userName}!` : "¡Bienvenido!"}
            </p>
            <p className="text-[11px] text-white/50">Redirigiendo al dashboard...</p>
          </div>
          {/* Barra de progreso */}
          <div className="ml-2 w-16 h-1 bg-white/10 rounded-full overflow-hidden flex-shrink-0">
            <div className="h-full rounded-full origin-left"
              style={{
                background: "linear-gradient(90deg, #FF7A30, #D94F10)",
                animation: success ? "progress 1.8s linear forwards" : "none",
              }} />
          </div>
        </div>
      </div>

      {/* Card */}
      <div className="relative z-10 w-full max-w-[420px] bg-white rounded-3xl px-10 py-11"
        style={{ boxShadow: "0 2px 4px rgba(26,22,18,0.04), 0 12px 40px rgba(26,22,18,0.09)" }}>

        {/* Logo */}
        <Link to="/" className="flex items-center mb-9 w-fit">
          <img src={logo} alt="Condome" className="h-12 w-auto object-contain" />
        </Link>

        {/* Header */}
        <div className="mb-8">
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[26px] font-semibold text-[#1A1612] leading-tight mb-1.5">
            Iniciar sesión
          </h1>
          <p className="text-sm text-[#A89E94]">
            ¿No tienes cuenta?{" "}
            <Link to="/register" className="text-[#D94F10] font-medium hover:underline">
              Crear una
            </Link>
          </p>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <IconWarn /> {globalError}
          </div>
        )}

        {/* Formulario */}
        <form onSubmit={handleSubmit} noValidate>
          <div className="space-y-5">

            <div>
              <label className={LABEL}>Correo electrónico</label>
              <input type="email" name="email" value={form.email}
                onChange={handleChange}
                className={errors.email ? INPUT_ERR : INPUT}
                placeholder="correo@ejemplo.com"
                autoComplete="email" />
              {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
            </div>

            <div>
              <label className={LABEL}>Contraseña</label>
              <div className="relative">
                <input type={showPass ? "text" : "password"}
                  name="password" value={form.password}
                  onChange={handleChange}
                  className={`${errors.password ? INPUT_ERR : INPUT} !pr-11`}
                  placeholder="••••••••"
                  autoComplete="current-password" />
                <button type="button" onClick={() => setShowPass(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#D94F10] transition-colors p-1 bg-transparent border-none cursor-pointer">
                  {showPass ? <IconEyeOff /> : <IconEye />}
                </button>
              </div>
              {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
            </div>
          </div>

          <div className="flex justify-end mt-3 mb-6">
            <a href="#" className="text-xs text-[#A89E94] hover:text-[#D94F10] transition-colors">
              ¿Olvidaste tu contraseña?
            </a>
          </div>

          <button type="submit" className={BTN} disabled={loading || success}>
            {loading
              ? <><Spinner /> Verificando...</>
              : success
              ? <><IconCheck /> Sesión iniciada</>
              : "Iniciar Sesión"}
          </button>
        </form>

        <p className="mt-8 text-center text-[11px] text-[#C8C0B4] tracking-wide">
          © 2025 Condome · Todos los derechos reservados
        </p>
      </div>

      {/* Estilos de animación */}
      <style>{`
        @keyframes progress {
          from { width: 0%; }
          to   { width: 100%; }
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
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/>
    </svg>
  );
}
function IconEyeOff() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
      <path d="M17.94 17.94A10.07 10.07 0 0112 20c-7 0-11-8-11-8a18.45 18.45 0 015.06-5.94" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9.9 4.24A9.12 9.12 0 0112 4c7 0 11 8 11 8a18.5 18.5 0 01-2.16 3.19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="1" y1="1" x2="23" y2="23" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}
function IconWarn() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="flex-shrink-0">
      <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="1.5"/>
      <line x1="12" y1="8" x2="12" y2="12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
      <line x1="12" y1="16" x2="12.01" y2="16" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}
function IconCheck() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <polyline points="20,6 9,17 4,12"/>
    </svg>
  );
}
function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white flex-shrink-0"
      style={{ animation: "spin 0.7s linear infinite" }} />
  );
}
