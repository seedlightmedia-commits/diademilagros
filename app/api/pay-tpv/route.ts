import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
    const currency = process.env.REDSYS_CURRENCY || "978";

    // Pasar a céntimos (Ej: 8€ = 800)
    const amountInCents = Math.round(amount * 100).toString();

    // Número de pedido de 12 caracteres
    const orderId = `CINE${Date.now().toString().slice(-8)}`;

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_MERCHANTDATA: JSON.stringify({
        customerData,
        eventName,
      }),

      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com",
      DS_MERCHANT_URLOK: "https://diademilagros.com",
      DS_MERCHANT_URLKO: "https://diademilagros.com",
    };

    // Codificación Base64 de los parámetros
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams)
    ).toString("base64");

    // Clave secreta
    const key = Buffer.from(secretKey, "base64");

    // Preparar pedido para 3DES
    const order = Buffer.alloc(16);
    order.write(orderId);

    const cipher = crypto.createCipheriv(
      "des-ede3-cbc",
      key,
      Buffer.alloc(8, 0)
    );
    cipher.setAutoPadding(false);

    const merchantKey = Buffer.concat([
      cipher.update(order),
      cipher.final(),
    ]);

    // Firma HMAC SHA256
    const signature = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    return NextResponse.json({
      url: "https://sis-t.redsys.es:25443/sis/realizarPago",
      params: merchantParametersBase64,
      signature,
      signatureVersion: "HMAC_SHA256_V1",
    });
  } catch (error) {
    console.error("Error en pay-tpv:", error);

    return NextResponse.json(
      {
        error: "No se pudo preparar la orden de pago",
      },
      {
        status: 500,
      }
    );
  }
}