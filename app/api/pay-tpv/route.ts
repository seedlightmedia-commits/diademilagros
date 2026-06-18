import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
    const currency = process.env.REDSYS_CURRENCY || "978";

    const amountInCents = Math.round(amount * 100).toString();

    // ✅ FIX 1: orderId máximo 12 caracteres, 4 primeros numéricos
    // "2026" (4 num) + 8 alfanuméricos = 12 exactos
    const suffix = Date.now().toString().slice(-8); // 8 dígitos del timestamp
    const orderId = `2026${suffix}`; // 12 caracteres exactos, cumple Redsys

    // ✅ FIX 2: Serializar merchantData de forma compacta para no superar 1024 bytes
    const merchantDataPayload = JSON.stringify({ customerData, eventName });
    const merchantDataBase64 = Buffer.from(merchantDataPayload).toString("base64");

    // Verificación de seguridad del tamaño
    if (merchantDataBase64.length > 1024) {
      console.error("⚠️ DS_MERCHANT_MERCHANTDATA supera 1024 bytes");
      return NextResponse.json({ error: "Datos del cliente demasiado largos" }, { status: 400 });
    }

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

    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams)
    ).toString("base64");

    const key = Buffer.from(secretKey, "base64");

    const order = Buffer.alloc(16, 0);
    order.write(orderId);

    const cipher = crypto.createCipheriv("des-ede3-cbc", key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    const merchantKey = Buffer.concat([cipher.update(order), cipher.final()]);

    const signatureBase64 = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    // ✅ FIX 3: Eliminar también los '=' de padding además de '+' y '/'
    const signatureUrlSafe = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_")
      .replace(/=/g, ""); // <-- esto faltaba

    return NextResponse.json({
      url: "https://sis-t.redsys.es:25443/sis/realizarPago",
      params: merchantParametersBase64,
      signature: signatureUrlSafe,
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