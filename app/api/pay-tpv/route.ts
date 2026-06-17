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
    // Número de pedido de 12 caracteres (Redsys estricto)
    const orderId = `CINE${Date.now().toString().slice(-8)}`;

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0",
      DS_MERCHANT_MERCHANTDATA: encodeURIComponent(JSON.stringify({ customerData, eventName })),
      
      // 🛠️ CORRECCIÓN 1: Apuntar a la ruta exacta de tu nuevo Webhook de confirmación
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com",
      
      // 🛠️ CORRECCIÓN 2: Rutas con parámetros para avisar en tu web si el pago fue exitoso o falló
      DS_MERCHANT_URLOK: "https://diademilagros.com",
      DS_MERCHANT_URLKO: "https://diademilagros.com",
    };

    // 🔒 PROCESO DE CIFRADO NATIVO REDSYS SHA-256
    const merchantParametersBase64 = Buffer.from(JSON.stringify(merchantParams)).toString("base64");
    
    // 1. Descifrar la clave secreta comercial (3DES)
    const keyBuffer = Buffer.from(secretKey, "base64");
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    
    // 2. Ajustar la orden en un bloque de 8 bytes rellenos de ceros
    const orderBuffer = Buffer.alloc(12, 0);
    orderBuffer.write(orderId);
    
    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
    
    // 3. Generar la firma digital final
    const merchantSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    return NextResponse.json({
      // 🛠️ CORRECCIÓN 3: URL oficial del entorno de Pruebas (Sandbox) de Redsys. 
      // (Cuando el banco te dé el visto bueno final, se cambia por la de producción: https://redsys.es)
      url: "https://redsys.es", 
      params: merchantParametersBase64,
      signature: merchantSignature,
    });

  } catch (error) {
    console.error("Error en pay-tpv nativo:", error);
    return NextResponse.json({ error: "No se pudo preparar la orden de pago" }, { status: 500 });
  }
}
