import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "2";
    const currency = process.env.REDSYS_CURRENCY || "978";

    // Validación de configuración
    if (!secretKey || !merchantCode) {
      console.error("❌ Variables de entorno Redsys no configuradas");
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // Asegurar que el importe sea numérico antes de convertir a céntimos
    const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const amountInCents = Math.round(parsedAmount * 100).toString();

    // orderId: 4 dígitos numéricos + 8 del timestamp = 12 chars exactos
    const suffix = Date.now().toString().slice(-8);
    const orderId = `2026${suffix}`;

    // merchantData: JSON compacto en Base64 estándar puro (Con sus padding "=")
    const merchantDataPayload = JSON.stringify({ customerData, eventName });
    const merchantDataBase64 = Buffer.from(merchantDataPayload, "utf-8").toString("base64");

    if (merchantDataBase64.length > 1024) {
      return NextResponse.json({ error: "Datos del cliente demasiado largos" }, { status: 400 });
    }

    console.log("🔧 orderId:", orderId);
    console.log("🔧 merchantData length:", merchantDataBase64.length);
    console.log("🔧 merchantData raw:", merchantDataPayload);

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_MERCHANTDATA: merchantDataBase64,
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com/api/tpv-webhook",
      DS_MERCHANT_URLOK: "https://diademilagros.com/pago-exitoso",
      DS_MERCHANT_URLKO: "https://diademilagros.com/pago-cancelado",
    };

    // 🛠️ CORRECCIÓN CRÍTICA 1: Codificar los parámetros en 'base64url' para que viajen de forma segura por el formulario HTML sin romperse en el navegador
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams),
      "utf-8"
    ).toString("base64url");

    // Derivar clave con 3DES usando el orderId
    const key = Buffer.from(secretKey, "base64");
    const order = Buffer.alloc(16, 0);
    order.write(orderId, "utf-8");

    const cipher = crypto.createCipheriv("des-ede3-cbc", key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    const merchantKey = Buffer.concat([cipher.update(order), cipher.final()]);

    // 🛠️ CORRECCIÓN CRÍTICA 2: Redsys calcula internamente la firma sobre Base64 Estándar.
    // Convertimos temporalmente nuestra cadena 'base64url' a 'base64' agregando el padding '=' para calcular de forma matemática exacta el HMAC.
    const standardBase64Params = merchantParametersBase64
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      + "=".repeat((4 - (merchantParametersBase64.length % 4)) % 4);

    // HMAC-SHA256 sobre el Base64 estándar reconstruido
    const signatureBase64 = crypto
      .createHmac("sha256", merchantKey)
      .update(standardBase64Params)
      .digest("base64");

    // 🛠️ CORRECCIÓN CRÍTICA 3: Convertir el resultado a formato URL-safe completo sin destruir sus caracteres en la petición POST
    const signatureUrlSafe = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    console.log("✅ Pago preparado para orden:", orderId, "importe:", amountInCents);

    return NextResponse.json({
      url: "https://sis-t.redsys.es:25443/sis/realizarPago",
      params: merchantParametersBase64,   // Viaja seguro por el navegador web
      signature: signatureUrlSafe,         // Alineado matemáticamente con el servidor del banco
      signatureVersion: "HMAC_SHA256_V1",
    });

  } catch (error) {
    console.error("Error en pay-tpv:", error);
    return NextResponse.json(
      { error: "No se pudo preparar la orden de pago" },
      { status: 500 }
    );
  }
}
