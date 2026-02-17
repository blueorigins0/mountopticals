import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string;
  badge_label: string | null;
  cta_text: string | null;
  cta_link: string | null;
}

interface PromoBanner {
  id: string;
  title: string;
  offer_text: string | null;
  image_url: string;
  link: string | null;
}

const fallbackSlides: HeroSlide[] = [
  { id: "1", title: "Industrial Machinery", subtitle: "Heavy-duty equipment for manufacturing excellence", image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=1200&auto=format&fit=crop", badge_label: "Top Seller", cta_text: "Shop Now", cta_link: "/products" },
  { id: "2", title: "Electronics Components", subtitle: "Quality components for OEM manufacturers", image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=1200&auto=format&fit=crop", badge_label: "New Arrival", cta_text: "Explore", cta_link: "/products" },
  { id: "3", title: "Raw Materials", subtitle: "Bulk materials at competitive wholesale prices", image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=1200&auto=format&fit=crop", badge_label: "Best Deal", cta_text: "View Products", cta_link: "/products" },
  { id: "4", title: "Tools & Equipment", subtitle: "Professional grade tools for every industry", image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=1200&auto=format&fit=crop", badge_label: "Popular", cta_text: "Browse", cta_link: "/products" },
];

const fallbackBanners: PromoBanner[] = [
  { id: "1", title: "Power Tools", offer_text: "UPTO 40% OFF", image_url: "https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?w=600&auto=format&fit=crop", link: "/products" },
  { id: "2", title: "Electronics", offer_text: "UPTO 50% OFF", image_url: "https://images.unsplash.com/photo-1518770660439-4636190af475?w=600&auto=format&fit=crop", link: "/products" },
  { id: "3", title: "Raw Materials", offer_text: "UPTO 30% OFF", image_url: "https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?w=600&auto=format&fit=crop", link: "/products" },
  { id: "4", title: "Safety Gear", offer_text: "UPTO 60% OFF", image_url: "https://images.unsplash.com/photo-1530124566582-a618bc2615dc?w=600&auto=format&fit=crop", link: "/products" },
  { id: "5", title: "Packaging", offer_text: "UPTO 45% OFF", image_url: "https://images.unsplash.com/photo-1565793298595-6a879b1d9492?w=600&auto=format&fit=crop", link: "/products" },
];

export function HeroSection() {
  const [currentSlide, setCurrentSlide] = useState(0);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>(fallbackSlides);
  const [promoBanners, setPromoBanners] = useState<PromoBanner[]>(fallbackBanners);

  useEffect(() => {
    const fetchData = async () => {
      const [slidesRes, bannersRes] = await Promise.all([
        supabase.from("hero_slides").select("*").eq("is_active", true).order("sort_order"),
        supabase.from("promo_banners").select("*").eq("is_active", true).order("sort_order"),
      ]);
      if (slidesRes.data && slidesRes.data.length > 0) setHeroSlides(slidesRes.data as HeroSlide[]);
      if (bannersRes.data && bannersRes.data.length > 0) setPromoBanners(bannersRes.data as PromoBanner[]);
    };
    fetchData();
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % heroSlides.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [heroSlides.length]);

  const goToSlide = (idx: number) => setCurrentSlide(idx);
  const prevSlide = () => setCurrentSlide((prev) => (prev - 1 + heroSlides.length) % heroSlides.length);
  const nextSlide = () => setCurrentSlide((prev) => (prev + 1) % heroSlides.length);

  // Build tabs from slides
  const heroTabs = heroSlides.slice(0, 5).map((slide, idx) => ({
    label: slide.title,
    offer: slide.badge_label || "",
    slideIdx: idx,
  }));

  return (
    <section className="w-full">
      {/* Hero Slider - Moglix height ~300px desktop */}
      <div className="relative w-full h-[200px] sm:h-[250px] md:h-[300px] overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="absolute inset-0"
          >
            <img
              src={heroSlides[currentSlide]?.image_url}
              alt={heroSlides[currentSlide]?.title}
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-r from-foreground/70 via-foreground/40 to-transparent" />
            
            <div className="absolute inset-0 flex items-center">
              <div className="container mx-auto px-4">
                <div className="max-w-xl">
                  <h2 className="text-xl sm:text-2xl md:text-3xl lg:text-4xl font-display font-bold text-white mb-1 sm:mb-2 leading-tight line-clamp-1">
                    {heroSlides[currentSlide]?.title}
                  </h2>
                  <p className="text-white/90 text-xs sm:text-sm md:text-base mb-3 sm:mb-4 max-w-md">
                    {heroSlides[currentSlide]?.subtitle}
                  </p>
                  <Link to={heroSlides[currentSlide]?.cta_link || "/products"}>
                    <Button size="sm" className="bg-accent hover:bg-accent-hover text-accent-foreground shadow-lg h-8 sm:h-9 text-xs sm:text-sm">
                      {heroSlides[currentSlide]?.cta_text || "Shop Now"}
                      <ArrowRight className="ml-1.5 h-4 w-4" />
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </motion.div>
        </AnimatePresence>

        {/* Nav Arrows removed per design */}

        {/* Dots */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {heroSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => goToSlide(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentSlide ? "bg-accent w-6" : "bg-white/50 hover:bg-white/70 w-1.5"
              }`}
            />
          ))}
        </div>
      </div>

      {/* Tabs below slider - Moglix style */}
      <div className="hidden md:block border-b border-border bg-card">
        <div className="container mx-auto px-4">
          <div className="flex items-stretch">
            {heroTabs.map((tab, idx) => (
              <button
                key={idx}
                onClick={() => goToSlide(tab.slideIdx)}
                className={`flex-1 py-2 px-3 text-center border-b-2 transition-colors ${
                  currentSlide === tab.slideIdx
                    ? "border-accent text-accent"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
              >
                <p className="text-xs font-semibold uppercase truncate">{tab.label}</p>
                <p className={`text-[10px] ${currentSlide === tab.slideIdx ? "text-accent" : "text-muted-foreground"}`}>
                  {tab.offer}
                </p>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Promo Banners - compact like Moglix ~120px */}
      <div className="py-2 sm:py-3 bg-background">
        <div className="container mx-auto px-3 sm:px-4">
          {/* Desktop: 5 grid */}
          <div className="hidden md:grid grid-cols-5 gap-2">
            {promoBanners.slice(0, 5).map((banner) => (
              <Link key={banner.id} to={banner.link || "/products"} className="group relative rounded-lg overflow-hidden h-[100px] lg:h-[120px]">
                <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                <div className="absolute bottom-1.5 left-2 right-2">
                  <p className="text-white text-[11px] font-bold">{banner.title}</p>
                  <p className="text-accent text-[10px] font-semibold">{banner.offer_text}</p>
                </div>
              </Link>
            ))}
          </div>

          {/* Tablet: 4 visible in slider */}
          <div className="hidden sm:block md:hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
              {promoBanners.map((banner) => (
                <Link key={banner.id} to={banner.link || "/products"} className="group relative rounded-lg overflow-hidden flex-shrink-0 w-[calc(25%-6px)] h-[90px]">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                  <div className="absolute bottom-1.5 left-2 right-2">
                    <p className="text-white text-[11px] font-bold">{banner.title}</p>
                    <p className="text-accent text-[10px] font-semibold">{banner.offer_text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Mobile: slider with 1 visible */}
          <div className="sm:hidden">
            <div className="flex gap-2 overflow-x-auto scrollbar-hide snap-x snap-mandatory pb-1">
              {promoBanners.map((banner) => (
                <Link key={banner.id} to={banner.link || "/products"} className="group relative rounded-lg overflow-hidden flex-shrink-0 w-[85%] snap-center h-[100px]">
                  <img src={banner.image_url} alt={banner.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                  <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                  <div className="absolute bottom-2 left-3 right-3">
                    <p className="text-white text-sm font-bold">{banner.title}</p>
                    <p className="text-accent text-xs font-semibold">{banner.offer_text}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
