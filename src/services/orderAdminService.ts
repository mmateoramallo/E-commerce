import { supabase } from "../lib/supabase";

export type OrderStatus =
  | "pending_payment"
  | "paid"
  | "expired"
  | "cancelled"
  | "failed"
  | "stock_problem";

export type AdminOrderItem = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminOrder = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  comment: string;
  totalAmount: number;
  status: OrderStatus;
  mercadoPagoPreferenceId: string;
  mercadoPagoPaymentId: string;
  createdAt: string;
  paidAt: string | null;
  items: AdminOrderItem[];
};

type OrderItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
};

type OrderRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  comment: string | null;
  total_amount: number | string;
  status: OrderStatus;
  mercado_pago_preference_id: string | null;
  mercado_pago_payment_id: string | null;
  created_at: string;
  paid_at: string | null;
  order_items: OrderItemRow[];
};

function mapOrder(row: OrderRow): AdminOrder {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    comment: row.comment ?? "",
    totalAmount: Number(row.total_amount),
    status: row.status,
    mercadoPagoPreferenceId: row.mercado_pago_preference_id ?? "",
    mercadoPagoPaymentId: row.mercado_pago_payment_id ?? "",
    createdAt: row.created_at,
    paidAt: row.paid_at,
    items: (row.order_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function getAdminOrders(): Promise<AdminOrder[]> {
  const { data, error } = await supabase
    .from("orders")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      comment,
      total_amount,
      status,
      mercado_pago_preference_id,
      mercado_pago_payment_id,
      created_at,
      paid_at,
      order_items (
        id,
        product_id,
        product_name,
        quantity,
        unit_price,
        subtotal
      )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(error.message);
  }

  return (data ?? []).map((order) => mapOrder(order as unknown as OrderRow));
}