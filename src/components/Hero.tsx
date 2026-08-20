import whatsappLogo from "@/assets/whatsapp-logo.png";
import pecinPhotoCutout from "@/assets/redesign/pecin-photo-cutout.png";
import ribbonBannerBg from "@/assets/redesign/ribbon-banner-bg.png";
import mysticalBg from "@/assets/redesign/mystical-bg.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Instagram, Linkedin } from "lucide-react";
import BehanceIcon from "@/components/icons/BehanceIcon";
import InfiniteCarousel from "@/components/InfiniteCarousel";

const Hero = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <section
      id="hero"
      className="relative min-h-screen overflow-hidden pt-16 sm:pt-20 pb-16 bg-[#0a0c0e]"
    >
      {/* Full-width edge-to-edge background illustration */}
      <div className="absolute top-0 left-0 right-0 w-full h-[800px] sm:h-[900px] md:h-[1000px] pointer-events-none overflow-hidden z-0">
        <img
          src={mysticalBg}
          alt=""
          className="w-full h-full object-cover object-top opacity-75"
          aria-hidden="true"
        />
        {/* Soft bottom fade to blend seamlessly into section background */}
        <div
          className="absolute inset-0 pointer-events-none"
          style={{
            background: "linear-gradient(to bottom, rgba(10,12,14,0.1) 0%, rgba(10,12,14,0.3) 60%, #0a0c0e 100%)",
          }}
        />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Hero Visual Container */}
        <div className="relative w-full max-w-5xl mx-auto my-2">

          {/* ── MOBILE LAYOUT (< md): matches reference exactly ── */}
          <div className="flex flex-col md:hidden">

            {/* Main content block: left text + right photo (absolute) */}
            <div className="relative w-full overflow-hidden">

              {/* Photo — absolute top-right, full height of block */}
              <div
                className="absolute top-0 right-0 pointer-events-none animate-hero-photo z-0"
                style={{ width: "46%", bottom: 0 }}
              >
                <img
                  src={pecinPhotoCutout}
                  alt="Leonardo Pecin - Designer e Diretor de Arte"
                  className="w-full h-full object-contain object-top drop-shadow-2xl"
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Left column: title + box + button */}
              <div className="relative z-10 flex flex-col" style={{ width: "58%" }}>

                {/* Title — 1 linha, fonte calibrada para caber na coluna de 58% */}
                <h1
                  className="font-boldonse text-white drop-shadow-lg animate-hero-title mb-2.5"
                  style={{
                    fontSize: "clamp(15px, 4.8vw, 20px)",
                    lineHeight: 1.05,
                    transform: "rotate(-1deg)",
                    transformOrigin: "left bottom",
                    whiteSpace: "nowrap",
                  }}
                >
                  Opa, tudo bom?
                </h1>

                {/* Dashed selection box — sangra levemente sob a foto */}
                <div
                  className="relative bg-black/60 animate-hero-box mb-3"
                  style={{
                    border: "2px dashed rgba(255,255,255,0.85)",
                    padding: "10px 12px",
                    transform: "rotate(-0.4deg)",
                    transformOrigin: "top left",
                    width: "calc(100% + 24px)",
                  }}
                >
                  {[
                    { top: "-4px", left: "-4px" },
                    { top: "-4px", right: "-4px" },
                    { bottom: "-4px", left: "-4px" },
                    { bottom: "-4px", right: "-4px" },
                    { top: "-4px", left: "calc(50% - 4px)" },
                    { bottom: "-4px", left: "calc(50% - 4px)" },
                    { top: "calc(50% - 4px)", left: "-4px" },
                    { top: "calc(50% - 4px)", right: "-4px" },
                  ].map((pos, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        width: "7px",
                        height: "7px",
                        background: "#020403",
                        border: "1.5px solid white",
                        ...pos,
                      }}
                    />
                  ))}
                  <p className="text-white font-medium leading-[1.4]" style={{ fontSize: "12px" }}>Se você precisa de</p>
                  <p className="font-bold text-[#00ff88] leading-[1.3]" style={{ fontSize: "14px" }}>design, autoridade</p>
                  <p className="font-bold text-[#00ff88] leading-[1.3]" style={{ fontSize: "14px" }}>e posicionamento...</p>
                </div>

                {/* WhatsApp button — full width of left column */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-hero-btn w-full inline-flex items-center justify-center gap-2 bg-[#00a166] hover:bg-[#00c17a] text-white rounded-xl font-boldonse shadow-[0_5px_18px_rgba(0,161,102,0.5)] transition-all duration-300 active:scale-95"
                  style={{ padding: "10px 14px", fontSize: "14px" }}
                >
                  <img src={whatsappLogo} alt="WhatsApp" className="object-contain shrink-0" style={{ width: "18px", height: "18px" }} />
                  Fale comigo!
                </a>

                {/* Spacer to allow photo to show below button */}
                <div style={{ height: "40px" }} aria-hidden />
              </div>
            </div>

            {/* Ribbon — full width, zero margin-top */}
            <div className="relative w-full animate-hero-ribbon">
              <img
                src={ribbonBannerBg}
                alt=""
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center font-boldonse text-white tracking-tight lowercase select-none animate-hero-ribbon-text drop-shadow-md" style={{ fontSize: "clamp(13px, 4vw, 18px)" }}>
                designer & diretor de arte
              </span>
            </div>

            {/* Social icons — centered below ribbon */}
            <div className="flex items-center justify-center gap-4 mt-4 mb-1 animate-hero-socials">
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
                  className="w-9 h-9 rounded-full bg-[#141517] border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-[#00ff88] transition-all hover:scale-110 shadow-sm"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          {/* ── DESKTOP LAYOUT (≥ md): Original overlapping layout ── */}
          <div className="relative w-full hidden md:block">
            {/* Photo */}
            <div
              className="relative ml-auto w-[70%] md:w-[68%] z-20 pointer-events-none animate-hero-photo"
              style={{ marginRight: "3%" }}
            >
              <img
                src={pecinPhotoCutout}
                alt="Leonardo Pecin - Designer e Diretor de Arte"
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {/* Left panel */}
            <div
              className="absolute z-10 flex flex-col items-start"
              style={{ left: "9%", top: "20%", width: "37%" }}
            >
              <h1
                className="font-boldonse text-white drop-shadow-lg whitespace-nowrap animate-hero-title"
                style={{
                  fontSize: "clamp(20px, 3.3vw, 38px)",
                  lineHeight: 1.15,
                  marginBottom: "clamp(16px, 1.6vw, 24px)",
                  transform: "rotate(-1.7deg)",
                  transformOrigin: "left bottom",
                  marginLeft: "-5px",
                }}
              >
                Opa, tudo bom?
              </h1>

              <div className="w-full animate-hero-box">
                <div
                  className="relative w-full bg-black/60"
                  style={{
                    border: "2px dashed rgba(255,255,255,0.85)",
                    padding: "clamp(10px, 1.5vw, 20px) clamp(10px, 1.6vw, 22px)",
                    marginBottom: "clamp(14px, 1.4vw, 22px)",
                    transform: "rotate(-0.8deg)",
                    transformOrigin: "top left",
                  }}
                >
                  {[
                    { top: "-5px", left: "-5px" },
                    { top: "-5px", right: "-5px" },
                    { bottom: "-5px", left: "-5px" },
                    { bottom: "-5px", right: "-5px" },
                    { top: "-5px", left: "calc(50% - 5px)" },
                    { bottom: "-5px", left: "calc(50% - 5px)" },
                    { top: "calc(50% - 5px)", left: "-5px" },
                    { top: "calc(50% - 5px)", right: "-5px" },
                  ].map((pos, i) => (
                    <span
                      key={i}
                      style={{
                        position: "absolute",
                        width: "clamp(8px, 0.8vw, 11px)",
                        height: "clamp(8px, 0.8vw, 11px)",
                        background: "#020403",
                        border: "1.5px solid white",
                        ...pos,
                      }}
                    />
                  ))}
                  <p className="text-white font-medium whitespace-nowrap" style={{ fontSize: "clamp(12px, 1.65vw, 24px)", lineHeight: 1.4 }}>
                    Se você precisa de
                  </p>
                  <p className="font-bold text-[#00ff88] whitespace-nowrap" style={{ fontSize: "clamp(15px, 2.0vw, 30px)", lineHeight: 1.35 }}>
                    design, autoridade
                  </p>
                  <p className="font-bold text-[#00ff88] whitespace-nowrap" style={{ fontSize: "clamp(15px, 2.0vw, 30px)", lineHeight: 1.35 }}>
                    e posicionamento...
                  </p>
                </div>
              </div>

              <div
                className="w-full animate-hero-btn"
                style={{ marginBottom: "clamp(14px, 1.4vw, 22px)" }}
              >
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-boldonse whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 bg-[#00a166] hover:bg-[#00c17a] text-white rounded-xl sm:rounded-2xl shadow-[0_8px_25px_rgba(0,161,102,0.45)] hover:shadow-[0_12px_35px_rgba(0,161,102,0.65)] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    width: "100%",
                    padding: "clamp(10px, 1.4vw, 18px) clamp(8px, 1.6vw, 22px)",
                    fontSize: "clamp(13px, 1.7vw, 26px)",
                    lineHeight: 1,
                  }}
                >
                  <img
                    src={whatsappLogo}
                    alt="WhatsApp"
                    className="shrink-0"
                    style={{ width: "clamp(26px, 3.2vw, 48px)", height: "clamp(26px, 3.2vw, 48px)", objectFit: "contain" }}
                  />
                  <span className="whitespace-nowrap">Fale comigo!</span>
                </a>
              </div>

              <div
                className="w-full flex items-center justify-center animate-hero-socials"
                style={{ gap: "clamp(8px, 1.2vw, 18px)" }}
              >
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
                    className="rounded-full bg-[#141517] border border-white/20 flex items-center justify-center text-white/80 hover:text-white hover:border-[#00ff88] transition-all hover:scale-110 shadow-sm"
                    style={{ width: "clamp(28px, 2.8vw, 42px)", height: "clamp(28px, 2.8vw, 42px)" }}
                  >
                    <Icon style={{ width: "52%", height: "52%" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>
          {/* Ribbon — desktop only (mobile has its own above) */}
          <div className="hidden md:block relative w-full max-w-4xl mx-auto md:-mt-[6%] z-30 animate-hero-ribbon">
            <div className="relative w-full flex items-center justify-center">
              <img
                src={ribbonBannerBg}
                alt=""
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center font-boldonse text-white sm:text-xl md:text-2xl lg:text-[34px] tracking-tight lowercase select-none animate-hero-ribbon-text drop-shadow-md">
                designer & diretor de arte
              </span>
            </div>
          </div>
        </div>

        {/* Intro text directly below the banner */}
        <div className="text-center mt-10 sm:mt-12 mb-10 sm:mb-12 px-4 animate-hero-socials">
          <p className="text-sm sm:text-base md:text-lg text-white font-normal leading-relaxed">
            <span className="text-[#00ff88] font-bold">Prazer, eu me chamo Leo!</span>{" "}
            Sou apaixonado por dar vida a projetos através da arte e do design.
          </p>
        </div>

        {/* Infinite Carousel Showcase (Full-width fluido) */}
        <div className="w-full my-4">
          <InfiniteCarousel />
        </div>

        {/* Secondary description below carousel */}
        <div className="text-center max-w-3xl mx-auto px-4 mt-6">
          <p className="text-sm sm:text-base md:text-lg text-white/90 leading-relaxed">
            <span className="text-white/80">Graduado em Design e pós graduado em Direção de arte, atuo no visual desde 2019 e </span>
            <span className="text-[#00ff88] font-bold">trabalho desenvolvendo projetos de todo tipo que possa imaginar:</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
