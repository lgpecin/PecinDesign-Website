import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import type { BudgetClient } from "./types";

type Props = {
  client: BudgetClient | null;
  onClose: () => void;
  onCreated?: (created: BudgetClient) => void;
};

const ClientForm = ({ client, onClose, onCreated }: Props) => {
  const [form, setForm] = useState({
    name: client?.name || "",
    company: client?.company || "",
    email: client?.email || "",
    phone: client?.phone || "",
    notes: client?.notes || "",
  });
  const qc = useQueryClient();

  const save = useMutation({
    mutationFn: async () => {
      if (client) {
        const { data, error } = await supabase
          .from("budget_clients")
          .update(form)
          .eq("id", client.id)
          .select()
          .single();
        if (error) throw error;
        return { mode: "edit" as const, record: data as BudgetClient };
      } else {
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user) throw new Error("Não autenticado");
        const { data, error } = await supabase
          .from("budget_clients")
          .insert([{ ...form, user_id: userData.user.id }])
          .select()
          .single();
        if (error) throw error;
        return { mode: "create" as const, record: data as BudgetClient };
      }
    },
    onSuccess: (res) => {
      qc.invalidateQueries({ queryKey: ["budget_clients"] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      toast.success(res.mode === "edit" ? "Cliente atualizado" : "Cliente cadastrado");
      onClose();
      if (res.mode === "create" && onCreated) {
        onCreated(res.record);
      }
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar cliente"),
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        save.mutate();
      }}
      className="space-y-4 pt-2"
    >
      <div>
        <Label htmlFor="name" className="text-xs font-medium text-[#5E6862]">
          Nome *
        </Label>
        <Input
          id="name"
          value={form.name}
          onChange={(e) => setForm({ ...form, name: e.target.value })}
          placeholder="Nome do cliente"
          required
          className="mt-1"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <Label htmlFor="company" className="text-xs font-medium text-[#5E6862]">
            Empresa / Marca
          </Label>
          <Input
            id="company"
            value={form.company}
            onChange={(e) => setForm({ ...form, company: e.target.value })}
            placeholder="Nome da marca"
            className="mt-1"
          />
        </div>
        <div>
          <Label htmlFor="phone" className="text-xs font-medium text-[#5E6862]">
            WhatsApp / Telefone
          </Label>
          <Input
            id="phone"
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
            placeholder="(44) 99999-9999"
            className="mt-1"
          />
        </div>
      </div>

      <div>
        <Label htmlFor="email" className="text-xs font-medium text-[#5E6862]">
          E-mail
        </Label>
        <Input
          id="email"
          type="email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          placeholder="contato@empresa.com"
          className="mt-1"
        />
      </div>

      <div>
        <Label htmlFor="notes" className="text-xs font-medium text-[#5E6862]">
          Notas internas
        </Label>
        <Textarea
          id="notes"
          rows={3}
          value={form.notes}
          onChange={(e) => setForm({ ...form, notes: e.target.value })}
          placeholder="Observações..."
          className="mt-1 resize-none"
        />
      </div>

      <div className="flex justify-end gap-2 pt-3 border-t border-[#F0F1EC]">
        <button
          type="button"
          onClick={onClose}
          className="studio-press rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={save.isPending}
          className="studio-press rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2 cursor-pointer disabled:opacity-50"
        >
          {save.isPending ? "Salvando..." : client ? "Salvar" : "Criar e abrir"}
        </button>
      </div>
    </form>
  );
};

export default ClientForm;
