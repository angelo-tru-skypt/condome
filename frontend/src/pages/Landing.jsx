import { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import logo from "../public/img/logo.svg";

/* ══════════════════════════════════════════════════════════════════
   CONDOME — Landing Page
   Dirigida a administradores de condominios
   Paleta: naranja #D94F10 / #FF7A30 sobre crema #F7F5F2 y blanco
══════════════════════════════════════════════════════════════════ */

/* ── Hook para animación al entrar en viewport ── */
function useInView(threshold = 0.15) {
  const ref = useRef(null);
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect(); } },
      { threshold }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, [threshold]);
  return [ref, visible];
}

/* ── Componente de sección animada ── */
function Reveal({ children, delay = 0, className = "" }) {
  const [ref, visible] = useInView();
  return (
    <div ref={ref} className={className} style={{
      opacity:    visible ? 1 : 0,
      transform:  visible ? "translateY(0)" : "translateY(32px)",
      transition: `opacity 0.7s ease ${delay}s, transform 0.7s ease ${delay}s`,
    }}>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   NAVBAR
══════════════════════════════════════════════════════════════════ */
function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const fn = () => setScrolled(window.scrollY > 60);
    window.addEventListener("scroll", fn);
    return () => window.removeEventListener("scroll", fn);
  }, []);

  // Sobre el hero oscuro → links blancos | tras scroll → links oscuros
  const linkColor    = scrolled ? "#6B6158" : "rgba(255,255,255,0.85)";
  const linkHover    = "#FF7A30";
  const loginColor   = scrolled ? "#6B6158" : "rgba(255,255,255,0.75)";

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 transition-all duration-400"
      style={{
        background:     scrolled ? "rgba(255,255,255,0.95)" : "rgba(0,0,0,0.15)",
        backdropFilter: "blur(14px)",
        borderBottom:   scrolled ? "1px solid rgba(229,224,216,0.6)" : "1px solid rgba(255,255,255,0.06)",
        boxShadow:      scrolled ? "0 2px 20px rgba(26,22,18,0.08)" : "none",
      }}>
      <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">

        {/* Logo — texto blanco sobre hero oscuro, naranja tras scroll */}
        <Link to="/" className="flex items-center gap-2.5">
          {scrolled ? (
            <img src={logo} alt="Condome" className="h-9 w-auto" />
          ) : (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z" fill="white"/>
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Condome
              </span>
            </div>
          )}
        </Link>

        {/* Nav links — desktop */}
        <div className="hidden md:flex items-center gap-8">
          {[["#features", "Características"], ["#precios", "Precios"]].map(([href, label]) => (
            <a key={href} href={href}
              className="text-sm font-medium transition-colors duration-200"
              style={{ color: linkColor }}
              onMouseEnter={e => e.target.style.color = linkHover}
              onMouseLeave={e => e.target.style.color = linkColor}>
              {label}
            </a>
          ))}
        </div>

        {/* CTA buttons */}
        <div className="hidden md:flex items-center gap-3">
          <Link to="/login"
            className="px-4 py-2 text-sm font-medium transition-colors duration-200"
            style={{ color: loginColor }}>
            Iniciar sesión
          </Link>
          <Link to="/register"
            className="px-5 py-2.5 text-sm font-semibold text-white rounded-xl transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
            style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)", boxShadow: "0 4px 14px rgba(217,79,16,0.35)" }}>
            Empezar gratis
          </Link>
        </div>

        {/* Mobile menu button */}
        <button className="md:hidden p-2 transition-colors"
          style={{ color: scrolled ? "#6B6158" : "white" }}
          onClick={() => setMenuOpen(o => !o)}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            {menuOpen
              ? <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              : <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            }
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {menuOpen && (
        <div className="md:hidden bg-white border-t border-[#E5E0D8] px-6 py-4 space-y-3">
          <a href="#features" className="block text-sm text-[#6B6158]" onClick={() => setMenuOpen(false)}>Características</a>
          <a href="#precios"  className="block text-sm text-[#6B6158]" onClick={() => setMenuOpen(false)}>Precios</a>
          <hr className="border-[#E5E0D8]" />
          <Link to="/login"    className="block text-sm text-[#6B6158]">Iniciar sesión</Link>
          <Link to="/register" className="block text-sm font-semibold text-[#D94F10]">Empezar gratis →</Link>
        </div>
      )}
    </nav>
  );
}

