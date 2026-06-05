"use client";

import { useEffect, useState } from "react";
import Image from "next/image";

// Thick line-art raised hands icon - for Poder de Dios
function RaisedHandsIcon() {
  return (
    <div className="relative w-16 h-16 md:w-20 md:h-20 flex items-center justify-center">
      <Image
        src="/manos.png"
        alt="Manos levantadas Poder de Dios"
        width={80}
        height={80}
        // Invertimos el color del trazo a blanco si tu fondo es oscuro, o lo dejas limpio si ya es negro
        className="object-contain"
        priority
      />
    </div>
  );
}


// Thick line-art Bible with cross icon - for Palabra Viva
function BibleIcon() {
  return (
    <svg className="w-16 h-16 md:w-20 md:h-20" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <rect x="15" y="10" width="50" height="60" rx="2" />
      <path d="M15 10 Q10 10 10 15 L10 65 Q10 70 15 70" />
      <path d="M40 22 L40 50" />
      <path d="M30 32 L50 32" />
      <path d="M50 70 L50 78 L54 74 L58 78 L58 70" />
    </svg>
  );
}

// Thick line-art cross icon - for Salvación
function CrossIcon() {
  return (
    <svg className="w-16 h-16 md:w-20 md:h-20" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 8 L40 72" />
      <path d="M20 24 L60 24" />
      <path d="M30 72 L50 72" />
    </svg>
  );
}

// Thick line-art flame/church icon - for Avivamiento
function FlameIcon() {
  return (
    <svg className="w-16 h-16 md:w-20 md:h-20" viewBox="0 0 80 80" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <path d="M40 5 C40 25 20 35 20 52 C20 65 28 75 40 75 C52 75 60 65 60 52 C60 35 40 25 40 5 Z" />
      <path d="M40 35 C40 45 32 50 32 58 C32 65 35 70 40 70 C45 70 48 65 48 58 C48 50 40 45 40 35 Z" />
    </svg>
  );
}

const essenceItems = [
  {
    id: 1,
    title: "PODER DE DIOS",
    description: "Sanidades y milagros como evidencia de su poder",
    icon: <RaisedHandsIcon />,
    image: "Poder.jpg",
    cardPosition: "right", 
  },
  {
    id: 2,
    title: "PALABRA VIVA",
    description: "Mensaje de fe y esperanza",
    icon: <BibleIcon />,
    image: "Palabra.jpg",
    cardPosition: "left", 
  },
  {
    id: 3,
    title: "SALVACIÓN",
    description: "Oportunidad para creer en Jesús.",
    icon: <CrossIcon />,
    image: "/Salvacion.png",
    cardPosition: "right", 
  },
  {
    id: 4,
    title: "AVIVAMIENTO",
    description: "Renovación del corazón",
    icon: <FlameIcon />,
    image: "/Avivamiento.png",
    cardPosition: "left", 
  },
];

const gradients = [
  "from-[#ffc972] via-[#ffc972] to-[#ff9b00]",
  "from-[#ffc972] via-[#ffc972] to-[#ff9b00]",
  "from-[#ffc972] via-[#ffc972] to-[#ff9b00]",
  "from-[#ffc972] via-[#ffc972] to-[#ff9b00]",
];

function EssenceCard({ item, index }: { item: typeof essenceItems[0]; index: number }) {
  const isCardLeft = item.cardPosition === "left";
  
  return (
    <div className="w-full h-full bg-white rounded-2xl overflow-hidden shadow-2xl border border-gray-100/50">
      <div className={`flex flex-col md:flex-row h-full ${isCardLeft ? "" : "md:flex-row-reverse"}`}>
        {/* Image Side */}
        <div className="w-full md:w-1/2 h-[200px] md:h-full relative">
          <Image
            src={item.image}
            alt={item.title}
            fill
            className="object-cover"
          />
        </div>
        
        {/* Yellow Card Side */}
        <div className={`w-full md:w-1/2 h-auto md:h-full relative bg-gradient-to-br ${gradients[index]} flex items-center`}>
          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <svg 
              className={`absolute ${isCardLeft ? 'right-0' : 'left-0'} top-0 h-full w-2/3 text-[#d4832f]/20`}
              viewBox="0 0 200 400" 
              preserveAspectRatio="none"
              style={{ transform: isCardLeft ? 'none' : 'scaleX(-1)' }}
            >
              <path 
                d="M100,0 Q150,100 100,200 Q50,300 100,400 L200,400 L200,0 Z" 
                fill="currentColor"
              />
            </svg>
          </div>
          
          <div className="relative z-10 p-6 md:p-10 lg:p-12">
            <div className="text-gray-800 mb-4 scale-90 md:scale-100 origin-left">
              {item.icon}
            </div>
            <h3 className="text-xl md:text-2xl lg:text-3xl font-bold text-gray-900 tracking-wide mb-3">
              {item.title}
            </h3>
            <p className="text-gray-800 text-sm md:text-base leading-relaxed">
              {item.description}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

export function EssenceSection() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  if (isMobile) {
    return (
      <section id="esencia" className="bg-white px-4 py-12">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-light text-gray-400 tracking-[0.15em] uppercase border-b border-gray-300 inline-block pb-2">
              NUESTRA ESENCIA
            </h2>
            <p className="text-gray-600 mt-3 text-sm">
              Cuatro pilares fundamentales de nuestro ministerio
            </p>
          </div>

          <div className="flex flex-col gap-6">
            {essenceItems.map((item, index) => (
              <div key={item.id} className="min-h-[420px] h-[450px]">
                <EssenceCard item={item} index={index} />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // DESKTOP: Estructura nativa en cascada idéntica a Noches de Gloria
  return (
    <section id="esencia" className="bg-white w-full pb-24">
      {/* El título NO interfiere. Se desplaza hacia arriba con el scroll normal de la web */}
      <div className="text-center pt-20 pb-16 px-4 max-w-7xl mx-auto">
        <h2 className="text-3xl font-light text-gray-400 tracking-[0.15em] uppercase border-b border-gray-300 inline-block pb-2">
          NUESTRA ESENCIA
        </h2>
        <p className="text-gray-600 mt-4 text-base">
          Cuatro pilares fundamentales de nuestro ministerio
        </p>
      </div>

      {/* Contenedor central con los márgenes perfectos a los lados del pantallazo */}
      <div className="max-w-7xl mx-auto px-12 md:px-24 relative flex flex-col gap-0">
        {essenceItems.map((item, index) => (
          <div
            key={item.id}
            // Cada tarjeta se vuelve sticky por sí misma. 
            // Inicia el despliegue exactamente cuando llega a la posición superior, sin importar el título.
            className="sticky w-full h-[60vh] max-h-[520px] flex items-center justify-center mb-12 last:mb-0"
            style={{
              // top controla el punto de frenado en pantalla y permite que se encajen una sobre otra
              top: `calc(15vh + ${index * 15}px)`,
            }}
          >
            <div className="w-full h-full">
              <EssenceCard item={item} index={index} />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
