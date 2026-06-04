"use client";

import Image from "next/image";

const socialLinks = [
  {
    label: "Facebook",
    href: "https://facebook.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none"/>
        <path d="M15.5 8.5h-2c-.5 0-1 .5-1 1v2h3l-.5 3h-2.5v6h-3v-6h-2v-3h2v-2.5c0-2 1.5-3.5 3.5-3.5h2.5v3z" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://instagram.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none"/>
        <rect x="6" y="6" width="12" height="12" rx="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" fill="none"/>
        <circle cx="16" cy="8" r="1" fill="currentColor"/>
      </svg>
    ),
  },
  {
    label: "Youtube",
    href: "https://youtube.com",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
        <circle cx="12" cy="12" r="11" stroke="currentColor" strokeWidth="1" fill="none"/>
        <path d="M10 8.5v7l6-3.5-6-3.5z" fill="currentColor"/>
      </svg>
    ),
  },
];

export function Footer() {
  return (
    <footer className="bg-[#1a2332] py-6 border-t border-white/10">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Logo */}
          <Image
            src="https://hebbkx1anhila5yf.public.blob.vercel-storage.com/LOGOS_BLANCO-9B5F954DZY4tgONN2PqQwW6V9a2cKi.png"
            alt="Día de Milagros"
            width={140}
            height={40}
            className="h-10 w-auto"
          />

          {/* Social Links */}
          <div className="flex items-center gap-6">
            <span className="text-white/60 text-sm">Síguenos:</span>
            {socialLinks.map((social) => (
              <a
                key={social.label}
                href={social.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-white/70 hover:text-primary transition-colors text-sm"
                aria-label={social.label}
              >
                {social.icon}
                <span>{social.label}</span>
              </a>
            ))}
          </div>
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
