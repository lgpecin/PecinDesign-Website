import { useState } from "react";
import { ClipboardList, LayoutTemplate, Calculator } from "lucide-react";
import BriefingTemplateBuilder from "./briefings/BriefingTemplateBuilder";
import TemplatesSection from "./TemplatesSection";
import ExpensesSection from "./budgets/ExpensesSection";

const LibrarySection = () => {
  const [tab, setTab] = useState<"briefings" | "services" | "expenses">("briefings");

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111412]">
          Templates & Custos
        </h1>

        <div className="inline-flex flex-wrap items-center bg-[#EBECE6] p-1 rounded-full border border-[#E2E4DC] self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setTab("briefings")}
            className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === "briefings"
                ? "bg-[#111412] text-white"
                : "text-[#5E6862] hover:text-[#111412]"
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" strokeWidth={1.7} />
            Briefings
          </button>

          <button
            type="button"
            onClick={() => setTab("services")}
            className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === "services"
                ? "bg-[#111412] text-white"
                : "text-[#5E6862] hover:text-[#111412]"
            }`}
          >
            <LayoutTemplate className="w-3.5 h-3.5" strokeWidth={1.7} />
            Serviços
          </button>

          <button
            type="button"
            onClick={() => setTab("expenses")}
            className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === "expenses"
                ? "bg-[#111412] text-white"
                : "text-[#5E6862] hover:text-[#111412]"
            }`}
          >
            <Calculator className="w-3.5 h-3.5" strokeWidth={1.7} />
            Custos & Hora
          </button>
        </div>
      </div>

      {tab === "briefings" && <BriefingTemplateBuilder />}
      {tab === "services" && <TemplatesSection />}
      {tab === "expenses" && <ExpensesSection />}
    </div>
  );
};

export default LibrarySection;
