import { supabase } from "../lib/supabase";

export type InquiryCartItem = {
  productId: string;
  quantity: number;
};

export type CreateInquiryInput = {
  fullName: string;
  email: string;
  phone: string;
  comment: string;
  items: InquiryCartItem[];
};

export async function createInquiryFromCart(input: CreateInquiryInput) {
  const { data, error } = await supabase.rpc("create_inquiry_from_cart", {
    customer_full_name: input.fullName,
    customer_email: input.email,
    customer_phone: input.phone,
    customer_comment: input.comment,
    cart_items: input.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    })),
  });

  if (error) {
    throw new Error(error.message);
  }

  return data as string;
}