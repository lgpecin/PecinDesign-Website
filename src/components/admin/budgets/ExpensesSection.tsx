import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Trash2, Edit, TrendingUp, Wallet, Info, Clock } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/hooks/useAuth";
import { useHourlyRate } from "@/hooks/useHourlyRate";

type Expense = {
  id: string;
  user_id: string;
  name: string;
  category: string;
  description: string | null;
  amount: number;
  recurrence: "monthly" | "yearly" | "one_time" | string;
  display_order: number;
};

const CATEGORIES = [
  { value: "equipamento", label: "Equipamento" },
  { value: "software", label: "Software / Assinatura" },
  { value: "plataforma", label: "Plataforma" },
  { value: "curso", label: "Curso / Educação" },
  { value: "servico", label: "Serviço" },
  { value: "outros", label: "Outros" },
];

const RECURRENCES = [
  { value: "monthly", label: "Mensal" },
  { value: "yearly", label: "Anual" },
  { value: "one_time", label: "Único" },
];

const OVERHEAD_KEY = "budget_overhead_amount";

const fmt = (n: number) =>
  n.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const ExpensesSection = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Expense | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const { data: expenses = [], isLoading } = useQuery({
    queryKey: ["business-expenses"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("business_expenses")
        .select("*")
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as Expense[];
    },
  });

  const { data: overhead = 0 } = useQuery({
    queryKey: ["site-setting", OVERHEAD_KEY],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("site_settings")
        .select("setting_value")
        .eq("setting_key", OVERHEAD_KEY)
        .maybeSingle();
      if (error) throw error;
      return parseFloat(data?.setting_value || "0") || 0;
    },
  });

  const [overheadDraft, setOverheadDraft] = useState<string>("");
  const { hourlyRate, setHourlyRate } = useHourlyRate();
  const [rateDraft, setRateDraft] = useState<string>("");

  const saveOverhead = useMutation({
    mutationFn: async (value: number) => {
      const { data: existing } = await supabase
        .from("site_settings")
        .select("id")
        .eq("setting_key", OVERHEAD_KEY)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase
          .from("site_settings")
          .update({ setting_value: String(value) })
          .eq("setting_key", OVERHEAD_KEY);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("site_settings").insert([
          {
            setting_key: OVERHEAD_KEY,
            setting_value: String(value),
            setting_type: "number",
            description: "Valor a somar em cada orçamento para cobrir custos",
          },
        ]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["site-setting", OVERHEAD_KEY] });
      toast.success("Valor de rateio salvo");
    },
    onError: () => toast.error("Erro ao salvar valor"),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("business_expenses")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-expenses"] });
      toast.success("Custo removido");
    },
    onError: () => toast.error("Erro ao remover"),
  });

  // Totais normalizados para mensal
  const monthlyTotal = expenses.reduce((sum, e) => {
    if (e.recurrence === "monthly") return sum + Number(e.amount);
    if (e.recurrence === "yearly") return sum + Number(e.amount) / 12;
    return sum;
  }, 0);
  const yearlyTotal = monthlyTotal * 12;
  const oneTimeTotal = expenses
    .filter((e) => e.recurrence === "one_time")
    .reduce((s, e) => s + Number(e.amount), 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <h2 className="text-lg font-semibold text-[#111412]">Custos do Estúdio</h2>
          <p className="text-xs text-[#5E6862] mt-0.5">
            Equipamentos, assinaturas, hora técnica e rateio por orçamento.
          </p>
        </div>
        <Dialog
          open={dialogOpen}
          onOpenChange={(open) => {
            setDialogOpen(open);
            if (!open) setEditing(null);
          }}
        >
          <DialogTrigger asChild>
            <Button
              onClick={() => setEditing(null)}
              className="rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs px-4"
            >
              <Plus className="w-3.5 h-3.5 mr-1.5" />
              Novo Custo
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {editing ? "Editar Custo" : "Novo Custo"}
              </DialogTitle>
            </DialogHeader>
            <ExpenseForm
              expense={editing}
              userId={user?.id || ""}
              onClose={() => {
                setDialogOpen(false);
                setEditing(null);
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Totais */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-5 rounded-3xl border border-[#E5E7E2] bg-[#E6F7EE]">
          <div className="flex items-center gap-2 text-[#111412]/70 text-xs font-medium uppercase tracking-wide">
            <TrendingUp className="w-3.5 h-3.5 text-[#00A859]" />
            Total Mensal
          </div>
          <div className="text-2xl font-bold text-[#111412] mt-1.5 studio-nums">{fmt(monthlyTotal)}</div>
          <div className="text-xs text-[#5E6862] mt-1">
            Recorrências mensais + anuais/12
          </div>
        </Card>
        <Card className="p-5 rounded-3xl border border-[#E5E7E2] bg-white">
          <div className="flex items-center gap-2 text-[#5E6862] text-xs font-medium uppercase tracking-wide">
            <TrendingUp className="w-3.5 h-3.5 text-[#00A859]" />
            Total Anual
          </div>
          <div className="text-2xl font-bold text-[#111412] mt-1.5 studio-nums">{fmt(yearlyTotal)}</div>
          <div className="text-xs text-[#5E6862] mt-1">
            Projeção anualizada
          </div>
        </Card>
        <Card className="p-5 rounded-3xl border border-[#E5E7E2] bg-[#F1F8D0]">
          <div className="flex items-center gap-2 text-[#111412]/70 text-xs font-medium uppercase tracking-wide">
            <Wallet className="w-3.5 h-3.5 text-[#3F6B00]" />
            Investimentos Únicos
          </div>
          <div className="text-2xl font-bold text-[#111412] mt-1.5 studio-nums">{fmt(oneTimeTotal)}</div>
          <div className="text-xs text-[#5E6862] mt-1">
            Compras pontuais registradas
          </div>
        </Card>
      </div>

      {/* Valor/Hora e Rateio por orçamento */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="p-5 rounded-3xl border border-[#E5E7E2]">
          <div className="flex items-start gap-2 mb-3">
            <Clock className="w-4 h-4 text-[#00A859] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#111412]">Valor da Hora Técnica</h3>
              <p className="text-xs text-[#5E6862]">
                Referência usada nos orçamentos ao calcular por horas.
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Valor por hora (R$/h)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={String(hourlyRate)}
                value={rateDraft}
                onChange={(e) => setRateDraft(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                const v = parseFloat(rateDraft.replace(",", ".")) || 0;
                setHourlyRate(v);
                setRateDraft("");
              }}
              className="rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs px-4"
            >
              Salvar
            </Button>
            <div className="text-sm studio-nums">
              Atual: <span className="font-semibold text-[#00A859]">{fmt(hourlyRate)}/h</span>
            </div>
          </div>
        </Card>

        <Card className="p-5 rounded-3xl border border-[#E5E7E2]">
          <div className="flex items-start gap-2 mb-3">
            <Info className="w-4 h-4 text-[#00A859] mt-0.5" />
            <div>
              <h3 className="font-semibold text-[#111412]">Rateio por Orçamento</h3>
              <p className="text-xs text-[#5E6862]">
                Valor fixo sugerido para cobrir custos operacionais em cada projeto.
              </p>
            </div>
          </div>
          <div className="flex items-end gap-2 flex-wrap">
            <div className="flex-1 min-w-[140px]">
              <Label className="text-xs">Valor por orçamento (R$)</Label>
              <Input
                type="text"
                inputMode="decimal"
                placeholder={String(overhead)}
                value={overheadDraft}
                onChange={(e) => setOverheadDraft(e.target.value)}
              />
            </div>
            <Button
              onClick={() => {
                const v = parseFloat(overheadDraft.replace(",", ".")) || 0;
                saveOverhead.mutate(v);
                setOverheadDraft("");
              }}
              disabled={saveOverhead.isPending}
              className="rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs px-4"
            >
              Salvar
            </Button>
            <div className="text-sm studio-nums">
              Atual: <span className="font-semibold text-[#00A859]">{fmt(overhead)}</span>
            </div>
          </div>
          {monthlyTotal > 0 && (
            <p className="text-xs text-[#5E6862] mt-3 studio-nums">
              Sugestão (4 projetos/mês): <strong>{fmt(monthlyTotal / 4)}</strong>
            </p>
          )}
        </Card>
      </div>

      {/* Lista */}
      <div className="space-y-2">
        {isLoading ? (
          <p className="text-sm text-[#5E6862]">Carregando...</p>
        ) : expenses.length === 0 ? (
          <Card className="p-8 rounded-3xl border border-[#E5E7E2] text-center text-[#5E6862] text-sm">
            Nenhum custo cadastrado. Clique em "Novo Custo" para começar.
          </Card>
        ) : (
          expenses.map((e) => (
            <Card key={e.id} className="p-4 rounded-2xl border border-[#E5E7E2] bg-white flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-semibold text-[#111412]">{e.name}</span>
                  <span className="text-[10px] uppercase tracking-wide bg-[#F6F6F2] text-[#5E6862] border border-[#E5E7E2] px-2.5 py-0.5 rounded-full">
                    {CATEGORIES.find((c) => c.value === e.category)?.label ||
                      e.category}
                  </span>
                  <span className="text-[10px] uppercase tracking-wide bg-[#E6F7EE] text-[#008746] px-2.5 py-0.5 rounded-full font-medium">
                    {RECURRENCES.find((r) => r.value === e.recurrence)?.label ||
                      e.recurrence}
                  </span>
                </div>
                {e.description && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">
                    {e.description}
                  </p>
                )}
              </div>
              <div className="text-right">
                <div className="font-bold">{fmt(Number(e.amount))}</div>
                {e.recurrence === "yearly" && (
                  <div className="text-[10px] text-muted-foreground">
                    ≈ {fmt(Number(e.amount) / 12)}/mês
                  </div>
                )}
              </div>
              <div className="flex gap-1">
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    setEditing(e);
                    setDialogOpen(true);
                  }}
                >
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={() => {
                    if (confirm(`Remover "${e.name}"?`)) remove.mutate(e.id);
                  }}
                >
                  <Trash2 className="w-4 h-4 text-destructive" />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
};

const ExpenseForm = ({
  expense,
  userId,
  onClose,
}: {
  expense: Expense | null;
  userId: string;
  onClose: () => void;
}) => {
  const qc = useQueryClient();
  const [form, setForm] = useState({
    name: expense?.name || "",
    category: expense?.category || "outros",
    description: expense?.description || "",
    amount: expense?.amount != null ? String(expense.amount) : "",
    recurrence: expense?.recurrence || "monthly",
  });

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        name: form.name.trim(),
        category: form.category,
        description: form.description.trim() || null,
        amount: parseFloat(form.amount.replace(",", ".")) || 0,
        recurrence: form.recurrence,
      };
      if (!payload.name) throw new Error("Nome obrigatório");
      if (expense) {
        const { error } = await supabase
          .from("business_expenses")
          .update(payload)
          .eq("id", expense.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("business_expenses")
          .insert([{ ...payload, user_id: userId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["business-expenses"] });
      toast.success(expense ? "Custo atualizado" : "Custo adicionado");
      onClose();
    },
    onError: (e: any) => toast.error(e.message || "Erro ao salvar"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-3"
    >
      <div>
        <Label>Nome</Label>
        <Input
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Ex: Adobe Creative Cloud"
          required
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Categoria</Label>
          <Select
            value={form.category}
            onValueChange={(v) => setForm({ ...form, category: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label>Recorrência</Label>
          <Select
            value={form.recurrence}
            onValueChange={(v) => setForm({ ...form, recurrence: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {RECURRENCES.map((r) => (
                <SelectItem key={r.value} value={r.value}>
                  {r.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
      <div>
        <Label>Valor (R$)</Label>
        <Input
          type="text"
          inputMode="decimal"
          value={form.amount}
          onChange={(e) => setForm({ ...form, amount: e.target.value })}
          placeholder="Ex: 89,90"
          required
        />
      </div>
      <div>
        <Label>Descrição (opcional)</Label>
        <Textarea
          value={form.description}
          onChange={(e) => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
      </div>
      <div className="flex gap-2 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onClose}
          className="flex-1"
        >
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={save.isPending}>
          {save.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
};

export default ExpensesSection;
