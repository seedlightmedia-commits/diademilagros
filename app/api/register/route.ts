import { NextResponse } from "next/server";

const GOOGLE_SCRIPT_URL =
  "https://script.google.com/macros/s/AKfycbyZtdg-L0zGJ9euTGJqGFTY_Hu-7csWUKUrNnk2JDorQMtsXG3VaPs0G-CX_ETw3uv5fw/exec";

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