import { MessageSquare } from "lucide-react";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import stripesDecoration from "@/assets/redesign/stripes-decoration.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AnimatedSection } from "@/components/AnimatedSection";

const Contact = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <section id="contact" className="relative py-16 sm:py-24 overflow-hidden">
      {/* Stripes decoration - left */}
      <img
        src={stripesDecoration}
        alt=""
        className="stripes-left"
        aria-hidden="true"
        loading="lazy"
      />
      {/* Stripes decoration - right */}
      <img
        src={stripesDecoration}
        alt=""
        className="stripes-right"
        aria-hidden="true"
        loading="lazy"
      />

      <div className="container mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-14 h-14 bg-primary/15 rounded-2xl flex items-center justify-center">
                <MessageSquare className="w-7 h-7 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h2 className="font-boldonse text-3xl sm:text-4xl md:text-5xl text-white mb-4">
              Vamos Conversar?
            </h2>

            {/* Subtitle */}
            <p className="text-muted-foreground text-base sm:text-lg mb-8">
              Tem um projeto em mente? Fale comigo por WhatsApp.
            </p>

            {/* WhatsApp CTA */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-10 py-5 bg-primary hover:bg-primary/90 text-primary-foreground rounded-full text-lg sm:text-xl font-bold shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105"
            >
              <img
                src={whatsappLogo}
                alt="WhatsApp"
                className="w-8 h-8 object-contain"
                width="32"
                height="32"
              />
              Fale comigo no WhatsApp
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Contact;
