import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { motion } from "framer-motion";
import { SEOHead } from "@/components/SEOHead";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  MessageSquare,
  Phone,
  Mail,
  FileText,
  ShoppingCart,
  Truck,
  CreditCard,
  Shield,
  RotateCcw,
  HelpCircle,
  Package,
  Clock,
} from "lucide-react";

const faqCategories = [
  {
    title: "Orders & Purchasing",
    icon: ShoppingCart,
    faqs: [
      {
        question: "How do I place a bulk order?",
        answer:
          "You can place bulk orders directly through our products page. Select the items, choose your quantity (meeting the MOQ), and proceed to checkout. For very large orders, we recommend using our RFQ (Request for Quotation) system for better pricing.",
      },
      {
        question: "What is MOQ (Minimum Order Quantity)?",
        answer:
          "MOQ is the minimum number of units you need to purchase. We have different MOQs for shop buyers (wholesale) and retail buyers. Shop buyers typically have higher MOQs but get better per-unit pricing.",
      },
      {
        question: "Can I get a custom quote for large orders?",
        answer:
          'Yes! Use our RFQ system to submit a request. Go to the "Request Quote" page, add the products you need, specify quantities and your target price, and our team will respond with a competitive quote within 24-48 hours.',
      },
      {
        question: "How do I track my order?",
        answer:
          "Log into your dashboard and navigate to the Orders tab. You can see the status of all your orders including pending, confirmed, processing, shipped, and delivered statuses.",
      },
    ],
  },
  {
    title: "Shipping & Delivery",
    icon: Truck,
    faqs: [
      {
        question: "What are the shipping charges?",
        answer:
          "Shipping charges vary based on order weight, volume, and delivery location. For bulk orders, we offer competitive freight rates. Shipping costs are calculated at checkout. For RFQ orders, shipping is included in the quoted price.",
      },
      {
        question: "How long does delivery take?",
        answer:
          "Standard delivery takes 5-7 business days within India. For remote areas, it may take up to 10 business days. Express shipping options are available at additional cost. International orders typically take 10-21 business days.",
      },
      {
        question: "Do you deliver pan-India?",
        answer:
          "Yes, we deliver across India and also ship to 20+ countries internationally. Our logistics network covers all major industrial hubs and cities.",
      },
    ],
  },
  {
    title: "Payment & Invoicing",
    icon: CreditCard,
    faqs: [
      {
        question: "What payment methods do you accept?",
        answer:
          "We accept bank transfers (NEFT/RTGS), UPI, credit/debit cards, and net banking. For bulk orders, we also offer credit terms for verified businesses.",
      },
      {
        question: "Can I get a GST invoice?",
        answer:
          "Yes, we provide GST-compliant invoices for all orders. Make sure your GST number is updated in your profile for accurate invoicing. Invoices are available for download from your dashboard.",
      },
      {
        question: "Do you offer credit terms?",
        answer:
          "Yes, we offer 30/60/90 day credit terms for verified businesses with a good track record. Contact our sales team or mention it in your RFQ for credit term discussions.",
      },
    ],
  },
  {
    title: "Returns & Warranty",
    icon: RotateCcw,
    faqs: [
      {
        question: "What is your return policy?",
        answer:
          "We accept returns within 7 days of delivery for manufacturing defects or wrong items. The product must be unused and in original packaging. Custom/made-to-order items are non-returnable.",
      },
      {
        question: "How do I initiate a return?",
        answer:
          "Contact our support team via chat or email with your order number and reason for return. Our team will guide you through the process and arrange pickup if applicable.",
      },
      {
        question: "Do products come with warranty?",
        answer:
          "Yes, most products come with manufacturer warranty. Warranty duration varies by product category — machinery typically has 1-2 years, electronics 6-12 months. Check individual product pages for specific warranty information.",
      },
    ],
  },
  {
    title: "Account & Registration",
    icon: Shield,
    faqs: [
      {
        question: "How do I register as a buyer?",
        answer:
          'Click on "Login" and then "Sign Up" to create your account. You can register as either a shop (wholesale) buyer or retail buyer. Shop buyers get access to wholesale pricing with higher MOQs.',
      },
      {
        question: "What is the difference between Shop and Retail buyers?",
        answer:
          "Shop buyers are wholesale/business buyers who purchase in larger quantities and get better pricing. Retail buyers can purchase in smaller quantities at retail pricing. Your buyer type determines the prices and MOQs you see.",
      },
      {
        question: "How do I update my company details?",
        answer:
          "Log into your dashboard and go to the Profile section. You can update your company name, GST number, shipping address, and other details there.",
      },
    ],
  },
  {
    title: "RFQ (Request for Quotation)",
    icon: FileText,
    faqs: [
      {
        question: "What is the RFQ process?",
        answer:
          "RFQ allows you to request custom pricing for bulk orders. Browse products, add them to your RFQ cart with desired quantities, submit the request, and our team will respond with a detailed quotation including pricing, delivery timeline, and payment terms.",
      },
      {
        question: "How long does it take to get a quote?",
        answer:
          "We typically respond to RFQ requests within 24-48 business hours. Complex or large-scale requirements may take up to 3-5 business days for detailed quotation.",
      },
      {
        question: "Can I negotiate the quoted price?",
        answer:
          "Yes, our RFQ system is designed for negotiation. You can mention your target price when submitting the RFQ, and our team will work to provide the best possible pricing based on quantity and relationship.",
      },
    ],
  },
];

