import { useState, useEffect } from "react";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const FloatingWhatsApp = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useSiteSettings();
  const { t } = useLanguage();

  useEffect(() => {
    const contactSection = document.getElementById("contact");
    if (!contactSection) {
      setIsVisible(true);
      return;
    }

    if (typeof IntersectionObserver !== "undefined") {
      const observer = new IntersectionObserver(
        ([entry]) => {
          setIsVisible(!entry.isIntersecting);
        },
        { threshold: 0 }
      );
      observer.observe(contactSection);
      return () => observer.disconnect();
    }

    let rafId = 0;
    let ticking = false;
    const checkVisibility = () => {
      ticking = false;
      const rect = contactSection.getBoundingClientRect();
      setIsVisible(!(rect.top <= window.innerHeight && rect.bottom >= 0));
    };
    const handleScroll = () => {
      if (!ticking) {
        ticking = true;
        rafId = window.requestAnimationFrame(checkVisibility);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    checkVisibility();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) window.cancelAnimationFrame(rafId);
    };
  }, []);

  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <a
      href={whatsappLink}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed bottom-6 right-6 z-50 transition-[opacity,transform] duration-200 ease-out will-change-transform md:hover:scale-110 active:scale-[0.97] ${
        isVisible ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
      }`}
      aria-label={t("floating.whatsapp")}
    >
      <div className="relative">
        <div className="absolute inset-0 rounded-full bg-green-500/30 animate-ping-slow" />
        <div className="relative w-14 h-14 rounded-full bg-[#25D366] flex items-center justify-center shadow-[0_10px_25px_rgba(37,211,102,0.45)] border border-white/20">
          <WhatsAppIcon className="w-8 h-8 text-white" />
        </div>
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
