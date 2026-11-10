import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Plus,
  Search,
  Edit,
  Trash2,
  ArrowRight,
  Building2,
  Mail,
  Phone,
  Users,
} from "lucide-react";
import { toast } from "sonner";
import ClientForm from "./ClientForm";
import type { BudgetClient } from "./types";

type Props = {
  onOpenClient: (client: BudgetClient) => void;
  initialNewOpen?: boolean;
  onClearInitialNew?: () => void;
};

const ClientsList = ({
  onOpenClient,
  initialNewOpen = false,
  onClearInitialNew,
}: Props) => {
  const [search, setSearch] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(initialNewOpen);
  const [editing, setEditing] = useState<BudgetClient | null>(null);
  const qc = useQueryClient();

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["budget_clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as BudgetClient[];
    },
  });

  const { data: metaCounts } = useQuery({
    queryKey: ["client_meta_counts"],
    queryFn: async () => {
      const [budgetsRes, briefingsRes, boardsRes] = await Promise.all([
        supabase.from("client_budgets").select("client_id"),
        (supabase as any).from("client_briefings").select("client_id"),
        (supabase as any).from("client_boards").select("client_id"),
      ]);

      const budgetMap: Record<string, number> = {};
      (budgetsRes.data || []).forEach((r: any) => {
        budgetMap[r.client_id] = (budgetMap[r.client_id] || 0) + 1;
      });

      const briefingMap: Record<string, number> = {};
      if (!briefingsRes.error) {
        (briefingsRes.data || []).forEach((r: any) => {
          briefingMap[r.client_id] = (briefingMap[r.client_id] || 0) + 1;
        });
      }

      const boardSet = new Set<string>();
      if (!boardsRes.error) {
        (boardsRes.data || []).forEach((r: any) => boardSet.add(r.client_id));
      }

      return { budgetMap, briefingMap, boardSet };
    },
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("budget_clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget_clients"] });
      qc.invalidateQueries({ queryKey: ["client_meta_counts"] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      toast.success("Cliente excluído");
    },
    onError: () => toast.error("Erro ao excluir cliente"),
  });

  const filtered = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      c.name.toLowerCase().includes(q) ||
      (c.company || "").toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q)
    );
  });

  const handleClose = () => {
    setIsFormOpen(false);
    setEditing(null);
    onClearInitialNew?.();
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111412]">
          Clientes
        </h1>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-72">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#8FA399] w-4 h-4" />
            <input
              placeholder="Buscar cliente..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-full bg-white border border-[#E5E7E2] focus:border-[#111412] pl-9 pr-4 py-2 text-sm text-[#111412] placeholder:text-[#8FA399] outline-none transition-colors"
            />
          </div>

          <button
            type="button"
            onClick={() => setIsFormOpen(true)}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Novo cliente
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-44 rounded-3xl bg-white border border-[#E5E7E2] animate-pulse" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D6D9D2] bg-white p-12 text-center space-y-3">
          <Users className="w-10 h-10 mx-auto text-[#00A859] opacity-60" />
          <p className="text-sm text-[#5E6862]">
            {clients.length === 0
              ? "Nenhum cliente cadastrado ainda."
              : "Nenhum cliente corresponde à busca."}
          </p>
          {clients.length === 0 && (
            <button
              type="button"
              onClick={() => setIsFormOpen(true)}
              className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-5 py-2.5 cursor-pointer"
            >
              <Plus className="w-4 h-4 text-[#CCFF00]" />
              Cadastrar primeiro cliente
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((c) => {
            const bCount = metaCounts?.budgetMap[c.id] || 0;
            const brCount = metaCounts?.briefingMap[c.id] || 0;
            const hasBoard = metaCounts?.boardSet.has(c.id);

            return (
              <div
                key={c.id}
                className="bg-white border border-[#E5E7E2] hover:border-[#C5CBC2] rounded-3xl p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-base font-bold text-[#111412] truncate">
                        {c.name}
                      </h3>
                      {c.company && (
                        <p className="flex items-center gap-1.5 text-xs text-[#5E6862] mt-0.5 truncate">
                          <Building2 className="w-3.5 h-3.5 shrink-0" />
                          {c.company}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-1.5 text-[11px] font-medium studio-nums">
                    <span className="px-2.5 py-0.5 rounded-full bg-[#F6F6F2] text-[#5E6862]">
                      {bCount} {bCount === 1 ? "orçamento" : "orçamentos"}
                    </span>
                    {brCount > 0 && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#F1F8D0] text-[#1F2E05]">
                        {brCount} {brCount === 1 ? "briefing" : "briefings"}
                      </span>
                    )}
                    {hasBoard && (
                      <span className="px-2.5 py-0.5 rounded-full bg-[#E6F7EE] text-[#053825]">
                        Quadro
                      </span>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-[#5E6862]">
                    {c.email && (
                      <div className="flex items-center gap-1.5 truncate">
                        <Mail className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate">{c.email}</span>
                      </div>
                    )}
                    {c.phone && (
                      <div className="flex items-center gap-1.5 studio-nums">
                        <Phone className="w-3.5 h-3.5 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-3 border-t border-[#F0F1EC]">
                  <button
                    type="button"
                    onClick={() => {
                      setEditing(c);
                      setIsFormOpen(true);
                    }}
                    className="studio-press p-2 rounded-full text-[#5E6862] hover:text-[#111412] hover:bg-[#F6F6F2] cursor-pointer"
                    title="Editar cliente"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir cliente "${c.name}" e todos os seus dados?`)) {
                        del.mutate(c.id);
                      }
                    }}
                    className="studio-press p-2 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir cliente"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => onOpenClient(c)}
                    className="studio-press flex-1 inline-flex items-center justify-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold py-2 px-4 cursor-pointer"
                  >
                    Abrir
                    <ArrowRight className="w-3.5 h-3.5 text-[#CCFF00]" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Dialog open={isFormOpen} onOpenChange={handleClose}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>{editing ? "Editar cliente" : "Novo cliente"}</DialogTitle>
          </DialogHeader>
          <ClientForm
            client={editing}
            onClose={handleClose}
            onCreated={(created) => onOpenClient(created)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientsList;
