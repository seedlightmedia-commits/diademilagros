"use client";

import Image from "next/image";

export function Footer() {
  return (
    <footer className="bg-[#1a2332] py-6 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-center gap-6">
          {/* Logo centered */}
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOS_BLANCO-9B5F954DZY4tgONN2PqQwW6V9a2cKi.png"
            alt="Día de Milagros"
            width={140}
            height={40}
            className="h-10 w-auto"
          />
        </div>

        {/* Copyright */}
        <div className="mt-6 text-center">
          <p className="text-white/30 text-xs">
            © Todos los derechos reservados.
          </p>
        </div>
      </div>
    </footer>
  );
}
