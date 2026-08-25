import whatsappLogo from "@/assets/whatsapp-logo.png";
import pecinPhotoCutout from "@/assets/redesign/pecin-photo-cutout.png";
import ribbonBannerBg from "@/assets/redesign/ribbon-banner-bg.png";
import mysticalBg from "@/assets/redesign/mystical-bg.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { Instagram, Linkedin } from "lucide-react";
import BehanceIcon from "@/components/icons/BehanceIcon";
import InfiniteCarousel from "@/components/InfiniteCarousel";
import { useLanguage } from "@/contexts/LanguageContext";

const Hero = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  /* ════════════════════════════════════════════════════════════════════════════════
     🎛️ CONTROLES DE AJUSTE MANUAL - HERO MOBILE (< md)
     Altere as porcentagens (%) e valores abaixo para calibrar na mão o layout mobile:
     ════════════════════════════════════════════════════════════════════════════════ */
  const mobileHero = {
    // 0. ESPAÇAMENTO INICIAL DO TOPO (Abaixo do Logo e menu PT/EN)
    espacoInicialTopo: "10px",       // Espaço extra antes do "Opa, tudo bom?" para não encostar na barra superior

    // 1. PROPORÇÕES E POSIÇÃO HORIZONTAL/VERTICAL (Colunas)
    colunaTextoLargura: "48%",       // Largura do bloco de texto da esquerda (ex: 45%, 50%, 58%)
    colunaTextoMargemEsquerda: "6.5%", // Deslocamento do bloco para o centro (ex: 0%, 4%, 6%, 10%)
    fotoLargura: "30%",              // Largura do container da foto à direita (ex: 30%, 45%, 60%)
    fotoEscalaZoom: "220%",          // Zoom/Tamanho da foto em porcentagem (ex: "100%", "150%", "220%")
    fotoPosicaoVertical: "-25px",      // 🔥 NOVO: Altura / Posição vertical da foto (ex: "0px", "-20px" p/ subir, "15px" p/ descer)
    fotoDeslocamentoDireita: "-3%",   // Posição horizontal da foto à direita (ex: 0%, -3%, 5%)

    // 2. TÍTULO "Opa, tudo bom?"
    tituloTamanho: "clamp(15px, 4.8vw, 20px)", // Tamanho da fonte do título
    tituloMargemInferior: "13px",     // Distância do título até a caixa pontilhada

    // 3. CAIXA PONTILHADA "Se você precisa de..."
    caixaLarguraExtra: "0px",       // Extensão da caixa sob a foto (largura = 100% + este valor)
    caixaPadding: "10px 12px",       // Espaçamento interno da caixa
    caixaMargemInferior: "10px",     // Distância da caixa até o botão WhatsApp

    // 4. BOTÃO WHATSAPP "Fale comigo!"
    botaoPadding: "10px 14px",       // Padding interno do botão
    botaoFonteTamanho: "14px",       // Tamanho do texto do botão
    botaoIconeTamanho: "18px",       // Tamanho do ícone do WhatsApp
    espacoAbaixoBotao: "22px",       // Distância do botão até a faixa verde (revela a foto do Leo)

    // 5. FAIXA VERDE "designer & diretor de arte"
    faixaMargemSuperior: "-10px",      // Distância antes da faixa verde
    faixaTextoTamanho: "clamp(13px, 4vw, 18px)", // Tamanho da fonte na faixa

    // 6. ÍCONES SOCIAIS (Instagram, LinkedIn, Behance)
    sociaisEspacoTopo: "12px",       // Distância dos ícones abaixo da faixa verde
    sociaisEspacoEmbaixo: "6px",     // Distância abaixo dos ícones sociais
    sociaisTamanhoIcone: "26px",     // Tamanho do círculo dos ícones

    // 7. TEXTO DE APRESENTAÇÃO "Prazer, eu me chamo Leo!"
    apresentacaoEspacoTopo: "10px",  // Distância acima do texto "Prazer..."
    apresentacaoEspacoEmbaixo: "8px",// Distância abaixo do texto até o carrossel

    // 8. CARROSSEL E TEXTO FINAL
    carrosselMargemVertical: "2px",  // Margem vertical do carrossel no mobile
    textoFinalEspacoTopo: "10px",    // Distância do texto "Graduado em Design..." abaixo do carrossel
  };

  return (
    <section
      id="hero"
      className="relative overflow-hidden pt-20 sm:pt-24 md:pt-28 pb-6 sm:pb-12 bg-[#0a0c0e]"
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
        <div className="relative w-full max-w-5xl mx-auto my-1 sm:my-2">

          {/* ── MOBILE LAYOUT (< md): 100% calibrável via objeto mobileHero acima ── */}
          <div className="flex flex-col md:hidden">

            {/* Main content block: left text + right photo (absolute) */}
            <div className="relative w-full overflow-hidden" style={{ paddingTop: mobileHero.espacoInicialTopo }}>

              {/* Photo — absolute top-right (Camada acima dos elementos da esquerda, mas abaixo da faixa verde) */}
              <div
                className="absolute pointer-events-none animate-hero-photo z-10"
                style={{
                  top: mobileHero.fotoPosicaoVertical,
                  width: mobileHero.fotoLargura,
                  right: mobileHero.fotoDeslocamentoDireita,
                  bottom: 0,
                }}
              >
                <img
                  src={pecinPhotoCutout}
                  alt="Leonardo Pecin - Designer e Diretor de Arte"
                  className="w-full h-full object-contain object-top drop-shadow-2xl transition-transform duration-200"
                  style={{
                    transform: `scale(${parseFloat(mobileHero.fotoEscalaZoom) / 100})`,
                    transformOrigin: "top right",
                  }}
                  loading="eager"
                  fetchPriority="high"
                />
              </div>

              {/* Left column: title + box + button (Camada base z-0) */}
              <div
                className="relative z-0 flex flex-col"
                style={{
                  width: mobileHero.colunaTextoLargura,
                  marginLeft: mobileHero.colunaTextoMargemEsquerda,
                }}
              >

                {/* Title — 1 linha, fonte calibrada para caber na coluna */}
                <h1
                  className="font-boldonse text-white drop-shadow-lg animate-hero-title"
                  style={{
                    fontSize: mobileHero.tituloTamanho,
                    lineHeight: 1.05,
                    transform: "rotate(-1deg)",
                    transformOrigin: "left bottom",
                    whiteSpace: "nowrap",
                    marginBottom: mobileHero.tituloMargemInferior,
                  }}
                >
                  {t("hero.greeting")}
                </h1>

                {/* Dashed selection box — sangra levemente sob a foto */}
                <div
                  className="relative bg-black/60 animate-hero-box"
                  style={{
                    border: "2px dashed rgba(255,255,255,0.85)",
                    padding: mobileHero.caixaPadding,
                    transform: "rotate(-0.4deg)",
                    transformOrigin: "top left",
                    width: `calc(100% + ${mobileHero.caixaLarguraExtra})`,
                    marginBottom: mobileHero.caixaMargemInferior,
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
                  <p className="text-white font-medium leading-[1.4]" style={{ fontSize: "12px" }}>{t("hero.box_line1")}</p>
                  <p className="font-bold text-[#00ff88] leading-[1.3]" style={{ fontSize: "14px" }}>{t("hero.box_line2")}</p>
                  <p className="font-bold text-[#00ff88] leading-[1.3]" style={{ fontSize: "14px" }}>{t("hero.box_line3")}</p>
                </div>

                {/* WhatsApp button — full width of left column */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="animate-hero-btn w-full inline-flex items-center justify-center gap-2 bg-[#00a166] hover:bg-[#00c17a] text-white rounded-xl font-boldonse shadow-[0_5px_18px_rgba(0,161,102,0.5)] transition-all duration-300 active:scale-95 pointer-events-auto"
                  style={{ padding: mobileHero.botaoPadding, fontSize: mobileHero.botaoFonteTamanho }}
                >
                  <img src={whatsappLogo} alt="WhatsApp" className="object-contain shrink-0" style={{ width: mobileHero.botaoIconeTamanho, height: mobileHero.botaoIconeTamanho }} />
                  {t("hero.cta_whatsapp")}
                </a>

                {/* Spacer to allow photo to show below button */}
                <div style={{ height: mobileHero.espacoAbaixoBotao }} aria-hidden />
              </div>
            </div>

            {/* Ribbon — full width (Camada superior z-20) */}
            <div className="relative w-full z-20 animate-hero-ribbon" style={{ marginTop: mobileHero.faixaMargemSuperior }}>
              <img
                src={ribbonBannerBg}
                alt=""
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center font-boldonse text-white tracking-tight lowercase select-none animate-hero-ribbon-text drop-shadow-md" style={{ fontSize: mobileHero.faixaTextoTamanho }}>
                {t("hero.ribbon")}
              </span>
            </div>

            {/* Social icons — centered below ribbon */}
            <div
              className="flex items-center justify-center gap-4 animate-hero-socials"
              style={{ marginTop: mobileHero.sociaisEspacoTopo, marginBottom: mobileHero.sociaisEspacoEmbaixo }}
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
                  style={{ width: mobileHero.sociaisTamanhoIcone, height: mobileHero.sociaisTamanhoIcone }}
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
                {t("hero.greeting")}
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
                    {t("hero.box_line1")}
                  </p>
                  <p className="font-bold text-[#00ff88] whitespace-nowrap" style={{ fontSize: "clamp(15px, 2.0vw, 30px)", lineHeight: 1.35 }}>
                    {t("hero.box_line2")}
                  </p>
                  <p className="font-bold text-[#00ff88] whitespace-nowrap" style={{ fontSize: "clamp(15px, 2.0vw, 30px)", lineHeight: 1.35 }}>
                    {t("hero.box_line3")}
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
                  <span className="whitespace-nowrap">{t("hero.cta_whatsapp")}</span>
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
          {/* Ribbon — desktop only */}
          <div className="hidden md:block relative w-full max-w-4xl mx-auto md:-mt-[6%] z-30 animate-hero-ribbon">
            <div className="relative w-full flex items-center justify-center">
              <img
                src={ribbonBannerBg}
                alt=""
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center font-boldonse text-white sm:text-xl md:text-2xl lg:text-[34px] tracking-tight lowercase select-none animate-hero-ribbon-text drop-shadow-md">
                {t("hero.ribbon")}
              </span>
            </div>
          </div>
        </div>

        {/* Intro text directly below the banner */}
        <div
          className="text-center px-4 animate-hero-socials"
          style={{
            marginTop: "clamp(8px, 2.5vw, 40px)",
            marginBottom: "clamp(8px, 2.2vw, 36px)",
          }}
        >
          <p className="text-xs sm:text-base md:text-lg text-white font-normal leading-relaxed">
            <span className="text-[#00ff88] font-bold">{t("hero.intro_p1")}</span>{" "}
            {t("hero.intro_p2")}
          </p>
        </div>

        {/* Infinite Carousel Showcase (Full-width fluido com espaço reservado) */}
        <div className="w-full min-h-[204px] sm:min-h-[368px] md:min-h-[512px] animate-hero-carousel" style={{ marginTop: "clamp(2px, 1vw, 16px)", marginBottom: "clamp(2px, 1vw, 16px)" }}>
          <InfiniteCarousel />
        </div>

        {/* Secondary description below carousel */}
        <div className="text-center max-w-3xl mx-auto px-4" style={{ marginTop: "clamp(8px, 2vw, 24px)" }}>
          <p className="text-xs sm:text-base md:text-lg text-white/90 leading-relaxed">
            <span className="text-white/80">{t("hero.outro_p1")}</span>
            <span className="text-[#00ff88] font-bold">{t("hero.outro_p2")}</span>
          </p>
        </div>
      </div>
    </section>
  );
};

export default Hero;
