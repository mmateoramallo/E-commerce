import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

type CartItemInput = {
  productId: string;
  quantity: number;
};

type CreatePaymentBody = {
  fullName: string;
  email: string;
  phone?: string;
  comment?: string;
  items: CartItemInput[];
};

type OrderItemRow = {
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
  order_items: OrderItemRow[];
};

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      ...corsHeaders,
      "Content-Type": "application/json",
    },
  });
}

function getSupabaseSecretKey() {
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (serviceRoleKey) {
    return serviceRoleKey;
  }

  const secretKey = Deno.env.get("SUPABASE_SECRET_KEY");

  if (secretKey) {
    return secretKey;
  }

  const secretKeysJson = Deno.env.get("SUPABASE_SECRET_KEYS");

  if (secretKeysJson) {
    try {
      const parsedSecretKeys = JSON.parse(secretKeysJson) as Record<
        string,
        string
      >;

      const firstSecretKey = Object.values(parsedSecretKeys)[0];

      if (firstSecretKey) {
        return firstSecretKey;
      }
    } catch {
      return "";
    }
  }

  return "";
}

function validateBody(body: CreatePaymentBody) {
  if (!body.fullName?.trim()) {
    return "El nombre es obligatorio.";
  }

  if (!body.email?.trim()) {
    return "El correo es obligatorio.";
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  if (!emailRegex.test(body.email.trim())) {
    return "El correo no es válido.";
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return "El carrito está vacío.";
  }

  const invalidItem = body.items.find((item) => {
    return (
      !item.productId || !Number.isInteger(item.quantity) || item.quantity <= 0
    );
  });

  if (invalidItem) {
    return "Hay productos inválidos en el carrito.";
  }

  return "";
}

function isLocalUrl(url: string) {
  return url.includes("localhost") || url.includes("127.0.0.1");
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  if (req.method !== "POST") {
    return jsonResponse({ error: "Método no permitido." }, 405);
  }

  try {
    const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const appUrl = Deno.env.get("APP_URL") ?? "http://localhost:5173";
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseSecretKey = getSupabaseSecretKey();

    console.log("create-payment invoked");
    console.log("APP_URL:", appUrl);
    console.log("Has MP token:", Boolean(mercadoPagoAccessToken));
    console.log("Has Supabase URL:", Boolean(supabaseUrl));
    console.log("Has Supabase secret key:", Boolean(supabaseSecretKey));

    if (!mercadoPagoAccessToken) {
      return jsonResponse(
        { error: "Falta configurar MERCADO_PAGO_ACCESS_TOKEN." },
        500,
      );
    }

    if (!supabaseUrl || !supabaseSecretKey) {
      return jsonResponse(
        {
          error:
            "Faltan credenciales internas de Supabase. Revisá SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY en Edge Function Secrets.",
        },
        500,
      );
    }

    const body = (await req.json()) as CreatePaymentBody;
    const validationError = validateBody(body);

    if (validationError) {
      return jsonResponse({ error: validationError }, 400);
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
      },
    });

    const cartItems = body.items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
    }));

    const { data: orderId, error: orderError } = await supabaseAdmin.rpc(
      "create_order_with_reservation",
      {
        customer_full_name: body.fullName.trim(),
        customer_email: body.email.trim(),
        customer_phone: body.phone?.trim() ?? "",
        customer_comment: body.comment?.trim() ?? "",
        cart_items: cartItems,
      },
    );

    if (orderError) {
      console.error("create_order_with_reservation error:", orderError);

      return jsonResponse(
        {
          error: orderError.message,
          step: "create_order_with_reservation",
          detail: orderError,
        },
        400,
      );
    }

    console.log("Order created:", orderId);

    const { data: orderData, error: orderFetchError } = await supabaseAdmin
      .from("orders")
      .select(
        `
        id,
        full_name,
        email,
        phone,
        comment,
        total_amount,
        order_items (
          product_id,
          product_name,
          quantity,
          unit_price,
          subtotal
        )
      `,
      )
      .eq("id", orderId)
      .single();

    if (orderFetchError || !orderData) {
      console.error("order fetch error:", orderFetchError);

      return jsonResponse(
        {
          error: "No se pudo recuperar la orden creada.",
          step: "fetch_order",
          detail: orderFetchError,
        },
        500,
      );
    }

    const order = orderData as unknown as OrderRow;

    const webhookUrl =
      Deno.env.get("MERCADO_PAGO_WEBHOOK_URL") ??
      `${supabaseUrl}/functions/v1/mercado-pago-webhook`;

    const preferencePayload: Record<string, unknown> = {
      items: order.order_items.map((item) => ({
        id: item.product_id ?? undefined,
        title: item.product_name,
        quantity: item.quantity,
        unit_price: Number(item.unit_price),
        currency_id: "ARS",
      })),
      external_reference: order.id,
      notification_url: webhookUrl,
      metadata: {
        order_id: order.id,
        customer_full_name: order.full_name,
        customer_email: order.email,
        customer_phone: order.phone,
      },
      payment_methods: {
        installments: 1,
      },
    };

    if (!isLocalUrl(appUrl)) {
      preferencePayload.back_urls = {
          success: `${appUrl}/pago-exitoso`,
          failure: `${appUrl}/pago-rechazado`,
          pending: `${appUrl}/pago-pendiente`,
      };

      preferencePayload.auto_return = "approved";
    }

    console.log("Preference payload:", JSON.stringify(preferencePayload));

    const mercadoPagoResponse = await fetch(
      "https://api.mercadopago.com/checkout/preferences",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${mercadoPagoAccessToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(preferencePayload),
      },
    );

    const mercadoPagoData = await mercadoPagoResponse.json();

    if (!mercadoPagoResponse.ok) {
      console.error("Mercado Pago status:", mercadoPagoResponse.status);
      console.error("Mercado Pago error:", mercadoPagoData);

      return jsonResponse(
        {
          error: "Mercado Pago no pudo crear la preferencia.",
          step: "mercado_pago_create_preference",
          detail: mercadoPagoData,
          preferencePayload,
        },
        400,
      );
    }

    const { error: updateOrderError } = await supabaseAdmin
      .from("orders")
      .update({
        mercado_pago_preference_id: mercadoPagoData.id,
      })
      .eq("id", order.id);

    if (updateOrderError) {
      console.error("update order preference error:", updateOrderError);

      return jsonResponse(
        {
          error:
            "La preferencia fue creada, pero no se pudo actualizar la orden.",
          step: "update_order_preference",
          detail: updateOrderError,
        },
        500,
      );
    }

    /*
      Importante:
      Antes usábamos sandbox_init_point primero.
      En tu caso, sandbox_init_point está entrando en loop de login.
      Por eso ahora usamos init_point primero.
    */
    const checkoutUrl =
      mercadoPagoData.init_point ?? mercadoPagoData.sandbox_init_point;

    if (!checkoutUrl) {
      return jsonResponse(
        {
          error: "Mercado Pago no devolvió una URL de checkout.",
          step: "missing_checkout_url",
          detail: mercadoPagoData,
        },
        500,
      );
    }

    console.log("Checkout URL:", checkoutUrl);

    return jsonResponse({
      orderId: order.id,
      preferenceId: mercadoPagoData.id,
      checkoutUrl,
    });
  } catch (error) {
    console.error("Unexpected create-payment error:", error);

    return jsonResponse(
      {
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado al crear el pago.",
        step: "unexpected_error",
      },
      500,
    );
  }
});
