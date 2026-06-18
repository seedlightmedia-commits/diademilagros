import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(request: Request) {
  try {
    const { eventName, amount, customerData } = await request.json();

    const secretKey = process.env.REDSYS_SECRET_KEY || "";
    const merchantCode = process.env.REDSYS_MERCHANT_CODE || "";
    const terminal = process.env.REDSYS_TERMINAL || "1";
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

    // merchantData: JSON compacto en Base64 estándar puro
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
      DS_MERCHANT_MERCHANTURL: "https://diademilagros.com",
      DS_MERCHANT_URLOK: "https://diademilagros.com",
      DS_MERCHANT_URLKO: "https://diademilagros.com",
    };

    // 🛠️ CORRECCIÓN OFICIAL 1: Redsys exige el JSON en Base64 ESTÁNDAR puro (Mantiene los '=' al final)
    const merchantParametersBase64 = Buffer.from(
      JSON.stringify(merchantParams),
      "utf-8"
    ).toString("base64");

    // Derivar clave con 3DES usando el orderId
    const key = Buffer.from(secretKey, "base64");
    const order = Buffer.alloc(16, 0);
    order.write(orderId, "utf-8");

    const cipher = crypto.createCipheriv("des-ede3-cbc", key, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    const merchantKey = Buffer.concat([cipher.update(order), cipher.final()]);

    // 🛠️ CORRECCIÓN OFICIAL 2: El HMAC se calcula estrictamente sobre el Base64 ESTÁNDAR puro
    const signatureBase64 = crypto
      .createHmac("sha256", merchantKey)
      .update(merchantParametersBase64)
      .digest("base64");

    // 🛠️ CORRECCIÓN OFICIAL 3: Convertir la firma a URL-safe tradicional (reemplazando + y /)
    // IMPORTANTE: NO elimines los caracteres '=' de la firma, el banco los necesita para validar bloques criptográficos
    const signatureUrlSafe = signatureBase64
      .replace(/\+/g, "-")
      .replace(/\//g, "_");

    console.log("✅ Pago preparado para orden:", orderId, "importe:", amountInCents);

    return NextResponse.json({
      url: "https://redsys.es",
      params: merchantParametersBase64,   // Viaja con su estructura estándar intacta
      signature: signatureUrlSafe,         // Viaja con sus bytes alineados al 100%
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
