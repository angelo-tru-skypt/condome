import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../public/img/logo.svg";
import { useAuth } from "../context/AuthContext";

/* ── Clases reutilizables ── */
const INPUT     = "w-full px-4 py-3 bg-[#F7F5F2] border border-[#E5E0D8] rounded-xl text-[#1A1612] text-sm outline-none transition-all duration-200 placeholder:text-[#C8C0B4] focus:border-[#D94F10] focus:bg-white focus:ring-4 focus:ring-[#D94F10]/10";
const INPUT_ERR = "w-full px-4 py-3 bg-[#F7F5F2] border border-red-400 rounded-xl text-[#1A1612] text-sm outline-none transition-all duration-200 placeholder:text-[#C8C0B4] focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-400/10";
const LABEL     = "block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#6B6158] mb-1.5";
const SELECT_STYLE = {
  backgroundImage: `url("data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%23A89E94' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E")`,
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 14px center",
  paddingRight: "36px",
  appearance: "none",
};

/* ── Lista de países ── */
const PAISES = [
  { code: "DO", name: "República Dominicana", flag: "🇩🇴" },
  { code: "US", name: "Estados Unidos",       flag: "🇺🇸" },
  { code: "MX", name: "México",               flag: "🇲🇽" },
  { code: "CO", name: "Colombia",             flag: "🇨🇴" },
  { code: "VE", name: "Venezuela",            flag: "🇻🇪" },
  { code: "PE", name: "Perú",                 flag: "🇵🇪" },
  { code: "CL", name: "Chile",               flag: "🇨🇱" },
  { code: "AR", name: "Argentina",            flag: "🇦🇷" },
  { code: "EC", name: "Ecuador",              flag: "🇪🇨" },
  { code: "GT", name: "Guatemala",            flag: "🇬🇹" },
  { code: "HN", name: "Honduras",             flag: "🇭🇳" },
  { code: "SV", name: "El Salvador",          flag: "🇸🇻" },
  { code: "NI", name: "Nicaragua",            flag: "🇳🇮" },
  { code: "CR", name: "Costa Rica",           flag: "🇨🇷" },
  { code: "PA", name: "Panamá",              flag: "🇵🇦" },
  { code: "CU", name: "Cuba",                flag: "🇨🇺" },
  { code: "PR", name: "Puerto Rico",          flag: "🇵🇷" },
  { code: "BO", name: "Bolivia",              flag: "🇧🇴" },
  { code: "PY", name: "Paraguay",             flag: "🇵🇾" },
  { code: "UY", name: "Uruguay",              flag: "🇺🇾" },
  { code: "ES", name: "España",              flag: "🇪🇸" },
  { code: "PT", name: "Portugal",             flag: "🇵🇹" },
];

/* ── Password strength ── */
function getStrength(pwd) {
  if (!pwd) return { score: 0, label: "", color: "", bar: "" };
  let s = 0;
  if (pwd.length >= 8) s++;
  if (/[A-Z]/.test(pwd)) s++;
  if (/[0-9]/.test(pwd)) s++;
  if (/[^A-Za-z0-9]/.test(pwd)) s++;
  const map = {
    1: { label: "Débil",   color: "#C0392B", bar: "bg-red-500"   },
    2: { label: "Regular", color: "#D4800A", bar: "bg-amber-500" },
    3: { label: "Buena",   color: "#7A9A3A", bar: "bg-lime-500"  },
    4: { label: "Fuerte",  color: "#2E7D52", bar: "bg-green-600" },
  };
  return { score: s, ...(map[s] || {}) };
}

