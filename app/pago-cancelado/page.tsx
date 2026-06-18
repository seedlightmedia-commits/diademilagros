"use client";

import Link from "next/link";
import { Suspense } from "react";

function ContentPagoCancelado() {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      {/* Tarjeta Contenedora Blanca */}
      <div className="bg-white rounded-3xl p-8 max-w-lg w-full shadow-2xl relative text-center border border-gray-100 animate-scale-up">

        {/* Encabezado Naranja */}
        <h1 className="text-2xl md:text-3xl font-extrabold text-[#ff7542] mb-6 tracking-wide">
          Pago no completado
        </h1>

        {/* Círculo con la X Roja */}
        <div className="w-16 h-16 bg-[#fee2e2] text-[#ef4444] rounded-full flex items-center justify-center mx-auto mb-6 border border-[#fecaca]">
          <svg
            className="w-8 h-8 stroke-[3]"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </div>

        {/* Mensajes Informativos */}
        <p className="text-gray-700 text-lg font-medium mb-2">
          Tu pago fue cancelado o denegado por el banco.
        </p>

        <p className="text-gray-500 text-sm md:text-base mb-8">
          No se realizó ningún cargo. Puedes intentarlo de nuevo cuando quieras.
        </p>

        {/* Botón Volver */}
        <Link href="/#eventos">
          <button className="bg-[#ff7542] hover:bg-[#e06333] text-white font-bold py-3 px-12 rounded-full transition-all duration-200 text-base shadow-md hover:shadow-lg active:scale-95">
            Volver a los eventos
          </button>
        </Link>

        {/* Pie */}
        <p className="text-gray-400 text-xs mt-6">
          Si crees que es un error, contacta con tu banco o inténtalo con otra tarjeta.
        </p>

      </div>
    </div>
  );
}

export default function PagoCanceladoPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">
        Cargando...
      </div>
    }>
      <ContentPagoCancelado />
    </Suspense>
  );
}