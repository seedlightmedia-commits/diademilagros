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

      const merchantDataRaw = normalizedParams.ds_merchantdata || params.Ds_MerchantData || "";
      console.error("📦 [DIAGNÓSTICO] Ds_MerchantData en bruto recibido:", merchantDataRaw);

      let customerData = { name: "Invitado", email: "", phone: "", tickets: 1 };
      let eventName = "CINE PARA NIÑOS";

      // ── Declarar cData fuera del try para que sea accesible en el bloque de Sheets ──
      let cData: any = null;

      if (merchantDataRaw) {
        try {
          const sanitized = merchantDataRaw.replace(/-/g, "+").replace(/_/g, "/");
          const padded = sanitized + "=".repeat((4 - (sanitized.length % 4)) % 4);

          let decoded = Buffer.from(padded, "base64").toString("utf-8");
          console.error("📦 [DIAGNÓSTICO] Texto decodificado crudo:", decoded);

          const lastCurlyBrace = decoded.lastIndexOf("}");
          if (lastCurlyBrace !== -1) {
            decoded = decoded.substring(0, lastCurlyBrace + 1);
          }

          const parsed = JSON.parse(decoded);

          // ── Guardar cData en el scope externo ──
          cData = parsed.customerData || parsed.customerdata;

          if (cData) {
            customerData = {
              name:    cData.name    || cData.Name    || "Invitado",
              email:   cData.email   || cData.Email   || "",
              phone:   cData.phone   || cData.Phone   || "",
              tickets: Number(cData.tickets || cData.Tickets) || 1,
            };
          }

          eventName = parsed.eventName || parsed.eventname || eventName;
          console.error("✅ Datos del cliente asignados con éxito:", customerData);

        } catch (err) {
          console.error("❌ Error grave decodificando merchantData:", err);
        }
      }

      // Filtro de seguridad
      if (!customerData.email || customerData.email.trim() === "") {
        console.error("❌ El email se decodificó como vacío. No se puede continuar al Excel ni enviar correo.");
        return new Response("OK", { status: 200 });
      }

      const numTickets = Number(customerData.tickets) || 1;
      const pricePerTicket = 8; // precio por boleta en euros
      const totalPaid = (pricePerTicket * numTickets).toFixed(2);
      const uniqueCode = `DM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      const qrDataUrl = await QRCode.toDataURL(uniqueCode);
      const qrBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");

      const eventNameClean = eventName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

      // ========================================================
      // 📊 ENVÍO A GOOGLE SHEETS
      // ========================================================
      const sheetsUrl = process.env.GOOGLE_SHEETS_CINE_URL;
      if (sheetsUrl) {
        try {
          console.error("📤 [SHEETS] Transformando payload a formato seguro...");

          const formBody = new URLSearchParams();
          formBody.append("eventName",   eventNameClean);
          formBody.append("name",        customerData.name  || "Invitado");
          formBody.append("email",       customerData.email || "");
          formBody.append("phone",       customerData.phone || "");
          formBody.append("tickets",     String(numTickets));
          formBody.append("totalPaid",   totalPaid);
          formBody.append("uniqueCode",  uniqueCode);
          formBody.append("qrFormula",   `=IMAGE("https://api.qrserver.com/v1/create-qr-code/?data=${uniqueCode}")`);
          // ── Campos de Cine para Niños ──
          formBody.append("childAge",    cData?.childAge    || "");
          formBody.append("fatherName",  cData?.fatherName  || "");
          formBody.append("motherName",  cData?.motherName  || "");
          formBody.append("fatherPhone", cData?.fatherPhone || "");
          formBody.append("motherPhone", cData?.motherPhone || "");

          console.error("📤 [SHEETS] Enviando petición POST...");

          fetch(sheetsUrl, {
            method: "POST",
            headers: { "Content-Type": "application/x-www-form-urlencoded" },
            body: formBody.toString(),
          })
          .then(async (res) => {
            console.error(`📊 [SHEETS] Servidor respondió con Estado: ${res.status}`);
          })
          .catch((err) => {
            console.error("❌ [SHEETS] Error conectando con Google:", err);
          });

        } catch (sheetsError) {
          console.error("❌ [SHEETS] Excepción en el bloque de Google Sheets:", sheetsError);
        }
      } else {
        console.error("⚠️ [SHEETS] ERROR: La variable GOOGLE_SHEETS_CINE_URL no está configurada en Vercel.");
      }

      // ========================================================
      // 📨 ENVÍO DE CORREO ELECTRÓNICO
      // ========================================================
      try {
        console.error(`📨 [RESEND] Intentando enviar correo a: ${customerData.email}`);

        const antiCollapseId = `${Date.now()}-${Math.floor(Math.random() * 1000)}`;

        const emailResult = await resend.emails.send({
          from: "Día de Milagros <eventos@diademilagros.com>",
          to: customerData.email,
          subject: `Confirmación de inscripción - ${eventNameClean} (#${antiCollapseId.slice(-4)})`,
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
          <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%;">
            <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:20px 0;">
              <tr>
                <td align="center">
                  <table width="620" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:18px;overflow:hidden;box-shadow:0 4px 10px rgba(0,0,0,0.05);">
                    <tr>
                      <td align="center" bgcolor="#ff7542" style="background:#ff7542;padding:40px 35px;">
                        <img src="https://diademilagros.com/LOGOS_BLANCO.png" alt="Día de Milagros" width="260" style="display:block;margin:0 auto 20px auto;border:0;height:auto;max-width:100%;">
                        <h1 style="color:white;margin:0;font-size:32px;letter-spacing:1px;font-weight:bold;text-transform:uppercase;">
                          ${eventNameClean}
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:45px;background:#ffffff;">
                        <h2 style="color:#ff7542;margin-top:0;font-size:24px;">¡Hola ${customerData.name}!</h2>
                        <p style="color:#333333;font-size:16px;line-height:1.6;margin-bottom:10px;">
                          Tu inscripción se ha procesado con éxito. Presenta el código QR adjunto en la entrada el día del evento.
                        </p>

                        <!-- ── Resumen de compra ── -->
                        <table width="100%" cellpadding="0" cellspacing="0" style="margin:20px 0;border:1px solid #eeeeee;border-radius:10px;overflow:hidden;">
                          <tr style="background:#fff8f5;">
                            <td style="padding:12px 16px;font-size:14px;color:#555555;border-bottom:1px solid #eeeeee;">
                              <b>Boletas compradas</b>
                            </td>
                            <td style="padding:12px 16px;font-size:14px;color:#333333;border-bottom:1px solid #eeeeee;text-align:right;">
                              ${numTickets} entrada${numTickets > 1 ? "s" : ""}
                            </td>
                          </tr>
                          <tr style="background:#ffffff;">
                            <td style="padding:12px 16px;font-size:14px;color:#555555;">
                              <b>Total pagado</b>
                            </td>
                            <td style="padding:12px 16px;font-size:16px;font-weight:bold;color:#ff7542;text-align:right;">
                              ${totalPaid}€
                            </td>
                          </tr>
                        </table>

                        <!-- ── QR ── -->
                        <div style="text-align:center;margin:30px 0;padding:20px;background:#fdfdfd;border:1px dashed #dddddd;border-radius:12px;">
                          <img src="cid:qr-code-inline" alt="Código de acceso QR" width="180" style="display:inline-block;border:0;height:auto;">
                          <p style="color:#666666;font-size:12px;margin:10px 0 0 0;font-family:monospace;">Código: ${uniqueCode}</p>
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td bgcolor="#fafafa" style="padding:20px;text-align:center;border-top:1px solid #eeeeee;">
                        <p style="color:#999999;font-size:12px;margin:0;">Día de Milagros &copy; 2026</p>
                        <span style="display:none;white-space:nowrap;font-size:1px;line-height:1px;color:#fafafa;">Ref: ${antiCollapseId}</span>
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

        console.error("✅ [RESEND] Correo enviado de forma exitosa. ID:", emailResult);
      } catch (emailError) {
        console.error("❌ [RESEND] Error crítico enviando el correo:", emailError);
      }
    }

    return new Response("OK", { status: 200 });

  } catch (globalError) {
    console.error("❌ [WEBHOOK] Error crítico general del sistema:", globalError);
    return new Response("Error interno", { status: 500 });
  }
}