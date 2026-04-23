import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../public/img/logo.svg";
import { useAuth } from "../context/AuthContext";

const INPUT =
  "w-full rounded-[20px] border border-[var(--control-border)] bg-[var(--control-bg-inset)] px-4 py-3.5 text-sm text-[var(--fg-primary)] outline-none transition-all placeholder:text-[var(--fg-muted)] focus:border-[var(--control-border-strong)] focus:bg-white focus:ring-4 focus:ring-[var(--focus-ring)]";
const INPUT_ERR =
  "w-full rounded-[20px] border border-red-300 bg-[var(--control-bg-inset)] px-4 py-3.5 text-sm text-[var(--fg-primary)] outline-none transition-all placeholder:text-[var(--fg-muted)] focus:border-red-300 focus:bg-white focus:ring-4 focus:ring-red-100";
const LABEL = "mb-2 block text-[10px] font-semibold uppercase tracking-[0.18em] text-[var(--fg-tertiary)]";

const SELECT_STYLE = {
  backgroundImage:
    "url(\"data:image/svg+xml,%3Csvg width='10' height='6' viewBox='0 0 10 6' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M1 1L5 5L9 1' stroke='%238C8076' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/%3E%3C/svg%3E\")",
  backgroundRepeat: "no-repeat",
  backgroundPosition: "right 16px center",
  paddingRight: "42px",
  appearance: "none",
};

const PAISES = [
  { code: "DO", name: "Republica Dominicana", flag: "RD" },
  { code: "US", name: "Estados Unidos", flag: "US" },
  { code: "MX", name: "Mexico", flag: "MX" },
  { code: "CO", name: "Colombia", flag: "CO" },
  { code: "VE", name: "Venezuela", flag: "VE" },
  { code: "PE", name: "Peru", flag: "PE" },
  { code: "CL", name: "Chile", flag: "CL" },
  { code: "AR", name: "Argentina", flag: "AR" },
  { code: "EC", name: "Ecuador", flag: "EC" },
  { code: "GT", name: "Guatemala", flag: "GT" },
  { code: "HN", name: "Honduras", flag: "HN" },
  { code: "SV", name: "El Salvador", flag: "SV" },
  { code: "NI", name: "Nicaragua", flag: "NI" },
  { code: "CR", name: "Costa Rica", flag: "CR" },
  { code: "PA", name: "Panama", flag: "PA" },
  { code: "CU", name: "Cuba", flag: "CU" },
  { code: "PR", name: "Puerto Rico", flag: "PR" },
  { code: "BO", name: "Bolivia", flag: "BO" },
  { code: "PY", name: "Paraguay", flag: "PY" },
  { code: "UY", name: "Uruguay", flag: "UY" },
  { code: "ES", name: "Espana", flag: "ES" },
  { code: "PT", name: "Portugal", flag: "PT" },
];

function getStrength(password) {
  if (!password) return { score: 0, label: "", bar: "", color: "" };

  let score = 0;
  if (password.length >= 8) score += 1;
  if (/[A-Z]/.test(password)) score += 1;
  if (/[0-9]/.test(password)) score += 1;
  if (/[^A-Za-z0-9]/.test(password)) score += 1;

  const scale = {
    1: { label: "Debil", bar: "bg-red-500", color: "#C0392B" },
    2: { label: "Regular", bar: "bg-amber-500", color: "#B86A2D" },
    3: { label: "Buena", bar: "bg-orange-500", color: "#D94F10" },
    4: { label: "Fuerte", bar: "bg-emerald-600", color: "#2E7D52" },
  };

  return { score, ...(scale[score] || {}) };
}

