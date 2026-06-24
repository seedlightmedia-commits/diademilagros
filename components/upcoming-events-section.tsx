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
    location: " Cine Aribau, Calle Aribau 8, Barcelon, Metro L1, L2 Universitat",
    image: "Recurso2.jpg",
    note: "Este evento es para toda la familia. Y es totalmente gratis.",
    isFree: true,
    price: 0,
  },
  {
    id: 2,
    title: "CINE PARA NIÑOS",
    date: "1 Agosto 2026",
    time: "17H - 21H",
    location: "Cine Aribau, Calle Aribau 8,  Barcelona Metro L1 L2 Universitat",
    image: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/Recurso3-R2JDtJacHbQ8U6fet0xIITCAMhjAAt.jpg",
    note: "Edades: 1 año (si camina) hasta 10 años. Película: a confirmar. Precio: a confirmar",
    isFree: false,
    price: 8,
  },
];

const GOOGLE_SHEETS_WEBHOOK_URL = "https://script.google.com/macros/s/AKfycbxzAWwyBMsyOfKwaC1GFZnAy3woPg_3sXoQjM8aJKb9IhYsWeiq2ArUjT4ayiQGGIVMoQ/exec";

const TPV_VIRTUAL_CONFIG = {
  merchantId: "YOUR_MERCHANT_ID",
  terminalId: "YOUR_TERMINAL_ID",
  secretKey: "YOUR_SECRET_KEY",
  environment: "sandbox",
};

interface FormData {
  name: string;
  phone: string;
  email: string;
  tickets: number;
  // Día de Milagros
  age?: string;
  nationality?: string;
  invitedBy?: string;
  howDidYouMeetUs?: string;
  attendanceGroup?: string;
  // Cine para Niños
  childAge?: string;
  guardianName?: string;
  guardianPhone?: string;
  childNames?: string[];
}

