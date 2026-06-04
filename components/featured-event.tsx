"use client";

import Image from "next/image";
import { Button } from "@/components/ui/button";

export function FeaturedEvent() {
  const whatsappNumber = "616938229";
  const whatsappMessage = encodeURIComponent(
    "Hola, me gustaría obtener información sobre el evento Día de Milagros"
  );
  const whatsappLink = `https://wa.me/34${whatsappNumber}?text=${whatsappMessage}`;

  return (
    <section className="py-16 bg-brand-cream">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative rounded-2xl overflow-hidden shadow-2xl bg-[#1a2332]">
            {/* Event Image */}
            <Image
              src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso1-hN6fWklMNgbJFEluDQ9n5gqLhWo2WL.jpg"
              alt="En Honor al Espíritu Santo - Evento Día de Milagros"
              width={800}
              height={400}
              className="w-full h-auto"
            />
            
            {/* Info bar - 3 sections horizontal with separators */}
            <div className="bg-[#1a2332] px-4 py-4 md:px-6">
              <div className="flex flex-col md:flex-row items-center justify-between gap-4 md:gap-0">
                {/* Section 1: Location */}
                <div className="text-center md:text-left md:flex-1">
                  <p className="text-white text-xs md:text-sm">Cine Aribau 8,</p>
                  <p className="text-white text-xs md:text-sm">Barcelona, España.</p>
                </div>
                
                {/* Section 2: Date and Time with separator */}
                <div className="md:border-l md:border-white/30 md:pl-6 md:flex-1 text-center">
                  <p className="text-white text-xs md:text-sm">Sábado 1 de agosto</p>
                  <p className="text-white font-bold text-sm md:text-base">17:00 horas</p>
                </div>
                
                {/* Section 3: Button */}
                <div className="md:flex-1 flex flex-col items-center md:items-end">
                  <Button
                    variant="outline"
                    size="sm"
                    className="border-primary bg-transparent text-primary hover:bg-primary hover:text-white text-[10px] md:text-xs px-4 md:px-6 py-1 h-auto rounded-sm font-bold tracking-wide"
                    nativeButton={false}
                    render={<a href="#eventos">ENTRADA GRATUITA</a>}
                  />
                  <a
                    href={whatsappLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-[8px] md:text-[10px] text-white/50 hover:text-primary transition-colors mt-1"
                  >
                    Información al WhatsApp {whatsappNumber}
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
