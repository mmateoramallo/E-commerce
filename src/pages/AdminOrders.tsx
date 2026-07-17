import { useEffect, useMemo, useState } from "react";
import { AdminNav } from "../components/AdminNav";
import { getAdminOrders } from "../services/orderAdminService";
import type { AdminOrder, OrderStatus } from "../services/orderAdminService";

const statusLabels: Record<OrderStatus, string> = {
  pending_payment: "Pendiente",
  paid: "Pagada",
  expired: "Vencida",
  cancelled: "Cancelada",
  failed: "Fallida",
  stock_problem: "Problema de stock",
};

const statusOptions: Array<"all" | OrderStatus> = [
  "all",
  "pending_payment",
  "paid",
  "expired",
  "cancelled",
  "failed",
  "stock_problem",
];

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

function getStatusClass(status: OrderStatus) {
  return `order-status ${status}`;
}

export function AdminOrders() {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | OrderStatus>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadOrders() {
      try {
        setLoading(true);

        const data = await getAdminOrders();

        if (!isMounted) return;

        setOrders(data);
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setMessage("No se pudieron cargar las órdenes.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredOrders = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return orders.filter((order) => {
      const matchesStatus =
        statusFilter === "all" || order.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        order.fullName.toLowerCase().includes(normalizedSearch) ||
        order.email.toLowerCase().includes(normalizedSearch) ||
        order.phone.toLowerCase().includes(normalizedSearch) ||
        order.mercadoPagoPaymentId.toLowerCase().includes(normalizedSearch) ||
        order.items.some((item) =>
          item.productName.toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });
  }, [orders, search, statusFilter]);

  const paidOrders = orders.filter((order) => order.status === "paid");
  const pendingOrders = orders.filter(
    (order) => order.status === "pending_payment"
  );

  const paidTotal = paidOrders.reduce(
    (total, order) => total + order.totalAmount,
    0
  );

  function buildWhatsAppUrl(order: AdminOrder) {
    if (!order.phone) return "";

    const phoneDigits = order.phone.replace(/\D/g, "");
    const message = encodeURIComponent(
      `Hola ${order.fullName}, te contacto por tu compra en Muebles Store.`
    );

    return `https://wa.me/54${phoneDigits}?text=${message}`;
  }

  return (
    <section className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Órdenes</h1>
          <p>
            Revisá las compras generadas con Mercado Pago y el estado de cada
            orden.
          </p>
        </div>
      </header>

      <AdminNav />

      <div className="admin-stats">
        <article>
          <span>Total órdenes</span>
          <strong>{orders.length}</strong>
        </article>

        <article>
          <span>Pagadas</span>
          <strong>{paidOrders.length}</strong>
        </article>

        <article>
          <span>Pendientes</span>
          <strong>{pendingOrders.length}</strong>
        </article>

        <article>
          <span>Total cobrado</span>
          <strong>${paidTotal.toLocaleString("es-AR")}</strong>
        </article>
      </div>

      <section className="admin-orders-panel">
        <div className="admin-products-header">
          <div>
            <h2>Listado de órdenes</h2>
            <p>Buscá por cliente, email, teléfono, producto o ID de pago.</p>
          </div>

          <div className="admin-order-filters">
            <input
              className="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar orden..."
            />

            <select
              className="admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | OrderStatus)
              }
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {status === "all" ? "Todos los estados" : statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="admin-message">{message}</p>}

        {loading ? (
          <div className="admin-empty-card">
            <p>Cargando órdenes...</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="admin-empty-card">
            <h3>No hay órdenes para mostrar</h3>
            <p>Probá cambiando la búsqueda o el filtro de estado.</p>
          </div>
        ) : (
          <div className="order-admin-list">
            {filteredOrders.map((order) => {
              const whatsappUrl = buildWhatsAppUrl(order);

              return (
                <article key={order.id} className="order-admin-card">
                  <div className="order-admin-header">
                    <div>
                      <span className={getStatusClass(order.status)}>
                        {statusLabels[order.status]}
                      </span>

                      <h3>{order.fullName}</h3>

                      <p>Creada: {formatDate(order.createdAt)}</p>
                      <p>Pagada: {formatDate(order.paidAt)}</p>
                    </div>

                    <div className="order-admin-total">
                      <span>Total</span>
                      <strong>${order.totalAmount.toLocaleString("es-AR")}</strong>
                    </div>
                  </div>

                  <div className="order-contact-grid">
                    <span>
                      Email
                      <strong>{order.email}</strong>
                    </span>

                    <span>
                      Teléfono
                      <strong>{order.phone || "-"}</strong>
                    </span>

                    <span>
                      ID pago MP
                      <strong>{order.mercadoPagoPaymentId || "-"}</strong>
                    </span>
                  </div>

                  {order.comment && (
                    <div className="order-comment">
                      <span>Comentario</span>
                      <p>{order.comment}</p>
                    </div>
                  )}

                  <div className="order-items">
                    <h4>Productos comprados</h4>

                    {order.items.map((item) => (
                      <div key={item.id} className="order-item-row">
                        <span>
                          {item.productName} x{item.quantity}
                        </span>

                        <strong>${item.subtotal.toLocaleString("es-AR")}</strong>
                      </div>
                    ))}
                  </div>

                  <div className="order-admin-actions">
                    {whatsappUrl && (
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="order-whatsapp-link"
                      >
                        Contactar por WhatsApp
                      </a>
                    )}

                    <button
                      type="button"
                      className="secondary-button"
                      onClick={() => navigator.clipboard.writeText(order.id)}
                    >
                      Copiar ID orden
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}