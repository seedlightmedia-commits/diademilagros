import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
    const currency = process.env.REDSYS_CURRENCY || "978";

    if (!secretKey || !merchantCode) {
      console.error("❌ Variables de entorno Redsys no configuradas");
      return NextResponse.json({ error: "Configuración incompleta" }, { status: 500 });
    }

    // Asegurar céntimos exactos sin decimales
    const parsedAmount = typeof amount === "string" ? parseFloat(amount) : amount;
    const amountInCents = Math.round(parsedAmount * 100).toString();

    // ID de pedido: longitud exacta entre 4 y 12 caracteres obligatorios
    const suffix = Date.now().toString().slice(-8);
    const orderId = `2026${suffix}`;

    // merchantData opcional en base64 nativo
    const merchantDataPayload = JSON.stringify({ customerData, eventName });
    const merchantDataBase64 = Buffer.from(merchantDataPayload, "utf-8").toString("base64");

    if (merchantDataBase64.length > 1024) {
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

    // 🛠️ SOLUCIÓN 1: Redsys exige Base64 ESTÁNDAR para Ds_MerchantParameters (minificado sin espacios)
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams),
      "utf-8"
    ).toString("base64");

    // Derivación de clave 3DES usando la clave secreta en Base64 original del backend
    const key = Buffer.from(secretKey, "base64");
    const order = Buffer.alloc(16, 0);
    order.write(orderId, "utf-8");

    const cipher = crypto.createCipheriv("des-ede3-cbc", key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    const merchantKey = Buffer.concat([cipher.update(order), cipher.final()]);

    // 🛠️ SOLUCIÓN 2: Firma calculada de forma directa sobre la cadena exacta que se envía
    const signatureBase64 = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    console.log("✅ Pago preparado con éxito para Orden:", orderId);

    // Retornamos los valores nativos listos para renderizarse en el <form> oculto del cliente
    return NextResponse.json({
      url: "https://sis.redsys.es/sis/realizarPago",// URL del Entorno de pruebas
      params: merchantParametersBase64,  // Asignar al input name="Ds_MerchantParameters"
      signature: signatureBase64,        // Asignar al input name="Ds_Signature"
      signatureVersion: "HMAC_SHA256_V1", // Asignar al input name="Ds_SignatureVersion"
    });

  } catch (error) {
    console.error("Error en pay-tpv:", error);
    return NextResponse.json(
      { error: "No se pudo preparar la orden de pago" },
      { status: 500 }
    );
  }
}
