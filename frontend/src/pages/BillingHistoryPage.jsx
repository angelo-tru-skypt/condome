import { useEffect, useMemo, useState } from "react";
import { useAuth } from "../context/AuthContext";
import { useCondominio } from "../context/CondominioContext";
import adminService from "../utils/adminService";
import billingPortalService from "../utils/billingPortalService";
import { isSystemAdminRole, isResidentRole, isCondoAdminRole, isPropertyOwnerRole } from "../utils/roles";

const SURFACE = "bg-[#1A1A1A] border border-[#262626] rounded-[28px]";

export default function BillingHistoryPage() {
  const { user } = useAuth();
  const { condominio } = useCondominio();
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const isResident = isResidentRole(user?.role || user?.rol);
  const isAdmin =
    isSystemAdminRole(user?.role || user?.rol) ||
    isCondoAdminRole(user?.role || user?.rol) ||
    isPropertyOwnerRole(user?.role || user?.rol);
  const isCondoAdmin = isCondoAdminRole(user?.role || user?.rol);

  const loadHistory = useMemo(
    () => async () => {
      if (isAdmin && !condominio?.id) {
        setRecords([]);
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const response = await (isAdmin
          ? adminService.listPaymentHistory(condominio.id)
          : isResident
            ? billingPortalService.listResidentPaymentHistory()
            : billingPortalService.listPropertyOwnerPaymentHistory());
        setRecords(response.data || []);
      } catch (loadError) {
        setError(loadError.message || "No se pudo cargar el historial.");
      } finally {
        setLoading(false);
      }
    },
    [condominio?.id, isAdmin, isResident]
  );

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const totalAmount = records.reduce((acc, item) => acc + Number(item.amount || 0), 0);

  if (isAdmin && !condominio?.id) {
    return <MissingCondominioState />;
  }

  return (
    <div className="space-y-6">
      <section className={`${SURFACE} p-6 md:p-7`}>
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <p className="text-[11px] uppercase tracking-[0.22em] font-semibold text-[#B15A27]">
              Historial de pagos
            </p>
            <h1 className="mt-2 text-2xl md:text-3xl font-semibold text-[#E5E5E5]">
              {isAdmin
                ? "Revisa la trazabilidad financiera del condominio activo."
                : "Consulta tus pagos registrados y movimientos anteriores."}
            </h1>
            <p className="mt-2 text-sm leading-7 text-[#A3A3A3] max-w-3xl">
              Esta vista reúne los cargos ya cerrados para que puedas validar fechas, montos,
              referencias y estados finales.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SummaryCard label="Movimientos" value={records.length} />
            <SummaryCard label="Monto total" value={formatMoney(totalAmount)} compact />
          </div>
        </div>
      </section>

      {error && <ErrorBanner message={error} />}

      <section className={`${SURFACE} p-6 md:p-7`}>
        {loading ? (
          <p className="text-sm text-[#A3A3A3]">Cargando historial...</p>
        ) : records.length ? (
          <div className="space-y-4">
            {records.map((record) => (
              <article key={record.id} className="rounded-[24px] border border-[#262626] bg-[#141414] p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div>
                    <div className="flex flex-wrap gap-2">
                      <Badge>{record.state}</Badge>
                      <Badge variant="soft">{record.apartamentoNombre || "general"}</Badge>
                      {record.periodLabel ? <Badge variant="soft">{record.periodLabel}</Badge> : null}
                    </div>
                    <h2 className="mt-3 text-lg font-semibold text-[#E5E5E5]">{record.name}</h2>
                    <p className="mt-1 text-sm text-[#A3A3A3]">
                      {formatMoney(record.amount)} · vencía {formatDate(record.dueDate)}
                    </p>
                    <p className="mt-2 text-sm leading-6 text-[#5D554E]">
                      {record.note || "Sin observaciones adicionales."}
                    </p>
                  </div>

                  <div className="rounded-[22px] border border-[#E7DDD4] bg-[#1A1A1A] px-4 py-3 min-w-[210px]">
                    <p className="text-xs uppercase tracking-[0.18em] text-[#737373]">Pago</p>
                    <p className="mt-2 text-sm font-semibold text-[#E5E5E5]">
                      {record.paymentMethod || "Sin método registrado"}
                    </p>
                    <p className="mt-1 text-xs text-[#737373]">
                      {record.paymentReference || "Sin referencia"}
                    </p>
                    <p className="mt-2 text-xs text-[#737373]">
                      {record.paidAt ? `Registrado el ${formatDateTime(record.paidAt)}` : "Sin fecha de pago"}
                    </p>
                  </div>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <EmptyState />
        )}
      </section>
    </div>
  );
}

function MissingCondominioState() {
  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className={`${SURFACE} max-w-xl p-8 text-center`}>
        <p className="text-sm font-semibold text-[#E5E5E5]">Primero selecciona o registra un condominio</p>
        <p className="text-sm text-[#737373] mt-2">
          El historial administrativo necesita un condominio activo para consultar los movimientos.
        </p>
      </div>
    </div>
  );
}

function SummaryCard({ label, value, compact = false }) {
  return (
    <div className="rounded-2xl bg-[#141414] border border-[#262626] px-4 py-4 text-center min-w-[120px]">
      <p className="text-[11px] uppercase tracking-[0.18em] text-[#737373]">{label}</p>
      <p className={`mt-2 font-semibold text-[#E5E5E5] ${compact ? "text-lg" : "text-2xl"}`}>{value}</p>
    </div>
  );
}

function Badge({ children, variant = "strong" }) {
  return <span className={`px-3 py-1 rounded-full text-[11px] font-semibold ${variant === "soft" ? "bg-[#262626] text-[#6F655B]" : "bg-[#EEF6FF] text-[#1A6B9A]"}`}>{children}</span>;
}

function ErrorBanner({ message }) {
  return <div className="px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{message}</div>;
}

function EmptyState() {
  return (
    <div className="rounded-[24px] border border-dashed border-[#2B2723] bg-[#0B1014] p-8 text-center">
      <h3 className="text-lg font-semibold text-[#E5E5E5]">Todavía no hay historial registrado</h3>
      <p className="mt-2 text-sm leading-7 text-[#A3A3A3]">
        Los cargos pagados o cerrados aparecerán aquí para su consulta.
      </p>
    </div>
  );
}

function formatMoney(value) {
  return new Intl.NumberFormat("es-DO", { style: "currency", currency: "DOP" }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleDateString("es-DO", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(value) {
  if (!value) return "Sin fecha";
  return new Date(value).toLocaleString("es-DO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}
