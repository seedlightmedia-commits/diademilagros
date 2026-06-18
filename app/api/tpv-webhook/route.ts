import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    console.log("========== WEBHOOK REDSYS ==========");
    const ds_signature = (formData.get("Ds_Signature") as string) || "";
    const ds_merchantParameters = (formData.get("Ds_MerchantParameters") as string) || "";

    const secretKey = process.env.REDSYS_SECRET_KEY || "";

    // 1. Decodificar parámetros comerciales de forma nativa
    const jsonString = Buffer.from(ds_merchantParameters, "base64").toString("utf-8");
    const params = JSON.parse(jsonString);
    
    // Normalizar todas las propiedades a minúsculas para unificar protocolos de Redsys
    const normalizedParams = Object.keys(params).reduce((acc, key) => {
      acc[key.toLowerCase()] = params[key];
      return acc;
    }, {} as Record<string, any>);

    const orderId = normalizedParams.ds_order || "";
    const responseCode = parseInt(normalizedParams.ds_response || "9999");

    // 2. 🔐 VERIFICACIÓN DE SEGURIDAD SEGÚN PROTOCOLO OFICIAL REDSYS
    const keyBuffer = Buffer.from(secretKey, "base64");
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    
    const orderBuffer = Buffer.alloc(16, 0);
    orderBuffer.write(orderId);
    
    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
    
    const localSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(ds_merchantParameters)
      .digest("base64"); 

    const signatureNormalized = ds_signature.replace(/-/g, "+").replace(/_/g, "/").replace(/=/g, "");
    const localSignatureNormalized = localSignature.replace(/-/g, "+").replace(/_/g, "/").replace(/=/g, "");

    if (signatureNormalized !== localSignatureNormalized) {
      console.error("❌ Las firmas no coinciden");
      return new Response("Firma no autorizada", { status: 401 });
    }

    console.log("🔒 Firma válida. Procesando pasarela de pago para el pedido:", orderId);

    // 3. Si el pago fue aprobado correctamente por el banco (Códigos 0000 a 0099)
    if (responseCode >= 0 && responseCode <= 99) {
      const merchantDataRaw = normalizedParams.ds_merchantdata || "{}";
      
      // Control de extracción de datos a prueba de fallos
      let customerData = { name: "Padre de Familia", email: "", phone: "", tickets: 1 };
      let eventName = "CINE PARA NIÑOS";

      try {
  // Normalizar Base64: revertir URL-safe y restaurar padding obligatorio
  const sanitized = merchantDataRaw
    .replace(/-/g, "+")
    .replace(/_/g, "/");

  // ✅ FIX CRÍTICO: añadir '=' de padding que Redsys omite al transmitir
  const padded = sanitized + "=".repeat((4 - (sanitized.length % 4)) % 4);

  const decodedStr = Buffer.from(padded, "base64").toString("utf-8");

  // Verificar que lo decodificado parece JSON antes de parsear
  if (!decodedStr.startsWith("{")) {
    throw new Error(`merchantData no es JSON válido tras decodificar: ${decodedStr.slice(0, 50)}`);
  }

  const parsedMerchantData = JSON.parse(decodedStr);
  if (parsedMerchantData.customerData) customerData = parsedMerchantData.customerData;
  if (parsedMerchantData.eventName) eventName = parsedMerchantData.eventName;

  console.log("✅ merchantData OK →", { email: customerData.email, eventName });

} catch (parseError) {
  console.error("❌ Error decodificando merchantData:", parseError, "| Raw recibido:", merchantDataRaw);
  // No hay fallback posible si el Base64 viene corrupto;
  // el problema está en el pay-tpv al codificarlo, no aquí.
}

if (!customerData.email) {
  console.error("❌ Abortado: email vacío. Revisar que pay-tpv codifica merchantData correctamente.");
  return new Response("Email faltante", { status: 400 });
}

      const numTickets = customerData.tickets || 1;
      const uniqueCode = "DM-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
      
      // Generar código QR nativo
      const qrImageBase64 = await QRCode.toDataURL(uniqueCode);
      const base64CleanData = qrImageBase64.replace(/^data:image\/\w+;base64,/, "");

      // Estructura destinada a tu Google Sheets
      const registerPayload = {
        eventName,
        name: customerData.name || "Invitado",
        phone: customerData.phone || "",
        email: customerData.email,
        tickets: numTickets,
        uniqueCode
      };

      // 🚀 ENVIAR AL EXCEL EXCLUSIVO DE CINE
      if (process.env.GOOGLE_SHEETS_CINE_URL) {
        const sheetsResponse = await fetch(
          process.env.GOOGLE_SHEETS_CINE_URL!,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registerPayload),
          }
        );
        console.log("Google Sheets Status:", sheetsResponse.status);
      } else {
        console.error("⚠️ Error: GOOGLE_SHEETS_CINE_URL no configurada.");
      }

      // 📧 ENVIAR CORREO CON DISEÑO INSTITUCIONAL DE DÍA DE MILAGROS ADAPTADO AL CINE
      const emailResult = await resend.emails.send({
        from: "Día de Milagros <eventos@diademilagros.com>",
        to: customerData.email,
        subject: `Confirmación de inscripción - ${eventName}`,
        attachments: [
          {
            filename: 'qr-code.png',
            content: Buffer.from(base64CleanData, 'base64'),
            contentType: 'image/png',
            contentId: 'qr-code-inline',
          }
        ],
        html: `
        <html>
        <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;">
          <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
            <tr>
              <td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                  <tr>
                    <td align="center" bgcolor="#ff7542" style="background:#ff7542;padding:35px;">
                      <img src="https://diademilagros.com" alt="Día de Milagros" width="240" style="display:block;margin:0 auto 15px auto;height:auto;">
                      <h1 style="color:white;margin:0;font-size:34px;letter-spacing:1px;font-weight:bold;">
                        CINE PARA NIÑOS
                      </h1>
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:45px;background:#ffffff;">
                      <h2 style="color:#ff7542;margin-top:0;">¡Hola ${customerData.name}!</h2>
                      <p style="color:#333;font-size:16px;line-height:1.5;">Tu pago ha sido procesado de forma correcta y tu inscripción al cine está confirmada.</p>
                      <br>
                      <p style="font-size:15px;color:#444;margin:5px 0;"><b>Evento:</b> ${eventName}</p>
                      <p style="font-size:15px;color:#444;margin:5px 0;"><b>Entradas reservadas:</b> ${numTickets} plaza(s)</p>
                      <p style="font-size:15px;color:#444;margin:5px 0;"><b>Código único de acceso:</b> <code>${uniqueCode}</code></p>
                      <br>
                      <div align="center" style="margin:20px 0;">
                        <img src="cid:qr-code-inline" width="240" alt="Código QR" style="display:block;margin:auto;">
                      </div>
                      <br>
                      <p align="center" style="font-size:15px;color:#222;font-weight:bold;">Presenta este código QR en la entrada de la iglesia.<br>Válido para acceder con las ${numTickets} personas inscritas.</p>
                      <br>
                      <hr style="border:none;border-top:1px solid #eee;">
                      <p align="center" style="color:#777;font-size:13px;margin-bottom:0;">City Church Barcelona</p>
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
        </html>
        `,
      });
      console.log("Respuesta Resend:", emailResult);
      console.log("✅ Registro en Excel completado y correo enviado con éxito.");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error crítico en el webhook de Redsys:", error);
    return new Response("Error interno", { status: 500 });
  }
}