export function UpcomingEventsSection() {
  const [selectedEvent, setSelectedEvent] = useState<typeof upcomingEvents[0] | null>(null);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    phone: "",
    email: "",
    tickets: 1,
    age: "",
    nationality: "",
    invitedBy: "",
    howDidYouMeetUs: "",
    attendanceGroup: "",
    childAge: "",
    guardianName: "",
    guardianPhone: "",
    childNames: [],
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [registrationComplete, setRegistrationComplete] = useState(false);

  const handleInputChange = (e: ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;

    if (name === "tickets") {
      const ticketCount = parseInt(value) || 1;
      const needsChildNames = ticketCount >= 3;
      setFormData((prev) => ({
        ...prev,
        tickets: ticketCount,
        childNames: needsChildNames
          ? Array.from({ length: ticketCount }, (_, i) => prev.childNames?.[i] ?? "")
          : [],
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [name]: value,
      }));
    }
  };

  const handleChildNameChange = (index: number, value: string) => {
    setFormData((prev) => {
      const updated = [...(prev.childNames ?? [])];
      updated[index] = value;
      return { ...prev, childNames: updated };
    });
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      if (selectedEvent?.isFree) {
        const uniqueCode =
          "DM-" +
          Date.now() +
          "-" +
          Math.floor(Math.random() * 100000);

        const qrImage = await QRCode.toDataURL(uniqueCode);

        const response = await fetch("/api/register", {
          method: "POST",
          body: JSON.stringify({
            eventName: selectedEvent.title,
            name: formData.name,
            phone: formData.phone,
            email: formData.email,
            uniqueCode,
            qrImage,
            age: formData.age,
            nationality: formData.nationality,
            invitedBy: formData.invitedBy,
            howDidYouMeetUs: formData.howDidYouMeetUs,
            attendanceGroup: formData.attendanceGroup,
          }),
        });

        const result = await response.json();
        console.log("Apps Script:", result);

        if (result.status !== "success") {
          throw new Error(result.message || "Error al registrar");
        }

        setRegistrationComplete(true);
      } else {
        const totalAmount = (selectedEvent?.price || 0) * formData.tickets;

        const response = await fetch("/api/pay-tpv", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            eventName: selectedEvent?.title,
            amount: totalAmount,
            customerData: formData,
          }),
        });

        const paymentData = await response.json();
        console.log(paymentData);
        console.log(response.status);

        if (!response.ok) {
          throw new Error(paymentData.error || "Error al procesar la orden");
        }

        const form = document.createElement("form");
        form.method = "POST";
        form.action = paymentData.url;

        const paramsInput = document.createElement("input");
        paramsInput.type = "hidden";
        paramsInput.name = "Ds_MerchantParameters";
        paramsInput.value = paymentData.params;
        form.appendChild(paramsInput);

        const signatureInput = document.createElement("input");
        signatureInput.type = "hidden";
        signatureInput.name = "Ds_Signature";
        signatureInput.value = paymentData.signature;
        form.appendChild(signatureInput);

        const signatureVersionInput = document.createElement("input");
        signatureVersionInput.type = "hidden";
        signatureVersionInput.name = "Ds_SignatureVersion";
        signatureVersionInput.value = paymentData.signatureVersion;
        form.appendChild(signatureVersionInput);

        document.body.appendChild(form);
        console.log(paymentData.url);
        console.log(paymentData.params);
        console.log(paymentData.signature);
        console.log("================================");
        console.log("URL:", paymentData.url);
        console.log("SignatureVersion:", paymentData.signatureVersion);
        console.log("MerchantParameters:", paymentData.params);
        console.log("Signature:", paymentData.signature);
        console.log("================================");

        if (
          !paymentData.url ||
          !paymentData.params ||
          !paymentData.signature ||
          !paymentData.signatureVersion
        ) {
          throw new Error("La API /api/pay-tpv no devolvió todos los datos necesarios.");
        }
        document.body.appendChild(form);
        form.submit();
      }
    } catch (error) {
      console.error("Registration error:", error);
      alert("No se pudo iniciar el proceso de pago. Por favor, inténtelo de nuevo.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const closeDialog = () => {
    setSelectedEvent(null);
    setFormData({
      name: "",
      phone: "",
      email: "",
      tickets: 1,
      age: "",
      nationality: "",
      invitedBy: "",
      howDidYouMeetUs: "",
      attendanceGroup: "",
      childAge: "",
      guardianName: "",
      guardianPhone: "",
      childNames: [],
    });
    setRegistrationComplete(false);
  };

  const totalPrice = selectedEvent ? selectedEvent.price * formData.tickets : 0;
  const showChildNames = selectedEvent?.id === 2 && formData.tickets >= 1;

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
        <DialogContent className="sm:max-w-md bg-white p-0 gap-0 max-h-[90vh] overflow-hidden flex flex-col">

          {/* Header fijo */}
          <DialogHeader className="px-6 pt-6 pb-2 shrink-0">
            <DialogTitle className="text-primary font-bold text-center">
              {registrationComplete ? "¡Registro Exitoso!" : `Registro - ${selectedEvent?.title}`}
            </DialogTitle>
          </DialogHeader>

          {/* Cuerpo con scroll */}
          <div className="overflow-y-auto flex-1 px-6 pb-6" style={{ overflowY: "scroll" }}>

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
              <form onSubmit={handleSubmit} className="space-y-4 pt-2">

                {/* ── Campos comunes ── */}
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
                    Email *
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

                {/* ── Campos exclusivos: Día de Milagros ── */}
                {selectedEvent?.id === 1 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Edad *
                      </label>
                      <input
                        type="number"
                        name="age"
                        value={formData.age}
                        onChange={handleInputChange}
                        min={1}
                        max={120}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="Ej: 35"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nacionalidad *
                      </label>
                      <input
                        type="text"
                        name="nationality"
                        value={formData.nationality}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="Ej: Española, Colombiana..."
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre de quien te invitó *
                      </label>
                      <input
                        type="text"
                        name="invitedBy"
                        value={formData.invitedBy}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Cómo nos conociste? *
                      </label>
                      <select
                        name="howDidYouMeetUs"
                        value={formData.howDidYouMeetUs}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-white"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="Redes sociales">Redes sociales</option>
                        <option value="Un amigo">Un amigo</option>
                        <option value="Familiar">Familiar</option>
                        <option value="Internet">Internet</option>
                        <option value="Flyer / Cartel">Flyer / Cartel</option>
                        <option value="Otro">Otro</option>
                      </select>
                    </div>

             <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        ¿Habías asistido antes a alguna de nuestras reuniones? *
                      </label>
                      <select
                        name="attendanceGroup"
                        value={formData.attendanceGroup}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-white"
                      >
                        <option value="">Selecciona una opción</option>
                        <option value="Sí">Sí</option>
                        <option value="No">No</option>
                      </select>
                    </div>
                  </>
                )}

                {/* ── Campos exclusivos: Cine para Niños ── */}
                {selectedEvent?.id === 2 && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Edad del niño/a *
                      </label>
                      <input
                        type="number"
                        name="childAge"
                        value={formData.childAge}
                        onChange={handleInputChange}
                        min={2}
                        max={18}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="Ej: 7"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nombre del padre, madre o tutor legal *
                      </label>
                      <input
                        type="text"
                        name="guardianName"
                        value={formData.guardianName}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="Nombre completo"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Teléfono del padre, madre o tutor legal *
                      </label>
                      <input
                        type="tel"
                        name="guardianPhone"
                        value={formData.guardianPhone}
                        onChange={handleInputChange}
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                        placeholder="+34 612 345 678"
                      />
                    </div>
                  </>
                )}

                {/* ── Campos de pago (solo Cine para Niños) ── */}
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

                    {/* ── Nombres de niños (emergente cuando tickets >= 1) ── */}
                    {showChildNames && (
                      <div className="border border-primary/20 rounded-xl p-4 bg-primary/5 space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
                        <p className="text-sm font-semibold text-primary flex items-center gap-2">
                          <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-white text-xs">✓</span>
                          Nombre de cada niño/a
                        </p>
                        <p className="text-xs text-gray-500 -mt-1">
                          Por favor indica el nombre de cada niño/a para su entrada.
                        </p>
                        {Array.from({ length: formData.tickets }).map((_, i) => (
                          <div key={i}>
                            <label className="block text-xs font-medium text-gray-600 mb-1">
                              Niño/a {i + 1} *
                            </label>
                            <input
                              type="text"
                              value={formData.childNames?.[i] ?? ""}
                              onChange={(e) => handleChildNameChange(i, e.target.value)}
                              required
                              className="w-full px-3 py-2 border border-primary/30 rounded-md focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm bg-white"
                              placeholder={`Nombre completo del niño/a ${i + 1}`}
                            />
                          </div>
                        ))}
                      </div>
                    )}

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

          </div>{/* ← cierre del div scroll */}

        </DialogContent>
      </Dialog>
    </section>
  );
}
