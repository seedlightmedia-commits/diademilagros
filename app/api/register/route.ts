import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const data = await req.json();

    const appsScriptUrl = process.env.GOOGLE_SHEETS_WEBHOOK_URL;
    if (!appsScriptUrl) {
      return new NextResponse(JSON.stringify({ error: 'Google Sheets webhook not configured' }), { status: 500, headers: { 'Content-Type': 'application/json' } });
    }

    // Forward request to Apps Script Web App
    const forwardRes = await fetch(appsScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    const text = await forwardRes.text();

    // Return the Apps Script response (as text) to the client
    return new NextResponse(JSON.stringify({ ok: forwardRes.ok, status: forwardRes.status, body: text }), {
      status: forwardRes.ok ? 200 : 502,
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('API /api/register error:', err);
    return new NextResponse(JSON.stringify({ error: String(err) }), { status: 500, headers: { 'Content-Type': 'application/json' } });
  }
}
