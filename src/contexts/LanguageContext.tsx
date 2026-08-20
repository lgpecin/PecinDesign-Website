import { createContext, useContext, useState, useEffect, ReactNode } from "react";

type Language = "pt" | "en";

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

// Detect user preferred language (default to pt)
const detectLanguage = (): Language => {
  try {
    const saved = localStorage.getItem("preferred-language");
    if (saved === "pt" || saved === "en") return saved;
  } catch {}

  return "pt";
};

const translations: Record<Language, Record<string, string>> = {
  pt: {
    // Navigation
    "nav.home": "Início",
    "nav.services": "Meus Serviços",
    "nav.projects": "Portfólio",
    "nav.about": "Sobre Mim",
    "nav.contact": "Contato",
    "nav.back_home": "Voltar ao Início",

    // Hero
    "hero.greeting": "Opa, tudo bom?",
    "hero.box_line1": "Se você precisa de",
    "hero.box_line2": "design, autoridade",
    "hero.box_line3": "e posicionamento...",
    "hero.cta_whatsapp": "Fale comigo!",
    "hero.ribbon": "designer & diretor de arte",
    "hero.intro_p1": "Prazer, eu me chamo Leo!",
    "hero.intro_p2": "Sou apaixonado por dar vida a projetos através da arte e do design.",
    "hero.outro_p1": "Graduado em Design e pós graduado em Direção de arte, atuo no visual desde 2019 e ",
    "hero.outro_p2": "trabalho desenvolvendo projetos de todo tipo que possa imaginar:",

    // Services
    "services.title": "Meus Serviços",
    "services.branding_title": "Branding",
    "services.branding_sub": "Construção de Marcas Poderosas",
    "services.branding_desc": "Construção e reposicionamento completo de marcas: identidade visual, manual de marca, tom de voz e materiais institucionais para destacar seu negócio.",
    "services.webdesign_title": "Web Design",
    "services.webdesign_sub": "Sites, apps, landing pages",
    "services.webdesign_desc": "Design de interfaces modernas, intuitivas e de alta conversão: landing pages, websites institucionais, e-commerces e plataformas personalizadas.",
    "services.productdesign_title": "Product Design",
    "services.productdesign_sub": "Produtos e soluções",
    "services.productdesign_desc": "Concepção visual e estrutural de produtos físicos e digitais, embalagens, rótulos e protótipos focados na melhor experiência e estética.",
    "services.artdirection_title": "Direção de Arte",
    "services.artdirection_sub": "Desenvolvimento de campanhas e peças",
    "services.artdirection_desc": "Conceituação visual estratégica para campanhas publicitárias, lançamentos, editoriais, key visuals e direção de fotografia.",
    "services.socialmedia_title": "Social Media",
    "services.socialmedia_sub": "Conteúdos para as Mídias Sociais",
    "services.socialmedia_desc": "Design estratégico para redes sociais: templates autorais, posts, carrosséis, stories e identidade visual para acelerar seu perfil.",
    "services.more_title": "E muito mais",
    "services.more_sub": "Soluções completas sob medida",
    "services.more_desc": "Apresentações comerciais, motion design, diagramação editorial, sinalização e projetos especiais desenvolvidos sob medida para sua necessidade.",
    "services.modal_includes": "O que inclui:",
    "services.modal_cta": "Contratar Serviço",
    "services.modal_close": "Fechar",

    // Projects / Portfolio
    "projects.title": "Portfólio",
    "projects.subtitle": "Esqueça os templates prontos. Aqui só entra suor, neurônios queimados e estratégias visuais que funcionam pra valer! Se liga:",
    "projects.filter_all": "Todos",
    "projects.view_all": "Ver todos os projetos",
    "projects.view_full": "Conheça meu portfólio completo",
    "projects.loading": "Carregando projetos...",
    "projects.empty": "Nenhum projeto disponível nesta categoria.",
    "projects.about_project": "Sobre o Projeto",
    "projects.software_used": "Softwares Utilizados",
    "projects.notes": "Observações e Autoria",
    "projects.detail": "Detalhe",
    "projects.technologies": "Tecnologias & Ferramentas",

    // About / Timeline
    "about.title": "E quem sou eu?",
    "about.t2019_badge": "2019",
    "about.t2019_desc": "Sempre brinquei de contar histórias, desenhar e até mexer com programas de design. 2019 foi quando comecei a atuar na área e em 2021 iniciei minha graduação em design.",
    "about.t2024_badge": "2024",
    "about.t2024_desc": "Após finalizar a faculdade e emendar em uma pós graduação em direção de arte. Eu já tinha percorrido alguns estágios e freelances onde desenvolvi diversas habilidades.",
    "about.t2026_badge": "2026",
    "about.t2026_desc": "Após seis anos no mercado, criei minha própria marca e me lancei ao mercado dos autônomos, onde consegui meu primeiro grande cliente, o Grupo Barigui, onde atuo até hoje como designer das Marcas Premium (Ford, BMW, Audi, Mini, Motorrad).",
    "about.tyourturn_badge": "Sua vez",
    "about.tyourturn_desc": "Agora é a vez do seu projeto ganhar vida e dar o próximo passo no mercado.",
    "about.cta_button": "Fale comigo!",

    // Service Steps
    "steps.title": "Como é trabalhar comigo?",
    "steps.subtitle": "É suuuuper importante que todas etapas sejam bem claras. Então, quando você entra em contato comigo para desenvolvermos um projeto, é isso que acontece:",
    "steps.step1_title": "Reunião",
    "steps.step1_desc": "Conversamos sobre suas necessidades, objetivos e visão para o projeto. É o momento de alinhar expectativas e entender o que você precisa.",
    "steps.step1_duration": "30-60 min",
    "steps.step2_title": "Briefing",
    "steps.step2_desc": "Recebo todas as informações detalhadas do projeto: público-alvo, referências visuais, materiais existentes e requisitos específicos.",
    "steps.step2_duration": "1-2 dias",
    "steps.step3_title": "Contrato",
    "steps.step3_desc": "Formalizamos nossa parceria com um contrato claro, definindo prazos, valores, entregas e termos de trabalho.",
    "steps.step3_duration": "1 dia",
    "steps.step4_title": "Apresentação",
    "steps.step4_desc": "Apresento as primeiras propostas criativas. Você terá a oportunidade de avaliar as direções visuais e dar seu feedback.",
    "steps.step4_duration": "5-7 dias",
    "steps.step5_title": "Validação",
    "steps.step5_desc": "Refinamos o projeto com base no seu feedback. Fazemos os ajustes necessários até que tudo esteja perfeito.",
    "steps.step5_duration": "1-3 dias",
    "steps.step6_title": "Entrega Final",
    "steps.step6_desc": "Você recebe todos os arquivos finais nos formatos adequados, prontos para uso. Inclui manual de aplicação quando necessário.",
    "steps.step6_duration": "1-2 dias",
    "steps.disclaimer": "O cronograma de trabalho e entrega pode variar e é definido com precisão conforme a definição do escopo do projeto durante a fase de briefing e contrato.",
    "steps.disclaimer_label": "Observação:",

    // FAQ
    "faq.title_line1": "FICOU COM",
    "faq.title_line2": "ALGUMA DÚVIDA?",
    "faq.footer": "Caso tenha ficado com alguma outra dúvida, pode sempre me dar um alô pra gente conversar sobre!",
    "faq.q1": "Quais serviços de design podemos desenvolver?",
    "faq.a1_intro": "Trabalho com bastante coisa mesmo! A gente sempre pode conversar sobre projetos mais diferentes, mas geralmente, o que costumo desenvolver são os itens abaixo:",
    "faq.q2": "Qual é o prazo médio de entrega dos projetos?",
    "faq.a2": "O prazo varia de acordo com a complexidade e escopo do projeto. Em média, projetos de identidade visual levam de 2 a 4 semanas, enquanto designs de apps e websites podem levar de 4 a 8 semanas. Sempre discuto os prazos no início do projeto para garantir alinhamento com suas expectativas.",
    "faq.q3": "O projeto desenvolvido conta com rodadas de revisões?",
    "faq.a3": "Sim! Cada projeto inclui rodadas de revisão para garantir sua total satisfação. O número de revisões varia de acordo com o pacote escolhido, mas geralmente incluo de 2 a 3 rodadas de ajustes. Revisões adicionais podem ser solicitadas conforme necessário.",
    "faq.q4": "Quais formatos de arquivo são entregues ao final do projeto?",
    "faq.a4": "Entrego todos os arquivos necessários para uso imediato e futuro. Para identidade visual, você recebe arquivos editáveis (AI, PSD) e formatos finais (PNG, JPG, SVG, PDF). Para projetos web/app, entrego protótipos navegáveis e arquivos de design completos no Figma ou Adobe XD.",
    "faq.q5": "Você trabalha com clientes remotos?",
    "faq.a5": "Absolutamente! Trabalho com clientes de todo o Brasil e do mundo através de videochamadas e ferramentas de colaboração online. A comunicação remota permite flexibilidade e eficiência, mantendo a qualidade do trabalho em todos os projetos.",
    "faq.q6": "Podemos marcar uma reunião para conversar sobre meu projeto?",
    "faq.a6": "É claro! Só me mandar uma mensagem e a gente encaixa a melhor data para ambos, para conversarmos sobre ideias e projetos e também para me conhecer melhor. Se for de Maringá, dá até pra gente ir tomar um café enquanto conversamos sobre!",
    "faq.service1": "Social Media",
    "faq.service2": "Branding",
    "faq.service3": "Motion Design",
    "faq.service4": "Webdesign",
    "faq.service5": "Ativação de Marca",
    "faq.service6": "Criação de Ebooks",
    "faq.service7": "Planejamento Estratégico",
    "faq.service8": "Design de Produtos e Embalagens",

    // Contact
    "contact.title": "Vamos Conversar?",
    "contact.subtitle": "Tem um projeto em mente? Fale comigo por WhatsApp.",
    "contact.cta_whatsapp": "Chamar no WhatsApp",

    // Footer & Floating
    "footer.rights": "© 2025 Pecin Design. Todos os direitos reservados.",
    "floating.whatsapp": "Fale no WhatsApp",
  },
  en: {
    // Navigation
    "nav.home": "Home",
    "nav.services": "My Services",
    "nav.projects": "Portfolio",
    "nav.about": "About Me",
    "nav.contact": "Contact",
    "nav.back_home": "Back to Home",

    // Hero
    "hero.greeting": "Hey, what's up?",
    "hero.box_line1": "If you need",
    "hero.box_line2": "design, authority",
    "hero.box_line3": "and positioning...",
    "hero.cta_whatsapp": "Let's talk!",
    "hero.ribbon": "designer & art director",
    "hero.intro_p1": "Nice to meet you, I'm Leo!",
    "hero.intro_p2": "I'm passionate about bringing projects to life through art and design.",
    "hero.outro_p1": "Graduated in Design with a post-grad in Art Direction, I've been in the visual arts since 2019 and ",
    "hero.outro_p2": "develop all kinds of creative projects you can imagine:",

    // Services
    "services.title": "My Services",
    "services.branding_title": "Branding",
    "services.branding_sub": "Building Powerful Brands",
    "services.branding_desc": "Complete brand building and repositioning: visual identity, brand guidelines, tone of voice, and brand collateral to make your business stand out.",
    "services.webdesign_title": "Web Design",
    "services.webdesign_sub": "Websites, apps, landing pages",
    "services.webdesign_desc": "Modern, intuitive, high-converting interfaces: landing pages, corporate websites, e-commerce, and custom digital platforms.",
    "services.productdesign_title": "Product Design",
    "services.productdesign_sub": "Products and solutions",
    "services.productdesign_desc": "Visual and structural design of physical and digital products, packaging, labels, and prototypes focused on optimal aesthetics and UX.",
    "services.artdirection_title": "Art Direction",
    "services.artdirection_sub": "Campaign & visual development",
    "services.artdirection_desc": "Strategic visual conceptualization for advertising campaigns, product launches, editorial, key visuals, and photography direction.",
    "services.socialmedia_title": "Social Media",
    "services.socialmedia_sub": "Content for Social Media",
    "services.socialmedia_desc": "Strategic design for social channels: custom templates, posts, carousels, stories, and identity systems to scale your profile.",
    "services.more_title": "And much more",
    "services.more_sub": "Custom complete solutions",
    "services.more_desc": "Pitch decks, motion design, editorial layout, signage, and bespoke creative projects tailored precisely to your needs.",
    "services.modal_includes": "What's included:",
    "services.modal_cta": "Hire Service",
    "services.modal_close": "Close",

    // Projects / Portfolio
    "projects.title": "Portfolio",
    "projects.subtitle": "Forget ready-made templates. Here you'll find sweat, burned neurons, and visual strategies that truly work! Check it out:",
    "projects.filter_all": "All",
    "projects.view_all": "View all projects",
    "projects.view_full": "Explore full portfolio",
    "projects.loading": "Loading projects...",
    "projects.empty": "No projects available in this category.",
    "projects.about_project": "About the Project",
    "projects.software_used": "Software Used",
    "projects.notes": "Notes & Credits",
    "projects.detail": "Detail",
    "projects.technologies": "Technologies & Tools",

    // About / Timeline
    "about.title": "Who am I?",
    "about.t2019_badge": "2019",
    "about.t2019_desc": "I've always loved storytelling, drawing, and experimenting with design tools. 2019 was when I began working in the field, and in 2021 I started my degree in Design.",
    "about.t2024_badge": "2024",
    "about.t2024_desc": "After finishing college and pursuing a post-grad in Art Direction, I had already gone through internships and freelance work where I developed versatile skills.",
    "about.t2026_badge": "2026",
    "about.t2026_desc": "After six years in the industry, I launched my own brand as an independent designer and landed my first major client, Grupo Barigui, where I still design for Premium Brands (Ford, BMW, Audi, Mini, Motorrad).",
    "about.tyourturn_badge": "Your turn",
    "about.tyourturn_desc": "Now it's your project's turn to come to life and take the next step in the market.",
    "about.cta_button": "Let's talk!",

    // Service Steps
    "steps.title": "What's it like working with me?",
    "steps.subtitle": "It's super important that every step is crystal clear. So when you reach out to develop a project, here's what happens:",
    "steps.step1_title": "Meeting",
    "steps.step1_desc": "We discuss your needs, goals, and project vision. Time to align expectations and understand exactly what you need.",
    "steps.step1_duration": "30-60 min",
    "steps.step2_title": "Briefing",
    "steps.step2_desc": "I gather all detailed project information: target audience, visual references, existing assets, and requirements.",
    "steps.step2_duration": "1-2 days",
    "steps.step3_title": "Contract",
    "steps.step3_desc": "We formalize our partnership with a clear contract, setting timelines, fees, deliverables, and terms.",
    "steps.step3_duration": "1 day",
    "steps.step4_title": "Presentation",
    "steps.step4_desc": "I present the initial creative proposals. You'll evaluate visual directions and provide feedback.",
    "steps.step4_duration": "5-7 days",
    "steps.step5_title": "Validation",
    "steps.step5_desc": "We refine the project based on your input, making necessary adjustments until everything is perfect.",
    "steps.step5_duration": "1-3 days",
    "steps.step6_title": "Final Delivery",
    "steps.step6_desc": "You receive all final files in proper production-ready formats, including brand guidelines where applicable.",
    "steps.step6_duration": "1-2 days",
    "steps.disclaimer": "Timelines and deliveries may vary and are precisely defined according to project scope during briefing and contract stages.",
    "steps.disclaimer_label": "Note:",

    // FAQ
    "faq.title_line1": "GOT ANY",
    "faq.title_line2": "QUESTIONS?",
    "faq.footer": "If you have any other questions, feel free to reach out and we can chat about it!",
    "faq.q1": "What design services can we develop?",
    "faq.a1_intro": "I work with quite a lot! We can always talk about different projects, but generally, here's what I usually develop:",
    "faq.q2": "What's the average project delivery time?",
    "faq.a2": "Timelines vary depending on project scope and complexity. On average, brand identity projects take 2-4 weeks, while apps and websites take 4-8 weeks. Deadlines are always discussed upfront for full alignment.",
    "faq.q3": "Does the project include revision rounds?",
    "faq.a3": "Yes! Every project includes revision rounds to guarantee satisfaction, typically 2-3 rounds of refinement. Additional rounds can be requested if necessary.",
    "faq.q4": "Which file formats are delivered upon completion?",
    "faq.a4": "All files needed for immediate and future use: editable source files (AI, PSD) and final exports (PNG, JPG, SVG, PDF). For digital projects, Figma design files and navigable prototypes.",
    "faq.q5": "Do you work with remote clients?",
    "faq.a5": "Absolutely! I work with clients worldwide via video calls and online collaboration tools. Remote communication offers great flexibility and efficiency.",
    "faq.q6": "Can we schedule a meeting to discuss my project?",
    "faq.a6": "Of course! Just send me a message and we'll pick the best time for both of us to chat about ideas and projects.",
    "faq.service1": "Social Media",
    "faq.service2": "Branding",
    "faq.service3": "Motion Design",
    "faq.service4": "Web Design",
    "faq.service5": "Brand Activation",
    "faq.service6": "Ebook Creation",
    "faq.service7": "Strategic Planning",
    "faq.service8": "Product & Packaging Design",

    // Contact
    "contact.title": "Let's Talk?",
    "contact.subtitle": "Have a project in mind? Reach me on WhatsApp.",
    "contact.cta_whatsapp": "Chat on WhatsApp",

    // Footer & Floating
    "footer.rights": "© 2025 Pecin Design. All rights reserved.",
    "floating.whatsapp": "Chat on WhatsApp",
  },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      return detectLanguage();
    } catch {
      return "pt";
    }
  });

  const setLanguage = (lang: Language) => {
    const validLang = lang === "en" ? "en" : "pt";
    setLanguageState(validLang);
    try {
      localStorage.setItem("preferred-language", validLang);
      document.documentElement.lang = validLang;
    } catch {}
  };

  useEffect(() => {
    try {
      document.documentElement.lang = language;
    } catch {}
  }, [language]);

  const t = (key: string): string => {
    try {
      return translations[language]?.[key] ?? translations.pt?.[key] ?? key;
    } catch {
      return key;
    }
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) throw new Error("useLanguage must be used within LanguageProvider");
  return context;
};
