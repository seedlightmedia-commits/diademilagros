import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const ds_signature = (formData.get("Ds_Signature") as string) || "";
    const ds_merchantParameters = (formData.get("Ds_MerchantParameters") as string) || "";

    const secretKey = process.env.REDSYS_SECRET_KEY || "";

    // 1. Decodificar parámetros del banco de forma nativa
    const jsonString = Buffer.from(ds_merchantParameters, "base64").toString("utf-8");
    const params = JSON.parse(jsonString);
    const orderId = params.Ds_Order || params.DS_MERCHANT_ORDER || "";
    const responseCode = parseInt(params.Ds_Response || "9999");

    // 2. 🔐 VERIFICACIÓN DE SEGURIDAD NATIVA
    const keyBuffer = Buffer.from(secretKey, "base64");
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    
    const orderBuffer = Buffer.alloc(12, 0);
    orderBuffer.write(orderId);
    
    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
    
    const localSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(ds_merchantParameters)
      .digest("base64url"); 

    const signatureNormalized = ds_signature.replace(/_/g, "/").replace(/-/g, "+");
    const localSignatureNormalized = localSignature.replace(/_/g, "/").replace(/-/g, "+");

    // Verificar firmas para impedir registros falsos de personas que no pagaron
    if (signatureNormalized.substring(0, 16) !== localSignatureNormalized.substring(0, 16)) {
      return new Response("Firma no autorizada", { status: 401 });
    }

    // 3. Si el pago fue aprobado correctamente por el banco (Códigos 0000 a 0099)
    if (responseCode >= 0 && responseCode <= 99) {
      const merchantDataRaw = params.Ds_MerchantData || params.DS_MERCHANT_MERCHANTDATA || "{}";
      const merchantData = JSON.parse(decodeURIComponent(merchantDataRaw));
      const { customerData, eventName } = merchantData;

      // Generación automática del código aleatorio post-pago
      const uniqueCode = "DM-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
      const qrImageBase64 = await QRCode.toDataURL(uniqueCode);

      // Enviar datos limpios a tu /api/register actual (Sheets + Correo con Resend)
      const registerPayload = {
        eventName,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        uniqueCode,
        qrImage: qrImageBase64
      };

      await fetch("https://diademilagros.com", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerPayload),
      });
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error en webhook nativo de Redsys:", error);
    return new Response("Error interno", { status: 500 });
  }
}
