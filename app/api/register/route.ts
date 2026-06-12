import { NextResponse } from "next/server";
import { Resend } from "resend";

console.log("API KEY:", process.env.RESEND_API_KEY);

const resend = new Resend(process.env.RESEND_API_KEY!);

const GOOGLE_SCRIPT_URL = process.env.GOOGLE_SHEETS_WEBHOOK_URL!;

export async function POST(request: Request) {
  try {
    const data = await request.json();

    console.log("==================================");
    console.log("Nombre:", data.name);
    console.log("Email:", data.email);
    console.log("Código:", data.uniqueCode);
    console.log("QR:", data.qrImage);
    console.log("Longitud QR:", data.qrImage?.length);
    console.log("==================================");

    // Guardar en Google Sheets
    await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    // Enviar correo
    const email = await resend.emails.send({
      from: "Día de Milagros <eventos@diademilagros.com>",
      to: data.email,
      subject: "Confirmación de inscripción - DÍA DE MILAGROS",
      html: `
      <html>
      <body style="margin:0;background:#f5f5f5;font-family:Arial,sans-serif;">

      <table width="100%" cellpadding="0" cellspacing="0">
      <tr>
      <td align="center">

      <table width="620" cellpadding="0" cellspacing="0"
      style="background:#ffffff;border-radius:18px;overflow:hidden;">

      <tr>
      <td align="center"
      style="background:#ff7542;padding:40px;">

      <img
      src="https://diademilagros.com/LOGOS_BLANCO.png"
      width="240"
      style="display:block;margin:auto;">

      </td>
      </tr>

      <tr>
      <td style="padding:45px;">

      <h2 style="color:#ff7542;">
      ¡Hola ${data.name}!
      </h2>

      <p>
      Tu inscripción ha sido confirmada correctamente.
      </p>

      <p>
      <strong>Evento:</strong><br>
      ${data.eventName}
      </p>

      <p>
      <strong>Código único:</strong><br>
      ${data.uniqueCode}
      </p>

      <br>

      <div style="text-align:center;">

      <img
      src="${data.qrImage}"
      width="240"
      alt="Código QR"
      style="display:block;margin:auto;">

      </div>

      <br>

      <p style="text-align:center;">
      Presenta este código QR al ingresar.
      </p>

      <hr>

      <p style="text-align:center;color:#777;">
      Ministerio Barcelona
      </p>

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

    console.log("========== RESPUESTA RESEND ==========");
    console.log(email);
    console.log("======================================");

    return NextResponse.json({
      status: "success",
      email,
    });
  } catch (error) {
    console.error("ERROR API REGISTER:");
    console.error(error);

    return NextResponse.json(
      {
        status: "error",
        message: "Error al registrar",
      },
      {
        status: 500,
      }
    );
  }
}