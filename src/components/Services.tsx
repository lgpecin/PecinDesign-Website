import { useState } from "react";
import { X, Sparkles, Globe, Box, Eye, Share2, PlusCircle, CheckCircle2 } from "lucide-react";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useInView } from "@/hooks/use-in-view";
import whatsappLogo from "@/assets/whatsapp-logo.png";

// Service sticker assets
import serviceBranding from "@/assets/redesign/service-branding.png";
import serviceWebdesign from "@/assets/redesign/service-webdesign.png";
import serviceProductdesign from "@/assets/redesign/service-productdesign.png";
import serviceDirecaodearte from "@/assets/redesign/service-direcaodearte.png";
import serviceSocialmedia from "@/assets/redesign/service-socialmedia.png";
import serviceEmuitomais from "@/assets/redesign/service-emuitomais.png";

// Corner dots decorations
import dotsVariant1 from "@/assets/redesign/dots-variant-1.png";
import dotsVariant2 from "@/assets/redesign/dots-variant-2.png";
import dotsVariant3 from "@/assets/redesign/dots-variant-3.png";
import dotsVariant4 from "@/assets/redesign/dots-variant-4.png";

interface ServiceItem {
  id: string;
  title: string;
  subtitle: string;
  src: string;
  bgColor: string;
  textColor: string;
  btnBg: string;
  btnText: string;
  description: string;
  deliverables: string[];
  Icon: React.ElementType;
}

const servicesData: ServiceItem[] = [
  {
    id: "branding",
    title: "Branding",
    subtitle: "Construção de Marcas Poderosas",
    src: serviceBranding,
    bgColor: "#C6F806", // Lime green
    textColor: "#064e3b", // Dark green
    btnBg: "#18181b",
    btnText: "#ffffff",
    description:
      "Construção completa de marcas autênticas e memoráveis: desde o diagnóstico estratégico, DNA da marca e tom de voz, até a identidade visual completa, paleta cromática, tipografia e manual com todas as regras de aplicação.",
    deliverables: [
      "Diagnóstico e Estratégia de Posicionamento",
      "Logotipo, Símbolos e Identidade Visual",
      "Manual de Identidade Visual Completo",
      "Aplicações Digitais e Materiais Institucionais",
    ],
    Icon: Sparkles,
  },
  {
    id: "webdesign",
    title: "Web Design",
    subtitle: "Sites, apps, landing pages",
    src: serviceWebdesign,
    bgColor: "#00C090", // Emerald Teal
    textColor: "#043828",
    btnBg: "#18181b",
    btnText: "#ffffff",
    description:
      "Criação de websites institucionais modernos, landing pages de altíssima conversão, portfólios e interfaces de aplicativos (UI/UX). Foco em usabilidade, velocidade de carregamento, responsividade e estética de alto nível.",
    deliverables: [
      "Landing Pages de Alta Conversão",
      "Websites Institucionais e Portfólios",
      "Design de Interfaces (UI/UX para Apps e Web)",
      "Prototipagem Interativa e Responsividade Total",
    ],
    Icon: Globe,
  },
  {
    id: "productdesign",
    title: "Product Design",
    subtitle: "Produtos e soluções",
    src: serviceProductdesign,
    bgColor: "#0C3643", // Deep Slate
    textColor: "#ffffff",
    btnBg: "#C6F806",
    btnText: "#0C3643",
    description:
      "Design de produtos físicos e digitais com foco na experiência do usuário, viabilidade e apelo comercial. Desenvolvimento de embalagens, rótulos, design system e interfaces completas centradas nas necessidades do público.",
    deliverables: [
      "Design de Embalagens, Rótulos e Mockups 3D",
      "Arquitetura de Informação e Design System",
      "Pesquisa de Usuário e Testes de Usabilidade",
      "Prototipagem de Produtos Físicos e Digitais",
    ],
    Icon: Box,
  },
  {
    id: "direcaodearte",
    title: "Direção de Arte",
    subtitle: "Desenvolvimento de campanhas e peças",
    src: serviceDirecaodearte,
    bgColor: "#00A82D", // Vibrant Green
    textColor: "#ffffff",
    btnBg: "#18181b",
    btnText: "#ffffff",
    description:
      "Conceituação criativa para campanhas publicitárias, lançamentos, editoriais e projetos visuais de grande escala. Direção estética de ensaios fotográficos, key visuals e peças de alto impacto que contam histórias fortes.",
    deliverables: [
      "Conceituação Criativa de Campanhas",
      "Key Visuals e Materiais de Lançamento",
      "Direção Visual para Ensaios e Conteúdos",
      "Curadoria Estética e Padronização Visual",
    ],
    Icon: Eye,
  },
  {
    id: "socialmedia",
    title: "Social Media",
    subtitle: "Conteúdos para as Mídias Sociais",
    src: serviceSocialmedia,
    bgColor: "#00C4E2", // Cyan Blue
    textColor: "#063d4a",
    btnBg: "#18181b",
    btnText: "#ffffff",
    description:
      "Design estratégico e produção de conteúdos para redes sociais: posts estáticos com autoridade visual, carrosséis de alto engajamento, capas de reels, stories dinâmicos e identidades completas para perfis profissionais.",
    deliverables: [
      "Identidade Visual para Feeds e Perfis",
      "Carrosséis Estratégicos e Posts Estáticos",
      "Templates Editáveis e Diretrizes de Conteúdo",
      "Banners, Thumbnails e Criativos para Anúncios",
    ],
    Icon: Share2,
  },
  {
    id: "emuitomais",
    title: "E muito mais...",
    subtitle: "Qual é sua necessidade?",
    src: serviceEmuitomais,
    bgColor: "#3D3D3D", // Dark Charcoal
    textColor: "#ffffff",
    btnBg: "#C6F806",
    btnText: "#18181b",
    description:
      "Projetos personalizados sob medida para o seu desafio: apresentações corporativas de impacto (pitch decks), e-books diagramados, ativações de marca, materiais gráficos impressos e consultoria criativa exclusiva.",
    deliverables: [
      "Apresentações Corporativas e Pitch Decks",
      "Diagramação de E-books e Materiais Ricos",
      "Ativações de Marca e Materiais Impressos",
      "Consultoria Criativa e Projetos Especiais",
    ],
    Icon: PlusCircle,
  },
];