/* ══════════════════════════════════════════════════════════════════
   HERO
══════════════════════════════════════════════════════════════════ */
function Hero() {
  return (
    <section className="relative min-h-screen flex items-center overflow-hidden"
      style={{ background: "linear-gradient(160deg, #1A1612 0%, #2D2318 50%, #1A1612 100%)" }}>

      {/* Fondo — patrón de puntos */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize:  "32px 32px",
        }} />

      {/* Glow naranja izquierda */}
      <div className="absolute -left-40 top-1/4 w-[600px] h-[600px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(217,79,16,0.18) 0%, transparent 65%)" }} />

      {/* Glow naranja derecha */}
      <div className="absolute -right-40 bottom-1/4 w-[400px] h-[400px] rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(255,122,48,0.1) 0%, transparent 65%)" }} />

      {/* Línea decorativa diagonal */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 right-1/3 w-px h-full opacity-10"
          style={{ background: "linear-gradient(to bottom, transparent, #FF7A30, transparent)" }} />
      </div>

      <div className="relative z-10 max-w-6xl mx-auto px-6 pt-28 pb-20 grid md:grid-cols-2 gap-16 items-center">

        {/* Copy */}
        <div>
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full mb-8 border"
            style={{ background: "rgba(217,79,16,0.1)", borderColor: "rgba(217,79,16,0.25)" }}>
            <span className="w-1.5 h-1.5 rounded-full bg-[#FF7A30] animate-pulse" />
            <span className="text-[11px] font-semibold tracking-[0.15em] uppercase text-[#FF7A30]">
              SaaS para condominios
            </span>
          </div>

          <h1 className="mb-6 leading-[1.1]"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            <span className="block text-[52px] md:text-[64px] font-bold text-white">
              Gestiona tu
            </span>
            <span className="block text-[52px] md:text-[64px] font-bold"
              style={{ WebkitTextStroke: "2px #D94F10", color: "transparent" }}>
              condominio
            </span>
            <span className="block text-[52px] md:text-[64px] font-bold text-white">
              sin caos.
            </span>
          </h1>

          <p className="text-[#A89E94] text-lg leading-relaxed mb-10 max-w-md"
            style={{ fontFamily: "'DM Sans', sans-serif" }}>
            La plataforma todo-en-uno que simplifica la administración de residencias.
            Pagos, reservas, visitantes y más — desde un solo lugar.
          </p>

          {/* CTA buttons */}
          <div className="flex flex-wrap gap-4">
            <Link to="/register"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-white font-semibold text-sm tracking-wide transition-all duration-200 hover:opacity-90 hover:-translate-y-0.5"
              style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)", boxShadow: "0 8px 24px rgba(217,79,16,0.4)" }}>
              Empezar gratis
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <a href="#features"
              className="inline-flex items-center gap-2 px-7 py-4 rounded-xl text-[#C8C0B4] font-medium text-sm border border-white/10 hover:border-white/20 hover:text-white transition-all duration-200">
              Ver características
            </a>
          </div>


        </div>

        {/* Dashboard mockup */}
        <div className="hidden md:block relative">
          <DashboardMockup />
        </div>
      </div>

      {/* Wave bottom */}
      <div className="absolute bottom-0 left-0 right-0">
        <svg viewBox="0 0 1440 80" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M0 80V40C240 0 480 60 720 40C960 20 1200 60 1440 40V80H0Z" fill="#F7F5F2"/>
        </svg>
      </div>
    </section>
  );
}

