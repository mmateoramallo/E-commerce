import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

type MercadoPagoWebhookBody = {
  action?: string;
  api_version?: string;
  data?: {
    id?: string | number;
  };
  date_created?: string;
  id?: string | number;
  live_mode?: boolean;
  type?: string;
  user_id?: string | number;
};

type MercadoPagoPayment = {
  id: number;
  status: string;
  status_detail?: string;
  external_reference?: string;
  metadata?: {
    order_id?: string;
    [key: string]: unknown;
  };
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

async function readWebhookBody(req: Request) {
  try {
    return (await req.json()) as MercadoPagoWebhookBody;
  } catch {
    return null;
  }
}

function getPaymentIdFromRequest(
  req: Request,
  body: MercadoPagoWebhookBody | null
) {
  const url = new URL(req.url);

  const queryId =
    url.searchParams.get("id") ??
    url.searchParams.get("data.id") ??
    url.searchParams.get("payment_id");

  const bodyPaymentId = body?.data?.id ?? body?.id;

  return String(bodyPaymentId ?? queryId ?? "");
}

function getNotificationType(
  req: Request,
  body: MercadoPagoWebhookBody | null
) {
  const url = new URL(req.url);

  return (
    body?.type ??
    url.searchParams.get("type") ??
    url.searchParams.get("topic") ??
    ""
  );
}

async function getMercadoPagoPayment(
  paymentId: string,
  accessToken: string
): Promise<MercadoPagoPayment> {
  const response = await fetch(
    `https://api.mercadopago.com/v1/payments/${paymentId}`,
    {
      method: "GET",
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    }
  );

  const data = await response.json();

  if (!response.ok) {
    console.error("Mercado Pago get payment error:", data);

    throw new Error("No se pudo consultar el pago en Mercado Pago.");
  }

  return data as MercadoPagoPayment;
}

function getOrderIdFromPayment(payment: MercadoPagoPayment) {
  return payment.external_reference ?? payment.metadata?.order_id ?? "";
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      headers: corsHeaders,
    });
  }

  try {
    const mercadoPagoAccessToken = Deno.env.get("MERCADO_PAGO_ACCESS_TOKEN");
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseSecretKey = getSupabaseSecretKey();

    if (!mercadoPagoAccessToken) {
      return jsonResponse(
        { error: "Falta configurar MERCADO_PAGO_ACCESS_TOKEN." },
        500
      );
    }

    if (!supabaseUrl || !supabaseSecretKey) {
      return jsonResponse(
        {
          error:
            "Faltan credenciales internas de Supabase. Revisá SUPABASE_SERVICE_ROLE_KEY o SUPABASE_SECRET_KEY.",
        },
        500
      );
    }

    const body = await readWebhookBody(req);
    const notificationType = getNotificationType(req, body);
    const paymentId = getPaymentIdFromRequest(req, body);

    console.log("Mercado Pago webhook received");
    console.log("Notification type:", notificationType);
    console.log("Payment ID:", paymentId);
    console.log("Body:", JSON.stringify(body));

    if (!paymentId) {
      return jsonResponse({
        received: true,
        ignored: true,
        reason: "No payment id received.",
      });
    }

    if (
      notificationType &&
      notificationType !== "payment" &&
      notificationType !== "payments"
    ) {
      return jsonResponse({
        received: true,
        ignored: true,
        reason: `Notification type ignored: ${notificationType}`,
      });
    }

    const payment = await getMercadoPagoPayment(
      paymentId,
      mercadoPagoAccessToken
    );

    console.log("Payment status:", payment.status);
    console.log("Payment external_reference:", payment.external_reference);
    console.log("Payment metadata:", JSON.stringify(payment.metadata));

    const orderId = getOrderIdFromPayment(payment);

    if (!orderId) {
      return jsonResponse(
        {
          received: true,
          ignored: true,
          reason: "Payment has no external_reference or metadata.order_id.",
          paymentId,
          paymentStatus: payment.status,
        },
        200
      );
    }

    const supabaseAdmin = createClient(supabaseUrl, supabaseSecretKey, {
      auth: {
        persistSession: false,
      },
    });

    if (payment.status === "approved") {
      const { error } = await supabaseAdmin.rpc("confirm_order_paid", {
        p_order_id: orderId,
        p_mercado_pago_payment_id: String(payment.id),
      });

      if (error) {
        console.error("confirm_order_paid error:", error);

        return jsonResponse(
          {
            received: true,
            processed: false,
            error: error.message,
            step: "confirm_order_paid",
            paymentId: payment.id,
            orderId,
          },
          500
        );
      }

      return jsonResponse({
        received: true,
        processed: true,
        action: "order_paid",
        paymentId: payment.id,
        orderId,
      });
    }

    if (
      payment.status === "rejected" ||
      payment.status === "cancelled" ||
      payment.status === "refunded" ||
      payment.status === "charged_back"
    ) {
      const { error } = await supabaseAdmin.rpc("release_order_reservation", {
        p_order_id: orderId,
      });

      if (error) {
        console.error("release_order_reservation error:", error);

        return jsonResponse(
          {
            received: true,
            processed: false,
            error: error.message,
            step: "release_order_reservation",
            paymentId: payment.id,
            orderId,
          },
          500
        );
      }

      return jsonResponse({
        received: true,
        processed: true,
        action: "reservation_released",
        paymentId: payment.id,
        orderId,
        paymentStatus: payment.status,
      });
    }

    return jsonResponse({
      received: true,
      processed: false,
      action: "payment_status_ignored",
      paymentId: payment.id,
      orderId,
      paymentStatus: payment.status,
    });
  } catch (error) {
    console.error("Unexpected mercado-pago-webhook error:", error);

    return jsonResponse(
      {
        received: true,
        processed: false,
        error:
          error instanceof Error
            ? error.message
            : "Error inesperado en webhook.",
      },
      500
    );
  }
});