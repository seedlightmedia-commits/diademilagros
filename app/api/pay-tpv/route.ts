import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
    const currency = process.env.REDSYS_CURRENCY || "978";

    // Pasar euros a céntimos en formato de texto plano (Ej: 8€ = 800)
    const amountInCents = Math.round(amount * 100).toString();

    // Número de pedido único de hasta 12 caracteres (Redsys estricto)
    const orderId = `CINE${Date.now().toString().slice(-8)}`;

    const merchantParams = {
      DS_MERCHANT_AMOUNT: amountInCents,
      DS_MERCHANT_ORDER: orderId,
      DS_MERCHANT_MERCHANTCODE: merchantCode,
      DS_MERCHANT_CURRENCY: currency,
      DS_MERCHANT_TERMINAL: terminal,
      DS_MERCHANT_TRANSACTIONTYPE: "0", // Operación estándar de compra autorizada
      DS_MERCHANT_MERCHANTDATA: encodeURIComponent(
        JSON.stringify({
          customerData,
          eventName,
        })
      ),
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com/api/tpv-webhook",
      // 🛠️ CORRECCIÓN 1: Redirecciones inteligentes para dar feedback al usuario tras el pago
      DS_MERCHANT_URLOK: "https://diademilagros.com",
      DS_MERCHANT_URLKO: "https://diademilagros.com",
    };

    // Codificación Base64 estándar de los parámetros comerciales del evento
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams)
    ).toString("base64");

    // Clave secreta del comercio provista por el banco en Barcelona
    const key = Buffer.from(secretKey, "base64");

    // 🛠️ CORRECCIÓN 2: El buffer del pedido DEBE ser estrictamente de 12 bytes
    // Rellenamos el espacio con ceros binarios para que el cifrado 3DES procese bloques exactos
    const orderBuffer = Buffer.alloc(12, 0);
    orderBuffer.write(orderId);

    // Inicializar el cifrador triple DES en modo CBC con vector de inicialización en ceros
    const cipher = crypto.createCipheriv(
      "des-ede3-cbc",
      key,
      Buffer.alloc(8, 0)
    );
    cipher.setAutoPadding(false); // Forzamos a no añadir relleno para respetar la estructura de Redsys

    // Derivamos la clave única de la transacción combinando la clave secreta con el identificador del pedido
    const merchantKey = Buffer.concat([
      cipher.update(orderBuffer),
      cipher.final(),
    ]);

    // Generar la firma digital HMAC SHA256 definitiva
    const signature = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    return NextResponse.json({
      // URL oficial del entorno de Pruebas (Sandbox) de Redsys
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