/* ── Mockup del dashboard ── */
function DashboardMockup() {
  return (
    <div className="relative" style={{ perspective: "1000px" }}>
      <div style={{ transform: "rotateY(-8deg) rotateX(4deg)", transformStyle: "preserve-3d" }}>

        {/* Ventana principal */}
        <div className="rounded-2xl overflow-hidden border border-white/10"
          style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(10px)", boxShadow: "0 40px 80px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)" }}>

          {/* Barra de título */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-white/8">
            <div className="flex gap-1.5">
              <div className="w-3 h-3 rounded-full bg-red-500/60" />
              <div className="w-3 h-3 rounded-full bg-yellow-500/60" />
              <div className="w-3 h-3 rounded-full bg-green-500/60" />
            </div>
            <div className="flex-1 mx-4 h-5 rounded bg-white/5 flex items-center px-3">
              <span className="text-[10px] text-white/30">condome.app/dashboard</span>
            </div>
          </div>

          {/* Contenido del mockup */}
          <div className="p-5 space-y-4">

            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="h-3 w-32 rounded bg-white/20 mb-1.5" />
                <div className="h-2 w-20 rounded bg-white/10" />
              </div>
              <div className="h-8 w-24 rounded-lg"
                style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }} />
            </div>

            {/* Stat cards */}
            <div className="grid grid-cols-3 gap-3">
              {[
                { label: "Residentes", value: "248", color: "#FF7A30" },
                { label: "Pagos",      value: "$12K", color: "#4CAF82" },
                { label: "Alertas",    value: "3",    color: "#E8A838" },
              ].map(s => (
                <div key={s.label} className="rounded-xl p-3 border border-white/8"
                  style={{ background: "rgba(255,255,255,0.04)" }}>
                  <div className="text-[10px] text-white/40 mb-1">{s.label}</div>
                  <div className="text-lg font-bold" style={{ color: s.color, fontFamily: "'Playfair Display', serif" }}>
                    {s.value}
                  </div>
                </div>
              ))}
            </div>

            {/* Lista de items */}
            {[85, 65, 90, 45].map((w, i) => (
              <div key={i} className="flex items-center gap-3 py-2 border-b border-white/5">
                <div className="w-7 h-7 rounded-lg flex-shrink-0"
                  style={{ background: i === 0 ? "rgba(217,79,16,0.3)" : "rgba(255,255,255,0.06)" }} />
                <div className="flex-1">
                  <div className="h-2 rounded mb-1.5" style={{ width: `${w}%`, background: "rgba(255,255,255,0.15)" }} />
                  <div className="h-1.5 rounded w-1/2" style={{ background: "rgba(255,255,255,0.07)" }} />
                </div>
                <div className="h-5 w-12 rounded-full"
                  style={{ background: i % 2 === 0 ? "rgba(76,175,130,0.2)" : "rgba(232,168,56,0.2)" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Card flotante — notificación */}
        <div className="absolute -right-8 -bottom-6 rounded-xl px-4 py-3 border border-white/10 flex items-center gap-3"
          style={{ background: "rgba(26,22,18,0.9)", backdropFilter: "blur(16px)", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }}>
          <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
            style={{ background: "rgba(76,175,130,0.2)" }}>
            <span className="text-sm">✅</span>
          </div>
          <div>
            <div className="text-[11px] font-semibold text-white">Pago recibido</div>
            <div className="text-[10px] text-white/40">Apt. 4B · $850.00</div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FEATURES
══════════════════════════════════════════════════════════════════ */
const FEATURES = [
  {
    icon: "💳",
    title: "Gestión de Pagos",
    desc: "Cobra cuotas de mantenimiento, genera recibos automáticos y lleva el control de morosos en tiempo real.",
    items: ["Pagos en línea", "Historial completo", "Alertas de mora"],
  },
  {
    icon: "🏊",
    title: "Reservas de Áreas",
    desc: "Permite a los residentes reservar amenidades como piscina, salón de eventos o gym sin conflictos.",
    items: ["Calendario visual", "Confirmación automática", "Límite por unidad"],
  },
  {
    icon: "🚗",
    title: "Control de Visitantes",
    desc: "Registra entradas y salidas de visitantes y vehículos. Autorización digital desde el celular.",
    items: ["QR de acceso", "Registro fotográfico", "Historial de ingresos"],
  },
  {
    icon: "📢",
    title: "Comunicación",
    desc: "Envía anuncios, circulares y notificaciones a todos los residentes o por áreas específicas.",
    items: ["Notificaciones push", "Tablón digital", "Segmentación por torre"],
  },
  {
    icon: "📊",
    title: "Reportes y Finanzas",
    desc: "Dashboards en tiempo real con ingresos, gastos, ocupación y estado financiero del condominio.",
    items: ["Exportar a PDF/Excel", "Gráficas interactivas", "Cierre mensual"],
  },
  {
    icon: "🔧",
    title: "Incidencias y Mantenimiento",
    desc: "Los residentes reportan problemas, tú los asignas y das seguimiento hasta resolución.",
    items: ["Ticket por incidencia", "Asignación a técnicos", "Estado en tiempo real"],
  },
];

function Features() {
  return (
    <section id="features" className="py-28 bg-[#F7F5F2] relative overflow-hidden">

      {/* Decoración fondo */}
      <div className="absolute top-0 right-0 w-96 h-96 rounded-full pointer-events-none"
        style={{ background: "radial-gradient(circle, rgba(217,79,16,0.05) 0%, transparent 70%)" }} />

      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <Reveal className="text-center mb-20">
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D94F10] mb-4">
            Todo lo que necesitas
          </span>
          <h2 className="text-[42px] md:text-[52px] font-bold text-[#1A1612] leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Una plataforma,<br />
            <span className="text-[#D94F10]">todo el control.</span>
          </h2>
          <p className="text-[#6B6158] text-lg max-w-xl mx-auto leading-relaxed">
            Diseñada específicamente para administradores que quieren orden,
            transparencia y residentes satisfechos.
          </p>
        </Reveal>

        {/* Grid de features */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {FEATURES.map((f, i) => (
            <Reveal key={f.title} delay={i * 0.08}>
              <FeatureCard {...f} />
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

function FeatureCard({ icon, title, desc, items }) {
  const [hovered, setHovered] = useState(false);

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="group relative bg-white rounded-2xl p-7 cursor-default transition-all duration-300"
      style={{
        boxShadow: hovered
          ? "0 20px 60px rgba(217,79,16,0.12), 0 4px 16px rgba(26,22,18,0.06)"
          : "0 2px 4px rgba(26,22,18,0.04), 0 8px 24px rgba(26,22,18,0.06)",
        transform: hovered ? "translateY(-4px)" : "translateY(0)",
        border: hovered ? "1px solid rgba(217,79,16,0.15)" : "1px solid rgba(229,224,216,0.8)",
      }}>

      {/* Icono */}
      <div className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl mb-5 transition-all duration-300"
        style={{
          background: hovered ? "rgba(217,79,16,0.1)" : "#F7F5F2",
        }}>
        {icon}
      </div>

      {/* Línea naranja al hover */}
      <div className="absolute top-0 left-7 right-7 h-[2px] rounded-full transition-all duration-300"
        style={{
          background: "linear-gradient(90deg, #FF7A30, #D94F10)",
          opacity: hovered ? 1 : 0,
          transform: hovered ? "scaleX(1)" : "scaleX(0)",
          transformOrigin: "left",
        }} />

      <h3 className="text-[17px] font-semibold text-[#1A1612] mb-2"
        style={{ fontFamily: "'Playfair Display', serif" }}>
        {title}
      </h3>
      <p className="text-sm text-[#6B6158] leading-relaxed mb-5">{desc}</p>

      {/* Items */}
      <ul className="space-y-2">
        {items.map(item => (
          <li key={item} className="flex items-center gap-2 text-xs text-[#6B6158]">
            <span className="w-1.5 h-1.5 rounded-full bg-[#D94F10] flex-shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PRECIOS
══════════════════════════════════════════════════════════════════ */
const PLANES = [
  {
    name:     "Básico",
    price:    "12",
    period:   "/mes",
    desc:     "Ideal para condominios pequeños que están comenzando.",
    highlight: false,
    features: [
      "Hasta 50 unidades",
      "Gestión de pagos",
      "Control de visitantes",
      "Anuncios básicos",
      "Soporte por email",
    ],
    cta: "Empezar gratis",
  },
  {
    name:      "Profesional",
    price:     "20",
    period:    "/mes",
    desc:      "Para condominios medianos que necesitan todo bajo control.",
    highlight:  true,
    badge:     "Más popular",
    features: [
      "Hasta 200 unidades",
      "Todo del plan Básico",
      "Reservas de amenidades",
      "Reportes financieros",
      "App para residentes",
      "Soporte prioritario",
    ],
    cta: "Empezar gratis",
  },
  {
    name:     "Enterprise",
    price:    "35",
    period:   "/mes",
    desc:     "Para grandes desarrollos o empresas administradoras.",
    highlight: false,
    features: [
      "Unidades ilimitadas",
      "Todo del plan Pro",
      "Multi-condominio",
      "API personalizada",
      "Gerente de cuenta",
      "SLA garantizado",
    ],
    cta: "Contactar ventas",
  },
];

function Pricing() {
  return (
    <section id="precios" className="py-28 relative overflow-hidden"
      style={{ background: "linear-gradient(180deg, #F7F5F2 0%, #EFEDE9 100%)" }}>

      <div className="max-w-6xl mx-auto px-6">

        {/* Header */}
        <Reveal className="text-center mb-16">
          <span className="inline-block text-[11px] font-semibold tracking-[0.2em] uppercase text-[#D94F10] mb-4">
            Planes y precios
          </span>
          <h2 className="text-[42px] md:text-[52px] font-bold text-[#1A1612] leading-tight mb-5"
            style={{ fontFamily: "'Playfair Display', serif" }}>
            Simple y transparente.
          </h2>
          <p className="text-[#6B6158] text-lg max-w-lg mx-auto">
            Sin costos ocultos. Cancela cuando quieras. 14 días de prueba gratis en todos los planes.
          </p>
        </Reveal>

        {/* Cards */}
        <div className="grid md:grid-cols-3 gap-6 items-center">
          {PLANES.map((plan, i) => (
            <Reveal key={plan.name} delay={i * 0.1}>
              <PlanCard {...plan} />
            </Reveal>
          ))}
        </div>

        {/* Nota */}
        <Reveal className="text-center mt-12">
          <p className="text-sm text-[#A89E94]">
            ¿Tienes más de 500 unidades?{" "}
            <a href="mailto:ventas@condome.com" className="text-[#D94F10] hover:underline font-medium">
              Contáctanos para un plan personalizado
            </a>
          </p>
        </Reveal>
      </div>
    </section>
  );
}

function PlanCard({ name, price, period, desc, highlight, badge, features, cta }) {
  return (
    <div className="relative rounded-2xl p-8 transition-all duration-300"
      style={highlight ? {
        background:   "linear-gradient(160deg, #2D2318 0%, #1A1612 100%)",
        boxShadow:    "0 32px 64px rgba(26,22,18,0.25), 0 0 0 1px rgba(217,79,16,0.2)",
        transform:    "scale(1.04)",
      } : {
        background:   "#FFFFFF",
        boxShadow:    "0 2px 4px rgba(26,22,18,0.04), 0 8px 24px rgba(26,22,18,0.07)",
        border:       "1px solid rgba(229,224,216,0.8)",
      }}>

      {/* Badge */}
      {badge && (
        <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full text-[11px] font-bold tracking-wider uppercase text-white"
          style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)", boxShadow: "0 4px 12px rgba(217,79,16,0.4)" }}>
          {badge}
        </div>
      )}

      {/* Plan name */}
      <div className="mb-6">
        <h3 className={`text-sm font-semibold tracking-[0.1em] uppercase mb-1 ${highlight ? "text-[#FF7A30]" : "text-[#D94F10]"}`}>
          {name}
        </h3>
        <div className="flex items-end gap-1">
          <span className={`text-[48px] font-bold leading-none ${highlight ? "text-white" : "text-[#1A1612]"}`}
            style={{ fontFamily: "'Playfair Display', serif" }}>
            ${price}
          </span>
          <span className={`text-sm mb-2 ${highlight ? "text-white/40" : "text-[#A89E94]"}`}>{period}</span>
        </div>
        <p className={`text-sm mt-2 leading-relaxed ${highlight ? "text-white/50" : "text-[#6B6158]"}`}>
          {desc}
        </p>
      </div>

      {/* Divider */}
      <div className={`h-px mb-6 ${highlight ? "bg-white/10" : "bg-[#E5E0D8]"}`} />

      {/* Features */}
      <ul className="space-y-3 mb-8">
        {features.map(f => (
          <li key={f} className="flex items-start gap-3 text-sm">
            <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: highlight ? "rgba(217,79,16,0.3)" : "rgba(217,79,16,0.1)" }}>
              <svg width="8" height="8" viewBox="0 0 10 8" fill="none">
                <path d="M1 4L3.5 6.5L9 1" stroke={highlight ? "#FF7A30" : "#D94F10"} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </span>
            <span className={highlight ? "text-white/70" : "text-[#6B6158]"}>{f}</span>
          </li>
        ))}
      </ul>

      {/* CTA */}
      <Link to="/register"
        className="block text-center py-3.5 rounded-xl text-sm font-semibold tracking-wide transition-all duration-200 hover:opacity-90 hover:-translate-y-px"
        style={highlight ? {
          background:  "linear-gradient(135deg, #FF7A30, #D94F10)",
          color:       "white",
          boxShadow:   "0 8px 20px rgba(217,79,16,0.4)",
        } : {
          background:  "transparent",
          color:       "#D94F10",
          border:      "1.5px solid #D94F10",
        }}>
        {cta}
      </Link>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
   FOOTER
══════════════════════════════════════════════════════════════════ */
function Footer() {
  return (
    <footer className="bg-[#1A1612] py-16">
      <div className="max-w-6xl mx-auto px-6">
        <div className="grid md:grid-cols-4 gap-10 pb-12 border-b border-white/8">

          {/* Brand */}
          <div className="md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                style={{ background: "linear-gradient(135deg, #FF7A30, #D94F10)" }}>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V15H9V21H4C3.45 21 3 20.55 3 20V9.5Z"
                    fill="white"/>
                </svg>
              </div>
              <span className="text-white font-bold text-xl tracking-tight"
                style={{ fontFamily: "'Playfair Display', serif" }}>
                Condome
              </span>
            </div>
            <p className="text-sm text-white/40 leading-relaxed max-w-xs">
              La plataforma SaaS diseñada para simplificar la gestión de condominios en Latinoamérica.
            </p>
          </div>

          {/* Links */}
          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-4">Producto</h4>
            <ul className="space-y-2.5">
              {["Características", "Precios", "Seguridad", "Actualizaciones"].map(l => (
                <li key={l}><a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="text-xs font-semibold tracking-[0.15em] uppercase text-white/30 mb-4">Empresa</h4>
            <ul className="space-y-2.5">
              {["Acerca de", "Blog", "Contacto", "Términos"].map(l => (
                <li key={l}><a href="#" className="text-sm text-white/50 hover:text-white transition-colors">{l}</a></li>
              ))}
            </ul>
          </div>
        </div>

        <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <p className="text-xs text-white/25">© 2025 Condome · Todos los derechos reservados</p>
          <div className="flex items-center gap-1 text-xs text-white/25">
            <span>Hecho con</span>
            <span className="text-[#D94F10]">♥</span>
            <span>para administradores</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

/* ══════════════════════════════════════════════════════════════════
   PÁGINA PRINCIPAL
══════════════════════════════════════════════════════════════════ */
export default function Landing() {
  return (
    <div style={{ fontFamily: "'DM Sans', system-ui, sans-serif" }}>
      <Navbar />
      <Hero />
      <Features />
      <Pricing />
      <Footer />
    </div>
  );
}