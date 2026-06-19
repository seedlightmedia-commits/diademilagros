export async function GET() {
  const sheetsUrl = process.env.GOOGLE_SHEETS_CINE_URL || "";

  if (!sheetsUrl) {
    console.error("⚠️ GOOGLE_SHEETS_CINE_URL no configurada");
    return Response.json({ disponibles: 999 });
  }

  try {
    const res = await fetch(sheetsUrl, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      redirect: "follow",
    });

    if (!res.ok) {
      console.error("❌ Google Sheets respondió con error:", res.status);
      return Response.json({ disponibles: 999 });
    }

    const data = await res.json();
    console.log("✅ Boletas disponibles:", data.disponibles);
    return Response.json({ disponibles: data.disponibles });

  } catch (error) {
    console.error("❌ Error consultando boletas:", error);
    return Response.json({ disponibles: 999 });
  }
}