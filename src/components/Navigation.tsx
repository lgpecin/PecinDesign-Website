import { useState, useEffect, useRef, useLayoutEffect, useCallback } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import logo from "@/assets/logo.png";
import { useLanguage } from "@/contexts/LanguageContext";

// Slime / Liquid bubble audio synthesizer using Web Audio API
const playSlimeSound = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    if (ctx.state === "suspended") {
      ctx.resume();
    }
    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    // Liquid pop / slime bubble pitch ramp
    osc.type = "sine";
    osc.frequency.setValueAtTime(320, now);
    osc.frequency.exponentialRampToValueAtTime(720, now + 0.05);
    osc.frequency.exponentialRampToValueAtTime(420, now + 0.12);

    gain.gain.setValueAtTime(0.06, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.12);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  } catch (e) {
    // Ignore if audio is restricted by browser policy
  }
};

const NAV_ITEMS = [
  { id: "hero", label: "Início" },
  { id: "services", label: "Meus Serviços" },
  { id: "portfolio", label: "Portfólio" },
  { id: "about", label: "Sobre Mim" },
];

const Navigation = () => {
  const [activeSection, setActiveSection] = useState("hero");
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  const [isSquishing, setIsSquishing] = useState(false);
  const [pillStyle, setPillStyle] = useState<{ left: number; top: number; width: number; height: number; opacity: number }>({
    left: 0,
    top: 0,
    width: 0,
    height: 0,
    opacity: 0,
  });

  const containerRef = useRef<HTMLDivElement | null>(null);
  const itemRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const { language, setLanguage, t } = useLanguage();
  const location = useLocation();
  const navigate = useNavigate();
  const isPortfolioPage = location.pathname === "/portfolio";

  // Target item is either hovered button or current active section
  const currentTargetId = hoveredId || (isPortfolioPage ? "portfolio" : activeSection);

  const updatePillPosition = useCallback(() => {
    const container = containerRef.current;
    const targetButton = itemRefs.current[currentTargetId];
    if (container && targetButton) {
      const containerRect = container.getBoundingClientRect();
      const buttonRect = targetButton.getBoundingClientRect();
      setPillStyle({
        left: buttonRect.left - containerRect.left,
        top: buttonRect.top - containerRect.top,
        width: buttonRect.width,
        height: buttonRect.height,
        opacity: 1,
      });
    }
  }, [currentTargetId]);

  useLayoutEffect(() => {
    updatePillPosition();
  }, [updatePillPosition]);

  useEffect(() => {
    const handleResize = () => updatePillPosition();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [updatePillPosition]);

  useEffect(() => {
    if (isPortfolioPage) {
      setActiveSection("portfolio");
      return;
    }

    const handleScroll = () => {
      const sections = ["hero", "services", "projects", "about"];
      const scrollPos = window.scrollY + 200;

      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const top = el.offsetTop;
          const height = el.offsetHeight;
          if (scrollPos >= top && scrollPos < top + height) {
            const mappedSection = section === "projects" ? "portfolio" : section;
            setActiveSection(mappedSection);
            break;
          }
        }
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, [isPortfolioPage]);

  const handleNavClick = (sectionId: string) => {
    // Trigger slime sound & squish physics
    playSlimeSound();
    setIsSquishing(true);
    setTimeout(() => setIsSquishing(false), 520);

    const targetElementId = sectionId === "portfolio" ? "projects" : sectionId;

    if (isPortfolioPage) {
      navigate("/");
      setTimeout(() => {
        const el = document.getElementById(targetElementId) || document.getElementById("portfolio");
        el?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    } else {
      setActiveSection(sectionId);
      const el = document.getElementById(targetElementId) || document.getElementById("portfolio");
      el?.scrollIntoView({ behavior: "smooth" });
    }
  };

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 py-4 px-6 sm:px-12 transition-all duration-300">
      <div className="max-w-7xl mx-auto flex items-center justify-between relative">
        {/* Logo (Top Left) — Desaparece suavemente no mobile ao scrollar */}
        <button
          onClick={() => handleNavClick("hero")}
          className={`hover:opacity-80 transition-all duration-500 active:scale-95 flex items-center ${
            isScrolled ? "max-md:opacity-0 max-md:pointer-events-none max-md:scale-90" : "opacity-100 pointer-events-auto scale-100"
          }`}
        >
          <img src={logo} alt="Pecin Design" className="h-7 sm:h-8 w-auto drop-shadow-md" />
        </button>

        {/* Center Pill Navigation with Slime Physics */}
        <div
          ref={containerRef}
          onMouseLeave={() => setHoveredId(null)}
          className="absolute left-1/2 -translate-x-1/2 hidden md:flex items-center bg-white rounded-full p-1 shadow-2xl select-none"
        >
          {/* Slime Liquid Gliding Indicator */}
          <div
            className={`slime-pill-indicator absolute rounded-full pointer-events-none bg-[#ccff00] shadow-[0_4px_16px_rgba(204,255,0,0.5),0_0_24px_rgba(204,255,0,0.3)] z-0 ${
              isSquishing ? "animate-slime-squish" : ""
            }`}
            style={{
              left: `${pillStyle.left}px`,
              top: `${pillStyle.top}px`,
              width: `${pillStyle.width}px`,
              height: `${pillStyle.height}px`,
              opacity: pillStyle.opacity,
            }}
          >
            {/* Glossy liquid top highlight */}
            <div className="absolute inset-0 rounded-full bg-gradient-to-b from-white/40 via-white/10 to-transparent pointer-events-none" />
            {/* Subtle inner slime glow */}
            <div className="absolute inset-x-2 bottom-0.5 h-1/2 rounded-full bg-gradient-to-t from-black/10 to-transparent pointer-events-none" />
          </div>

          {/* Navigation Buttons */}
          {[
            { id: "hero", label: t("nav.home") },
            { id: "services", label: t("nav.services") },
            { id: "portfolio", label: t("nav.projects") },
            { id: "about", label: t("nav.about") },
          ].map((item) => {
            const isSelected = currentTargetId === item.id;
            return (
              <button
                key={item.id}
                ref={(el) => (itemRefs.current[item.id] = el)}
                onMouseEnter={() => setHoveredId(item.id)}
                onClick={() => handleNavClick(item.id)}
                className={`relative z-10 px-5 py-1.5 rounded-full text-xs sm:text-sm font-bold transition-all duration-200 active:scale-95 ${
                  isSelected ? "text-black font-extrabold" : "text-neutral-700 hover:text-black font-semibold"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </div>

        {/* Right: Language Switcher (PT / EN) — fades out on mobile scroll */}
        <div
          className={`flex items-center gap-1 bg-[#141517]/80 backdrop-blur-md border border-white/20 rounded-full p-1 shadow-md transition-all duration-500 ${
            isScrolled ? "max-md:opacity-0 max-md:pointer-events-none max-md:scale-90" : "opacity-100 pointer-events-auto scale-100"
          }`}
        >
          <button
            onClick={() => setLanguage("pt")}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
              language === "pt"
                ? "bg-[#ccff00] text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            PT
          </button>
          <button
            onClick={() => setLanguage("en")}
            className={`px-2.5 py-1 rounded-full text-xs font-bold transition-all duration-200 ${
              language === "en"
                ? "bg-[#ccff00] text-black shadow-sm"
                : "text-white/70 hover:text-white"
            }`}
          >
            EN
          </button>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
