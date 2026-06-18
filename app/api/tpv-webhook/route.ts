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

    console.log("📥 Ds_Signature recibida:", ds_signature);
    console.log("📥 Ds_MerchantParameters recibido (primeros 100):", ds_merchantParameters.slice(0, 100));

    if (!ds_merchantParameters) {
      console.error("❌ No se recibieron parámetros del comercio");
      return new Response("Parámetros vacíos", { status: 400 });
    }

    const secretKey = process.env.REDSYS_SECRET_KEY || "";

    // 1. Decodificar parámetros
    const jsonString = Buffer.from(ds_merchantParameters, "base64").toString("utf-8");
    const params = JSON.parse(jsonString);

    // Normalizar claves a minúsculas
    const normalizedParams = Object.keys(params).reduce((acc, key) => {
      acc[key.toLowerCase()] = params[key];
      return acc;
    }, {} as Record<string, string>);

    const orderId = normalizedParams.ds_order || "";
    const responseCode = parseInt(normalizedParams.ds_response || "9999", 10);

    console.log("📋 OrderId:", orderId, "| ResponseCode:", responseCode);

    // 2. Verificar firma
    const keyBuffer = Buffer.from(secretKey, "base64");
    const cipher = crypto.createCipheriv("des-ede3-cbc", keyBuffer, Buffer.alloc(8, 0));
    cipher.setAutoPadding(false);

    const orderBuffer = Buffer.alloc(16, 0);
    orderBuffer.write(orderId, "utf-8");

    const merchantKey = Buffer.concat([cipher.update(orderBuffer), cipher.final()]);

    const localSignature = crypto
      .createHmac("sha256", merchantKey)
      .update(ds_merchantParameters)
      .digest("base64");

    const normalize = (s: string) => s.replace(/-/g, "+").replace(/_/g, "/").replace(/=/g, "");
    const signatureNormalized = normalize(ds_signature);
    const localSignatureNormalized = normalize(localSignature);

    if (signatureNormalized !== localSignatureNormalized) {
      console.error("❌ Firma inválida");
      console.error("   Esperada:", localSignatureNormalized);
      console.error("   Recibida:", signatureNormalized);
      return new Response("Firma no autorizada", { status: 401 });
    }

    console.log("🔒 Firma válida. Pedido:", orderId);

        // 3. Solo procesar pagos aprobados (códigos 0-99)
    if (responseCode >= 0 && responseCode <= 99) {
      // 🛠️ CORRECCIÓN: Intentar leer tanto en minúsculas como en mayúsculas por seguridad
      const merchantDataRaw = normalizedParams.ds_merchantdata || params.Ds_MerchantData || "";

      console.log("📦 merchantData raw recibido:", merchantDataRaw);

      let customerData = { name: "Invitado", email: "", phone: "", tickets: 1 };
      let eventName = "CINE PARA NIÑOS";

      if (merchantDataRaw) {
        try {
          // 🛠️ SOLUCIÓN ROBUSTA: Convierte de forma segura cualquier variante de Base64 (estándar o URL-safe)
          const base64Standard = merchantDataRaw
            .replace(/-/g, "+")
            .replace(/_/g, "/");
          
          // Reconstruir el padding '=' si le hace falta
          const paddedBase64 = base64Standard + "=".repeat((4 - (base64Standard.length % 4)) % 4);
          
          const decoded = Buffer.from(paddedBase64, "base64").toString("utf-8");

          console.log("📦 merchantData decodificado con éxito:", decoded);

          if (decoded.trim().startsWith("{")) {
            const parsed = JSON.parse(decoded);
            // 🛠️ Mantenemos tus datos base exactamente igual sin alterar tu estructura
            if (parsed.customerData) customerData = parsed.customerData;
            if (parsed.eventName) eventName = parsed.eventName;
          } else {
            throw new Error("El string decodificado no mantiene formato JSON");
          }

          console.log("✅ customerData OK:", { email: customerData.email, eventName });

        } catch (err) {
          console.error("❌ Error decodificando merchantData:", err);
        }
      }

      // 🛠️ CAMBIO SEGURO CONTRA CAÍDAS: Si el email falla, registramos el error en logs pero dejamos que Redsys reciba un 200
      // para que el banco no piense que tu servidor web se ha caído.
      if (!customerData.email) {
        console.error("❌ Email vacío — No se puede procesar correos ni Sheets en este intento");
        return new Response("OK", { status: 200 }); 
      }

      const numTickets = Number(customerData.tickets) || 1;
      const uniqueCode = `DM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // Generar QR
      const qrDataUrl = await QRCode.toDataURL(uniqueCode);
      const qrBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");

      // Payload para Google Sheets
      const registerPayload = {
        eventName,
        name: customerData.name || "Invitado",
        phone: customerData.phone || "",
        email: customerData.email,
        tickets: numTickets,
        uniqueCode,
      };

      // Enviar a Google Sheets
      const sheetsUrl = process.env.GOOGLE_SHEETS_CINE_URL;
      if (sheetsUrl) {
        try {
          const sheetsResponse = await fetch(sheetsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(registerPayload),
          });
          console.log("📊 Google Sheets status:", sheetsResponse.status);
        } catch (sheetsError) {
          console.error("❌ Error enviando a Google Sheets:", sheetsError);
        }
      } else {
        console.error("⚠️ GOOGLE_SHEETS_CINE_URL no configurada");
      }

      // Enviar correo
      try {
        const emailResult = await resend.emails.send({
          from: "Día de Milagros <eventos@diademilagros.com>",
          to: customerData.email,
          subject: `Confirmación de inscripción - ${eventName}`,
          attachments: [
            {
              filename: "qr-code.png",
              content: Buffer.from(qrBase64, "base64"),
              contentType: "image/png",
              contentId: "qr-code-inline",
            },
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
                        <p style="color:#333;font-size:16px;line-height:1.5;">
                          Tu pago ha sido procesado correctamente y tu inscripción está confirmada.
                        </p>
                        <p style="font-size:15px;color:#444;margin:5px 0;"><b>Evento:</b> ${eventName}</p>
                        <p style="font-size:15px;color:#444;margin:5px 0;"><b>Entradas:</b> ${numTickets} plaza(s)</p>
                        <p style="font-size:15px;color:#444;margin:5px 0;"><b>Código de acceso:</b> <code>${uniqueCode}</code></p>
                        <div align="center" style="margin:30px 0;">
                          <img src="cid:qr-code-inline" width="240" alt="Código QR" style="display:block;margin:auto;">
                        </div>
                        <p align="center" style="font-size:15px;color:#222;font-weight:bold;">
                          Presenta este QR en la entrada de la iglesia.<br>
                          Válido para ${numTickets} persona(s).
                        </p>
                        <hr style="border:none;border-top:1px solid #eee;margin-top:30px;">
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
        console.log("📧 Respuesta Resend:", emailResult);
      } catch (emailError) {
        console.error("❌ Error enviando correo con Resend:", emailError);
      }
      console.log("✅ Proceso completado de forma limpia.");
    }

    return new Response("OK", { status: 200 });
  } catch (error) {
    console.error("Error crítico en el webhook de Redsys:", error);
    return new Response("Error interno", { status: 500 });
  }
}
