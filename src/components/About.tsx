import { useSiteSettings } from "@/hooks/useSiteSettings";
import { AnimatedSection } from "@/components/AnimatedSection";

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
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="container mx-auto px-4 sm:px-6 relative z-10 max-w-6xl">
        {/* Two-Column Grid matching reference print */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-14 items-center">
          
          {/* Left Column: Timeline */}
          <div className="lg:col-span-7 relative">
            {/* Continuous Vertical White Line */}
            <div
              className="absolute left-[24px] sm:left-[28px] top-6 bottom-4 w-[3.5px] bg-white rounded-full pointer-events-none z-0"
              aria-hidden="true"
            />

            <div className="space-y-6 sm:space-y-8 relative z-10">
              {timelineItems.map((item, index) => (
                <AnimatedSection key={index} index={index}>
                  <div className="relative">
                    {/* Yellow/Lime Year Badge */}
                    <div className="inline-flex items-center justify-center bg-[#ccff00] text-[#053825] font-bold font-boldonse text-lg sm:text-2xl px-8 sm:px-10 py-1.5 sm:py-2 rounded-full shadow-md mb-3.5">
                      {item.year}
                    </div>
                    {/* Description Text */}
                    <p className="text-white text-sm sm:text-base md:text-[16px] leading-relaxed font-normal pl-11 sm:pl-14 max-w-xl">
                      {item.text}
                    </p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
          </div>

          {/* Right Column: Rotated White Frame + Overlapping Dark WhatsApp Button */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center pt-8 lg:pt-0">
            <AnimatedSection index={2}>
              <div className="relative w-full max-w-[360px] sm:max-w-[400px] md:max-w-[420px] mx-auto flex flex-col items-center">
                
                {/* White Rotated Card Frame (Dimensão fixa para photo mockup) */}
                <div
                  className="w-full h-[460px] sm:h-[520px] md:h-[560px] bg-white rounded-[36px] sm:rounded-[44px] shadow-[0_25px_60px_rgba(0,0,0,0.5)] transition-transform duration-500 hover:scale-[1.01] flex items-center justify-center overflow-hidden border-4 border-white/20"
                  style={{
                    transform: "rotate(2deg)",
                    transformOrigin: "center center",
                  }}
                >
                  {/* Espaço reservado para futura foto */}
                  <div className="w-full h-full bg-white flex items-center justify-center">
                    {/* Placeholder limpo para foto */}
                  </div>
                </div>

                {/* Overlapping Dark Floating WhatsApp Button */}
                <a
                  href={whatsappLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="absolute -bottom-5 -right-3 sm:-bottom-7 sm:-right-6 z-20 bg-[#141517] hover:bg-[#1a1c1e] border border-white/15 text-[#ccff00] rounded-[22px] sm:rounded-[26px] px-6 sm:px-8 py-3.5 sm:py-4.5 flex items-center gap-3 sm:gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.75)] transition-all duration-300 hover:scale-105 active:scale-95 group cursor-pointer whitespace-nowrap"
                  style={{
                    transform: "rotate(-2.8deg)",
                    transformOrigin: "center center",
                  }}
                >
                  {/* WhatsApp SVG in Neon Green */}
                  <svg
                    viewBox="0 0 308 308"
                    fill="#ccff00"
                    className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0 drop-shadow-sm group-hover:scale-110 transition-transform duration-300"
                  >
                    <path d="M227.904,176.981c-9.6-4.8-56.672-27.936-65.44-31.104c-8.768-3.168-15.136-4.8-21.504,4.8 c-6.368,9.6-24.672,31.104-30.24,37.472c-5.568,6.368-11.136,7.168-20.736,2.368c-9.6-4.8-40.544-14.944-77.216-47.648 c-28.544-25.44-47.808-56.896-53.376-66.496c-5.568-9.6-0.576-14.816,4.224-19.584c4.32-4.32,9.6-11.136,14.4-16.704 c4.8-5.568,6.368-9.6,9.6-15.968c3.168-6.368,1.6-11.968-0.8-16.768c-2.4-4.8-21.504-51.84-29.472-71.04 c-7.776-18.688-15.68-16.16-21.504-16.448c-5.568-0.288-11.936-0.288-18.304-0.288c-6.368,0-16.736,2.4-25.504,11.968 c-8.768,9.6-33.472,32.704-33.472,79.776c0,47.072,34.272,92.576,39.04,98.944c4.8,6.368,67.456,102.976,163.424,144.352 c22.816,9.856,40.64,15.744,54.56,20.16c22.944,7.296,43.84,6.272,60.352,3.808c18.432-2.752,56.672-23.168,64.64-45.504 c7.968-22.336,7.968-41.472,5.568-45.504C239.04,184.161,237.504,181.761,227.904,176.981z"/>
                    <path d="M154,0C69.088,0,0,69.088,0,154c0,27.104,7.072,53.6,20.512,76.896L0,308l79.296-20.768 C101.888,299.712,127.52,308,154,308c84.912,0,154-69.088,154-154C308,69.088,238.912,0,154,0z M154,281.6 c-23.424,0-46.368-6.272-66.432-18.144l-4.768-2.816l-49.344,12.928l13.184-48.096l-3.104-4.928 C30.688,199.936,24.4,177.344,24.4,154C24.4,82.528,82.528,24.4,154,24.4c71.472,0,129.6,58.128,129.6,129.6 C283.6,225.472,225.472,281.6,154,281.6z"/>
                  </svg>
                  <span className="font-boldonse text-2xl sm:text-3xl md:text-4xl text-[#ccff00] tracking-wide whitespace-nowrap">
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
