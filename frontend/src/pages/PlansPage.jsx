import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import StripePaymentModal from "../components/StripePaymentModal";
import API_ENDPOINTS from "../utils/API_ENDPOINTS";
import apiClient from "../utils/ApiClient";
import { PLAN_CATALOG, getPlanUsage } from "../utils/planUtils";
import { toDashboardPath } from "../utils/dashboardPaths";

const SURFACE = "bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[28px] shadow-[var(--shadow-card)] p-6 md:p-8";

export default function PlansPage() {
  const { user, completeOnboarding, refreshSession } = useAuth();
  const { condominios, setCondominioActivo } = useCondominio();
  const navigate = useNavigate();
  const isOnboarding = user?.has_completed_onboarding === false;

  const [stripeIntent, setStripeIntent] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [processingPlan, setProcessingPlan] = useState(null);
  const [pendingUpgradePlan, setPendingUpgradePlan] = useState(null);

  const currentPlan = user?.plan || "free";
  const planUsage = getPlanUsage(user, condominios);
  const currentPlanDetails = planUsage.details;
  const canAddMore = planUsage.canAddMore;
  const limit = planUsage.limit;
  const remainingSlots = planUsage.remainingSlots;
  const usageLabel = planUsage.usageLabel;
  const automationCopy = planUsage.automationCopy;
  const upgradeCopy = planUsage.upgradeCopy;
  const createCondominioRoute = toDashboardPath("condominio/nuevo");

  const handleManageCondo = async (id) => {
    await setCondominioActivo(id);
    navigate("/dashboard");
  };

  const finalizePlanActivation = async (response, planId) => {
    const refreshedUser = await refreshSession();
    const resolvedPlanCode = refreshedUser?.plan || response?.plan || planId || currentPlan;
    const nextPlanLabel = PLAN_CATALOG[resolvedPlanCode]?.label || "actualizado";
    setSuccess(response?.message || `Plan ${nextPlanLabel} activado correctamente.`);

    if (isOnboarding) {
      setTimeout(() => navigate("/dashboard"), 1200);
    }
  };

  const initiateUpgrade = async (planId) => {
    setProcessingPlan(planId);
    setPendingUpgradePlan(planId);
    setError("");
    setSuccess("");
    try {
      const response = await apiClient.post(API_ENDPOINTS.PAYMENTS_PLAN_INITIATE, {
        plan_id: planId,
      });

      if (response.ok && response.client_secret) {
        setStripeIntent({
          clientSecret: response.client_secret,
          publishedKey: response.published_key || "pk_test_placeholder",
          amount: response.amount,
        });
      } else if (response.ok) {
        await finalizePlanActivation(response, planId);
        setPendingUpgradePlan(null);
      } else {
        throw new Error(response.error || "No se pudo iniciar el pago");
      }
    } catch (err) {
      setPendingUpgradePlan(null);
      setError(err.message || "Error al procesar el plan");
    } finally {
      setProcessingPlan(null);
    }
  };

  const handleStripeSuccess = async (paymentIntent) => {
    setError("");
    setSuccess("");
    setStripeIntent(null);

    if (!paymentIntent?.id) {
      setPendingUpgradePlan(null);
      setError("Stripe no devolvió un identificador de pago válido para confirmar el plan.");
      return;
    }

    setProcessingPlan(pendingUpgradePlan || "plan");
    try {
      const response = await apiClient.post(
        API_ENDPOINTS.PAYMENTS_PLAN_CONFIRM,
        { payment_intent_id: paymentIntent.id },
        { maxRetries: 0 }
      );
      await finalizePlanActivation(response, pendingUpgradePlan);
    } catch (err) {
      setError(err.message || "El pago fue procesado, pero no se pudo confirmar el cambio de plan.");
    } finally {
      setProcessingPlan(null);
      setPendingUpgradePlan(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8 animate-reveal py-8">
      <div className="mb-10 text-center">
        <h1 className="text-4xl font-bold text-[var(--fg-primary)] tracking-tight">Centro de Gestión</h1>
        <p className="mt-4 text-[var(--fg-secondary)] max-w-xl mx-auto">
          {isOnboarding
            ? "Para comenzar, selecciona el plan que mejor se adapte a tus necesidades. Puedes iniciar con Free y subir a Pro o Premium cuando necesites más condominios."
            : "Elige el condominio que deseas administrar o actualiza tu plan para trabajar varios condominios bajo la misma cuenta."}
        </p>
      </div>

      {error && (
        <div className="p-4 bg-red-100 border border-red-300 text-red-700 rounded-2xl">
          {error}
        </div>
      )}

      {success && (
        <div className="p-4 bg-emerald-100 border border-emerald-300 text-emerald-700 rounded-2xl">
          {success}
        </div>
      )}

      {!isOnboarding && (
        <section className={SURFACE}>
          <div className="flex justify-between items-center gap-4 flex-wrap mb-3">
            <div>
              <h2 className="text-2xl font-bold text-[var(--fg-primary)]">Tus Condominios</h2>
              <p className="mt-2 text-sm text-[var(--fg-secondary)]">
                Plan actual: <strong>{currentPlanDetails.label}</strong>. {automationCopy}
              </p>
            </div>
            <div className="text-sm font-bold text-[var(--fg-tertiary)]">
              {usageLabel}
            </div>
          </div>

          <div className="mb-6 rounded-2xl border border-[var(--border-standard)] bg-[var(--surface-0)] px-4 py-3 text-sm text-[var(--fg-secondary)]">
            {limit === null
              ? "Tu plan Premium te permite crear cuantos condominios necesites."
              : `Te quedan ${remainingSlots} espacio(s) disponible(s) dentro de tu plan.`}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {condominios.map((condo) => (
              <div
                key={condo.id}
                className="border border-[var(--border-standard)] rounded-2xl p-5 hover:border-[var(--condome-orange)] transition-all cursor-pointer"
                onClick={() => handleManageCondo(condo.id)}
              >
                <h3 className="font-bold text-lg">{condo.name || condo.nombre}</h3>
                <p className="text-sm text-[var(--fg-tertiary)] mt-1">
                  {condo.document || condo.rnc || "Sin RNC"}
                </p>
                <button className="mt-4 px-4 py-2 bg-[var(--surface-2)] rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[var(--condome-orange)] hover:text-white transition-all w-full">
                  Gestionar
                </button>
              </div>
            ))}

              <div className="border-2 border-dashed border-[var(--border-standard)] rounded-2xl flex flex-col items-center justify-center p-6 text-center min-h-[160px]">
                {canAddMore ? (
                  <>
                    <p className="text-sm font-bold text-[var(--fg-secondary)] mb-4">¿Administras otra propiedad?</p>
                    <Link to={createCondominioRoute} className="px-6 py-2 bg-[var(--condome-orange)] text-white text-xs font-bold uppercase tracking-wider rounded-xl hover:scale-105 transition-transform shadow-lg shadow-[var(--condome-orange)]/20">
                      Registrar Condominio
                    </Link>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-[var(--fg-secondary)] mb-2">Límite alcanzado</p>
                    <p className="text-xs text-[var(--fg-tertiary)] max-w-[220px]">{upgradeCopy}</p>
                  </>
                )}
              </div>
          </div>
        </section>
      )}

      <section className="pt-8">
        <h2 className="text-2xl font-bold text-[var(--fg-primary)] text-center mb-8">Planes de Suscripción</h2>
        <div className="grid md:grid-cols-3 gap-6">
          <div className={`rounded-3xl border-2 p-8 flex flex-col ${currentPlan === "free" ? "border-[var(--condome-orange)] shadow-xl relative" : "border-[var(--border-standard)] bg-[var(--surface-0)]"}`}>
            {currentPlan === "free" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[var(--condome-orange)] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Plan Actual</span>}
            <h3 className="text-xl font-bold text-[var(--fg-primary)]">Free</h3>
            <div className="mt-4 text-3xl font-black text-[var(--fg-primary)]">$0 <span className="text-sm font-normal text-[var(--fg-tertiary)]">DOP</span></div>
            <p className="mt-4 text-sm text-[var(--fg-secondary)] leading-relaxed">Ideal para iniciar en tu primer condominio sin costo.</p>
            <ul className="mt-6 space-y-3 text-sm font-medium text-[var(--fg-secondary)] flex-1">
              {PLAN_CATALOG.free.feature_summary.map((feature) => (
                <li key={feature} className="flex items-center gap-2">✓ {feature}</li>
              ))}
            </ul>

            {isOnboarding && currentPlan === "free" && (
              <button
                onClick={async () => {
                  setProcessingPlan("free");
                  try {
                    await completeOnboarding();
                    navigate("/dashboard");
                  } catch (_error) {
                    setError("No se pudo completar el onboarding");
                  } finally {
                    setProcessingPlan(null);
                  }
                }}
                disabled={processingPlan === "free"}
                className="mt-8 w-full py-3 border-2 border-[var(--condome-orange)] text-[var(--condome-orange)] rounded-xl text-xs font-black uppercase tracking-widest hover:bg-[var(--condome-orange)] hover:text-white transition-colors"
              >
                {processingPlan === "free" ? "Iniciando..." : "Continuar con Free"}
              </button>
            )}
          </div>

          <div className={`rounded-3xl border-2 p-8 flex flex-col ${currentPlan === "pro" ? "border-[#635bff] shadow-xl relative" : "border-[var(--border-standard)] bg-[var(--surface-0)]"}`}>
            {currentPlan === "pro" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-[#635bff] text-white text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Plan Actual</span>}
            <h3 className="text-xl font-bold text-[var(--fg-primary)]">Pro</h3>
            <div className="mt-4 text-3xl font-black text-[#635bff]">$1,200 <span className="text-sm font-normal text-[var(--fg-tertiary)]">DOP / mes</span></div>
            <p className="mt-4 text-[10px] text-[#635bff] font-bold uppercase tracking-widest">Multi-condominio + automatización</p>
            <p className="mt-2 text-sm text-[var(--fg-secondary)] leading-relaxed">Para administradores que ya operan varios condominios desde una sola cuenta.</p>
            <ul className="mt-6 space-y-3 text-sm font-medium text-[var(--fg-secondary)] flex-1">
              {PLAN_CATALOG.pro.feature_summary.map((feature) => (
                <li key={feature} className="flex items-center gap-2">✓ {feature}</li>
              ))}
            </ul>
            {currentPlan !== "pro" && currentPlan !== "premium" && (
              <button
                onClick={() => initiateUpgrade("pro")}
                disabled={processingPlan === "pro"}
                className="mt-8 w-full py-3 bg-[#635bff] text-white rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-[#635bff]/20"
              >
                {processingPlan === "pro" ? "Iniciando..." : "Mejorar a Pro"}
              </button>
            )}
          </div>

          <div className={`rounded-3xl border-2 p-8 flex flex-col ${currentPlan === "premium" ? "border-amber-400 shadow-xl relative bg-amber-500/5" : "dark-surface-readable border-[var(--border-standard)] bg-[#121110] text-white"}`}>
            {currentPlan === "premium" && <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black text-[10px] font-bold uppercase tracking-widest px-3 py-1 rounded-full">Plan Actual</span>}
            <h3 className="text-xl font-bold text-amber-400">Premium</h3>
            <div className="mt-4 text-3xl font-black text-amber-400">$6,000 <span className="text-sm font-normal opacity-60">DOP / mes</span></div>
            <p className="mt-4 text-[10px] text-amber-400 font-bold uppercase tracking-widest">Escala sin límite</p>
            <p className="mt-2 text-sm opacity-80 leading-relaxed">La solución total para gestoras inmobiliarias y operación multi-condominio intensiva.</p>
            <ul className="mt-6 space-y-3 text-sm font-medium opacity-90 flex-1">
              {PLAN_CATALOG.premium.feature_summary.map((feature) => (
                <li key={feature} className="flex items-center gap-2">✓ {feature}</li>
              ))}
            </ul>
            {currentPlan !== "premium" && (
              <button
                onClick={() => initiateUpgrade("premium")}
                disabled={processingPlan === "premium"}
                className="mt-8 w-full py-3 bg-amber-400 text-[#121110] rounded-xl text-xs font-black uppercase tracking-widest hover:scale-[1.02] transition-transform shadow-lg shadow-amber-400/20"
              >
                {processingPlan === "premium" ? "Iniciando..." : "Mejorar a Premium"}
              </button>
            )}
          </div>
        </div>
      </section>

      <StripePaymentModal
        show={!!stripeIntent}
        clientSecret={stripeIntent?.clientSecret}
        publishedKey={stripeIntent?.publishedKey || "pk_test_placeholder"}
        amount={stripeIntent?.amount}
        onClose={() => setStripeIntent(null)}
        onSuccess={handleStripeSuccess}
        onError={(err) => setError(err)}
      />
    </div>
  );
}
