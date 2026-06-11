import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbx7-P1fOmqi0Nmr7wNG6GbdNf0xlQcH5qUzyXymKmfN_Dit2X1R4AWILcVtnl-q_sNu_A/exec";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    const response = await fetch(GOOGLE_SCRIPT_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);

    return NextResponse.json(
      {
        status: "error",
        message: "Error enviando datos a Google Apps Script",
      },
      { status: 500 }
    );
  }
}