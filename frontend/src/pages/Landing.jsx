import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import logo from "../public/img/logo.svg";
import logoWhite from "../public/img/logo-white.svg";

const FEATURES = [
  {
    title: "Cobros y trazabilidad",
    description: "Centraliza cuotas, historial y seguimiento financiero sin depender de hojas dispersas.",
    points: ["Pagos en linea", "Estado de cuenta claro", "Alertas de mora y conciliacion"],
  },
  {
    title: "Operaciones del condominio",
    description: "Organiza reservas, incidencias, avisos y documentos desde una misma consola administrativa.",
    points: ["Tablones y publicaciones", "Incidencias con seguimiento", "Biblioteca documental"],
  },
  {
    title: "Accesos y comunidad",
    description: "Mantiene propietarios, residentes, visitas y vehiculos dentro de un flujo mucho mas ordenado.",
    points: ["Visitas autorizadas", "Control de accesos", "Registro por unidad"],
  },
];

const STATS = [
  { value: "1 panel", label: "para estructura, comunidad y finanzas" },
  { value: "Multiperfil", label: "diseñado para cada tipo de usuario" },
  { value: "100%", label: "centrado en control y trazabilidad" },
];

const PLANS = [
  {
    name: "Free",
    price: "$0",
    description: "Para propietarios que necesitan empezar a organizar su comunidad.",
    features: ["1 Condominio", "Gestión de residentes", "Pagos e incidencias base"],
  },
  {
    name: "Pro",
    price: "$1,200",
    description: "Para administradores en crecimiento que gestionan varias propiedades.",
    features: ["Hasta 3 Condominios", "Panel multi-condominio", "Soporte integrado"],
    featured: true,
  },
  {
    name: "Premium",
    price: "$6,000",
    description: "Para operadores profesionales con alta demanda de condominios.",
    features: ["Condominios ilimitados", "Acceso total", "Máximo control operativo"],
  },
];

function useInView(threshold = 0.12) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [threshold]);

  return [ref, visible];
}

function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView();

  return (
    <div
      ref={ref}
      className={className}
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(26px)",
        transition: `opacity 700ms ease ${delay}s, transform 700ms ease ${delay}s`,
      }}
    >
      {children}
    </div>
  );
}

function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 120);
    onScroll();
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <nav
      className="fixed inset-x-0 top-0 z-50 transition-all duration-300"
      style={{
        background: scrolled ? "rgba(255, 253, 250, 0.9)" : "rgba(18, 17, 16, 0.58)",
        backdropFilter: "blur(18px)",
        borderBottom: scrolled ? "1px solid rgba(30, 26, 23, 0.08)" : "1px solid rgba(255,255,255,0.08)",
      }}
    >
      <div className="mx-auto flex h-[60px] sm:h-[74px] max-w-7xl items-center justify-between px-4 sm:px-5 md:px-8">
        <Link to="/landing" className="no-underline">
          <img src={scrolled ? logo : logoWhite} alt="Condome" className="h-6 sm:h-7 md:h-8 w-auto" />
        </Link>

        <div className="hidden items-center gap-4 sm:gap-5 md:gap-7 lg:flex">
          <a href="#producto" className={`text-xs sm:text-sm font-medium no-underline transition-colors hover:text-[#D94F10] ${scrolled ? "text-[#5F554D]" : "text-white"}`}>
            Producto
          </a>
          <a href="#planes" className={`text-xs sm:text-sm font-medium no-underline transition-colors hover:text-[#D94F10] ${scrolled ? "text-[#5F554D]" : "text-white"}`}>
            Planes
          </a>
          <Link to="/login" className={`text-xs sm:text-sm font-medium no-underline transition-colors hover:text-[#D94F10] ${scrolled ? "text-[#5F554D]" : "text-white"}`}>
            Iniciar sesion
          </Link>
          <Link
            to="/register"
            className="rounded-full bg-[linear-gradient(135deg,#FF7A30,#D94F10)] px-4 sm:px-5 py-2 sm:py-2.5 text-xs sm:text-sm font-semibold text-white no-underline shadow-[0_14px_28px_rgba(217,79,16,0.2)] transition-transform hover:translate-y-[-1px]"
          >
            Empezar
          </Link>
        </div>

        <button
          type="button"
          className={`rounded-xl sm:rounded-2xl border-none bg-transparent p-1.5 sm:p-2 md:hidden ${scrolled ? "text-[#1E1A17]" : "text-white"}`}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <IconMenu />
        </button>
      </div>

      {menuOpen && (
        <div className="border-t border-[rgba(30,26,23,0.08)] bg-[#fffdfa] px-4 sm:px-5 py-3 sm:py-4 md:hidden">
          <div className="flex flex-col gap-2.5 sm:gap-3">
            <a href="#producto" className="text-sm text-[#5F554D] no-underline" onClick={() => setMenuOpen(false)}>
              Producto
            </a>
            <a href="#planes" className="text-sm text-[#5F554D] no-underline" onClick={() => setMenuOpen(false)}>
              Planes
            </a>
            <Link to="/login" className="text-sm text-[#5F554D] no-underline" onClick={() => setMenuOpen(false)}>
              Iniciar sesion
            </Link>
            <Link to="/register" className="text-sm font-semibold text-[#D94F10] no-underline" onClick={() => setMenuOpen(false)}>
              Empezar
            </Link>
          </div>
        </div>
      )}
    </nav>
  );
}