const contactOptions = [
  {
    icon: MessageSquare,
    title: "Live Chat",
    description: "Chat with our support team in real-time",
    action: "/chat",
    buttonText: "Start Chat",
    isLink: true,
  },
  {
    icon: Phone,
    title: "Call Us",
    description: "Mon-Sat, 9:00 AM - 6:00 PM IST",
    action: "tel:+917551120242",
    buttonText: "+91 755-112-0242",
    isLink: false,
  },
  {
    icon: Mail,
    title: "Email Support",
    description: "We respond within 24 hours",
    action: "mailto:support@vendorhub.com",
    buttonText: "support@vendorhub.com",
    isLink: false,
  },
];

export default function Help() {
  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Help & FAQ" description="Find answers to common questions about ordering, shipping, payments, and returns on VendorHub." />
      <Header />

      <main className="pt-4 pb-20">
        <div className="container mx-auto px-4">
          {/* Page Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="mb-8 text-center"
          >
            <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">
              Help & <span className="text-accent">FAQ</span>
            </h1>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Find answers to common questions or get in touch with our support
              team for personalized assistance.
            </p>
          </motion.div>

          {/* Contact Options */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-12"
          >
            {contactOptions.map((option) => (
              <div
                key={option.title}
                className="bg-card rounded-xl border border-border p-6 text-center hover:shadow-md hover:border-accent/30 transition-all"
              >
                <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center mx-auto mb-4">
                  <option.icon className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">
                  {option.title}
                </h3>
                <p className="text-muted-foreground text-sm mb-4">
                  {option.description}
                </p>
                {option.isLink ? (
                  <Link to={option.action}>
                    <Button variant="outline" size="sm" className="w-full">
                      {option.buttonText}
                    </Button>
                  </Link>
                ) : (
                  <a href={option.action}>
                    <Button variant="outline" size="sm" className="w-full">
                      {option.buttonText}
                    </Button>
                  </a>
                )}
              </div>
            ))}
          </motion.div>

          {/* FAQ Sections */}
          <div className="max-w-3xl mx-auto">
            {faqCategories.map((category, catIdx) => (
              <motion.div
                key={category.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.15 + catIdx * 0.05 }}
                className="mb-8"
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <category.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h2 className="text-xl font-display font-semibold text-foreground">
                    {category.title}
                  </h2>
                </div>

                <Accordion type="single" collapsible className="w-full">
                  {category.faqs.map((faq, faqIdx) => (
                    <AccordionItem
                      key={faqIdx}
                      value={`${catIdx}-${faqIdx}`}
                      className="border-border"
                    >
                      <AccordionTrigger className="text-left text-sm font-medium hover:text-accent">
                        {faq.question}
                      </AccordionTrigger>
                      <AccordionContent className="text-muted-foreground text-sm leading-relaxed">
                        {faq.answer}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))}
          </div>

          {/* Still Need Help Banner */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.5 }}
            className="max-w-3xl mx-auto mt-12 bg-gradient-to-r from-primary to-primary/80 rounded-2xl p-8 text-center text-primary-foreground"
          >
            <HelpCircle className="h-12 w-12 mx-auto mb-4 opacity-80" />
            <h3 className="text-2xl font-display font-bold mb-2">
              Still have questions?
            </h3>
            <p className="text-primary-foreground/80 mb-6 max-w-md mx-auto">
              Our support team is here to help. Start a live chat for instant
              assistance or send us an email.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Link to="/chat">
                <Button
                  variant="secondary"
                  size="lg"
                  className="w-full sm:w-auto"
                >
                  <MessageSquare className="mr-2 h-5 w-5" />
                  Start Live Chat
                </Button>
              </Link>
              <Link to="/rfq">
                <Button
                  variant="outline"
                  size="lg"
                  className="w-full sm:w-auto border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                >
                  <FileText className="mr-2 h-5 w-5" />
                  Submit RFQ
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
