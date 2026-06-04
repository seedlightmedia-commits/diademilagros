"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
        isScrolled
          ? "bg-brand-dark/95 backdrop-blur-md py-3 shadow-lg"
          : "bg-white/95 py-4 shadow-sm"
      }`}
    >
      <div className="container mx-auto px-4 flex justify-center">
        <Image
          src={isScrolled ? "/LOGOS_BLANCO.png" : "/LOGOS_PRINCIPAL.png"}
          alt="Día de Milagros"
          width={200}
          height={55}
          className="h-12 w-auto"
          priority
        />
      </div>
    </header>
  );
}
