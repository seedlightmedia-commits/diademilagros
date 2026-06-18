"use client";

import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Suspense } from "react";

function ContentPagoExitoso() {
  const searchParams = useSearchParams();
  // Intentamos capturar el email si viaja en la URL, si no, dejamos un texto genérico instructivo
  const emailParam = searchParams.get("email");

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      {/* Tarjeta Contenedora Blanca */}
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative text-center border border-gray-100 animate-scale-up">
        
        {/* Encabezado Naranja */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#ff7542] mb-6 tracking-wide">
          ¡Registro Exitoso!
        </h1>

        {/* Círculo con el Check Verde */}
        <div className="w-16 h-16 bg-[#e6f9f0] text-[#10b981] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#c2f3dc]">
          <svg
            className="w-8 h-8 stroke-[3]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M5 13l4 4L19 7"
            />
          </svg>
        </div>

        {/* Mensajes Informativos */}
        <p className="text-gray-700 text-lg font-medium mb-2">
          Tu entrada ha sido registrada exitosamente.
        </p>
        
        <p className="text-gray-500 text-sm md:text-base mb-8">
          Se ha enviado un código QR {emailParam ? `a ${emailParam}` : "al correo electrónico proporcionado"}.
        </p>

        {/* Botón Cerrar / Volver */}
        <Link href="/">
          <button className="bg-[#ff7542] hover:bg-[#e06333] text-white font-bold py-3 px-12 rounded-full transition-all duration-200 text-base shadow-md hover:shadow-lg active:scale-95">
            Cerrar
          </button>
        </Link>
      </div>
    </div>
  );
}

export default function PagoExitosoPage() {
  return (
    // Encapsulado en Suspense requerido por Next.js al usar useSearchParams en componentes cliente
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Cargando confirmación...
      </div>
    }>
      <ContentPagoExitoso />
    </Suspense>
  );
}
