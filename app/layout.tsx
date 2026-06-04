import { Analytics } from "@vercel/analytics/next";
import type { Metadata, Viewport } from "next";
import { Inter, Abril_Fatface, Poppins, Montserrat } from "next/font/google";
import "./globals.css";

// Poppins is similar to Nexa - geometric sans-serif
const poppins = Poppins({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
  variable: "--font-poppins",
});

const montserrat = Montserrat({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
  variable: "--font-montserrat",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
});

const abrilFatface = Abril_Fatface({
  subsets: ["latin"],
  weight: "400",
  variable: "--font-abril",
});

export const metadata: Metadata = {
  title: "Día de Milagros | Sanidad y Milagros en Barcelona",
  description:
    "Cada milagro de Jesús tenía un propósito: mostrar que donde Jesús está, hay vida, fe y restauración. Eventos de sanidad y milagros en Barcelona, España.",
  keywords: [
    "Día de Milagros",
    "sanidad",
    "milagros",
    "Barcelona",
    "iglesia",
    "fe",
    "restauración",
    "eventos cristianos",
  ],
  generator: "v0.app",
  icons: {
    icon: [
      {
        url: "/icon-light-32x32.png",
        media: "(prefers-color-scheme: light)",
      },
      {
        url: "/icon-dark-32x32.png",
        media: "(prefers-color-scheme: dark)",
      },
      {
        url: "/icon1.png",
        type: "image/png",
      },
    ],
    apple: "/apple-icon.png",
  },
  openGraph: {
    title: "Día de Milagros | Sanidad y Milagros en Barcelona",
    description:
      "Cada milagro de Jesús tenía un propósito: mostrar que donde Jesús está, hay vida, fe y restauración.",
    type: "website",
    locale: "es_ES",
  },
};

export const viewport: Viewport = {
  themeColor: "#E8913A",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    /* Agregamos las variables tipográficas en la etiqueta html para que Next.js las active en el cliente */
    <html lang="es" suppressHydrationWarning className={`${abrilFatface.variable} ${montserrat.variable} ${poppins.variable} bg-background`}>
      <body
        className={`${poppins.variable} ${inter.variable} ${abrilFatface.variable} ${montserrat.variable} font-sans antialiased`}
      >
        {children}
        {process.env.NODE_ENV === "production" && <Analytics />}
      </body>
    </html>
  );
}
