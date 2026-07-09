import { supabase } from "../lib/supabase";

export type InquiryStatus = "new" | "contacted" | "closed" | "cancelled";

export type InquiryItem = {
  id: string;
  productId: string | null;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
};

export type AdminInquiry = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  comment: string;
  totalEstimated: number;
  status: InquiryStatus;
  createdAt: string;
  items: InquiryItem[];
};

type InquiryItemRow = {
  id: string;
  product_id: string | null;
  product_name: string;
  quantity: number;
  unit_price: number | string;
  subtotal: number | string;
};

type InquiryRow = {
  id: string;
  full_name: string;
  email: string;
  phone: string | null;
  comment: string | null;
  total_estimated: number | string;
  status: InquiryStatus;
  created_at: string;
  inquiry_items: InquiryItemRow[];
};

function mapInquiry(row: InquiryRow): AdminInquiry {
  return {
    id: row.id,
    fullName: row.full_name,
    email: row.email,
    phone: row.phone ?? "",
    comment: row.comment ?? "",
    totalEstimated: Number(row.total_estimated),
    status: row.status,
    createdAt: row.created_at,
    items: (row.inquiry_items ?? []).map((item) => ({
      id: item.id,
      productId: item.product_id,
      productName: item.product_name,
      quantity: item.quantity,
      unitPrice: Number(item.unit_price),
      subtotal: Number(item.subtotal),
    })),
  };
}

export async function getAdminInquiries(): Promise<AdminInquiry[]> {
  const { data, error } = await supabase
    .from("inquiries")
    .select(
      `
      id,
      full_name,
      email,
      phone,
      comment,
      total_estimated,
      status,
      created_at,
      inquiry_items (
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

  return (data ?? []).map((inquiry) =>
    mapInquiry(inquiry as unknown as InquiryRow)
  );
}

export async function updateInquiryStatus(
  inquiryId: string,
  status: InquiryStatus
) {
  const { error } = await supabase
    .from("inquiries")
    .update({ status })
    .eq("id", inquiryId);

  if (error) {
    throw new Error(error.message);
  }
}