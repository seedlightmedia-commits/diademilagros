"use client";

import { useState, useRef } from "react";
import { Play } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "@/components/ui/dialog";

const recentEvents = [
  {
    id: 1,
    title: "¡FELICIDADES POR TU GRADUACIÓN!",
    videoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/VideoGRaduaici%C3%B3nLideres-DrfK5FZCqBgX8c3NCqgsGpSKFWuR65.mp4",
  },
  {
    id: 2,
    title: "Testimonios de transformación",
    videoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/anuncio%20tres%20servicios-Yf6JlfpLhgY5f8Tn7J6MKvUUEkZWBr.mp4",
  },
  {
    id: 3,
    title: "Universidad de la Vida",
    videoUrl: "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/ANUNCIO%20UNIVERSIDAD%20DE%20LA%20VIDA%283%29-tpy3vn0Jh6WKqATlHfThYa01JHvOiM.mp4",
  },
];

export function RecentEventsSection() {
  const [selectedVideo, setSelectedVideo] = useState<string | null>(null);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  return (
    <section className="relative py-12 md:py-16">
      {/* Background Image */}
      <div
        className="absolute inset-0 bg-cover bg-center bg-no-repeat"
        style={{
          backgroundImage: `url('https://hebbkx1anhila5yf.public.blob.vercel-storage.com/FONDO%20GENTE1-qhJU1rxAeGlmdyodB0dfNvbo7NziIP.jpg')`,
        }}
      />
      {/* Orange Overlay */}
      <div className="absolute inset-0 bg-primary/85" />

     <div className="container mx-auto px-4 relative z-10">
        {/* Header */}
        <div className="text-center mb-8">
          {/* Se eliminó 'tracking-widest' para que las letras se unan de forma compacta y natural como en el pantallazo */}
          <h2 className="text-2xl md:text-3xl lg:text-4xl font-heading text-white mb-2 uppercase">
            ULTIMOS EVENTOS
          </h2>
          {/* Se aplicó font-montserrat para activar Nexa Regular con el tamaño exacto de la imagen */}
          <p className="font-montserrat font-normal text-white text-base md:text-xl lg:text-2xl">
            Testimonios de transformación en Barcelona
          </p>
        </div>


        {/* Video Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-5xl mx-auto">
          {recentEvents.map((event, index) => (
            <div
              key={event.id}
              className="relative aspect-[4/3] rounded-lg overflow-hidden cursor-pointer group"
              onClick={() => setSelectedVideo(event.videoUrl)}
            >
              {/* Video Thumbnail */}
              <video
                ref={(el) => { videoRefs.current[index] = el; }}
                src={event.videoUrl}
                className="w-full h-full object-cover"
                muted
                playsInline
                preload="metadata"
                onMouseEnter={(e) => e.currentTarget.play()}
                onMouseLeave={(e) => {
                  e.currentTarget.pause();
                  e.currentTarget.currentTime = 0;
                }}
              />
              
              {/* Dark Overlay */}
              <div className="absolute inset-0 bg-black/30 group-hover:bg-black/10 transition-colors" />
              
              {/* Play Button */}
              <div className="absolute left-4 bottom-4">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-full border-2 border-white/80 flex items-center justify-center bg-transparent group-hover:bg-white/20 transition-colors">
                  <Play className="text-white ml-1" size={18} fill="white" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Video Dialog */}
      <Dialog open={!!selectedVideo} onOpenChange={() => setSelectedVideo(null)}>
        <DialogContent className="max-w-4xl bg-black border-none p-0">
          <DialogTitle className="sr-only">Video del evento</DialogTitle>
          <div className="aspect-video">
            {selectedVideo && (
              <video
                src={selectedVideo}
                className="w-full h-full"
                controls
                autoPlay
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
}
