import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCondominio } from "../../context/CondominioContext";
import { COUNTRIES, getCountryLabel } from "../../data/countries";

const INPUT =
  "w-full px-4 py-3 bg-[#FFFCF8] border border-[#E6D9CD] rounded-2xl text-[#1F1A16] text-sm outline-none transition-all duration-200 placeholder:text-[#A2978D] focus:border-[#D94F10] focus:ring-4 focus:ring-[#D94F10]/10";
const INPUT_ERR =
  "w-full px-4 py-3 bg-[#FFFCF8] border border-red-400 rounded-2xl text-[#1F1A16] text-sm outline-none transition-all duration-200 placeholder:text-[#A2978D] focus:border-red-400 focus:ring-4 focus:ring-red-400/10";
const LABEL = "block text-[10px] font-semibold tracking-[0.12em] uppercase text-[#B15A27] mb-1.5";
const SELECT = `${INPUT} appearance-none cursor-pointer`;

const TIPOS = [
  { value: "residencial", label: "Residencial", desc: "Operacion orientada a vivienda", color: "#D94F10" },
  { value: "comercial", label: "Comercial", desc: "Locales y uso empresarial", color: "#1A6B9A" },
  { value: "mixto", label: "Mixto", desc: "Vivienda y comercio combinados", color: "#2E7D52" },
];

const STEPS = ["Base del condominio", "Contacto y ubicacion"];

