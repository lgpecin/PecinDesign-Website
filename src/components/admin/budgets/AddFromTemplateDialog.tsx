import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import * as Icons from "lucide-react";
import type { Service } from "./types";

type Props = {
  clientId: string;
  onClose: () => void;
};

const AddFromTemplateDialog = ({ clientId, onClose }: Props) => {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const qc = useQueryClient();

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as Service[];
    },
  });

  const toggle = (id: string) => {
    const next = new Set(selected);
    next.has(id) ? next.delete(id) : next.add(id);
    setSelected(next);
  };

  const add = useMutation({
    mutationFn: async () => {
      const chosen = templates.filter((t) => selected.has(t.id));
      if (chosen.length === 0) return;
      const { data: maxOrder } = await supabase
        .from("client_services")
        .select("display_order")
        .eq("client_id", clientId)
        .order("display_order", { ascending: false })
        .limit(1);
      let nextOrder =
        maxOrder && maxOrder.length > 0 ? (maxOrder[0].display_order || 0) + 1 : 0;

      const rows = chosen.map((t) => ({
        client_id: clientId,
        template_service_id: t.id,
        name: t.name,
        description: t.description,
        category: t.category,
        price: t.price,
        delivery_days: t.delivery_days,
        icon: t.icon,
        color: t.color,
        is_active: t.is_active,
        display_order: nextOrder++,
      }));
      const { error } = await supabase.from("client_services").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_services", clientId] });
      qc.invalidateQueries({ queryKey: ["client_services_counts"] });
      toast.success(`${selected.size} serviço(s) adicionado(s)`);
      onClose();
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao adicionar"),
  });

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        Selecione um ou mais templates para copiar para este cliente. Você pode editar
        preços e prazos depois.
      </p>

      {isLoading ? (
        <div className="text-center py-6 text-muted-foreground">Carregando templates...</div>
      ) : templates.length === 0 ? (
        <Card className="p-6 text-center border-dashed text-muted-foreground">
          Nenhum template cadastrado. Crie templates na aba "Templates de Serviços".
        </Card>
      ) : (
        <div className="max-h-[50vh] overflow-y-auto space-y-2">
          {templates.map((t) => {
            const I = (Icons as any)[t.icon || "Folder"] || Icons.Folder;
            const checked = selected.has(t.id);
            return (
              <Card
                key={t.id}
                onClick={() => toggle(t.id)}
                className={`p-3 cursor-pointer flex items-center gap-3 transition-colors ${
                  checked ? "border-primary bg-primary/5" : ""
                }`}
              >
                <Checkbox checked={checked} onCheckedChange={() => toggle(t.id)} />
                <div
                  className="p-2 rounded-md shrink-0"
                  style={{ backgroundColor: `${t.color}20` }}
                >
                  <I className="w-4 h-4" style={{ color: t.color || "#6366f1" }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium truncate">{t.name}</div>
                  <div className="text-xs text-muted-foreground truncate">
                    {t.description || "Sem descrição"}
                  </div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-primary text-sm">
                    R$ {t.price.toFixed(2)}
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {t.delivery_days}d
                  </Badge>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      <div className="flex gap-2 pt-2 border-t">
        <Button variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button
          onClick={() => add.mutate()}
          disabled={selected.size === 0 || add.isPending}
          className="flex-1"
        >
          {add.isPending ? "Adicionando..." : `Adicionar ${selected.size || ""}`}
        </Button>
      </div>
    </div>
  );
};

export default AddFromTemplateDialog;
