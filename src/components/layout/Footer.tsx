import { Link } from "react-router-dom";
import { 
  Mail, Phone, MapPin, Linkedin, Factory, Award, 
  Globe, FileText, Shield, Clock 
} from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SiteLogo } from "@/components/SiteLogo";

const quickLinks = [
  { label: "Products", href: "/products" },
  { label: "Request Quote", href: "/rfq" },
  { label: "Help & FAQ", href: "/help" },
  { label: "Quality Certifications", href: "#" },
  { label: "Contact Sales", href: "/chat" },
];

const buyerLinks = [
  { label: "How RFQ Works", href: "/rfq", icon: FileText },
  { label: "Bulk Orders", href: "/rfq", icon: Factory },
  { label: "Payment Terms", href: "#", icon: Award },
  { label: "Shipping & Delivery", href: "#", icon: Globe },
  { label: "Buyer Login", href: "/login", icon: Clock },
];

export function Footer() {
  return (
    <footer className="bg-primary text-primary-foreground">
      {/* Main Footer */}
      <div className="container mx-auto px-4 py-12 md:py-16">
        {/* Desktop/Tablet View - Same layout on both */}
        <div className="hidden sm:grid sm:grid-cols-2 md:grid-cols-4 gap-8 md:gap-12">
          {/* Company Info */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <SiteLogo className="w-10 h-10" />
              <span className="text-xl font-display font-bold">
                Vendor<span className="text-accent">Hub</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted B2B industrial supplier. ISO 9001:2015 certified with 15+ years of 
              manufacturing excellence. Serving businesses across India and 20+ countries.
            </p>
            
            {/* Certifications */}
            <div className="flex flex-wrap gap-3 pt-2">
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-xs">
                <Shield className="h-3.5 w-3.5 text-accent" />
                ISO 9001
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-primary-light text-xs">
                <FileText className="h-3.5 w-3.5 text-accent" />
                GST Compliant
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-5">Quick Links</h4>
            <ul className="space-y-3">
              {quickLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* For Buyers */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-5">For Buyers</h4>
            <ul className="space-y-3">
              {buyerLinks.map((link) => (
                <li key={link.label}>
                  <Link 
                    to={link.href} 
                    className="text-primary-foreground/70 hover:text-accent transition-colors text-sm flex items-center gap-2"
                  >
                    <link.icon className="h-3.5 w-3.5" />
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-display font-semibold text-lg mb-5">Contact Us</h4>
            <ul className="space-y-4">
              <li className="flex items-start gap-3 text-sm">
                <MapPin className="h-5 w-5 mt-0.5 text-accent flex-shrink-0" />
                <span className="text-primary-foreground/70">
                  Industrial Area, Phase-II<br />
                  Bhopal, MP 462001, India
                </span>
              </li>
              <li>
                <a 
                  href="tel:+917551120242" 
                  className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  <Phone className="h-5 w-5 text-accent" />
                  +91 755-112-0242
                </a>
              </li>
              <li>
                <a 
                  href="mailto:sales@vendorhub.com" 
                  className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                >
                  <Mail className="h-5 w-5 text-accent" />
                  sales@vendorhub.com
                </a>
              </li>
            </ul>

            {/* Social */}
            <div className="flex gap-3 mt-6">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center hover:bg-accent transition-colors"
                aria-label="LinkedIn"
              >
                <Linkedin className="h-5 w-5" />
              </a>
            </div>
          </div>
        </div>

        {/* Mobile View Only - Accordion */}
        <div className="sm:hidden space-y-4">
          {/* Company Info - Always visible */}
          <div className="space-y-4 pb-4 border-b border-primary-light">
            <div className="flex items-center gap-2">
              <SiteLogo className="w-10 h-10" />
              <span className="text-xl font-display font-bold">
                Vendor<span className="text-accent">Hub</span>
              </span>
            </div>
            <p className="text-primary-foreground/70 text-sm leading-relaxed">
              Your trusted B2B industrial supplier. ISO 9001:2015 certified with 15+ years of 
              manufacturing excellence.
            </p>
            <div className="flex flex-wrap gap-2">
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light text-xs">
                <Shield className="h-3 w-3 text-accent" />
                ISO 9001
              </div>
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-primary-light text-xs">
                <FileText className="h-3 w-3 text-accent" />
                GST Compliant
              </div>
            </div>
          </div>

          {/* Accordion Sections */}
          <Accordion type="multiple" className="w-full">
            <AccordionItem value="quick-links" className="border-primary-light">
              <AccordionTrigger className="text-primary-foreground hover:text-accent py-3">
                <span className="font-semibold">Quick Links</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-3">
                  {quickLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-primary-foreground/70 hover:text-accent transition-colors text-sm"
                      >
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="for-buyers" className="border-primary-light">
              <AccordionTrigger className="text-primary-foreground hover:text-accent py-3">
                <span className="font-semibold">For Buyers</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-3">
                  {buyerLinks.map((link) => (
                    <li key={link.label}>
                      <Link 
                        to={link.href} 
                        className="text-primary-foreground/70 hover:text-accent transition-colors text-sm flex items-center gap-2"
                      >
                        <link.icon className="h-3.5 w-3.5" />
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="contact" className="border-primary-light">
              <AccordionTrigger className="text-primary-foreground hover:text-accent py-3">
                <span className="font-semibold">Contact Us</span>
              </AccordionTrigger>
              <AccordionContent className="pb-4">
                <ul className="space-y-4">
                  <li className="flex items-start gap-3 text-sm">
                    <MapPin className="h-5 w-5 mt-0.5 text-accent flex-shrink-0" />
                    <span className="text-primary-foreground/70">
                      Industrial Area, Phase-II<br />
                      Bhopal, MP 462001, India
                    </span>
                  </li>
                  <li>
                    <a 
                      href="tel:+917551120242" 
                      className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      <Phone className="h-5 w-5 text-accent" />
                      +91 755-112-0242
                    </a>
                  </li>
                  <li>
                    <a 
                      href="mailto:sales@vendorhub.com" 
                      className="flex items-center gap-3 text-sm text-primary-foreground/70 hover:text-accent transition-colors"
                    >
                      <Mail className="h-5 w-5 text-accent" />
                      sales@vendorhub.com
                    </a>
                  </li>
                </ul>
                <div className="flex gap-3 mt-4">
                  <a 
                    href="#" 
                    className="w-10 h-10 rounded-full bg-primary-light flex items-center justify-center hover:bg-accent transition-colors"
                    aria-label="LinkedIn"
                  >
                    <Linkedin className="h-5 w-5" />
                  </a>
                </div>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </div>
      </div>

      {/* Bottom Bar */}
      <div className="border-t border-primary-light">
        <div className="container mx-auto px-4 py-5">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-primary-foreground/60 text-sm text-center md:text-left">
              © {new Date().getFullYear()} VendorHub Industrial Supplies. All rights reserved.
            </p>
            <div className="flex flex-wrap justify-center gap-4 md:gap-6">
              <Link to="#" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
                Privacy Policy
              </Link>
              <Link to="#" className="text-primary-foreground/60 hover:text-accent text-sm transition-colors">
                Terms of Service
              </Link>
              <span className="text-primary-foreground/60 text-sm">
                GSTIN: 23AAAAA0000A1Z5
              </span>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
