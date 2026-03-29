import PageTransition from "@/components/layout/PageTransition";
import HeroSection from "@/components/landing/HeroSection";
import TrustStrip from "@/components/landing/TrustStrip";
import FeaturedEvents from "@/components/landing/FeaturedEvents";
import HowItWorks from "@/components/landing/HowItWorks";
import GallerySection from "@/components/landing/GallerySection";
import StatsCounter from "@/components/landing/StatsCounter";
import CTABanner from "@/components/landing/CTABanner";

export default function LandingPage() {
  return (
    <PageTransition>
      <HeroSection />
      <TrustStrip />
      <FeaturedEvents />
      <HowItWorks />
      <GallerySection />
      <StatsCounter />
      <CTABanner />
    </PageTransition>
  );
}
