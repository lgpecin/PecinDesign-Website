import { useState } from "react";
import {
  ArrowLeft,
  Building2,
  Mail,
  Phone,
  FileText,
  ClipboardList,
  LayoutGrid,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import BudgetsList from "./BudgetsList";
import BudgetEditor from "./BudgetEditor";
import ClientBriefingsTab from "../briefings/ClientBriefingsTab";
import ClientBoardTab from "../boards/ClientBoardTab";
import type { BudgetClient, ClientBudget } from "./types";

type Props = {
  client: BudgetClient;
  initialTab?: "budgets" | "briefings" | "board";
  onBack: () => void;
};

const ClientServicesView = ({
  client,
  initialTab = "budgets",
  onBack,
}: Props) => {
  const [tab, setTab] = useState<"budgets" | "briefings" | "board">(initialTab);
  const [activeBudget, setActiveBudget] = useState<ClientBudget | null>(null);

  if (activeBudget) {
    return (
      <BudgetEditor
        client={client}
        budget={activeBudget}
        onBack={() => setActiveBudget(null)}
      />
    );
  }

  const copyInfo = async (text: string, label: string) => {
    await navigator.clipboard.writeText(text);
    toast.success(`${label} copiado`);
  };

  return (
    <div className="space-y-6">
      {/* Client Header Card */}
      <div className="bg-white border border-[#E5E7E2] rounded-3xl p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div className="flex items-start gap-3.5">
          <button
            type="button"
            onClick={onBack}
            title="Voltar para Clientes"
            className="studio-press p-2.5 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] cursor-pointer mt-0.5"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl sm:text-2xl font-bold text-[#111412]">
                {client.name}
              </h2>
              {client.company && (
                <span className="inline-flex items-center gap-1 text-xs font-medium px-2.5 py-0.5 rounded-full bg-[#E6F7EE] text-[#053825]">
                  <Building2 className="w-3 h-3" />
                  {client.company}
                </span>
              )}
            </div>

            <div className="flex flex-wrap gap-3 text-xs text-[#5E6862]">
              {client.email && (
                <button
                  type="button"
                  onClick={() => copyInfo(client.email!, "E-mail")}
                  className="inline-flex items-center gap-1 hover:text-[#111412] cursor-pointer"
                >
                  <Mail className="w-3.5 h-3.5" />
                  {client.email}
                  <Copy className="w-2.5 h-2.5 opacity-50" />
                </button>
              )}
              {client.phone && (
                <button
                  type="button"
                  onClick={() => copyInfo(client.phone!, "Telefone")}
                  className="inline-flex items-center gap-1 hover:text-[#111412] cursor-pointer studio-nums"
                >
                  <Phone className="w-3.5 h-3.5" />
                  {client.phone}
                  <Copy className="w-2.5 h-2.5 opacity-50" />
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 3 Clean Primary Tabs: Orçamentos | Briefings | Quadro */}
        <div className="inline-flex flex-wrap items-center bg-[#EBECE6] p-1 rounded-full border border-[#E2E4DC] self-start lg:self-auto">
          <button
            type="button"
            onClick={() => setTab("budgets")}
            className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === "budgets"
                ? "bg-[#111412] text-white"
                : "text-[#5E6862] hover:text-[#111412]"
            }`}
          >
            <FileText className="w-3.5 h-3.5" strokeWidth={1.7} />
            Orçamentos
          </button>

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
            onClick={() => setTab("board")}
            className={`studio-press inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full text-xs font-semibold cursor-pointer ${
              tab === "board"
                ? "bg-[#111412] text-white"
                : "text-[#5E6862] hover:text-[#111412]"
            }`}
          >
            <LayoutGrid className="w-3.5 h-3.5" strokeWidth={1.7} />
            Quadro
          </button>
        </div>
      </div>

      {tab === "budgets" && (
        <BudgetsList client={client} onOpenBudget={setActiveBudget} />
      )}
      {tab === "briefings" && <ClientBriefingsTab client={client} />}
      {tab === "board" && <ClientBoardTab client={client} />}
    </div>
  );
};

export default ClientServicesView;
