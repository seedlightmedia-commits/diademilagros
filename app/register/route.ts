import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const data = await request.json();

    return NextResponse.json({
      status: "success",
      data,
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: "error",
        message: "Error al procesar la solicitud",
      },
      { status: 500 }
    );
  }
}