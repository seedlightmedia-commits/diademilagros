"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";
import Image from "next/image";
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
    image: "https://vercel-storage.com",
    note: "Este evento es para toda la familia. Y es totalmente gratis.",
    isFree: true,
    price: 0,
  },
  {
    id: 2,
    title: "CINE PARA NIÑOS",
    date: "1 Agosto 2026",
    time: "17H - 21H",
    location: "Para quienes se encuentren en la cuidad de Barcelona", // Mantiene tu texto exacto
    image: "https://vercel-storage.com",
    note: "Este evento es para toda la familia. Niños desde 2 años.",
    isFree: false,
    price: 8,
  },
];

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
        // ENVIÓ REAL DIRECTO A TU WEBHOOK DE GOOGLE SHEETS
        await fetch("https://script.google.com/macros/s/AKfycbwBlQLzM5L4McT2tB43DHvf052wGRcST5In-vwKumL1yIBZ03zlRDISiD8SGQ9UeN87yA/exec", {
          method: "POST",
          mode: "no-cors", // Evita el bloqueo de seguridad CORS
          headers: { 
            "Content-Type": "text/plain;charset=utf-8" // Formato compatible con Google
          },
          body: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone
          }),
        });

        setRegistrationComplete(true);
      } else {
        // Paid event - redirect to TPV Virtual payment gateway
        const totalAmount = (selectedEvent?.price || 0) * formData.tickets;
        
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
                <h3 className="text-xl md:text-3xl font-extrabold text-[#ff7542] mb-3 leading-tight">
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
                  className="w-full bg-[#ff7542] hover:bg-[#ff7542]/90 text-white text-sm md:text-base py-3 px-5 rounded-xl transition-colors duration-200"
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
            <DialogTitle className="text-[#ff7542] font-bold text-center">
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
              <Button className="mt-4 bg-[#ff7542] hover:bg-[#ff7542]/90" onClick={closeDialog}>
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff7542]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Celular</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff7542]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff7542]"
                />
              </div>
              {!selectedEvent?.isFree && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Entradas</label>
                  <input
                    type="number"
                    name="tickets"
                    min="1"
                    value={formData.tickets}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#ff7542]"
                  />
                  <p className="text-right text-sm font-semibold text-gray-700 mt-2">Total: {totalPrice}€</p>
                </div>
              )}
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ff7542] hover:bg-[#ff7542]/90 text-white font-bold py-2 rounded-lg transition-colors"
              >
                {isSubmitting ? "Registrando..." : selectedEvent?.isFree ? "Confirmar Registro Gratis" : "Proceder al Pago"}
              </Button>
                        </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}

