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
       // 3. Solo procesar pagos aprobados (códigos 0-99)
    if (responseCode >= 0 && responseCode <= 99) {
      
      const merchantDataRaw = normalizedParams.ds_merchantdata || params.Ds_MerchantData || "";
      console.error("📦 [DIAGNÓSTICO] Ds_MerchantData en bruto recibido:", merchantDataRaw);

      let customerData = { name: "Invitado", email: "", phone: "", tickets: 1 };
      let eventName = "CINE PARA NIÑOS";

      if (merchantDataRaw) {
        try {
          // 1. Limpieza estándar de caracteres URL y rellenado de Base64
          const sanitized = merchantDataRaw.replace(/-/g, "+").replace(/_/g, "/");
          const padded = sanitized + "=".repeat((4 - (sanitized.length % 4)) % 4);
          
          // 2. Decodificar a texto plano
          let decoded = Buffer.from(padded, "base64").toString("utf-8");
          console.error("📦 [DIAGNÓSTICO] Texto decodificado crudo:", decoded);

          // 🛠️ REPARACIÓN CRÍTICA: Cortar cualquier carácter basura que Redsys añada después del cierre del JSON
          const lastCurlyBrace = decoded.lastIndexOf("}");
          if (lastCurlyBrace !== -1) {
            decoded = decoded.substring(0, lastCurlyBrace + 1);
          }

          // 3. Parsear el JSON limpio
          const parsed = JSON.parse(decoded);
          
          // Extraer los datos flexibles
          const cData = parsed.customerData || parsed.customerdata;
          if (cData) {
            customerData = {
              name: cData.name || cData.Name || "Invitado",
              email: cData.email || cData.Email || "",
              phone: cData.phone || cData.Phone || "",
              tickets: Number(cData.tickets || cData.Tickets) || 1
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

      // ========================================================
      // 🚀 A PARTIR DE AQUÍ SIGUE TU CÓDIGO DE QR, SHEETS Y RESEND COPIADO IGUAL...
      // ========================================================
            const numTickets = Number(customerData.tickets) || 1;
      const uniqueCode = `DM-${Date.now()}-${Math.floor(Math.random() * 100000)}`;

      // Generar QR en Base64 para el correo
      const qrDataUrl = await QRCode.toDataURL(uniqueCode);
      const qrBase64 = qrDataUrl.replace(/^data:image\/\w+;base64,/, "");

      // 🛠️ REPARACIÓN: Normalizamos el nombre del evento para eliminar caracteres que rompan las peticiones HTTP
      const eventNameClean = eventName.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase(); 
      // "CINE PARA NIÑOS" se convertirá de forma segura en "CINE PARA NINOS"

      // Payload para Google Sheets
      const registerPayload = {
        "Nombre del evento": eventNameClean,
        "Nombre": customerData.name || "Invitado",
        "Contacto": customerData.phone || "",
        "Gmail": customerData.email,
        "Plazas": numTickets,
        "Código único": uniqueCode,
        "qrFormula": `=IMAGE("https://qrserver.com{uniqueCode}")`
      };

      // Enviar a Google Sheets
      const sheetsUrl = process.env.GOOGLE_SHEETS_CINE_URL;
      if (sheetsUrl) {
        try {
          console.error("📤 [SHEETS] Intentando enviar payload...");
          const sheetsResponse = await fetch(sheetsUrl, {
            method: "POST",
            headers: { 
              "Content-Type": "application/json",
              "Accept": "application/json"
            },
            body: JSON.stringify(registerPayload),
          });
          
          console.error(`📊 [SHEETS] Código de estado HTTP recibido: ${sheetsResponse.status}`);
          const responseText = await sheetsResponse.text();
          console.error(`📊 [SHEETS] Respuesta del servidor de Google: ${responseText.slice(0, 150)}`);
          
        } catch (sheetsError) {
          console.error("❌ [SHEETS] Error crítico de red conectando con Google Sheets:", sheetsError);
        }
      } else {
        console.error("⚠️ [SHEETS] ERROR: La variable GOOGLE_SHEETS_CINE_URL no está configurada en Vercel.");
      }

      // Enviar correo electrónico con Resend
      try {
        console.error(`📨 [RESEND] Intentando enviar correo a: ${customerData.email}`);
        const emailResult = await resend.emails.send({
          from: "Día de Milagros <eventos@diademilagros.com>",
          to: customerData.email,
          subject: `Confirmación de inscripción - ${eventNameClean}`,
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
                        <h1 style="color:white;margin:0;font-size:34px;letter-spacing:1px;font-weight:bold;">
                          ${eventNameClean}
                        </h1>
                      </td>
                    </tr>
                    <tr>
                      <td style="padding:45px;background:#ffffff;">
                        <h2 style="color:#ff7542;margin-top:0;">¡Hola ${customerData.name}!</h2>
                        <p style="color:#333;font-size:16px;line-height:1.5;">Tu inscripción se ha procesado con éxito. Presenta el código QR adjunto en la entrada.</p>
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

