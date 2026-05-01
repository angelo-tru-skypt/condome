import React, { useState, useEffect, useMemo } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";

/**
 * Formulario de Pago de Stripe (con Payment Element)
 */
function CheckoutForm({ amount, onCancel, onSuccess, onError }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!stripe || !elements) return;

    setProcessing(true);

    const { error, paymentIntent } = await stripe.confirmPayment({
      elements,
      redirect: "if_required",
    });

    if (error) {
      onError(error.message);
      setProcessing(false);
    } else if (paymentIntent && paymentIntent.status === "succeeded") {
      onSuccess(paymentIntent);
    } else {
      // Manejar otros estados como processing o requires_action si es necesario
      onSuccess(paymentIntent || { status: "pending" });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="p-4 bg-[var(--surface-0)] border border-[var(--border-standard)] rounded-2xl shadow-inner">
        <PaymentElement 
          options={{
            layout: "tabs",
            theme: "night",
          }}
        />
      </div>

      <div className="flex gap-3 pt-4">
        <button
          type="button"
          onClick={onCancel}
          className="flex-1 px-5 py-3.5 rounded-xl border border-[var(--border-standard)] bg-transparent text-sm font-bold text-[var(--fg-secondary)] cursor-pointer hover:bg-[var(--surface-2)] transition-colors"
        >
          Cancelar
        </button>
        <button
          disabled={!stripe || processing}
          className="flex-[2] px-5 py-3.5 rounded-xl border-none bg-[var(--condome-orange)] text-white text-sm font-bold shadow-lg shadow-[var(--condome-orange)]/20 cursor-pointer disabled:opacity-50 active:scale-95 transition-all"
        >
          {processing ? "Procesando..." : `Confirmar Pago`}
        </button>
      </div>
    </form>
  );
}

/**
 * Modal de Stripe con Contexto de Elements
 */
export default function StripePaymentModal({
  show,
  clientSecret,
  publishedKey,
  amount,
  onClose,
  onSuccess,
  onError,
}) {
  const stripePromise = useMemo(() => {
    if (publishedKey && publishedKey !== "pk_test_placeholder") {
      return loadStripe(publishedKey);
    }
    // Fallback para testeo visual
    return null;
  }, [publishedKey]);

  if (!show || !clientSecret || !publishedKey) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-reveal">
      <div className="bg-[var(--surface-1)] border border-[var(--border-standard)] rounded-[32px] w-full max-w-lg p-8 shadow-2xl relative overflow-hidden">
        {/* Adorno visual */}
        <div className="absolute top-0 right-0 w-32 h-32 bg-[var(--condome-orange)]/10 blur-3xl -translate-y-1/2 translate-x-1/2 rounded-full"></div>
        
        <div className="relative">
          <div className="flex items-center gap-4 mb-8">
            <div className="w-14 h-14 bg-[var(--condome-orange)]/10 rounded-2xl flex items-center justify-center text-2xl">
              💳
            </div>
            <div>
              <h2 className="text-2xl font-bold text-[var(--fg-primary)] tracking-tight">Pasarela Segura</h2>
              <p className="text-sm text-[var(--fg-tertiary)] font-medium">Pago procesado por Stripe inc.</p>
            </div>
          </div>

          <Elements 
            stripe={stripePromise} 
            options={{ 
              clientSecret,
              appearance: {
                theme: 'night',
                variables: {
                  colorPrimary: '#FF7A30',
                  colorBackground: '#1A1612',
                  colorText: '#E5E5E5',
                  colorDanger: '#df1b41',
                  fontFamily: 'Inter, system-ui, sans-serif',
                  spacingUnit: '4px',
                  borderRadius: '12px',
                },
              }
            }}
          >
            <CheckoutForm
              amount={amount}
              onCancel={onClose}
              onSuccess={onSuccess}
              onError={onError}
            />
          </Elements>

          <div className="mt-8 pt-6 border-t border-[var(--border-standard)] border-dashed">
            <p className="text-[10px] uppercase tracking-[0.24em] font-black text-[var(--condome-orange)] mb-3 text-center">Tarjeta de Prueba (Stripe Testmode)</p>
            <div className="flex items-center justify-center gap-4 bg-white/5 rounded-2xl p-4 border border-white/5">
              <code className="text-sm font-black text-white tracking-widest">4242 4242 4242 4242</code>
              <div className="h-4 w-[1px] bg-white/20"></div>
              <code className="text-sm font-black text-white">12/30</code>
              <div className="h-4 w-[1px] bg-white/20"></div>
              <code className="text-sm font-black text-white">123</code>
            </div>
          </div>

          <p className="mt-6 text-center text-[10px] text-[var(--fg-tertiary)] font-bold uppercase tracking-[0.2em] opacity-40">
            Powered by Condome Security Layer
          </p>
        </div>
      </div>
    </div>
  );
}