function Hero() {
  return (
    <section className="dark-surface-readable relative overflow-hidden bg-[linear-gradient(150deg,#121110_0%,#241B16_48%,#121110_100%)] px-4 sm:px-5 pb-16 sm:pb-20 pt-24 sm:pt-28 md:pt-32 md:pb-24 text-white">
      <div className="pointer-events-none absolute inset-0 opacity-60" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.06) 1px, transparent 1px)", backgroundSize: "30px 30px" }} />
      <div className="pointer-events-none absolute left-[-8rem] sm:left-[-10rem] top-8 sm:top-12 h-[20rem] sm:h-[28rem] w-[20rem] sm:w-[28rem] rounded-full bg-[radial-gradient(circle,_rgba(255,122,48,0.28),_transparent_68%)]" />
      <div className="pointer-events-none absolute bottom-[-8rem] sm:bottom-[-10rem] right-[-4rem] sm:right-[-6rem] h-[18rem] sm:h-[24rem] w-[18rem] sm:w-[24rem] rounded-full bg-[radial-gradient(circle,_rgba(217,79,16,0.18),_transparent_68%)]" />

      <div className="relative mx-auto grid max-w-7xl gap-8 sm:gap-10 md:gap-12 lg:grid-cols-[1.2fr_0.88fr] lg:items-center">
        <Reveal>
          <div>
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 sm:px-3.5 py-1.5">
              <span className="h-2 w-2 rounded-full bg-[#FF7A30]" />
              <span className="text-[9px] sm:text-[10px] md:text-[11px] font-semibold uppercase tracking-[0.2em] sm:tracking-[0.24em] text-[#FFB184]">
                Software para condominios
              </span>
            </div>

            <h1 className="mt-5 sm:mt-7 max-w-3xl text-[1.8rem] sm:text-[2.4rem] md:text-[2.9rem] lg:text-[4.5rem] font-semibold leading-[1.02]" style={{ fontFamily: "'Playfair Display', serif" }}>
              Un panel mas serio, claro y elegante para administrar tu comunidad.
            </h1>

            <p className="mt-4 sm:mt-6 max-w-xl text-[13px] sm:text-[14px] md:text-[15px] leading-6 sm:leading-7 text-white/90 md:text-lg">
              Condome reorganiza la gestion de condominios en una sola experiencia: estructura, comunidad,
              accesos, incidencias y cobros con una interfaz mas agradable para trabajar todos los dias.
            </p>

            <div className="mt-6 sm:mt-8 flex flex-wrap gap-2.5 sm:gap-3">
              <Link
                to="/register"
                className="rounded-full bg-[linear-gradient(135deg,#FF7A30,#D94F10)] px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-semibold uppercase tracking-[0.1em] sm:tracking-[0.12em] text-white no-underline shadow-[0_16px_32px_rgba(217,79,16,0.24)] transition-transform hover:translate-y-[-1px]"
              >
                Crear cuenta
              </Link>
              <Link
                to="/login"
                className="rounded-full border border-white/12 bg-white/6 px-5 sm:px-6 py-3 sm:py-4 text-xs sm:text-sm font-medium text-white no-underline transition-colors hover:bg-white/10"
              >
                Ver plataforma
              </Link>
            </div>

            <div className="mt-8 sm:mt-10 grid gap-3 sm:gap-4 grid-cols-1 sm:grid-cols-3">
              {STATS.map((item) => (
                <div key={item.label} className="rounded-[18px] sm:rounded-[24px] border border-white/10 bg-white/6 p-3 sm:p-4 backdrop-blur-sm">
                  <p className="text-lg sm:text-xl md:text-2xl font-semibold text-white" style={{ fontFamily: "'Playfair Display', serif" }}>
                    {item.value}
                  </p>
                  <p className="mt-0.5 sm:mt-1 text-xs sm:text-sm leading-5 sm:leading-6 text-white/60">{item.label}</p>
                </div>
              ))}
            </div>
          </div>
        </Reveal>

        <Reveal delay={0.08}>
          <DashboardPreview />
        </Reveal>
      </div>
    </section>
  );
}

