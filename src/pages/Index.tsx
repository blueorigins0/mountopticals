import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HeroSection } from "@/components/home/HeroSection";
import { CategoriesSection } from "@/components/home/CategoriesSection";
import { FeaturedProducts } from "@/components/home/FeaturedProducts";
import { DynamicProductSections } from "@/components/home/DynamicProductSections";
import { TrustSection } from "@/components/home/TrustSection";
import { SEOHead } from "@/components/SEOHead";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="VendorHub - Industrial B2B Marketplace | Wholesale & Retail"
        description="India's leading B2B industrial marketplace. Shop machinery, electronics, tools at wholesale and retail prices. Get bulk quotes instantly."
      />
      <Header />
      <main className="pt-0">
        <HeroSection />
        <CategoriesSection />
        <FeaturedProducts />
        <DynamicProductSections />
      </main>
      <TrustSection />
      <Footer />
    </div>
  );
};

export default Index;
