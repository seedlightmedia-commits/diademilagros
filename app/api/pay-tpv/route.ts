import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
    const currency = process.env.REDSYS_CURRENCY || "978"; // 978 es Euros

    // Pasar a céntimos de forma segura evitando fallos de flotantes
    const amountInCents = Math.round(amount * 100).toString();

    // 🛠️ MEJORA: Número de pedido seguro de 12 caracteres (CINE + 5 dígitos de tiempo + 3 aleatorios)
    const timePart = Date.now().toString().slice(-5);
    const randomPart = Math.floor(100 + Math.random() * 900).toString(); // Asegura 3 dígitos
    const orderId = `CINE${timePart}${randomPart}`;

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0", // 0 = Autorización estándar
      DS_MERCHANT_MERCHANTDATA: encodeURIComponent(
        JSON.stringify({
          customerData,
          eventName,
        })
      ),
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com/api/tpv-webhook",
      DS_MERCHANT_URLOK: "https://diademilagros.com", // Recomendado: página de gracias
      DS_MERCHANT_URLKO: "https://diademilagros.com",  // Recomendado: página de reintento
    };

    // 🛠️ CORRECCIÓN CRÍTICA 1: Redsys requiere codificación 'base64url' para viajar por el navegador
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams)
    ).toString("base64url");

    // Clave secreta del comercio
    const key = Buffer.from(secretKey, "base64");

    // Pedido en bloque de 16 bytes (Requerido por 3DES)
    const order = Buffer.alloc(16, 0);
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

    // 🛠️ CORRECCIÓN CRÍTICA 2: El cálculo del HMAC se realiza sobre el string Base64URL, 
    // pero el resultado final ("signature") enviado a Redsys se codifica en 'base64' estándar o 'base64url' según su API. 
    // Para entornos web estándar, Redsys acepta base64url directamente.
    const signature = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64url");

    return NextResponse.json({
      // URL de entorno de pruebas. Recuerda cambiarla a la de producción cuando lances la web
      url: "https://sis-t.redsys.es:25443/sis/realizarPago",
      params: merchantParametersBase64,
      signature,
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