export default function Register() {
  const { register } = useAuth();
  const navigate     = useNavigate();

  const [step, setStep]             = useState(1);
  const [form, setForm]             = useState({
    nombre: "", apellido: "", email: "", telefono: "",
    pais: "",
    password: "", confirmPassword: "", terms: false,
  });
  const [errors, setErrors]         = useState({});
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass]     = useState(false);
  const [showConf, setShowConf]     = useState(false);
  const [loading, setLoading]       = useState(false);

  const strength = getStrength(form.password);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setForm(f => ({ ...f, [name]: type === "checkbox" ? checked : value }));
    if (errors[name])  setErrors(e => ({ ...e, [name]: "" }));
    if (globalError)   setGlobalError("");
  };

  // ── Validación step 1 ──────────────────────────────────────────────────────
  const v1 = () => {
    const e = {};
    if (!form.nombre.trim())   e.nombre   = "Requerido";
    if (!form.apellido.trim()) e.apellido = "Requerido";
    if (!form.email)           e.email    = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = "Correo inválido";
    if (!form.telefono.trim()) e.telefono = "Requerido";
    if (!form.pais)            e.pais     = "Selecciona tu país";
    return e;
  };

  // ── Validación step 2 ──────────────────────────────────────────────────────
  const v2 = () => {
    const e = {};
    if (!form.password)                e.password        = "Requerido";
    else if (form.password.length < 8) e.password        = "Mínimo 8 caracteres";
    if (!form.confirmPassword)         e.confirmPassword = "Requerido";
    else if (form.password !== form.confirmPassword) e.confirmPassword = "No coinciden";
    if (!form.terms)                   e.terms           = "Debes aceptar los términos";
    return e;
  };

  const handleNext = () => {
    const errs = v1();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setStep(2);
  };

  // ── Submit → llama la API ──────────────────────────────────────────────────
  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = v2();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    setGlobalError("");

    try {
      await register({
        nombre:          form.nombre,
        apellido:        form.apellido,
        email:           form.email,
        telefono:        form.telefono,
        pais:            form.pais,
        password:        form.password,
        confirmPassword: form.confirmPassword,
      });
      // Registro OK → redirigir al dashboard
      navigate("/dashboard");
    } catch (err) {
      setGlobalError(err.message || "Error al crear la cuenta. Intenta de nuevo.");
      // Si el error es del step 1 (ej: email duplicado), volver al paso 1
      if (err.message?.toLowerCase().includes("correo")) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const ic = (f) => errors[f] ? INPUT_ERR : INPUT;
  const paisSeleccionado = PAISES.find(p => p.code === form.pais);

  return (
    <div className="min-h-screen bg-[#F7F5F2] flex items-center justify-center px-4 py-10 relative overflow-hidden">

      {/* Dot pattern */}
      <div className="fixed inset-0 pointer-events-none opacity-60"
        style={{ backgroundImage: "radial-gradient(circle, #1A161215 1px, transparent 1px)", backgroundSize: "28px 28px" }} />

      {/* Glow */}
      <div className="fixed -top-32 -right-32 w-[500px] h-[500px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(217,79,16,0.08) 0%, transparent 65%)" }} />

      {/* Card */}
      <div className="relative z-10 w-full max-w-[440px] bg-white rounded-3xl px-10 py-11"
        style={{ boxShadow: "0 2px 4px rgba(26,22,18,0.04), 0 12px 40px rgba(26,22,18,0.09)" }}>

        {/* Logo */}
        <Link to="/" className="flex items-center mb-9 w-fit">
          <img src={logo} alt="Condome" className="h-12 w-auto object-contain" />
        </Link>

        {/* Header */}
        <div className="mb-7">
          <h1 style={{ fontFamily: "'Playfair Display', serif" }}
            className="text-[26px] font-semibold text-[#1A1612] leading-tight mb-1.5">
            Crear cuenta
          </h1>
          <p className="text-sm text-[#A89E94]">
            ¿Ya tienes cuenta?{" "}
            <Link to="/login" className="text-[#D94F10] font-medium hover:underline">
              Inicia sesión
            </Link>
          </p>
        </div>

        {/* Steps */}
        <div className="flex items-center mb-7">
          <StepDot n={1} current={step} />
          <span className={`text-[10px] tracking-[0.1em] uppercase ml-2 font-semibold transition-colors ${step === 1 ? "text-[#D94F10]" : "text-[#C8C0B4]"}`}>
            Datos
          </span>
          <div className="flex-1 h-px bg-[#E5E0D8] mx-3" />
          <StepDot n={2} current={step} />
          <span className={`text-[10px] tracking-[0.1em] uppercase ml-2 font-semibold transition-colors ${step === 2 ? "text-[#D94F10]" : "text-[#C8C0B4]"}`}>
            Acceso
          </span>
        </div>

        {/* Error global */}
        {globalError && (
          <div className="flex items-center gap-2.5 px-4 py-3 mb-5 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">
            <IconWarn /> {globalError}
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>

          {/* ── Step 1 ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={LABEL}>Nombre</label>
                  <input name="nombre" value={form.nombre} onChange={handleChange}
                    className={ic("nombre")} placeholder="Nombre" />
                  {errors.nombre && <p className="mt-1 text-[11px] text-red-500">{errors.nombre}</p>}
                </div>
                <div>
                  <label className={LABEL}>Apellido</label>
                  <input name="apellido" value={form.apellido} onChange={handleChange}
                    className={ic("apellido")} placeholder="Apellido" />
                  {errors.apellido && <p className="mt-1 text-[11px] text-red-500">{errors.apellido}</p>}
                </div>
              </div>

              <div>
                <label className={LABEL}>Correo electrónico</label>
                <input type="email" name="email" value={form.email} onChange={handleChange}
                  className={ic("email")} placeholder="correo@ejemplo.com" />
                {errors.email && <p className="mt-1 text-[11px] text-red-500">{errors.email}</p>}
              </div>

              <div>
                <label className={LABEL}>Teléfono</label>
                <input type="tel" name="telefono" value={form.telefono} onChange={handleChange}
                  className={ic("telefono")} placeholder="+1 809 000 0000" />
                {errors.telefono && <p className="mt-1 text-[11px] text-red-500">{errors.telefono}</p>}
              </div>

              <div>
                <label className={LABEL}>País de residencia</label>
                <div className="relative">
                  {paisSeleccionado && (
                    <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-lg pointer-events-none z-10">
                      {paisSeleccionado.flag}
                    </span>
                  )}
                  <select name="pais" value={form.pais} onChange={handleChange}
                    className={`${ic("pais")} cursor-pointer ${paisSeleccionado ? "pl-10" : ""}`}
                    style={SELECT_STYLE}>
                    <option value="">Selecciona tu país...</option>
                    {PAISES.map(p => (
                      <option key={p.code} value={p.code}>{p.flag} {p.name}</option>
                    ))}
                  </select>
                </div>
                {errors.pais && <p className="mt-1 text-[11px] text-red-500">{errors.pais}</p>}
              </div>

              <button type="button"
                className="w-full py-3.5 bg-gradient-to-br from-[#FF7A30] to-[#D94F10] text-white text-[13px] font-semibold tracking-[0.1em] uppercase rounded-xl cursor-pointer border-none transition-all duration-200 hover:opacity-90 mt-2"
                onClick={handleNext}>
                Continuar →
              </button>
            </div>
          )}

          {/* ── Step 2 ── */}
          {step === 2 && (
            <div className="space-y-4">

              {/* Password */}
              <div>
                <label className={LABEL}>Contraseña</label>
                <div className="relative">
                  <input type={showPass ? "text" : "password"}
                    name="password" value={form.password} onChange={handleChange}
                    className={`${ic("password")} !pr-11`} placeholder="Mínimo 8 caracteres" />
                  <button type="button" onClick={() => setShowPass(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#D94F10] transition-colors p-1 bg-transparent border-none cursor-pointer">
                    {showPass ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {form.password && (
                  <div className="mt-2">
                    <div className="flex gap-1">
                      {[1,2,3,4].map(i => (
                        <div key={i} className={`flex-1 h-[3px] rounded-full transition-all duration-300
                          ${i <= strength.score ? strength.bar : "bg-[#E5E0D8]"}`} />
                      ))}
                    </div>
                    <p className="mt-1 text-[10px] tracking-[0.08em] uppercase font-medium"
                      style={{ color: strength.color }}>{strength.label}</p>
                  </div>
                )}
                {errors.password && <p className="mt-1 text-[11px] text-red-500">{errors.password}</p>}
              </div>

              {/* Confirm */}
              <div>
                <label className={LABEL}>Confirmar contraseña</label>
                <div className="relative">
                  <input type={showConf ? "text" : "password"}
                    name="confirmPassword" value={form.confirmPassword} onChange={handleChange}
                    className={`${ic("confirmPassword")} !pr-11`} placeholder="Repite tu contraseña" />
                  <button type="button" onClick={() => setShowConf(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#A89E94] hover:text-[#D94F10] transition-colors p-1 bg-transparent border-none cursor-pointer">
                    {showConf ? <IconEyeOff /> : <IconEye />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="mt-1 text-[11px] text-red-500">{errors.confirmPassword}</p>}
              </div>

              {/* Terms */}
              <div className="flex items-start gap-2.5 pt-1">
                <input type="checkbox" id="terms" name="terms"
                  checked={form.terms} onChange={handleChange}
                  className="mt-0.5 w-4 h-4 cursor-pointer flex-shrink-0 accent-[#D94F10]" />
                <label htmlFor="terms" className="text-xs text-[#A89E94] leading-relaxed cursor-pointer">
                  Acepto los{" "}
                  <a href="#" className="text-[#D94F10] hover:underline">Términos de Servicio</a>
                  {" "}y la{" "}
                  <a href="#" className="text-[#D94F10] hover:underline">Política de Privacidad</a>.
                  {errors.terms && <span className="block mt-1 text-red-500">{errors.terms}</span>}
                </label>
              </div>

              {/* Buttons */}
              <div className="flex gap-2.5 pt-1">
                <button type="button" onClick={() => { setStep(1); setGlobalError(""); }}
                  className="flex-1 py-3.5 bg-transparent border border-[#E5E0D8] rounded-xl text-[#6B6158] text-[13px] font-medium cursor-pointer transition-all duration-200 hover:border-[#C8C0B4] hover:bg-[#F7F5F2]">
                  ← Atrás
                </button>
                <button type="submit" disabled={loading}
                  className="flex-[2] py-3.5 bg-gradient-to-br from-[#FF7A30] to-[#D94F10] text-white text-[13px] font-semibold tracking-[0.1em] uppercase rounded-xl border-none cursor-pointer transition-all duration-200 hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2">
                  {loading ? <><Spinner /> Creando...</> : "Crear Cuenta"}
                </button>
              </div>
            </div>
          )}
        </form>

        <p className="mt-8 text-center text-[11px] text-[#C8C0B4] tracking-wide">
          © 2025 Condome · Todos los derechos reservados
        </p>
      </div>
    </div>
  );
}

function StepDot({ n, current }) {
  const done = current > n, active = current === n;
  return (
    <div className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-semibold border-[1.5px] transition-all duration-300 flex-shrink-0
      ${done ? "bg-[#EFEDE9] border-[#E5E0D8] text-[#A89E94]" : active ? "bg-[#D94F10] border-[#D94F10] text-white" : "bg-transparent border-[#E5E0D8] text-[#C8C0B4]"}`}>
      {done ? "✓" : n}
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
function Spinner() {
  return (
    <span className="inline-block w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white flex-shrink-0"
      style={{ animation: "spin 0.7s linear infinite" }} />
  );
}
