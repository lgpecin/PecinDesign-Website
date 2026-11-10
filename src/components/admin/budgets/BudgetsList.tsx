import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, FileText, Trash2, ArrowRight, Calendar } from "lucide-react";
import { toast } from "sonner";
import type { BudgetClient, ClientBudget } from "./types";

type Props = {
  client: BudgetClient;
  onOpenBudget: (budget: ClientBudget) => void;
};

const STATUS_BADGE: Record<string, { label: string; cls: string }> = {
  approved: { label: "Aprovado", cls: "bg-[#E6F7EE] text-[#053825]" },
  sent: { label: "Enviado", cls: "bg-[#F1F8D0] text-[#1F2E05]" },
  rejected: { label: "Recusado", cls: "bg-red-50 text-red-700" },
  draft: { label: "Rascunho", cls: "bg-[#F3F4F0] text-[#5E6862]" },
};

const BudgetsList = ({ client, onOpenBudget }: Props) => {
  const [isNewOpen, setIsNewOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const qc = useQueryClient();

  const { data: budgets = [], isLoading } = useQuery({
    queryKey: ["client_budgets", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_budgets")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ClientBudget[];
    },
  });

  const create = useMutation({
    mutationFn: async (name: string) => {
      const { data: u } = await supabase.auth.getUser();
      if (!u?.user) throw new Error("Não autenticado");
      const { data, error } = await supabase
        .from("client_budgets")
        .insert([{ client_id: client.id, user_id: u.user.id, name }])
        .select()
        .single();
      if (error) throw error;
      return data as ClientBudget;
    },
    onSuccess: (b) => {
      qc.invalidateQueries({ queryKey: ["client_budgets", client.id] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      toast.success("Orçamento criado");
      setIsNewOpen(false);
      setNewName("");
      onOpenBudget(b);
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao criar orçamento"),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("client_budgets").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_budgets", client.id] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      toast.success("Orçamento excluído");
    },
  });

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap justify-between items-center gap-3">
        <h3 className="text-lg font-semibold text-[#111412]">Orçamentos</h3>

        <button
          type="button"
          onClick={() => setIsNewOpen(true)}
          className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo orçamento
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-3xl bg-white border border-[#E5E7E2] animate-pulse" />
      ) : budgets.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D6D9D2] bg-white p-10 text-center space-y-3">
          <FileText className="w-10 h-10 mx-auto text-[#00A859] opacity-60" />
          <p className="text-sm text-[#5E6862]">
            Nenhum orçamento criado para {client.name}.
          </p>
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-5 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#CCFF00]" />
            Criar primeiro orçamento
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {budgets.map((b) => {
            const st = STATUS_BADGE[b.status] || STATUS_BADGE.draft;
            return (
              <div
                key={b.id}
                className="bg-white border border-[#E5E7E2] hover:border-[#C5CBC2] rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-semibold text-[#111412] truncate">
                      {b.name}
                    </h4>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${st.cls}`}
                    >
                      {st.label}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 text-xs text-[#5E6862] studio-nums">
                    <Calendar className="w-3.5 h-3.5" />
                    <span>{new Date(b.created_at).toLocaleDateString("pt-BR")}</span>
                    {b.share_on_board && (
                      <span className="text-[11px] font-medium text-[#00A859]">
                        · No Quadro
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#F0F1EC]">
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir orçamento "${b.name}"?`)) del.mutate(b.id);
                    }}
                    className="studio-press p-2 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenBudget(b)}
                    className="studio-press flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold py-2 px-4 cursor-pointer"
                  >
                    Abrir orçamento
                    <ArrowRight className="w-3.5 h-3.5 text-[#CCFF00]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo orçamento</DialogTitle>
          </DialogHeader>

          <div className="space-y-2 py-2">
            <Label className="text-xs font-medium text-[#5E6862]">
              Nome do projeto
            </Label>
            <Input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ex: Identidade visual completa"
              onKeyDown={(e) => {
                if (e.key === "Enter" && newName.trim()) create.mutate(newName.trim());
              }}
            />
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="studio-press rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => newName.trim() && create.mutate(newName.trim())}
              disabled={!newName.trim() || create.isPending}
              className="studio-press rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2 cursor-pointer disabled:opacity-50"
            >
              Criar
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetsList;
