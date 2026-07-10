import { supabase } from "../lib/supabase";

export type PaymentCartItem = {
  productId: string;
  quantity: number;
};

export type CreatePaymentInput = {
  fullName: string;
  email: string;
  phone: string;
  comment: string;
  items: PaymentCartItem[];
};

export type CreatePaymentResponse = {
  orderId: string;
  preferenceId: string;
  checkoutUrl: string;
};

type FunctionErrorWithContext = Error & {
  context?: Response;
};

function formatDetail(detail: unknown) {
  if (!detail) return "";

  try {
    return JSON.stringify(detail);
  } catch {
    return String(detail);
  }
}

async function getFunctionErrorMessage(error: unknown) {
  const functionError = error as FunctionErrorWithContext;

  if (functionError.context) {
    try {
      const errorBody = await functionError.context.json();

      const mainError =
        errorBody?.error ??
        errorBody?.message ??
        functionError.message ??
        "No se pudo crear el pago.";

      const step = errorBody?.step ? ` Paso: ${errorBody.step}.` : "";
      const detail = errorBody?.detail
        ? ` Detalle: ${formatDetail(errorBody.detail)}`
        : "";

      return `${String(mainError)}${step}${detail}`;
    } catch {
      return functionError.message;
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No se pudo crear el pago.";
}

export async function createPaymentFromCart(
  input: CreatePaymentInput
): Promise<CreatePaymentResponse> {
  const { data, error } = await supabase.functions.invoke("create-payment", {
    body: {
      fullName: input.fullName,
      email: input.email,
      phone: input.phone,
      comment: input.comment,
      items: input.items,
    },
  });

  if (error) {
    const message = await getFunctionErrorMessage(error);
    throw new Error(message);
  }

  if (!data?.checkoutUrl) {
    throw new Error("No se recibió la URL de pago.");
  }

  return data as CreatePaymentResponse;
}