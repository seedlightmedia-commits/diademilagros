"use client";

import Image from "next/image";

export function PastorQuoteSection() {
  return (
    <section className="relative min-h-[400px] overflow-hidden flex items-center justify-center">
      {/* Background Image - Full bleed (Mantiene tu enlace exacto de Vercel) */}
      <div className="absolute inset-0">
        <Image
          src="/FONDO_OSCURO1.jpg"
          alt="Momento de oración"
          fill
          className="object-cover"
        />
        <div className="absolute inset-0 bg-black/60" />
      </div>

      {/* Content - Centered over image */}
      <div className="relative z-10 flex flex-col items-center justify-center min-h-[400px] px-4 py-16 w-full max-w-4xl mx-auto">
        
        {/* LOGO BLANCO SUPERIOR: Agregado tal cual el pantallazo arriba del título */}
        <div className="mb-6 relative w-[160px] h-[40px]">
          <Image
            src="/LOGOS_BLANCO.png"
            alt="Día de Milagros Logo Blanco"
            fill
            className="object-contain"
          />
        </div>

        {/* TÍTULO: Tamaño y estilo visual exacto del segundo pantallazo */}
        <h2 className="text-xl md:text-2xl lg:text-3xl font-extrabold text-white tracking-wide mb-1 text-center uppercase font-sans">
          PORQUE PARA DIOS NO HAY NADA IMPOSIBLE
        </h2>

        {/* CITA: Estilo simplificado sin el color del tema para respetar la captura */}
        <p className="text-white/90 font-normal text-sm md:text-base mb-6 text-center font-sans">Lucas 1.37</p>

        {/* PÁRRAFO: Tamaño de fuente e interlineado idéntico al pantallazo */}
        <p className="text-white/80 max-w-2xl mx-auto text-sm md:text-lg lg:text-xl leading-relaxed mb-8 text-center font-sans">
          Tu milagro está al alcance de tu fe. Deja que tu fe sea la luz que
          ilumine el camino hacia los milagros.
        </p>

        {/* INFO DEL PASTOR: Organizado de forma limpia abajo del todo */}
        <div className="text-white/70 text-xs md:text-sm uppercase tracking-[0.2em] text-center font-sans">
          <p className="mb-0.5">PASTOR</p>
          <p className="font-bold tracking-[0.25em] text-white">JOSE LUIS</p>
        </div>
      </div>
    </section>
  );
}
