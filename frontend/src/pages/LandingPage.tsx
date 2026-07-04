import Navbar from "../components/layout/Navbar";
import Footer from "../components/layout/Footer";
import HeroSection from "../components/landing/HeroSection";
import FeaturesSection from "../components/landing/FeaturesSection";
import StatsSection from "../components/landing/StatsSection";
import HowItWorksSection from "../components/landing/HowItWorksSection";
import CTASection from "../components/landing/CTASection";

export default function LandingPage() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-void">
      <Navbar />
      <main>
        <HeroSection />
        <FeaturesSection />
        <StatsSection />
        <HowItWorksSection />
        <CTASection />
      </main>
      <Footer />
    </div>
  );
}