export default function RegistroCondominio({ onSuccess }) {
  const navigate = useNavigate();
  const { crearCondominio } = useCondominio();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    nombre: "",
    tipo: "residencial",
    rnc: "",
    direccion: "",
    ciudad: "",
    pais: "DO",
    telefono: "",
    email: "",
  });

  const handleChange = ({ target: { name, value } }) => {
    setForm((current) => ({ ...current, [name]: value }));
    if (errors[name]) {
      setErrors((current) => ({ ...current, [name]: "" }));
    }
    if (error) setError("");
  };

  const validateStep0 = () => {
    const nextErrors = {};
    if (!form.nombre.trim()) nextErrors.nombre = "El nombre es requerido";
    if (!form.direccion.trim()) nextErrors.direccion = "La direccion es requerida";
    return nextErrors;
  };

  const validateStep1 = () => {
    const nextErrors = {};
    if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) {
      nextErrors.email = "Correo invalido";
    }
    return nextErrors;
  };

  const handleNext = () => {
    const nextErrors = step === 0 ? validateStep0() : {};
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }
    setStep(1);
  };

  const handleSubmit = async () => {
    const nextErrors = validateStep1();
    if (Object.keys(nextErrors).length) {
      setErrors(nextErrors);
      return;
    }

    setLoading(true);
    setError("");

    try {
      const result = await crearCondominio(form);
      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess(result.data);
        else navigate("/condominio");
      }, 1600);
    } catch (submitError) {
      setError(submitError.message || "Error al registrar el condominio");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mb-6 shadow-lg"
          style={{ background: "linear-gradient(135deg, #FF9966, #D94F10)" }}
        >
          <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round">
            <polyline points="20,6 9,17 4,12" />
          </svg>
        </div>
        <h2
          style={{ fontFamily: "'Playfair Display', serif" }}
          className="text-2xl font-semibold text-[#1F1A16]"
        >
          Condominio registrado
        </h2>
        <p className="mt-2 text-sm text-[#6D625A]">Redirigiendo a la ficha principal del condominio...</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
      <div>
        <div className="mb-8">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
            Registro inicial
          </p>
          <h1
            style={{ fontFamily: "'Playfair Display', serif" }}
            className="mt-2 text-3xl font-semibold text-[#1F1A16]"
          >
            Registrar condominio
          </h1>
          <p className="mt-3 text-sm leading-7 text-[#6D625A] max-w-2xl">
            Completa esta ficha para habilitar el backend administrativo. A partir de aqui podras
            organizar estructura, comunidad, pagos, accesos y seguimiento operativo.
          </p>
        </div>

        <div className="flex items-center gap-3 mb-8">
          {STEPS.map((stepLabel, index) => (
            <div key={stepLabel} className="flex items-center gap-3 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-semibold transition-all ${
                  index < step
                    ? "bg-[#D94F10] text-white"
                    : index === step
                      ? "bg-[#1A6B9A] text-white"
                      : "bg-[#E8DDD3] text-[#8C776A]"
                }`}
              >
                {index < step ? "✓" : index + 1}
              </div>
              <span className={`text-sm font-semibold ${index === step ? "text-[#1F1A16]" : "text-[#8C776A]"}`}>
                {stepLabel}
              </span>
              {index < STEPS.length - 1 ? (
                <div className={`flex-1 h-px ${index < step ? "bg-[#D94F10]" : "bg-[#E8DDD3]"}`} />
              ) : null}
            </div>
          ))}
        </div>

        <div className="rounded-[30px] border border-[#E6D9CD] bg-[#FFFCF8] p-6 md:p-7 shadow-[0_18px_40px_rgba(71,52,38,0.08)]">
          {error ? (
            <div className="flex items-center gap-2.5 px-4 py-3 mb-6 rounded-2xl bg-red-50 border border-red-200 text-red-600 text-sm">
              {error}
            </div>
          ) : null}

          {step === 0 ? (
            <div className="space-y-6">
              <div>
                <label className={LABEL}>Nombre del condominio *</label>
                <input
                  name="nombre"
                  value={form.nombre}
                  onChange={handleChange}
                  className={errors.nombre ? INPUT_ERR : INPUT}
                  placeholder="Ej: Torres del Sol, Residencial Las Palmas..."
                />
                {errors.nombre ? <p className="mt-1 text-[11px] text-red-500">{errors.nombre}</p> : null}
              </div>

              <div>
                <label className={LABEL}>Tipo de condominio *</label>
                <div className="grid gap-3 md:grid-cols-3">
                  {TIPOS.map((tipo) => (
                    <button
                      key={tipo.value}
                      type="button"
                      onClick={() => setForm((current) => ({ ...current, tipo: tipo.value }))}
                      className={`p-4 rounded-2xl border text-left transition-all cursor-pointer ${
                        form.tipo === tipo.value
                          ? "border-transparent shadow-md"
                          : "border-[#E6D9CD] bg-[#F8F1EA] hover:border-[#D94F10]/35"
                      }`}
                      style={
                        form.tipo === tipo.value
                          ? {
                              background: `linear-gradient(135deg, ${tipo.color}18, rgba(255,255,255,0.95))`,
                              boxShadow: `0 10px 24px ${tipo.color}18`,
                            }
                          : undefined
                      }
                    >
                      <p className="text-sm font-semibold text-[#1F1A16]">{tipo.label}</p>
                      <p className="mt-1 text-xs leading-5 text-[#6D625A]">{tipo.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>RNC / Documento fiscal</label>
                  <input
                    name="rnc"
                    value={form.rnc}
                    onChange={handleChange}
                    className={INPUT}
                    placeholder="Ej: 101-00000-1"
                  />
                </div>
                <div>
                  <label className={LABEL}>Direccion *</label>
                  <input
                    name="direccion"
                    value={form.direccion}
                    onChange={handleChange}
                    className={errors.direccion ? INPUT_ERR : INPUT}
                    placeholder="Av. Principal #123, sector..."
                  />
                  {errors.direccion ? <p className="mt-1 text-[11px] text-red-500">{errors.direccion}</p> : null}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className={LABEL}>Pais</label>
                  <div className="relative">
                    <select name="pais" value={form.pais} onChange={handleChange} className={SELECT}>
                      {COUNTRIES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.name}
                        </option>
                      ))}
                    </select>
                    <svg
                      className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-[#B15A27]"
                      width="14"
                      height="14"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                    >
                      <polyline points="6,9 12,15 18,9" />
                    </svg>
                  </div>
                </div>
                <div>
                  <label className={LABEL}>Ciudad</label>
                  <input name="ciudad" value={form.ciudad} onChange={handleChange} className={INPUT} placeholder="Santo Domingo" />
                </div>
                <div>
                  <label className={LABEL}>Telefono</label>
                  <input name="telefono" value={form.telefono} onChange={handleChange} className={INPUT} placeholder="809-000-0000" />
                </div>
                <div>
                  <label className={LABEL}>Correo de contacto</label>
                  <input
                    name="email"
                    value={form.email}
                    onChange={handleChange}
                    className={errors.email ? INPUT_ERR : INPUT}
                    placeholder="contacto@condominio.com"
                  />
                  {errors.email ? <p className="mt-1 text-[11px] text-red-500">{errors.email}</p> : null}
                </div>
              </div>
            </div>
          )}

          <div className="flex gap-3 mt-8">
            {step > 0 ? (
              <button
                onClick={() => setStep((current) => current - 1)}
                className="flex-1 py-3 rounded-2xl border border-[#E6D9CD] text-[#6D625A] text-sm font-semibold hover:border-[#D94F10]/40 transition-all cursor-pointer bg-white"
              >
                Atras
              </button>
            ) : null}
            <button
              onClick={step < STEPS.length - 1 ? handleNext : handleSubmit}
              disabled={loading}
              className="flex-1 py-3 rounded-2xl text-white text-sm font-semibold transition-all cursor-pointer border-none disabled:opacity-50"
              style={{ background: "linear-gradient(135deg, #FF9966, #D94F10)" }}
            >
              {loading ? "Guardando..." : step < STEPS.length - 1 ? "Continuar" : "Registrar condominio"}
            </button>
          </div>
        </div>
      </div>

      <aside className="space-y-6">
        <div className="rounded-[30px] border border-[#E6D9CD] bg-[#FFF8F2] p-6 shadow-[0_18px_40px_rgba(71,52,38,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
            Resumen del registro
          </p>
          <div className="mt-5 space-y-3">
            {[
              { label: "Nombre", value: form.nombre || "Pendiente" },
              { label: "Tipo", value: TIPOS.find((item) => item.value === form.tipo)?.label || "Pendiente" },
              { label: "Direccion", value: form.direccion || "Pendiente" },
              { label: "Pais", value: getCountryLabel(form.pais) || "Pendiente" },
              { label: "Ciudad", value: form.ciudad || "Pendiente" },
            ].map((item) => (
              <div key={item.label} className="rounded-[20px] border border-[#E6D9CD] bg-[#FFFCF8] p-4">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#B15A27]">{item.label}</p>
                <p className="mt-2 text-sm font-semibold text-[#1F1A16]">{item.value}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-[30px] border border-[#E6D9CD] bg-[#F8F1EA] p-6 shadow-[0_18px_40px_rgba(71,52,38,0.06)]">
          <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
            Despues del registro
          </p>
          <div className="mt-5 space-y-3">
            {[
              "Crear edificios y apartamentos para darle estructura al condominio.",
              "Registrar residentes y responsables para activar los flujos operativos.",
              "Configurar avisos, acceso, cobros y trazabilidad desde el panel principal.",
            ].map((item) => (
              <div key={item} className="rounded-[20px] border border-[#E6D9CD] bg-[#FFFCF8] px-4 py-3">
                <p className="text-sm leading-6 text-[#6D625A]">{item}</p>
              </div>
            ))}
          </div>
        </div>
      </aside>
    </div>
  );
}
