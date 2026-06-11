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

const upcomingEvents = [
  {
    id: 1,
    title: "DÍA DE MILAGROS",
    date: "1 Agosto 2026",
    time: "17h - 21H",
    location: "Para quienes se encuentren en la cuidad de Barcelona",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso2-L79daDs96bLxTYnUfYRMqIv59CTGaB.jpg",
    note: "Este evento es para toda la familia. Y es totalmente gratis.",
    isFree: true,
    price: 0,
  },
  {
    id: 2,
    title: "CINE PARA NIÑOS",
    date: "1 Agosto 2026",
    time: "17H - 21H",
    location: "Para quienes se encuentren en la cuidad de Barcelona",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso3-R2JDtJacHbQ8U6fet0xIITCAMhjAAt.jpg",
    note: "Este evento es para toda la familia. Niños desde 2 años.",
    isFree: false,
    price: 8,
  },
];

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
        // Envió a la ruta proxy server-side para evitar CORS y ocultar el webhook del cliente
        const response = await fetch('/api/register', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            eventId: selectedEvent.id,
            eventName: selectedEvent.title,
            ...formData,
            status: 'registered',
            timestamp: new Date().toISOString(),
          }),
        });

        if (!response.ok) {
          const errorBody = await response.json().catch(() => null);
          throw new Error(errorBody?.error || 'Error registrando el evento');
        }

        setRegistrationComplete(true);
      } else {
        // Evento de pago (Simulación)
        setRegistrationComplete(true);
      }
    } catch (error) {
      console.error('Error en el registro:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedEvent(null);
    setFormData({ name: "", phone: "", email: "", tickets: 1 });
    setRegistrationComplete(false);
  };

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
            <div key={event.id} className="bg-white rounded-xl overflow-hidden shadow-md border border-gray-100">
              <div className="relative aspect-square">
                <Image src={event.image} alt={event.title} fill className="object-cover" />
              </div>
              <div className="p-4">
                <h3 className="text-xl md:text-3xl font-extrabold text-[#ff7542] mb-3 leading-tight">{event.title}</h3>
                <div className="text-sm md:text-base text-gray-600 mb-3 space-y-0.5">
                  <p className="font-semibold">{event.date}</p>
                  <p>{event.time}</p>
                </div>
                <p className="text-sm md:text-base text-gray-600 mb-3">{event.location}</p>
                <p className="text-sm md:text-base text-gray-500 mb-4 p-3 bg-gray-50 rounded">{event.note}</p>
                <Button
                  size="sm"
                  className="w-full bg-[#ff7542] hover:bg-[#ff7542]/90 text-white text-sm md:text-base py-3 px-5 rounded-xl"
                  onClick={() => setSelectedEvent(event)}
                >
                  Regístrame aquí
                </Button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Modal */}
      <Dialog open={!!selectedEvent} onOpenChange={closeDialog}>
        <DialogContent className="sm:max-w-md bg-white p-6">
          <DialogHeader>
            <DialogTitle className="text-[#ff7542] font-bold text-center text-xl">
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
              <p className="text-gray-600 mb-4">
                Tu entrada ha sido registrada exitosamente. Recibirás tu código QR por email.
              </p>
              <Button className="w-full bg-[#ff7542] hover:bg-[#ff7542]/90 text-white" onClick={closeDialog}>
                Cerrar
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Completo</label>
                <input
                  type="text"
                  name="name"
                  required
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7542]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Número de Celular</label>
                <input
                  type="tel"
                  name="phone"
                  required
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7542]"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Correo Electrónico</label>
                <input
                  type="email"
                  name="email"
                  required
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#ff7542]"
                />
              </div>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#ff7542] hover:bg-[#ff7542]/90 text-white font-bold py-2 rounded-lg"
              >
                {isSubmitting ? "Registrando..." : "Confirmar Registro Gratis"}
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
