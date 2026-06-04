"use client";

import { Button } from "@/components/ui/button";

export function HeroSection() {
  return (
    <section className="relative h-[80vh] min-h-[520px] flex items-center justify-center overflow-hidden bg-white">
      {/* Video Background */}
      <div className="absolute inset-x-0 top-20 bottom-0">
        <video
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Alabanza1-ptl9eYAx6QoTnkvXQyEReUTqTmpnWs.mp4"
            type="video/mp4"
          />
        </video>
        <div className="absolute inset-0 bg-black/50" />
      </div>

      {/* Content */}
      <div className="relative z-10 container mx-auto px-4 text-center pt-16">
        <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-white mb-6 tracking-tight font-serif">
          <span className="block">SANIDAD Y MILAGROS</span>
        </h1>
        <Button
          size="lg"
          className="bg-primary hover:bg-primary/90 text-white px-10 py-5 text-base font-semibold rounded-md"
          nativeButton={false}
          render={<a href="#eventos">EVENTOS</a>}
        />
      </div>
    </section>
  );
}
