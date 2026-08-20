import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AnimatedSection } from "@/components/AnimatedSection";
import aboutPhotoPlaceholder from "@/assets/about-photo-placeholder.png";
import WhatsAppIcon from "@/components/icons/WhatsAppIcon";

const timelineItems = [
  {
    year: "2019",
    text: "Sempre brinquei de contar histórias, desenhar e até mexer com programas de design. 2019 foi quando comecei a atuar na área e em 2021 iniciei minha graduação em design.",
  },
  {
    year: "2024",
    text: "Após finalizar a faculdade e emendar em uma pós graduação em direção de arte. Eu já tinha percorrido alguns estágios e freelances onde desenvolvi diversas habilidades.",
  },
  {
    year: "2026",
    text: "Após seis anos no mercado, criei minha própria marca e me lancei ao mercado dos autônomos, onde consegui meu primeiro grande cliente, o Grupo Barigui, onde atuo até hoje como designer das Marcas Premium (Ford, BMW, Audi, Mini, Motorrad).",
  },
  {
    year: "Sua vez",
    text: "Agora é a vez do seu projeto ganhar vida e dar o próximo passo no mercado.",
  },
];

const About = () => {
  const { settings } = useSiteSettings();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  return (
    <section
      id="about"
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{
        backgroundColor: "#053825",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.08) 1.5px, transparent 1.5px)`,
        backgroundSize: "26px 26px",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 relative z-10 max-w-6xl">
        {/* Two-Column Grid matching reference design */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Timeline */}
          <div className="lg:col-span-7 relative">
            {/* Continuous Vertical White Line */}
            <div
              className="absolute left-[22px] sm:left-[26px] top-6 bottom-4 w-[3.5px] bg-white rounded-full pointer-events-none z-0"
              aria-hidden="true"
            />

            <div className="space-y-6 sm:space-y-8 relative z-10">
              {timelineItems.map((item, index) => (
                <AnimatedSection key={index} index={index}>
                  <div className="relative">
                    {/* Yellow/Lime Year Badge */}
                    <div className="inline-flex items-center justify-center bg-[#ccff00] text-[#053825] font-bold font-boldonse text-xl sm:text-2xl md:text-3xl px-8 sm:px-10 py-1.5 sm:py-2 rounded-full shadow-md mb-3.5 select-none">
                      {item.year}
                    </div>
                    {/* Description Text */}
                    <p className="text-white text-sm sm:text-base md:text-[16.5px] leading-relaxed font-normal pl-9 sm:pl-12 max-w-xl">
                      {item.text}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Right Column: Photo Frame Placeholder + Overlapping WhatsApp Button */}
          <div className="lg:col-span-5 flex justify-center items-center w-full pt-10 lg:pt-0">
            <AnimatedSection index={2} className="w-full">
              <div className="relative w-full max-w-[340px] sm:max-w-[380px] md:max-w-[420px] mx-auto">
                
                {/* Moldura da Foto / Placeholder Image */}
                <div className="w-full relative">
                  <img
                    src={aboutPhotoPlaceholder}
                    alt="Foto Leonardo Pecin"
                    className="w-full h-auto object-contain drop-shadow-[0_20px_45px_rgba(0,0,0,0.5)] block select-none pointer-events-none"
                    draggable={false}
                  />
                </div>

                {/* Botão Sobreposto 'Fale comigo!' no canto inferior direito */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-4 -right-2 sm:-bottom-8 sm:-right-10 md:-bottom-9 md:-right-14 z-20 bg-[#121316] hover:bg-[#191b1e] border border-white/15 text-[#ccff00] rounded-[18px] sm:rounded-[22px] md:rounded-[26px] px-4 sm:px-6 md:px-7 py-2.5 sm:py-3.5 md:py-4 flex items-center gap-2.5 sm:gap-3 md:gap-3.5 shadow-[0_20px_45px_rgba(0,0,0,0.9)] transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer whitespace-nowrap"
                  style={{
                    transform: "rotate(-2.5deg)",
                  }}
                >
                  {/* WhatsApp Vector Icon Oficial com traço nítido */}
                  <WhatsAppIcon className="w-6 h-6 sm:w-8 sm:h-8 md:w-10 md:h-10 text-[#ccff00] shrink-0 group-hover:scale-110 transition-transform duration-300" />
                  
                  <span className="font-boldonse text-xl sm:text-2xl md:text-3xl lg:text-4xl text-[#ccff00] tracking-wide whitespace-nowrap">
                    Fale comigo!
                  </span>
                </a>
              </div>
            </AnimatedSection>
          </div>

        </div>
      </div>
    </section>
  );
};

export default About;