const Services = () => {
  const [selectedService, setSelectedService] = useState<ServiceItem | null>(null);
  const { settings } = useSiteSettings();
  const { ref, isInView } = useInView({ threshold: 0.1, triggerOnce: false });

  const getWhatsAppLink = (serviceTitle: string) => {
    const message = `Olá Leo! Gostaria de conversar sobre o serviço de ${serviceTitle}.`;
    return `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(message)}`;
  };

  return (
    <section
      id="services"
      ref={ref}
      className="relative w-full py-16 sm:py-24 md:py-28 overflow-hidden bg-white transition-opacity duration-700"
      style={{
        backgroundColor: "#ffffff",
        backgroundImage: `radial-gradient(circle, rgba(0, 0, 0, 0.08) 1.5px, transparent 1.5px)`,
        backgroundSize: "24px 24px",
      }}
    >
      {/* Corner dots decorations (4 cantos da seção branca - Aumentados e 100% visíveis) */}
      <img
        src={dotsVariant1}
        alt=""
        className="dots-decoration top-2 left-2 sm:top-4 sm:left-4 w-28 sm:w-40 md:w-52 lg:w-60 h-auto pointer-events-none opacity-100 z-10 drop-shadow-sm"
        aria-hidden="true"
      />
      <img
        src={dotsVariant2}
        alt=""
        className="dots-decoration top-2 right-2 sm:top-4 sm:right-4 w-28 sm:w-40 md:w-52 lg:w-60 h-auto pointer-events-none opacity-100 z-10 drop-shadow-sm"
        aria-hidden="true"
      />
      <img
        src={dotsVariant3}
        alt=""
        className="dots-decoration bottom-2 left-2 sm:bottom-4 sm:left-4 w-28 sm:w-40 md:w-52 lg:w-60 h-auto pointer-events-none opacity-100 z-10 drop-shadow-sm"
        aria-hidden="true"
      />
      <img
        src={dotsVariant4}
        alt=""
        className="dots-decoration bottom-2 right-2 sm:bottom-4 sm:right-4 w-28 sm:w-40 md:w-52 lg:w-60 h-auto pointer-events-none opacity-100 z-10 drop-shadow-sm"
        aria-hidden="true"
      />

      <div className="max-w-5xl mx-auto px-4 sm:px-6 relative z-10">
        {/* Section Title com animação ao surgir */}
        <div
          className={`text-center mb-10 sm:mb-14 transition-all duration-700 ${
            isInView ? "opacity-100 translate-y-0 filter-none" : "opacity-0 translate-y-8 blur-sm"
          }`}
        >
          <h2 className="font-boldonse text-4xl sm:text-5xl md:text-6xl text-[#064e3b] tracking-tight">
            Meus Serviços
          </h2>
        </div>

        {/* ── ÁREA PRINCIPAL: CONTAINER DE DIMENSÃO FIXA ── */}
        <div className="relative w-full max-w-4xl mx-auto min-h-[500px] sm:min-h-[530px] md:min-h-[550px]">
          {/* VISÃO 1: Grid com os 6 blocos */}
          <div
            className={`w-full grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 transition-all duration-300 ${
              selectedService ? "opacity-0 pointer-events-none" : isInView ? "opacity-100 scale-100 filter-none" : "opacity-0 scale-95 blur-sm"
            }`}
          >
            {servicesData.map((service, index) => (
              <div
                key={service.id}
                onClick={() => setSelectedService(service)}
                className="flex items-center justify-center cursor-pointer group transition-all duration-300"
                style={{
                  transitionDelay: `${index * 40}ms`,
                }}
              >
                <img
                  src={service.src}
                  alt={`${service.title} - ${service.subtitle}`}
                  className="w-full h-auto max-w-md transition-all duration-300 group-hover:scale-[1.03] group-hover:-translate-y-1 group-hover:drop-shadow-2xl drop-shadow-md active:scale-[0.98]"
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>

          {/* VISÃO 2: Card Expandido (ocupa EXATAMENTE a mesma área do grid sem mudar o tamanho da seção) */}
          {selectedService && (
            <div
              className="absolute inset-0 w-full h-full rounded-3xl p-6 sm:p-8 md:p-10 shadow-2xl transition-all duration-300 overflow-y-auto sm:overflow-hidden flex flex-col justify-between animate-in fade-in zoom-in-95 z-20"
              style={{
                backgroundColor: selectedService.bgColor,
              }}
            >
              {/* Botão Fechar 'X' no canto superior direito */}
              <button
                onClick={() => setSelectedService(null)}
                aria-label="Fechar detalhes do serviço"
                className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full hover:bg-black/15 active:scale-90 transition-all z-30"
                style={{ color: selectedService.textColor }}
              >
                <X className="w-7 h-7 sm:w-8 sm:h-8 stroke-[2.5]" />
              </button>

              {/* Topo: Título e Subtítulo com espaçamento seguro */}
              <div className="relative z-10 pr-12">
                <h3
                  className="font-boldonse text-3xl sm:text-4xl md:text-5xl tracking-tight leading-normal"
                  style={{ color: selectedService.textColor }}
                >
                  {selectedService.title}
                </h3>
                <p
                  className="font-semibold text-xs sm:text-sm md:text-base mt-2 sm:mt-3"
                  style={{ color: selectedService.textColor, opacity: 0.9 }}
                >
                  {selectedService.subtitle}
                </p>
              </div>

              {/* Meio: Descrição + Entregas + Ícone representativo */}
              <div className="grid grid-cols-1 md:grid-cols-12 gap-4 sm:gap-6 items-center relative z-10 my-2 sm:my-3">
                {/* Coluna Esquerda: Texto e Checklist */}
                <div className="md:col-span-8 flex flex-col items-start pr-0 md:pr-4">
                  <p
                    className="text-xs sm:text-sm md:text-base leading-relaxed font-normal"
                    style={{ color: selectedService.textColor }}
                  >
                    {selectedService.description}
                  </p>

                  {/* Lista de Entregas / Checklist */}
                  <div className="mt-3 sm:mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1.5 sm:gap-2 w-full">
                    {selectedService.deliverables.map((item, i) => (
                      <div
                        key={i}
                        className="flex items-center gap-2 text-xs sm:text-sm font-medium"
                        style={{ color: selectedService.textColor }}
                      >
                        <CheckCircle2 className="w-4 h-4 shrink-0 opacity-80" />
                        <span>{item}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Coluna Direita: Ícone em destaque */}
                <div className="md:col-span-4 flex items-center justify-center mt-2 md:mt-0">
                  <div
                    className="w-28 h-28 sm:w-36 sm:h-36 md:w-44 md:h-44 rounded-3xl bg-black/10 backdrop-blur-sm border border-black/10 flex items-center justify-center shadow-inner rotate-3 hover:rotate-6 transition-transform duration-300"
                    style={{ color: selectedService.textColor }}
                  >
                    <selectedService.Icon className="w-14 h-14 sm:w-20 sm:h-20 stroke-[1.5] drop-shadow-md" />
                  </div>
                </div>
              </div>

              {/* Rodapé: Botão Fale Comigo (WhatsApp) */}
              <div className="relative z-10 pt-2">
                <a
                  href={getWhatsAppLink(selectedService.title)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-3 px-7 sm:px-9 py-3 sm:py-3.5 rounded-full font-boldonse text-sm sm:text-lg shadow-xl transition-all duration-300 hover:scale-105 hover:shadow-2xl active:scale-95"
                  style={{
                    backgroundColor: selectedService.btnBg,
                    color: selectedService.btnText,
                  }}
                >
                  <img
                    src={whatsappLogo}
                    alt="WhatsApp"
                    className="w-5 h-5 sm:w-6 sm:h-6 object-contain"
                  />
                  Fale comigo
                </a>
              </div>

              {/* Dobra decorativa no canto inferior direito */}
              <div
                className="absolute bottom-0 right-0 w-12 h-12 sm:w-16 sm:h-16 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(135deg, transparent 50%, rgba(0,0,0,0.85) 50%)",
                }}
              />
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default Services;