function DashboardPreview() {
  return (
    <div className="relative">
      <div className="rounded-[32px] border border-white/10 bg-white/6 p-4 shadow-[0_26px_60px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <div className="rounded-[28px] border border-white/10 bg-[#FAF7F2] p-4 text-[#1E1A17]">
          <div className="flex items-center justify-between rounded-[24px] bg-[#121110] px-4 py-4 text-white">
            <div>
              <p className="text-[10px] uppercase tracking-[0.24em] text-white/70">Panel activo</p>
              <p className="mt-1 text-lg font-semibold" style={{ fontFamily: "'Playfair Display', serif" }}>
                Torre A · Vista general
              </p>
            </div>
            <span className="rounded-full bg-[rgba(255,122,48,0.12)] px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#FFB184]">
              En linea
            </span>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {[
              ["Ingresos", "$48.2K"],
              ["Incidencias", "12"],
              ["Pagos hoy", "26"],
            ].map(([label, value]) => (
              <div key={label} className="rounded-[22px] border border-[rgba(30,26,23,0.08)] bg-white p-4 shadow-[0_12px_26px_rgba(26,20,14,0.06)]">
                <p className="text-[11px] uppercase tracking-[0.18em] text-[#8C8076]">{label}</p>
                <p className="mt-3 text-[1.8rem] font-semibold text-[#1E1A17]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {value}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="rounded-[24px] border border-[rgba(30,26,23,0.08)] bg-white p-5 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.18em] text-[#8C8076]">Operacion</p>
                  <p className="mt-1 text-lg font-semibold text-[#1E1A17]">Actividad reciente</p>
                </div>
                <span className="rounded-full bg-[rgba(217,79,16,0.12)] px-3 py-1 text-[11px] font-semibold text-[#D94F10]">
                  Hoy
                </span>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Pago conciliado para Apt. 4B",
                  "Visita autorizada para Torre Norte",
                  "Nueva incidencia registrada en lobby",
                ].map((item, index) => (
                  <div key={item} className="flex items-center gap-3 rounded-[18px] bg-[#F7F2EC] px-4 py-3">
                    <span className={`h-9 w-9 rounded-2xl ${index === 0 ? "bg-[#121110]" : "bg-[rgba(217,79,16,0.12)]"} flex items-center justify-center text-sm font-semibold ${index === 0 ? "text-white" : "text-[#D94F10]"}`}>
                      0{index + 1}
                    </span>
                    <p className="text-sm leading-6 text-[#5F554D]">{item}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-[24px] border border-[rgba(30,26,23,0.08)] bg-[linear-gradient(145deg,#FFF8F1,#FFFFFF)] p-5 shadow-sm">
              <p className="text-[11px] uppercase tracking-[0.18em] text-[#D94F10]">Jerarquia clara</p>
              <p className="mt-2 text-lg font-semibold text-[#1E1A17]">Espacios diseñados para decidir rapido</p>
              <div className="mt-4 space-y-3">
                {["Cobros y balance", "Comunidad y accesos", "Bitacora y seguimiento"].map((item) => (
                  <div key={item} className="rounded-[18px] border border-[rgba(30,26,23,0.08)] bg-white px-4 py-3 shadow-sm">
                    <p className="text-sm font-semibold text-[#1E1A17]">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="absolute -bottom-6 -left-4 rounded-[24px] border border-white/12 bg-[#121110]/92 px-4 py-3 text-white shadow-[0_18px_40px_rgba(0,0,0,0.28)] backdrop-blur-xl">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[#FFB184]">Nueva estetica</p>
        <p className="mt-1 text-sm text-white/85">Mas claridad visual, mas estructura, menos ruido.</p>
      </div>
    </div>
  );
}

function ProductSection() {
  return (
    <section id="producto" className="px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#D94F10]">Producto</p>
          <h2 className="mt-4 text-[2.4rem] font-semibold leading-tight text-[#1E1A17] md:text-[3.3rem]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Una interfaz pensada como panel operativo, no como plantilla genérica.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#5F554D]">
            Todo el lenguaje visual se apoya en blanco, negro y naranja para comunicar orden, foco y autoridad.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {FEATURES.map((feature, index) => (
            <Reveal key={feature.title} delay={index * 0.08}>
              <article className="architectural-panel h-full rounded-[30px] p-7">
                <div className="flex h-12 w-12 items-center justify-center rounded-[18px] bg-[rgba(217,79,16,0.12)] text-[#D94F10]">
                  <IconPanel />
                </div>
                <h3 className="mt-6 text-[1.45rem] font-semibold text-[#1E1A17]" style={{ fontFamily: "'Playfair Display', serif" }}>
                  {feature.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-[#5F554D]">{feature.description}</p>

                <ul className="mt-5 space-y-2">
                  {feature.points.map((point) => (
                    <li key={point} className="flex items-center gap-3 text-sm text-[#3F3832]">
                      <span className="h-2 w-2 rounded-full bg-[#D94F10]" />
                      {point}
                    </li>
                  ))}
                </ul>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function PricingSection() {
  return (
    <section id="planes" className="border-y border-[rgba(30,26,23,0.06)] bg-[linear-gradient(180deg,#FFF9F3_0%,#F6F1EA_100%)] px-5 py-20 md:px-8 md:py-24">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <p className="text-[11px] font-semibold uppercase tracking-[0.26em] text-[#D94F10]">Planes</p>
          <h2 className="mt-4 text-[2.4rem] font-semibold leading-tight text-[#1E1A17] md:text-[3.2rem]" style={{ fontFamily: "'Playfair Display', serif" }}>
            Una estructura simple para crecer sin ruido.
          </h2>
          <p className="mt-4 text-[15px] leading-7 text-[#5F554D]">
            La plataforma mantiene el mismo lenguaje de trabajo en todos los planes: claridad, control y una experiencia mas agradable.
          </p>
        </Reveal>

        <div className="mt-12 grid gap-6 lg:grid-cols-3">
          {PLANS.map((plan, index) => (
            <Reveal key={plan.name} delay={index * 0.08}>
              <article
                className={`h-full rounded-[30px] p-7 ${plan.featured ? "dark-surface-readable bg-[#121110] text-white shadow-[0_28px_60px_rgba(18,17,16,0.18)]" : "architectural-panel"}`}
              >
                <div className="flex items-center justify-between">
                  <p className={`text-[11px] font-semibold uppercase tracking-[0.24em] ${plan.featured ? "text-[#FFB184]" : "text-[#D94F10]"}`}>
                    {plan.name}
                  </p>
                  {plan.featured ? (
                    <span className="rounded-full bg-[rgba(255,122,48,0.12)] px-3 py-1 text-[11px] font-semibold text-[#FFB184]">
                      Recomendado
                    </span>
                  ) : null}
                </div>
                <p className={`mt-5 text-[3rem] font-semibold ${plan.featured ? "text-white" : "text-[#1E1A17]"}`} style={{ fontFamily: "'Playfair Display', serif" }}>
                  {plan.price}
                </p>
                <p className={`mt-3 text-sm leading-7 ${plan.featured ? "text-white/80" : "text-[#5F554D]"}`}>{plan.description}</p>
                <div className={`my-6 h-px ${plan.featured ? "bg-white/10" : "bg-[rgba(30,26,23,0.08)]"}`} />
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className={`flex items-center gap-3 text-sm ${plan.featured ? "text-white/74" : "text-[#3F3832]"}`}>
                      <span className={`flex h-5 w-5 items-center justify-center rounded-full ${plan.featured ? "bg-[rgba(255,122,48,0.16)] text-[#FFB184]" : "bg-[rgba(217,79,16,0.12)] text-[#D94F10]"}`}>
                        <IconCheck />
                      </span>
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to="/register"
                  className={`mt-8 block rounded-full px-5 py-3 text-center text-sm font-semibold no-underline transition-transform hover:translate-y-[-1px] ${
                    plan.featured
                      ? "bg-[linear-gradient(135deg,#FF7A30,#D94F10)] text-white"
                      : "border border-[rgba(217,79,16,0.2)] bg-white text-[#D94F10]"
                  }`}
                >
                  Empezar ahora
                </Link>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function Footer() {
  return (
    <footer className="dark-surface-readable bg-[#121110] px-5 py-14 text-white md:px-8">
      <div className="mx-auto flex max-w-7xl flex-col gap-10 md:flex-row md:items-end md:justify-between">
        <div>
          <Link to="/landing" className="no-underline">
            <img src={logoWhite} alt="Condome" className="h-8 w-auto" />
          </Link>
          <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
            Diseñado para que propietarios, administradores y residentes interactuen con una experiencia mas clara, consistente y agradable.
          </p>
        </div>

        <div className="flex flex-col gap-3 text-sm text-white/58 md:items-end">
          <Link to="/login" className="text-white/68 no-underline transition-colors hover:text-white">
            Iniciar sesion
          </Link>
          <Link to="/register" className="text-white/68 no-underline transition-colors hover:text-white">
            Crear cuenta
          </Link>
          <p>© 2026 Condome</p>
        </div>
      </div>
    </footer>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-[#F7F3EE] text-[#1E1A17]">
      <Navbar />
      <Hero />
      <ProductSection />
      <PricingSection />
      <Footer />
    </div>
  );
}

function IconMenu() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M3 12h18M3 6h18M3 18h18" />
    </svg>
  );
}

function IconPanel() {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5">
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h10" />
    </svg>
  );
}

function IconCheck() {
  return (
    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-3 w-3">
      <path d="M2 6.2 4.5 8.5 10 3.5" />
    </svg>
  );
}
