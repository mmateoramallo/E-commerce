import { useEffect, useMemo, useState, type ChangeEvent } from "react";
import { AdminNav } from "../components/AdminNav";
import {
  getAdminInquiries,
  updateInquiryStatus,
} from "../services/inquiryAdminService";
import type {
  AdminInquiry,
  InquiryStatus,
} from "../services/inquiryAdminService";

const statusLabels: Record<InquiryStatus, string> = {
  new: "Nueva",
  contacted: "Contactada",
  closed: "Cerrada",
  cancelled: "Cancelada",
};

const statusOptions: InquiryStatus[] = [
  "new",
  "contacted",
  "closed",
  "cancelled",
];

function formatDate(value: string) {
  return new Intl.DateTimeFormat("es-AR", {
    dateStyle: "short",
    timeStyle: "short",
  }).format(new Date(value));
}

export function AdminInquiries() {
  const [inquiries, setInquiries] = useState<AdminInquiry[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | InquiryStatus>("all");
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    let isMounted = true;

    async function loadInquiries() {
      try {
        setLoading(true);

        const data = await getAdminInquiries();

        if (!isMounted) return;

        setInquiries(data);
      } catch (error) {
        console.error(error);

        if (!isMounted) return;

        setMessage("No se pudieron cargar las consultas.");
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    }

    void loadInquiries();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredInquiries = useMemo(() => {
    const normalizedSearch = search.toLowerCase().trim();

    return inquiries.filter((inquiry) => {
      const matchesStatus =
        statusFilter === "all" || inquiry.status === statusFilter;

      const matchesSearch =
        !normalizedSearch ||
        inquiry.fullName.toLowerCase().includes(normalizedSearch) ||
        inquiry.email.toLowerCase().includes(normalizedSearch) ||
        inquiry.phone.toLowerCase().includes(normalizedSearch) ||
        inquiry.items.some((item) =>
          item.productName.toLowerCase().includes(normalizedSearch)
        );

      return matchesStatus && matchesSearch;
    });
  }, [inquiries, search, statusFilter]);

  const newCount = inquiries.filter((inquiry) => inquiry.status === "new").length;
  const contactedCount = inquiries.filter(
    (inquiry) => inquiry.status === "contacted"
  ).length;
  const closedCount = inquiries.filter(
    (inquiry) => inquiry.status === "closed"
  ).length;

  async function handleStatusChange(
    inquiry: AdminInquiry,
    event: ChangeEvent<HTMLSelectElement>
  ) {
    const newStatus = event.target.value as InquiryStatus;

    try {
      await updateInquiryStatus(inquiry.id, newStatus);

      setInquiries((currentInquiries) =>
        currentInquiries.map((item) =>
          item.id === inquiry.id ? { ...item, status: newStatus } : item
        )
      );

      setMessage("Estado de consulta actualizado.");
    } catch (error) {
      console.error(error);
      setMessage("No se pudo actualizar el estado de la consulta.");
    }
  }

  return (
    <section className="admin-page">
      <header className="admin-topbar">
        <div>
          <p className="eyebrow">Administrador</p>
          <h1>Consultas recibidas</h1>
          <p>
            Revisá las consultas enviadas por WhatsApp y gestioná su estado.
          </p>
        </div>
      </header>

      <AdminNav />

      <div className="admin-stats">
        <article>
          <span>Total consultas</span>
          <strong>{inquiries.length}</strong>
        </article>

        <article>
          <span>Nuevas</span>
          <strong>{newCount}</strong>
        </article>

        <article>
          <span>Contactadas</span>
          <strong>{contactedCount}</strong>
        </article>

        <article>
          <span>Cerradas</span>
          <strong>{closedCount}</strong>
        </article>
      </div>

      <section className="admin-inquiries-panel">
        <div className="admin-products-header">
          <div>
            <h2>Listado de consultas</h2>
            <p>Buscá por cliente, email, teléfono o producto consultado.</p>
          </div>

          <div className="admin-inquiry-filters">
            <input
              className="admin-search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar consulta..."
            />

            <select
              className="admin-status-filter"
              value={statusFilter}
              onChange={(event) =>
                setStatusFilter(event.target.value as "all" | InquiryStatus)
              }
            >
              <option value="all">Todos los estados</option>
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
        </div>

        {message && <p className="admin-message">{message}</p>}

        {loading ? (
          <div className="admin-empty-card">
            <p>Cargando consultas...</p>
          </div>
        ) : filteredInquiries.length === 0 ? (
          <div className="admin-empty-card">
            <h3>No hay consultas para mostrar</h3>
            <p>Probá cambiando la búsqueda o el filtro de estado.</p>
          </div>
        ) : (
          <div className="inquiry-list">
            {filteredInquiries.map((inquiry) => (
              <article key={inquiry.id} className="inquiry-card">
                <div className="inquiry-card-header">
                  <div>
                    <span className={`inquiry-status ${inquiry.status}`}>
                      {statusLabels[inquiry.status]}
                    </span>

                    <h3>{inquiry.fullName}</h3>

                    <p>{formatDate(inquiry.createdAt)}</p>
                  </div>

                  <select
                    className="inquiry-status-select"
                    value={inquiry.status}
                    onChange={(event) => handleStatusChange(inquiry, event)}
                  >
                    {statusOptions.map((status) => (
                      <option key={status} value={status}>
                        {statusLabels[status]}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="inquiry-contact-grid">
                  <span>
                    Email
                    <strong>{inquiry.email}</strong>
                  </span>

                  <span>
                    Teléfono
                    <strong>{inquiry.phone || "-"}</strong>
                  </span>

                  <span>
                    Total estimado
                    <strong>
                      ${inquiry.totalEstimated.toLocaleString("es-AR")}
                    </strong>
                  </span>
                </div>

                {inquiry.comment && (
                  <div className="inquiry-comment">
                    <span>Comentario</span>
                    <p>{inquiry.comment}</p>
                  </div>
                )}

                <div className="inquiry-items">
                  <h4>Productos consultados</h4>

                  {inquiry.items.map((item) => (
                    <div key={item.id} className="inquiry-item-row">
                      <span>
                        {item.productName} x{item.quantity}
                      </span>

                      <strong>${item.subtotal.toLocaleString("es-AR")}</strong>
                    </div>
                  ))}
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </section>
  );
}