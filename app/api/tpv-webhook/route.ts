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
    console.log("Ds_Signature:", ds_signature);
    console.log("Ds_MerchantParameters:", ds_merchantParameters);

    const secretKey = process.env.REDSYS_SECRET_KEY || "";

    // 1. Decodificar parámetros de forma nativa
    const jsonString = Buffer.from(ds_merchantParameters, "base64").toString("utf-8");
    const params = JSON.parse(jsonString);
    console.log("Parámetros recibidos:", params);
    
    const orderId = params.Ds_Order || params.DS_MERCHANT_ORDER || "";
    const responseCode = parseInt(params.Ds_Response || "9999");

    // 2. 🔐 VERIFICACIÓN DE SEGURIDAD SEGÚN PROTOCOLO OFICIAL REDSYS
    const keyBuffer = Buffer.from(secretKey, "base64");
    console.log("orderId:", orderId);
console.log("secretKey:", secretKey.substring(0,10) + "...");
console.log("keyBuffer length:", keyBuffer.length);
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    
    cipher.setAutoPadding(false);
    
    
    const orderBuffer = Buffer.alloc(16, 0);
    orderBuffer.write(orderId);
    
    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
    console.log("merchantKey generada correctamente");
    
    const localSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(ds_merchantParameters)
      .digest("base64"); 

    const signatureNormalized = ds_signature
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/=/g, "");

    const localSignatureNormalized = localSignature
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .replace(/=/g, "");

    console.log("Firma Redsys:", signatureNormalized);
    console.log("Firma calculada:", localSignatureNormalized);

    if (signatureNormalized !== localSignatureNormalized) {
      console.error("❌ Las firmas no coinciden");
      return new Response("Firma no autorizada", { status: 401 });
    }

    console.log("🔒 Firma válida. Procesando pasarela de pago...");

    // 3. Si el pago fue aprobado correctamente por el banco (Códigos 0000 a 0099)
    if (responseCode >= 0 && responseCode <= 99) {
      const merchantDataRaw = params.Ds_MerchantData || params.DS_MERCHANT_MERCHANTDATA || "{}";
      
      // 🛠️ CORRECCIÓN CRÍTICA: Intenta decodificar de forma segura sin romper el servidor si viene en formato Base64URL
      let merchantData;
      try {
        if (merchantDataRaw.startsWith("%") || merchantDataRaw.includes("%22")) {
          merchantData = JSON.parse(decodeURIComponent(merchantDataRaw));
        } else {
          merchantData = JSON.parse(Buffer.from(merchantDataRaw, "base64url").toString("utf-8"));
        }
      } catch (parseError) {
        console.warn("⚠️ Mapeo alternativo: Error al decodificar JSON directo, aplicando fallback de URL", parseError);
        merchantData = JSON.parse(decodeURIComponent(merchantDataRaw));
      }

      const { customerData, eventName } = merchantData;

      // Extracción del número de entradas compradas
      const numTickets = customerData.tickets || 1;

      // Generación del código aleatorio post-pago
      const uniqueCode = "DM-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
      
      // Creamos el QR en Base64 para adjuntarlo como archivo real en Resend
      const qrImageBase64 = await QRCode.toDataURL(uniqueCode);
      const base64CleanData = qrImageBase64.replace(/^data:image\/\w+;base64,/, "");

      // Estructuramos el payload para la hoja de cálculo de Google
      const registerPayload = {
        eventName,
        name: customerData.name,
        phone: customerData.phone,
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
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(registerPayload),
          }
        );

        console.log(
          "Google Sheets:",
          sheetsResponse.status,
          await sheetsResponse.text()
        );
      } else {
        console.error("⚠️ Error: GOOGLE_SHEETS_CINE_URL no está definida.");
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
                      <img src="https://diademilagros.com/LOGOS_BLANCO.png" alt="Día de Milagros" width="240" style="display:block;margin:0 auto 15px auto;height:auto;">
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
    console.error("========== ERROR ==========");
console.error(error);

if (error instanceof Error) {
  console.error(error.message);
  console.error(error.stack);
}
    return new Response("Error interno", { status: 500 });
  }
}
