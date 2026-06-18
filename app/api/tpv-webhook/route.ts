import { NextResponse } from "next/server";
import crypto from "crypto";
import QRCode from "qrcode";
import { Resend } from "resend";

const resend = new Resend(process.env.RESEND_API_KEY!);

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const ds_signature = (formData.get("Ds_Signature") as string) || "";
    const ds_merchantParameters = (formData.get("Ds_MerchantParameters") as string) || "";

    const secretKey = process.env.REDSYS_SECRET_KEY || "";

    // 1. Decodificar parámetros del banco de forma nativa
    const jsonString = Buffer.from(ds_merchantParameters, "base64").toString("utf-8");
    const params = JSON.parse(jsonString);
    
    // CORRECCIÓN CRÍTICA: Redsys devuelve los parámetros en minúsculas en el webhook (Ds_Order y Ds_Response)
    const orderId = params.Ds_Order || params.DS_MERCHANT_ORDER || "";
    const responseCode = parseInt(params.Ds_Response || "9999");

    // 2. 🔐 VERIFICACIÓN DE SEGURIDAD NATIVA DEL BANCO (REPARADA)
    const keyBuffer = Buffer.from(secretKey, "base64");
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);
    
    const orderBuffer = Buffer.alloc(12, 0);
    orderBuffer.write(orderId);
    
    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);
    
    // REPARACIÓN COMPLETA: Cambiado a "base64" puro ya que Redsys no usa codificación URL directa en firmas
    const localSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(ds_merchantParameters)
      .digest("base64"); 

    // Normalizar ambas cadenas reemplazando símbolos para evitar discrepancias de envío
    const signatureNormalized = ds_signature.replace(/_/g, "/").replace(/-/g, "+");
    const localSignatureNormalized = localSignature.replace(/_/g, "/").replace(/-/g, "+");

    // Verificar firmas limpias para impedir accesos desautorizados
    if (signatureNormalized.substring(0, 16) !== localSignatureNormalized.substring(0, 16)) {
      console.error("Fallo de seguridad: La firma calculada no coincide con la de Redsys.");
      return new Response("Firma no autorizada", { status: 401 });
    }

    // 3. Si el pago fue aprobado correctamente por el banco (Códigos 0000 a 0099)
    if (responseCode >= 0 && responseCode <= 99) {
      // Leer el MerchantData del banco (Redsys lo pasa codificado en formato URL)
      const merchantDataRaw = params.Ds_MerchantData || params.DS_MERCHANT_MERCHANTDATA || "{}";
      const merchantData = JSON.parse(decodeURIComponent(merchantDataRaw));
      const { customerData, eventName } = merchantData;

      // Generación automática del código aleatorio post-pago
      const uniqueCode = "DM-" + Date.now() + "-" + Math.floor(Math.random() * 100000);
      
      // Creamos el QR en Base64 para guardarlo en la base de datos
      const qrImageBase64 = await QRCode.toDataURL(uniqueCode);
      
      // Procesamos la copia limpia del Base64 sin prefijos para el adjunto de Resend
      const base64CleanData = qrImageBase64.replace(/^data:image\/\w+;base64,/, "");

      // Estructuramos el payload idéntico para la hoja de cálculo
      const registerPayload = {
        eventName,
        name: customerData.name,
        phone: customerData.phone,
        email: customerData.email,
        uniqueCode,
        qrImage: qrImageBase64
      };

      // 🚀 ENVIAR DIRECTAMENTE A TU NUEVA HOJA EXCEL DE CINE
      await fetch(process.env.GOOGLE_SHEETS_CINE_URL!, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(registerPayload),
      });

      // 📧 ENVIAR CORREO DE CONFIRMACIÓN CON RESEND EXCLUSIVO PARA EL CINE
      await resend.emails.send({
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
          <table width="100%" cellpadding="0" cellspacing="0">
            <tr>
              <td align="center">
                <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;">
                  <tr>
                    <td align="center" style="background:#ff7542;padding:40px;">
                      <!-- CORRECCIÓN LOGO: URL corregida con la imagen corporativa oficial -->
                      <img src="https://diademilagros.com" width="240" style="display:block;margin:auto;">
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:45px;">
                      <h2 style="color:#ff7542;">¡Hola ${customerData.name}!</h2>
                      <p>Tu pago ha sido procesado de forma correcta y tu inscripción está confirmada.</p>
                      <p><strong>Evento:</strong><br>${eventName}</p>
                      <p><strong>Código único de acceso:</strong><br>${uniqueCode}</p>
                      <br>
                      <div style="text-align:center;">
                        <img src="cid:qr-code-inline" width="240" alt="Código QR" style="display:block;margin:auto;">
                      </div>
                      <br>
                      <p style="text-align:center;">Presenta este código QR en la entrada de la iglesia.</p>
                      <hr>
                      <p style="text-align:center;color:#777;">Ministerio Barcelona</p>
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
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error en webhook de Redsys:", error);
    return new Response("Error interno", { status: 500 });
  }
}