export default function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    pais: "",
    password: "",
    confirmPassword: "",
    terms: false,
  });
  const [errors, setErrors] = useState({});
  const [globalError, setGlobalError] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [showConf, setShowConf] = useState(false);
  const [loading, setLoading] = useState(false);

  const strength = getStrength(form.password);

  const handleChange = ({ target: { name, value, type, checked } }) => {
    setForm((current) => ({ ...current, [name]: type === "checkbox" ? checked : value }));
    if (errors[name]) setErrors((current) => ({ ...current, [name]: "" }));
    if (globalError) setGlobalError("");
  };

  const validateStepOne = () => {
    const nextErrors = {};
    if (!form.nombre.trim()) nextErrors.nombre = "Requerido";
    if (!form.apellido.trim()) nextErrors.apellido = "Requerido";
    if (!form.email) nextErrors.email = "Requerido";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) nextErrors.email = "Correo invalido";
    if (!form.telefono.trim()) nextErrors.telefono = "Requerido";
    if (!form.pais) nextErrors.pais = "Selecciona tu pais";
    return nextErrors;
  };

  const validateStepTwo = () => {
    const nextErrors = {};
    if (!form.password) nextErrors.password = "Requerido";
    else if (form.password.length < 8) nextErrors.password = "Minimo 8 caracteres";
    if (!form.confirmPassword) nextErrors.confirmPassword = "Requerido";
    else if (form.password !== form.confirmPassword) nextErrors.confirmPassword = "No coinciden";
    if (!form.terms) nextErrors.terms = "Debes aceptar los terminos";
    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = validateStepOne();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setStep(2);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validateStepTwo();

    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setGlobalError("");

    try {
      await register({
        nombre: form.nombre,
        apellido: form.apellido,
        email: form.email,
        telefono: form.telefono,
        pais: form.pais,
        password: form.password,
        confirmPassword: form.confirmPassword,
      });
      navigate("/dashboard");
    } catch (error) {
      setGlobalError(error.message || "Error al crear la cuenta. Intenta de nuevo.");
      if (error.message?.toLowerCase().includes("correo")) setStep(1);
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (name) => (errors[name] ? INPUT_ERR : INPUT);
  const selectedCountry = PAISES.find((country) => country.code === form.pais);

  return (
    <div className="relative min-h-screen overflow-hidden bg-[linear-gradient(180deg,#FBF8F4_0%,#F2ECE5_100%)]">
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-[-12rem] top-[-8rem] h-[30rem] w-[30rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,48,0.14),_transparent_68%)]" />
        <div className="absolute bottom-[-10rem] right-[-8rem] h-[26rem] w-[26rem] rounded-full bg-[radial-gradient(circle,_rgba(217,79,16,0.1),_transparent_68%)]" />
        <div className="absolute inset-0 opacity-50" style={{ backgroundImage: "radial-gradient(circle, rgba(18,17,16,0.08) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      </div>

      <div className="relative z-10 mx-auto grid min-h-screen max-w-7xl gap-8 px-4 py-6 md:px-8 lg:grid-cols-[1.02fr_0.98fr] lg:items-center">
        <section className="hidden rounded-[36px] bg-[linear-gradient(150deg,#121110_0%,#241B16_52%,#121110_100%)] p-9 text-white shadow-[0_30px_80px_rgba(18,17,16,0.18)] lg:block">
          <Link to="/landing" className="flex items-center gap-3 no-underline">
            <div className="flex h-12 items-center px-4 py-2 rounded-[22px] bg-white/5 border border-white/10 backdrop-blur-md">
              <img src={logo} alt="Condome" className="h-8 w-auto brightness-0 invert opacity-90" />
            </div>
          </Link>

          <div className="mt-14 max-w-xl">
            <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#FFB184]">Registro de cuenta</p>
            <h1 className="mt-5 text-[3.4rem] font-semibold leading-[1.02]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Una experiencia de entrada mas cuidada desde el primer paso.
            </h1>
            <p className="mt-6 text-[15px] leading-7 text-white/70">
              Crea tu cuenta y entra a una plataforma mas estructurada para gestionar comunidad, espacios y finanzas sin perder el orden.
            </p>
          </div>

          <div className="mt-12 grid gap-4">
            {[
              "Paso 1: datos base del usuario y contexto.",
              "Paso 2: acceso seguro y preparacion de credenciales.",
              "Paso 3: redireccion al panel segun el rol del usuario.",
            ].map((item, index) => (
              <div key={item} className="flex items-center gap-4 rounded-[24px] border border-white/10 bg-white/6 px-5 py-4">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[rgba(255,122,48,0.12)] text-sm font-semibold text-[#FFB184]">
                  0{index + 1}
                </span>
                <p className="text-sm leading-6 text-white/66">{item}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="architectural-panel mx-auto w-full max-w-[560px] rounded-[36px] p-6 md:p-8">
          <div className="flex items-center justify-between gap-4">
            <Link to="/landing" className="no-underline">
              <img src={logo} alt="Condome" className="h-9 w-auto" />
            </Link>
            <Link to="/login" className="rounded-full bg-[rgba(217,79,16,0.1)] px-3.5 py-2 text-xs font-semibold text-[var(--condome-orange)] no-underline">
              Ya tengo cuenta
            </Link>
          </div>

          <div className="mt-10">
            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-[var(--condome-orange)]">Crear cuenta</p>
            <h1 className="mt-3 text-[2.2rem] font-semibold leading-tight text-[var(--fg-primary)]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Empieza con una base bien estructurada
            </h1>
            <p className="mt-3 text-sm leading-7 text-[var(--fg-secondary)]">
              Completa tus datos y prepara el acceso al panel principal sin salir del mismo flujo.
            </p>
          </div>

          <div className="mt-7 flex items-center gap-3 rounded-[24px] border border-[var(--border-subtle)] bg-white/72 px-4 py-3">
            <StepDot active={step === 1} done={step > 1} number={1} />
            <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${step === 1 ? "text-[var(--condome-orange)]" : "text-[var(--fg-tertiary)]"}`}>
              Datos base
            </span>
            <div className="h-px flex-1 bg-[var(--border-subtle)]" />
            <StepDot active={step === 2} done={false} number={2} />
            <span className={`text-[11px] font-semibold uppercase tracking-[0.18em] ${step === 2 ? "text-[var(--condome-orange)]" : "text-[var(--fg-tertiary)]"}`}>
              Acceso
            </span>
          </div>

          {globalError ? (
            <div className="mt-6 flex items-center gap-3 rounded-[22px] border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-600">
              <IconWarn />
              <span>{globalError}</span>
            </div>
          ) : null}

          <form className="mt-8" onSubmit={handleSubmit} noValidate>
            {step === 1 ? (
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className={LABEL}>Nombre</label>
                    <input name="nombre" value={form.nombre} onChange={handleChange} className={fieldClass("nombre")} placeholder="Nombre" />
                    {errors.nombre ? <p className="mt-1.5 text-[11px] text-red-500">{errors.nombre}</p> : null}
                  </div>
                  <div>
                    <label className={LABEL}>Apellido</label>
                    <input name="apellido" value={form.apellido} onChange={handleChange} className={fieldClass("apellido")} placeholder="Apellido" />
                    {errors.apellido ? <p className="mt-1.5 text-[11px] text-red-500">{errors.apellido}</p> : null}
                  </div>
                </div>

                <div>
                  <label className={LABEL}>Correo electronico</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} className={fieldClass("email")} placeholder="correo@ejemplo.com" />
                  {errors.email ? <p className="mt-1.5 text-[11px] text-red-500">{errors.email}</p> : null}
                </div>

                <div>
                  <label className={LABEL}>Telefono</label>
                  <input type="tel" name="telefono" value={form.telefono} onChange={handleChange} className={fieldClass("telefono")} placeholder="+1 809 000 0000" />
                  {errors.telefono ? <p className="mt-1.5 text-[11px] text-red-500">{errors.telefono}</p> : null}
                </div>

                <div>
                  <label className={LABEL}>Pais</label>
                  <div className="relative">
                    {selectedCountry ? (
                      <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-[rgba(217,79,16,0.1)] px-2 py-1 text-[10px] font-semibold text-[var(--condome-orange)]">
                        {selectedCountry.flag}
                      </span>
                    ) : null}
                    <select
                      name="pais"
                      value={form.pais}
                      onChange={handleChange}
                      className={`${fieldClass("pais")} ${selectedCountry ? "pl-16" : ""} cursor-pointer`}
                      style={SELECT_STYLE}
                    >
                      <option value="">Selecciona tu pais</option>
                      {PAISES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  {errors.pais ? <p className="mt-1.5 text-[11px] text-red-500">{errors.pais}</p> : null}
                </div>

                <button
                  type="button"
                  className="mt-3 w-full rounded-full border-none bg-[linear-gradient(135deg,#FF7A30,#D94F10)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_32px_rgba(217,79,16,0.2)] transition-transform hover:translate-y-[-1px]"
                  onClick={handleNext}
                >
                  Continuar
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className={LABEL}>Contrasena</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      name="password"
                      value={form.password}
                      onChange={handleChange}
                      className={`${fieldClass("password")} pr-12`}
                      placeholder="Minimo 8 caracteres"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl border-none bg-transparent p-1.5 text-[var(--fg-tertiary)] transition-colors hover:text-[var(--condome-orange)]"
                      onClick={() => setShowPass((current) => !current)}
                    >
                      {showPass ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                  {form.password ? (
                    <div className="mt-2">
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map((bar) => (
                          <div key={bar} className={`h-[4px] flex-1 rounded-full ${bar <= strength.score ? strength.bar : "bg-[rgba(30,26,23,0.08)]"}`} />
                        ))}
                      </div>
                      <p className="mt-1 text-[10px] font-semibold uppercase tracking-[0.12em]" style={{ color: strength.color }}>
                        {strength.label}
                      </p>
                    </div>
                  ) : null}
                  {errors.password ? <p className="mt-1.5 text-[11px] text-red-500">{errors.password}</p> : null}
                </div>

                <div>
                  <label className={LABEL}>Confirmar contrasena</label>
                  <div className="relative">
                    <input
                      type={showConf ? "text" : "password"}
                      name="confirmPassword"
                      value={form.confirmPassword}
                      onChange={handleChange}
                      className={`${fieldClass("confirmPassword")} pr-12`}
                      placeholder="Repite tu contrasena"
                    />
                    <button
                      type="button"
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-2xl border-none bg-transparent p-1.5 text-[var(--fg-tertiary)] transition-colors hover:text-[var(--condome-orange)]"
                      onClick={() => setShowConf((current) => !current)}
                    >
                      {showConf ? <IconEyeOff /> : <IconEye />}
                    </button>
                  </div>
                  {errors.confirmPassword ? <p className="mt-1.5 text-[11px] text-red-500">{errors.confirmPassword}</p> : null}
                </div>

                <label className="flex items-start gap-3 rounded-[24px] border border-[var(--border-subtle)] bg-white/72 px-4 py-4">
                  <input
                    type="checkbox"
                    name="terms"
                    checked={form.terms}
                    onChange={handleChange}
                    className="mt-1 h-4 w-4 cursor-pointer accent-[#D94F10]"
                  />
                  <span className="text-sm leading-6 text-[var(--fg-secondary)]">
                    Acepto los <a href="#" className="text-[var(--condome-orange)]">Terminos de Servicio</a> y la{" "}
                    <a href="#" className="text-[var(--condome-orange)]">Politica de Privacidad</a>.
                    {errors.terms ? <span className="mt-1 block text-[11px] text-red-500">{errors.terms}</span> : null}
                  </span>
                </label>

                <div className="flex flex-col gap-3 pt-1 md:flex-row">
                  <button
                    type="button"
                    className="rounded-full border border-[var(--border-standard)] bg-white px-5 py-4 text-sm font-medium text-[var(--fg-secondary)] transition-colors hover:bg-[var(--surface-3)] md:flex-1"
                    onClick={() => {
                      setStep(1);
                      setGlobalError("");
                    }}
                  >
                    Volver
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="flex items-center justify-center gap-2 rounded-full border-none bg-[linear-gradient(135deg,#FF7A30,#D94F10)] px-5 py-4 text-sm font-semibold uppercase tracking-[0.12em] text-white shadow-[0_16px_32px_rgba(217,79,16,0.2)] transition-transform hover:translate-y-[-1px] disabled:cursor-not-allowed disabled:opacity-60 md:flex-[1.4]"
                  >
                    {loading ? (
                      <>
                        <Spinner />
                        Creando
                      </>
                    ) : (
                      "Crear cuenta"
                    )}
                  </button>
                </div>
              </div>
            )}
          </form>
        </section>
      </div>

      <style>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

function StepDot({ active, done, number }) {
  return (
    <span
      className={`flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-semibold ${
        active
          ? "bg-[var(--condome-orange)] text-white"
          : done
            ? "bg-[rgba(217,79,16,0.1)] text-[var(--condome-orange)]"
            : "border border-[var(--border-standard)] bg-white text-[var(--fg-tertiary)]"
      }`}
    >
      {done ? "✓" : number}
    </span>
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

function Spinner() {
  return <span className="inline-block h-3.5 w-3.5 rounded-full border-2 border-white/35 border-t-white" style={{ animation: "spin 0.7s linear infinite" }} />;
}
