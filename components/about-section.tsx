"use client";

import Image from "next/image";

export function AboutSection() {
  return (
    <section id="nosotros" className="py-16 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <div className="flex justify-center mb-6">
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOS_PRINCIPAL%20ISO-vbgjkk5Iu1XugGcjzft7uk5SQ7eLzY.png"
              alt="Día de Milagros"
              width={60}
              height={60}
            />
          </div>

          <h2 className="text-2xl md:text-3xl font-heading text-brand-dark mb-6">
            ¿QUÉ ES DÍAS DE MILAGROS ?
          </h2>

          <div className="space-y-4 text-gray-600 text-sm md:text-base leading-relaxed font-montserrat text-justify">
            <p>
              Cada milagro de Jesús tenía un propósito: mostrar que donde Jesús
              está, hay vida,fe y restauración.
            </p>
            <p>
              Tiempos de recuperar la esperanza días de creer, de confiar el
              mismo poder que obró ayer continúa vigente hoy. Jesús sanó
              enfermos,levantó al caído,devolvió esperanza y hoy su amor sigue
              transformando corazones.
            </p>
            <p>
              Donde la fe vence el temor , donde Dios sigue obrando con poder en
              la vida de quienes le creen
            </p>
            <p className="text-primary font-medium">
              ¡Para Dios no hay nada imposible!.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
