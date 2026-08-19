import { useState, useEffect } from "react";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";

const FloatingWhatsApp = () => {
  const [isVisible, setIsVisible] = useState(true);
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  
  useEffect(() => {
    let rafId: number;
    
    const checkVisibility = () => {
      rafId = requestAnimationFrame(() => {
        const contactSection = document.getElementById("contact");
        if (contactSection) {
          const rect = contactSection.getBoundingClientRect();
          const isInContactSection = rect.top <= window.innerHeight && rect.bottom >= 0;
          setIsVisible(!isInContactSection);
        }
      });
    };

    let ticking = false;
    const handleScroll = () => {
      if (!ticking) {
        window.requestAnimationFrame(() => {
          checkVisibility();
          ticking = false;
        });
        ticking = true;
      }
    };
    
    window.addEventListener("scroll", handleScroll, { passive: true });
    checkVisibility();

    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (rafId) cancelAnimationFrame(rafId);
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
        <img 
          src={whatsappLogo} 
          alt="WhatsApp" 
          className="relative w-14 h-14 object-contain drop-shadow-2xl" 
          loading="lazy"
          decoding="async"
        />
      </div>
    </a>
  );
};

export default FloatingWhatsApp;
