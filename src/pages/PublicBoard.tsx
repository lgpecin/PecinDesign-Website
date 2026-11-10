import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import "@/components/admin/admin.css";
import {
  BoardBlockRenderer,
  type SharedBudgetView,
} from "@/components/admin/boards/BoardBlockRenderer";
import type { ClientBoardBlock, ClientKanbanCard } from "@/components/admin/budgets/types";

interface PublicBoardPayload {
  board: {
    id: string;
    title: string;
    share_token: string;
    client_name: string;
    client_company: string | null;
  };
  blocks: ClientBoardBlock[];
  kanban_cards: ClientKanbanCard[];
  shared_budgets: SharedBudgetView[];
}

const SPAN_CLASS: Record<number, string> = {
  1: "md:col-span-1 lg:col-span-1",
  2: "md:col-span-2 lg:col-span-2",
  3: "md:col-span-2 lg:col-span-3",
  4: "md:col-span-2 lg:col-span-4",
};

const PublicBoard = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicBoardPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [acceptingId, setAcceptingId] = useState<string | null>(null);

  useEffect(() => {
    document.body.classList.add("studio-theme");
    return () => document.body.classList.remove("studio-theme");
  }, []);

  const loadBoard = async () => {
    if (!token) {
      setErrorMsg("Link inválido.");
      setLoading(false);
      return;
    }

    const { data: rpcData, error } = await (supabase as any).rpc(
      "get_public_board",
      { p_token: token }
    );

    if (error || !rpcData) {
      setErrorMsg("Quadro não encontrado ou temporariamente indisponível.");
      setLoading(false);
      return;
    }

    setData(rpcData);
    setLoading(false);
  };

  useEffect(() => {
    loadBoard();
  }, [token]);

  const handleAcceptBudget = async (budgetId: string) => {
    if (!token) return;
    setAcceptingId(budgetId);
    try {
      const { error } = await (supabase as any).rpc("accept_public_budget", {
        p_token: token,
        p_budget_id: budgetId,
      });
      if (error) throw error;
      toast.success("Orçamento aprovado");
      await loadBoard();
    } catch (e: any) {
      toast.error(e?.message || "Erro ao aprovar orçamento");
    } finally {
      setAcceptingId(null);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#00A859]" />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-[#E5E7E2] rounded-3xl p-8 text-center space-y-3">
          <div className="bg-[#111412] inline-flex px-4 py-2 rounded-full mb-2">
            <img src={logo} alt="Pecin Design" className="h-6 w-auto" />
          </div>
          <h1 className="text-lg font-bold text-[#111412]">Quadro indisponível</h1>
          <p className="text-sm text-[#5E6862]">{errorMsg}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-[#F6F6F2] text-[#111412] pb-16">
      <header className="bg-[#111412] text-white border-b border-[#1F2723]">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <img src={logo} alt="Pecin Design" className="h-8 w-auto" />
            <div className="h-5 w-px bg-[#26302A]" />
            <div>
              <p className="text-xs text-[#8FA399]">
                {data.board.client_company || data.board.client_name}
              </p>
              <h1 className="text-base font-semibold leading-tight">
                {data.board.title}
              </h1>
            </div>
          </div>

          <span className="text-[11px] font-semibold px-3 py-1 rounded-full bg-[#1C231F] text-[#CCFF00]">
            Portal do Cliente
          </span>
        </div>
      </header>

      <main className="max-w-[1320px] mx-auto px-4 sm:px-8 pt-8">
        {data.blocks.length === 0 ? (
          <div className="bg-white border border-[#E5E7E2] rounded-3xl p-12 text-center text-sm text-[#5E6862]">
            Nenhum material publicado ainda neste quadro.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
            {data.blocks.map((blk) => (
              <div
                key={blk.id}
                className={`${SPAN_CLASS[blk.col_span] || "lg:col-span-2"} bg-white border border-[#E5E7E2] rounded-3xl p-5 sm:p-6`}
              >
                <BoardBlockRenderer
                  block={blk}
                  kanbanCards={data.kanban_cards || []}
                  sharedBudgets={data.shared_budgets || []}
                  isAdminEdit={false}
                  onAcceptBudget={handleAcceptBudget}
                  acceptingBudgetId={acceptingId}
                />
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default PublicBoard;
