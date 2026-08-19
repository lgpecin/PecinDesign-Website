import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import whatsappLogo from "@/assets/whatsapp-logo.png";
import { useSiteSettings } from "@/hooks/useSiteSettings";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

const FAQ = () => {
  const { settings } = useSiteSettings();
  const { t } = useLanguage();
  const whatsappLink = `https://wa.me/${settings.whatsapp_number}?text=${encodeURIComponent(settings.whatsapp_message)}`;

  const faqs = [
    {
      question: "Quais serviços de design podemos desenvolver?",
      answerKey: "faq.a1_intro",
    },
    {
      question: "Qual é o prazo médio de entrega dos projetos?",
      answerKey: "faq.a2",
    },
    {
      question: "O projeto desenvolvido conta com rodadas de revisões?",
      answerKey: "faq.a3",
    },
    {
      question: "Quais formatos de arquivo são entregues ao final do projeto?",
      answerKey: "faq.a4",
    },
    {
      question: "Você trabalha com clientes remotos?",
      answerKey: "faq.a5",
    },
    {
      question: "Podemos marcar uma reunião para conversar sobre meu projeto?",
      answerKey: "faq.a6",
    },
  ];

  return (
    <section
      id="faq"
      className="relative py-20 sm:py-28 overflow-hidden"
      style={{
        backgroundColor: "#053825",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <AnimatedSection>
          {/* Title */}
          <h2 className="font-boldonse text-4xl sm:text-6xl md:text-7xl text-center text-[#ccff00] mb-12 tracking-wider [text-shadow:0_0_30px_rgba(204,255,0,0.3)]">
            FICOU COM ALGUMA DÚVIDA?
          </h2>
        </AnimatedSection>

        {/* FAQ Items */}
        <AnimatedSection index={1}>
          <div className="max-w-2xl mx-auto">
            <Accordion type="single" collapsible className="space-y-3.5">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-[#18181b]/95 border border-white/10 rounded-full px-6 py-1 shadow-lg transition-all hover:bg-[#27272a] hover:border-white/20 data-[state=open]:rounded-2xl"
              >
                <AccordionTrigger className="hover:no-underline py-3 text-white text-sm sm:text-base font-semibold text-center justify-center [&>svg]:text-white/60 [&>svg]:ml-2">
                  <span>{faq.question}</span>
                </AccordionTrigger>
                <AccordionContent className="text-neutral-300 pt-2 pb-4 text-xs sm:text-sm leading-relaxed text-center">
                  {t(faq.answerKey)}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
        </AnimatedSection>

        {/* Footer text & WhatsApp CTA */}
        <AnimatedSection index={2}>
          <p className="text-center text-white/80 text-xs sm:text-sm md:text-base mt-10 max-w-lg mx-auto leading-relaxed">
            Tem alguma outra dúvida? Fique a vontade pra me dar um alô, a gente conversa e desenrola sua ideia!
          </p>

          <div className="flex justify-center mt-6">
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-3 px-8 py-3.5 bg-[#00a86b] hover:bg-[#00c980] text-white rounded-xl text-lg sm:text-xl font-bold shadow-[0_10px_30px_rgba(0,168,107,0.4)] hover:shadow-[0_15px_40px_rgba(0,168,107,0.6)] transition-all duration-300 hover:scale-105"
            >
              <img
                src={whatsappLogo}
                alt="WhatsApp"
                className="w-7 h-7 object-contain"
              />
              Fale comigo!
            </a>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FAQ;
