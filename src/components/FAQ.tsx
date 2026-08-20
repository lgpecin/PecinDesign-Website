import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";
import { AnimatedSection } from "@/components/AnimatedSection";

const FAQ = () => {
  const { t } = useLanguage();

  const faqs = [
    {
      question: t("faq.q1"),
      answerKey: "faq.a1_intro",
    },
    {
      question: t("faq.q2"),
      answerKey: "faq.a2",
    },
    {
      question: t("faq.q3"),
      answerKey: "faq.a3",
    },
    {
      question: t("faq.q4"),
      answerKey: "faq.a4",
    },
    {
      question: t("faq.q5"),
      answerKey: "faq.a5",
    },
    {
      question: t("faq.q6"),
      answerKey: "faq.a6",
    },
  ];

  return (
    <section
      id="faq"
      className="relative pt-16 sm:pt-24 pb-8 sm:pb-12 overflow-hidden"
      style={{
        backgroundColor: "#053825",
        backgroundImage: `radial-gradient(circle, rgba(255,255,255,0.06) 1.5px, transparent 1.5px)`,
        backgroundSize: "24px 24px",
      }}
    >
      <div className="container mx-auto px-6 relative z-10 max-w-4xl">
        <AnimatedSection>
          {/* Title */}
          <h2 className="font-boldonse text-4xl sm:text-6xl md:text-7xl text-center text-[#ccff00] mb-10 sm:mb-14 tracking-wider leading-[1.38] sm:leading-[1.42] md:leading-[1.45] [text-shadow:0_0_30px_rgba(204,255,0,0.3)]">
            {t("faq.title_line1")}<br />{t("faq.title_line2")}
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
                className="bg-[#18181b]/95 border border-white/10 rounded-[28px] px-6 py-1 shadow-lg transition-all duration-500 ease-spring-smooth will-change-[border-radius,box-shadow,background-color] hover:bg-[#1f2125] hover:border-[#ccff00]/70 hover:shadow-[0_0_25px_rgba(204,255,0,0.35)] data-[state=open]:bg-[#1f2125] data-[state=open]:border-[#ccff00] data-[state=open]:shadow-[0_0_35px_rgba(204,255,0,0.45)] data-[state=open]:rounded-[20px]"
              >
                <AccordionTrigger className="hover:no-underline py-3 text-white text-sm sm:text-base font-semibold text-center justify-center transition-colors [&>svg]:text-white/60 [&>svg]:ml-2 group-hover:[&>svg]:text-[#ccff00]">
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

        {/* Footer text */}
        <AnimatedSection index={2}>
          <p className="text-center text-white/80 text-xs sm:text-sm md:text-base mt-8 sm:mt-10 max-w-lg mx-auto leading-relaxed">
            {t("faq.footer")}
          </p>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default FAQ;
