import { MessageSquare, Instagram, Linkedin } from "lucide-react";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import stripesDecoration from "@/assets/redesign/stripes-decoration.png";
import BehanceIcon from "@/components/icons/BehanceIcon";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AnimatedSection } from "@/components/AnimatedSection";
import { useLanguage } from "@/contexts/LanguageContext";

const Contact = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <section id="contact" className="relative pt-10 sm:pt-14 pb-16 sm:pb-20 overflow-hidden bg-[#0d0f11]">
      {/* Full-width Green Stripes Illustration */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden flex items-center justify-between">
        <img
          src={stripesDecoration}
          alt=""
          className="w-full h-full object-cover sm:object-fill opacity-90 select-none"
          aria-hidden="true"
          loading="lazy"
        />
      </div>

      <div className="container mx-auto px-6 relative z-10">
        <AnimatedSection>
          <div className="max-w-2xl mx-auto text-center flex flex-col items-center">
            {/* Speech bubble icon */}
            <div className="w-12 h-12 sm:w-14 sm:h-14 bg-[#141517] border border-white/15 rounded-2xl flex items-center justify-center mb-5 shadow-md">
              <MessageSquare className="w-6 h-6 sm:w-7 sm:h-7 text-[#00ff88]" />
            </div>

            {/* Title */}
            <h2 className="font-boldonse text-3xl sm:text-4xl md:text-5xl text-white mb-3 tracking-wide">
              {t("contact.title")}
            </h2>

            {/* Subtitle */}
            <p className="text-neutral-400 text-sm sm:text-base md:text-lg mb-7 font-normal">
              {t("contact.subtitle")}
            </p>

            {/* WhatsApp CTA Button */}
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3.5 px-8 sm:px-10 py-3.5 sm:py-4 bg-[#008753] hover:bg-[#009e60] text-white rounded-xl sm:rounded-2xl text-base sm:text-lg font-bold shadow-[0_10px_30px_rgba(0,135,83,0.4)] hover:shadow-[0_15px_40px_rgba(0,135,83,0.6)] transition-all duration-300 hover:scale-105 active:scale-95"
            >
              <img
                src={whatsappLogo}
                alt="WhatsApp"
                className="w-6 h-6 sm:w-7 sm:h-7 object-contain shrink-0"
              />
              <span>{t("contact.cta_whatsapp")}</span>
            </a>

            {/* Social Media Icons directly below WhatsApp button */}
            <div className="flex items-center justify-center gap-4 sm:gap-5 mt-6 sm:mt-8">
              {[
                { href: settings.instagram_url, label: "Instagram", Icon: Instagram },
                { href: settings.linkedin_url, label: "LinkedIn", Icon: Linkedin },
                { href: settings.behance_url, label: "Behance", Icon: BehanceIcon },
              ].map(({ href, label, Icon }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-11 h-11 sm:w-12 sm:h-12 rounded-full bg-[#18191c]/90 border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-[#ccff00] hover:scale-110 active:scale-95 transition-all duration-200 shadow-md"
                >
                  <Icon className="w-5 h-5" />
                </a>
              ))}
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default Contact;
