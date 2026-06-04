import { Header } from "@/components/header";
import { HeroSection } from "@/components/hero-section";
import { FeaturedEvent } from "@/components/featured-event";
import { AboutSection } from "@/components/about-section";
import { RecentEventsSection } from "@/components/recent-events-section";
import { EssenceSection } from "@/components/essence-section";
import { UpcomingEventsSection } from "@/components/upcoming-events-section";
import { PastorQuoteSection } from "@/components/pastor-quote-section";
import { MovingGallery } from "@/components/moving-gallery";
import { Footer } from "@/components/footer";

export default function Page() {
  return (
    <main className="min-h-screen">
      <Header />
      <HeroSection />
      <FeaturedEvent />
      <AboutSection />
      <RecentEventsSection />
      <EssenceSection />
      <UpcomingEventsSection />
      <PastorQuoteSection />
      <MovingGallery />
      <Footer />
    </main>
  );
}
