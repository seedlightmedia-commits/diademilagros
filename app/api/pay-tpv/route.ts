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

    // 🛠️ REGLA CYBERPAC OBLIGATORIA (Pág 24): Los 4 primeros dígitos del pedido DEBEN SER NÚMEROS.
    // Usamos el año actual '2026' al principio para cumplir la norma, seguido de CINE, tus 5 dígitos de tiempo y el aleatorio.
    const timePart = Date.now().toString().slice(-5);
    const randomPart = Math.floor(100 + Math.random() * 900).toString(); // Asegura 3 dígitos
    const orderId = `2026CINE${timePart}${randomPart}`; // Da como resultado un ID válido de 12 caracteres

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0", // 0 = Autorización estándar
      
      // 🛠️ CORRECCIÓN CRÍTICA: Empaquetado directo en Base64 nativo para evitar fallos de lectura en el Webhook
      DS_MERCHANT_MERCHANTDATA: Buffer.from(
        JSON.stringify({
          customerData,
          eventName,
        })
      ).toString("base64"),
      
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com/api/tpv-webhook",

      // Página que verá el usuario cuando el pago sea correcto
      DS_MERCHANT_URLOK: "https://diademilagros.com/pago-exitoso",

      // Página que verá el usuario cuando el pago falle o sea cancelado
      DS_MERCHANT_URLKO: "https://diademilagros.com/pago-cancelado", 
    };

    // CORRECCIÓN CRÍTICA 1: Redsys requiere Base64 estándar puro (con caracteres '=') para interpretar el formulario web
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams)
    ).toString("base64");

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

    // CORRECCIÓN CRÍTICA 2: El cálculo del HMAC se realiza sobre el string Base64 generado anteriormente.
    const signatureBase64 = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    // CORRECCIÓN CRÍTICA 3: Modificar los caracteres especiales a mano para asegurar compatibilidad perfecta por POST en el navegador
    const signatureUrlSafe = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

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
