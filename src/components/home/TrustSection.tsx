import { Wallet, Truck, CreditCard, ShieldCheck, Headphones } from "lucide-react";

const trustItems = [
  {
    icon: Wallet,
    title: "Great Value",
    description: "Most popular brands with widest range of selection at best prices.",
  },
  {
    icon: Truck,
    title: "Nationwide Delivery",
    description: "Over 20,000 pincodes serviceable across India.",
  },
  {
    icon: CreditCard,
    title: "Secure Payment",
    description: "Partnered with India's most popular and secure payment solutions.",
  },
  {
    icon: ShieldCheck,
    title: "Buyer Protection",
    description: "Committed to buyer interests to provide a smooth shopping experience.",
  },
  {
    icon: Headphones,
    title: "365 Days Help Desk",
    description: "+91 755-112-0242",
    isPhone: true,
  },
];

export function TrustSection() {
  return (
    <section className="py-8 bg-card border-y border-border">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-6 md:gap-4">
          {trustItems.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col items-start"
            >
              <div className="w-10 h-10 mb-3 text-destructive">
                <item.icon className="h-8 w-8" strokeWidth={1.5} />
              </div>
              <h3 className="font-bold text-foreground text-sm mb-1">{item.title}</h3>
              {item.isPhone ? (
                <a href="tel:+917551120242" className="text-muted-foreground text-xs leading-relaxed flex items-center gap-1">
                  <span className="text-green-600">📞</span> {item.description}
                </a>
              ) : (
                <p className="text-muted-foreground text-xs leading-relaxed">{item.description}</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
