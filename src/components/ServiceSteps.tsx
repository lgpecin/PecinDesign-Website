import { Users, FileText, FileSignature, Presentation, CheckCircle, Package, AlertCircle } from "lucide-react";
import { AnimatedSection } from "@/components/AnimatedSection";

interface Step {
  icon: React.ReactNode;
  title: string;
  desc: string;
  duration: string;
}

const steps: Step[] = [
  {
    icon: <Users className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Reunião",
    duration: "30-60 min",
    desc: "Conversamos sobre suas necessidades, objetivos e visão para o projeto. É o momento de alinhar expectativas e entender o que você precisa.",
  },
  {
    icon: <FileText className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Briefing",
    duration: "1-2 dias",
    desc: "Recebo todas as informações detalhadas do projeto: público-alvo, referências visuais, materiais existentes e requisitos específicos.",
  },
  {
    icon: <FileSignature className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Contrato",
    duration: "1 dia",
    desc: "Formalizamos nossa parceria com um contrato claro, definindo prazos, valores, entregas e termos de trabalho.",
  },
  {
    icon: <Presentation className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Apresentação",
    duration: "5-7 dias",
    desc: "Apresento as primeiras propostas criativas. Você terá a oportunidade de avaliar as direções visuais e dar seu feedback.",
  },
  {
    icon: <CheckCircle className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Validação",
    duration: "1-3 dias",
    desc: "Refinamos o projeto com base no seu feedback. Fazemos os ajustes necessários até que tudo esteja perfeito.",
  },
  {
    icon: <Package className="w-6 h-6 sm:w-7 sm:h-7 md:w-8 md:h-8 text-[#00ff88]" />,
    title: "Entrega Final",
    duration: "1-2 dias",
    desc: "Você recebe todos os arquivos finais nos formatos adequados, prontos para uso. Inclui manual de aplicação quando necessário.",
  },
];

const ServiceSteps = () => {
  return (
    <section className="relative py-16 sm:py-24 md:py-28 overflow-hidden bg-[#0a0a0a]">
      {/* Subtle Grid lines */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-[0.05] [background-image:linear-gradient(to_right,white_1px,transparent_1px),linear-gradient(to_bottom,white_1px,transparent_1px)] [background-size:40px_40px]"
      />

      <div className="container mx-auto px-3 sm:px-4 md:px-6 relative z-10 max-w-6xl">
        <AnimatedSection>
          <div className="text-center mb-3 sm:mb-4">
            <h2 className="font-boldonse text-2xl sm:text-4xl md:text-5xl text-white tracking-wide leading-[1.2] sm:leading-[1.25]">
              Como é trabalhar comigo?
            </h2>
          </div>

          <p className="text-center text-xs sm:text-sm text-neutral-400 max-w-2xl mx-auto mb-8 sm:mb-12 leading-relaxed px-2">
            É suuuper importante que todas etapas sejam bem claras. Então, quando você entra em contato comigo para desenvolvermos um projeto, é isso que acontece:
          </p>
        </AnimatedSection>

        {/* 6 Steps Grid (2 colunas no mobile, 3 no desktop) */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-5 max-w-5xl mx-auto">
          {steps.map((step, index) => (
            <AnimatedSection key={index} index={index}>
              <div className="bg-[#141416]/90 border border-white/10 rounded-xl sm:rounded-2xl p-3.5 sm:p-5 md:p-6 text-center shadow-lg transition-all duration-300 hover:border-[#00ff88]/40 hover:bg-[#18181c] hover:scale-[1.02] flex flex-col items-center justify-between h-full">
                <div className="flex flex-col items-center w-full">
                  <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-white/5 flex items-center justify-center mb-2.5 sm:mb-3">
                    {step.icon}
                  </div>
                  <span className="inline-block px-2.5 sm:px-3 py-0.5 bg-[#00ff88]/10 text-[#00ff88] rounded-full text-[10px] sm:text-[11px] font-semibold mb-2">
                    {step.duration}
                  </span>
                  <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1.5 sm:mb-2">
                    {step.title}
                  </h3>
                  <p className="text-[11px] sm:text-xs md:text-sm text-neutral-400 leading-relaxed text-center">
                    {step.desc}
                  </p>
                </div>
              </div>
            </AnimatedSection>
          ))}
        </div>

        {/* Disclaimer Alert Box */}
        <AnimatedSection index={2}>
          <div className="mt-8 sm:mt-10 max-w-3xl mx-auto">
            <div className="bg-[#00ff88]/5 border border-[#00ff88]/20 rounded-xl p-3.5 sm:p-5 flex items-start gap-2.5 sm:gap-3 text-xs sm:text-sm text-neutral-300">
              <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-[#00ff88] flex-shrink-0 mt-0.5" />
              <p className="leading-relaxed text-[11px] sm:text-xs md:text-sm">
                <strong className="text-white font-semibold">Observação:</strong> O cronograma de trabalho e entrega pode variar e é definido com precisão conforme a definição do escopo do projeto durante a fase de briefing e contrato.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </div>
    </section>
  );
};

export default ServiceSteps;
