"use client";

import Image from "next/image";

const topRowImages = [
  {
    src: "Recurso_91.jpg",
    alt: "Galería 1",
    width: 170,
  },
  {
    src: "Cine2.jpg",
    alt: "Galería 2",
    width: 180,
  },
  {
    src: "Cine6.png",
    alt: "Galería 3",
    width: 200,
  },
  {
    src: "Cine4.png",
    alt: "Galería 4",
    width: 180,
  },
  {
    src: "Cine5.jpg",
    alt: "Galería 5",
    width: 160,
  },
  {
    src: "Cine1.jpg",
    alt: "Galería 6",
    width: 180,
  },
  {
    src: "Cine7.jpg",
    alt: "Galería 7",
    width: 140,
  },
];

const bottomRowImages = [
  {
    src: "Iglesia1.jpg",
    alt: "Galería 8",
    width: 200,
  },
  {
    src: "Iglesia3.png",
    alt: "Galería 9",
    width: 180,
  },
  {
    src: "Iglesia2.jpg",
    alt: "Galería 10",
    width: 160,
  },
  {
    src: "Iglesia4.jpg",
    alt: "Galería 11",
    width: 180,
  },
  {
    src: "Iglesia6.jpg",
    alt: "Galería 12",
    width: 200,
  },
];

export function MovingGallery() {
  return (
    <section className="w-full py-8 bg-white overflow-hidden">
      
      {/* Fila Superior: Mantiene tu animación nativa a la izquierda */}
      <div className="w-full overflow-hidden mb-3">
        {/* Removido el centrado artificial para que empiece cubriendo toda la pantalla */}
        <div className="w-full flex">
          <div className="flex gap-3 animate-slide-left whitespace-nowrap">
            {/* Bloque 1 */}
            {topRowImages.map((img, index) => (
              <div
                key={`top-1-${index}`}
                className="relative h-32 md:h-40 flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: img.width * 1.8 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {/* Bloque 2 (Repetición continua para no dejar huecos) */}
            {topRowImages.map((img, index) => (
              <div
                key={`top-2-${index}`}
                className="relative h-32 md:h-40 flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: img.width * 1.8 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Fila Inferior: Mantiene tu animación nativa a la derecha */}
      <div className="w-full overflow-hidden">
        {/* Removido el centrado artificial para que empiece cubriendo toda la pantalla */}
        <div className="w-full flex">
          <div className="flex gap-3 animate-slide-right whitespace-nowrap">
            {/* Bloque 1 */}
            {bottomRowImages.map((img, index) => (
              <div
                key={`bottom-1-${index}`}
                className="relative h-32 md:h-40 flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: img.width * 1.8 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
            {/* Bloque 2 (Repetición continua para no dejar huecos) */}
            {bottomRowImages.map((img, index) => (
              <div
                key={`bottom-2-${index}`}
                className="relative h-32 md:h-40 flex-shrink-0 rounded-lg overflow-hidden"
                style={{ width: img.width * 1.8 }}
              >
                <Image
                  src={img.src}
                  alt={img.alt}
                  fill
                  className="object-cover"
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
