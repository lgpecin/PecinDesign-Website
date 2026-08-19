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
        {/* Hero Visual Container (Conjunto: Foto + Painel Esquerdo + Faixa Inferior) */}
        <div className="relative w-full max-w-5xl mx-auto my-2">
          {/* ── Bloco Superior: Foto do Pecin (Aumentada em 20%) + Textos/Box (Esquerda) ── */}
          <div className="relative w-full">
            {/* Foto isolada do Leonardo Pecin (5% mais perto do centro) */}
            <div
              className="relative ml-auto w-[74%] sm:w-[70%] md:w-[68%] z-20 pointer-events-none animate-hero-photo"
              style={{
                marginRight: "3%", /* Traz a foto 5% mais perto do centro */
              }}
            >
              <img
                src={pecinPhotoCutout}
                alt="Leonardo Pecin - Designer e Diretor de Arte"
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
                fetchPriority="high"
              />
            </div>

            {/* ========================================================================= */}
            {/* PAINEL ESQUERDO (Título, Caixa de Seleção, Botão WhatsApp e Ícones Sociais) */}
            {/* ========================================================================= */}
            <div
              className="absolute z-10 flex flex-col items-start"
              style={{
                left: "9%",          /* Mais próximo do centro para o cotovelo sobrepor */
                top: "20%",          /* Posição vertical do bloco em relação à foto */
                width: "37%",        /* Largura diminuída do box e do botão */
              }}
            >
              {/* 1. TÍTULO: "Opa, tudo bom?" (Animado com desfoque e surgimento) */}
              <h1
                className="font-boldonse text-white drop-shadow-lg whitespace-nowrap animate-hero-title"
                style={{
                  fontSize: "clamp(20px, 3.3vw, 38px)",     /* Fonte fluida */
                  lineHeight: 1.15,
                  marginBottom: "clamp(16px, 1.6vw, 24px)", /* Distância até a caixa de seleção */
                  transform: "rotate(-1.7deg)",             /* Leve inclinação */
                  transformOrigin: "left bottom",
                  marginLeft: "-5px",                       /* Recuo de 5px para a esquerda em relação ao box */
                }}
              >
                Opa, tudo bom?
              </h1>

              {/* 2. CAIXA DE SELEÇÃO PONTILHADA (Animada individualmente) */}
              <div className="w-full animate-hero-box">
                <div
                  className="relative w-full bg-black/60"
                  style={{
                    border: "2px dashed rgba(255,255,255,0.85)", /* Borda pontilhada branca */
                    padding: "clamp(10px, 1.5vw, 20px) clamp(10px, 1.6vw, 22px)", /* Espaçamento interno */
                    marginBottom: "clamp(14px, 1.4vw, 22px)",     /* Distância até o botão WhatsApp */
                    transform: "rotate(-0.8deg)",                  /* Inclinação sutil */
                    transformOrigin: "top left",
                  }}
                >
                  {/* 8 Pontos/Alças de redimensionamento nos cantos e meios */}
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

                  {/* Texto em 3 linhas fixas */}
                  <p
                    className="text-white font-medium whitespace-nowrap"
                    style={{
                      fontSize: "clamp(12px, 1.65vw, 24px)", /* Tamanho do texto branco */
                      lineHeight: 1.4,
                    }}
                  >
                    Se você precisa de
                  </p>
                  <p
                    className="font-bold text-[#00ff88] whitespace-nowrap"
                    style={{
                      fontSize: "clamp(15px, 2.0vw, 30px)",  /* Tamanho do texto verde */
                      lineHeight: 1.35,
                    }}
                  >
                    design, autoridade
                  </p>
                  <p
                    className="font-bold text-[#00ff88] whitespace-nowrap"
                    style={{
                      fontSize: "clamp(15px, 2.0vw, 30px)",  /* Tamanho do texto verde */
                      lineHeight: 1.35,
                    }}
                  >
                    e posicionamento...
                  </p>
                </div>
              </div>

              {/* 3. BOTÃO WHATSAPP "Fale comigo!" (Animado de forma independente) */}
              <div
                className="w-full animate-hero-btn"
                style={{
                  marginBottom: "clamp(14px, 1.4vw, 22px)", /* Distância até os ícones sociais */
                  transform: "rotate(0deg)",
                  transformOrigin: "top left",
                }}
              >
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-boldonse whitespace-nowrap flex items-center justify-center gap-2 sm:gap-3 bg-[#00a166] hover:bg-[#00c17a] text-white rounded-xl sm:rounded-2xl shadow-[0_8px_25px_rgba(0,161,102,0.45)] hover:shadow-[0_12px_35px_rgba(0,161,102,0.65)] transition-all duration-300 hover:scale-[1.02]"
                  style={{
                    width: "100%",
                    padding: "clamp(10px, 1.4vw, 18px) clamp(8px, 1.6vw, 22px)",
                    fontSize: "clamp(13px, 1.7vw, 26px)",   /* Tamanho de fonte que se adapta sem quebrar */
                    lineHeight: 1,
                  }}
                >
                  <img
                    src={whatsappLogo}
                    alt="WhatsApp"
                    className="shrink-0"
                    style={{
                      width: "clamp(26px, 3.2vw, 48px)",   /* Ícone aumentado para destaque proporcional */
                      height: "clamp(26px, 3.2vw, 48px)",
                      objectFit: "contain",
                    }}
                  />
                  <span className="whitespace-nowrap">Fale comigo!</span>
                </a>
              </div>

              {/* 4. ÍCONES DE REDES SOCIAIS (Centralizados abaixo do botão) */}
              <div
                className="w-full flex items-center justify-center animate-hero-socials"
                style={{
                  transform: "rotate(+1deg)",
                  gap: "clamp(8px, 1.2vw, 18px)",             /* Espaçamento entre os círculos */
                }}
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
                    style={{
                      width: "clamp(28px, 2.8vw, 42px)",     /* Largura e altura de cada bolinha */
                      height: "clamp(28px, 2.8vw, 42px)",
                    }}
                  >
                    <Icon style={{ width: "52%", height: "52%" }} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          {/* ── Bloco Inferior: Faixa "designer * diretor de arte" (Centralizada e Animada a partir do centro) ── */}
          <div className="relative w-full max-w-4xl mx-auto -mt-[8%] sm:-mt-[7%] md:-mt-[6%] z-30 animate-hero-ribbon">
            <div className="relative w-full flex items-center justify-center">
              <img
                src={ribbonBannerBg}
                alt=""
                className="w-full h-auto block drop-shadow-2xl"
                loading="eager"
              />
              <span className="absolute inset-0 flex items-center justify-center font-boldonse text-white text-xs sm:text-lg md:text-2xl lg:text-[34px] tracking-tight lowercase select-none animate-hero-ribbon-text drop-shadow-md">
                designer & diretor de arte
              </span>
            </div>
          </div>
        </div>

        {/* Intro text directly below the banner (Espaçamento ajustado) */}
        <div className="text-center mt-10 sm:mt-12 mb-10 sm:mb-12 px-4 animate-hero-socials">
          <p className="text-sm sm:text-base md:text-lg text-white font-normal leading-relaxed">
            <span className="text-[#00ff88] font-bold">Prazer, eu me chamo Leo!</span> Sou apaixonado por dar vida
            <br />
            a projetos através da arte e do design.
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
