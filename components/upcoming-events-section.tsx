"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
import QRCode from "qrcode";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogHeader,
} from "@/components/ui/dialog";
import { X } from "lucide-react";

const upcomingEvents = [
  {
    id: 1,
    title: "DÍA DE MILAGROS",
    date: "1 Agosto 2026",
    time: "17h - 21H",
    location: "Para quienes se encuentren en la cuidad de Barcelona", // Mantiene tu texto exacto
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso2-L79daDs96bLxTYnUfYRMqIv59CTGaB.jpg",
    note: "Este evento es para personas mayores de edad. Y es totalmente gratis.",
    isFree: true,
    price: 0,
  },
  {
    id: 2,
    title: "CINE PARA NIÑOS",
    date: "1 Agosto 2026",
    time: "17H - 21H",
    location: "Para quienes se encuentren en la cuidad de Barcelona", // Mantiene tu texto exacto
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso3-R2JDtJacHbQ8U6fet0xIITCAMhjAAt.jpg",
    note: "Este evento es para toda la familia. Niños desde 5 años.",
    isFree: false,
    price: 8,
  },
];

// `EventsSection` removed to avoid duplicate components — use `UpcomingEventsSection` below.

// Google Sheets API endpoint placeholder
const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxTXubRFXBHszMzZwHk_mb6EAIbwBZxlROtD9-uoFOVCGKiSi5YL3BTZ9OnrtCPrt7NWg/exec";

// TPV Virtual API placeholders
const TPV_VIRTUAL_CONFIG = {
  merchantId: "YOUR_MERCHANT_ID",
  terminalId: "YOUR_TERMINAL_ID",
  secretKey: "YOUR_SECRET_KEY",
  environment: "sandbox", // or "production"
};

interface FormData {
  name: string;
  phone: string;
  email: string;
  tickets: number;
}

export function UpcomingEventsSection() {
  const [selectedEvent, setSelectedEvent] = useState<typeof upcomingEvents[0] | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    tickets: 1,
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === "tickets" ? parseInt(value) || 1 : value,
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedEvent?.isFree) {
  // Generar código único
const uniqueCode =
  "DM-" +
  Date.now() +
  "-" +
  Math.floor(Math.random() * 100000);

// Generar imagen QR en Base64
const qrImage = await QRCode.toDataURL(uniqueCode);

const response = await fetch(GOOGLE_SHEETS_WEBHOOK_URL, {
  method: "POST",
  body: JSON.stringify({
    eventName: selectedEvent.title,
    name: formData.name,
    phone: formData.phone,
    email: formData.email,
    uniqueCode,
    qrImage,
  }),
});

const result = await response.json();

console.log("Apps Script:", result);

if (result.status !== "success") {
  throw new Error(result.message || "Error al registrar");
}

  setRegistrationComplete(true);
      } else {
        // Paid event - redirect to TPV Virtual payment gateway
        const totalAmount = (selectedEvent?.price || 0) * formData.tickets;
        
        // TPV Virtual integration placeholder
        // In production, this would create a payment session and redirect
        console.log("[v0] Would initiate TPV Virtual payment:", {
          amount: totalAmount,
          currency: "EUR",
          merchantId: TPV_VIRTUAL_CONFIG.merchantId,
          terminalId: TPV_VIRTUAL_CONFIG.terminalId,
          orderId: `ORDER_${Date.now()}`,
          description: `${selectedEvent?.title} - ${formData.tickets} entrada(s)`,
          customerData: formData,
        });

        // Simulate successful payment for demo
        setRegistrationComplete(true);
      }
    } catch (error) {
      console.error("Registration error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedEvent(null);
    setFormData({ name: "", phone: "", email: "", tickets: 1 });
    setRegistrationComplete(false);
  };

  const totalPrice = selectedEvent ? selectedEvent.price * formData.tickets : 0;

  return (
    <section id="eventos" className="py-12 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h2 className="text-lg md:text-xl font-bold text-brand-dark">
            ADQUIERE TUS ENTRADAS A NUEVOS EVENTOS
          </h2>
        </div>

        <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
          {upcomingEvents.map((event) => (
            <div
              key={event.id}
              className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100"
            >
              <div className="relative aspect-square">
                <Image
                  src={event.image}
                  alt={event.title}
                  fill
                  className="object-cover"
                />
              </div>
              <div className="p-4">
                <h3 className="text-xl md:text-3xl font-extrabold text-primary mb-3 leading-tight">
                  {event.title}
                </h3>

                <div className="text-sm md:text-base text-gray-600 mb-3 space-y-0.5">
                  <p className="font-semibold">{event.date}</p>
                  <p>{event.time}</p>
                </div>
                
                <p className="text-sm md:text-base text-gray-600 mb-3">
                  {event.location}
                </p>

                <p className="text-sm md:text-base text-gray-500 mb-4 p-3 bg-gray-50 rounded">
                  {event.note}
                </p>

                <Button
                  size="sm"
                  className="w-full bg-primary hover:bg-primary/90 text-white text-sm md:text-base py-3 px-5 rounded-xl transition-colors duration-200"
                  onClick={() => setSelectedEvent(event)}
                >
                  Regístrame aquí
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Registration Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md bg-white">
          <DialogHeader>
            <DialogTitle className="text-primary font-bold text-center">
              {registrationComplete ? "¡Registro Exitoso!" : `Registro - ${selectedEvent?.title}`}
            </DialogTitle>
          </DialogHeader>

          {registrationComplete ? (
            <div className="text-center py-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <p className="text-gray-600 mb-2">
                {selectedEvent?.isFree
                  ? "Tu entrada ha sido registrada exitosamente."
                  : "Tu pago ha sido procesado. Recibirás tu código QR por email."}
              </p>
              {selectedEvent?.isFree && formData.email && (
                <p className="text-xs text-gray-500">
                  Se ha enviado un código QR a {formData.email}
                </p>
              )}
              <Button className="mt-4 bg-primary hover:bg-primary/90" onClick={closeDialog}>
                Cerrar
              </Button>
            </div>
          ) : (
                        <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre completo *
                </label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>


              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono *
                </label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="+34 612 345 678"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email {selectedEvent?.isFree ? "(opcional)" : "*"}
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  placeholder="tu@email.com"
                />
              </div>

              {!selectedEvent?.isFree && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Número de entradas *
                    </label>
                    <input
                      type="number"
                      name="tickets"
                      value={formData.tickets}
                      onChange={handleInputChange}
                      min={1}
                      max={10}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                    />
                  </div>

                  <div className="bg-gray-50 p-3 rounded-md">
                    <div className="flex justify-between text-sm">
                      <span>Precio por entrada:</span>
                      <span>{selectedEvent?.price}€</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span>Cantidad:</span>
                      <span>{formData.tickets}</span>
                    </div>
                    <div className="flex justify-between font-bold text-primary mt-2 pt-2 border-t">
                      <span>Total:</span>
                      <span>{totalPrice}€</span>
                    </div>
                  </div>
                </>
              )}

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 text-white"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Procesando..."
                  : selectedEvent?.isFree
                  ? "Registrarme"
                  : `Pagar ${totalPrice}€`}
              </Button>

              {!selectedEvent?.isFree && (
                <p className="text-[10px] text-gray-400 text-center">
                  Pago seguro procesado por TPV Virtual
                </p>
              )}
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
