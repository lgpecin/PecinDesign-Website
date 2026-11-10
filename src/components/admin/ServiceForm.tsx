import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
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
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import { Service } from "./budgets/types";
import HoursPricingHelper from "./budgets/HoursPricingHelper";
import * as Icons from "lucide-react";

type ServiceFormProps = {
  service: Service | null;
  onClose: () => void;
};

const categories = [
  { value: "estatico", label: "Estático" },
  { value: "carrossel", label: "Carrossel" },
  { value: "reels", label: "Reels" },
  { value: "branding", label: "Branding" },
  { value: "marca", label: "Marca" },
  { value: "ebook", label: "E-book" },
  { value: "outros", label: "Outros" },
];

const iconOptions = [
  "Image", "Images", "LayoutGrid", "Video", "Clapperboard",
  "Palette", "Star", "BookOpen", "FileText", "Folder",
  "Pen", "Pencil", "Brush", "Sparkles", "Lightbulb"
];

const colorOptions = [
  "#6366f1", "#8b5cf6", "#ec4899", "#f59e0b", "#ef4444",
  "#10b981", "#3b82f6", "#14b8a6", "#a855f7", "#f97316"
];

const ServiceForm = ({ service, onClose }: ServiceFormProps) => {
  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    category: "estatico" | "branding" | "carrossel" | "ebook" | "marca" | "outros" | "reels";
    price: number;
    delivery_days: number;
    hours: number;
    icon: string;
    color: string;
    is_active: boolean;
  }>({
    name: service?.name || "",
    description: service?.description || "",
    category: (service?.category as any) || "estatico",
    price: service?.price || 0,
    delivery_days: service?.delivery_days || 1,
    hours: (service as any)?.hours || 0,
    icon: service?.icon || "Folder",
    color: service?.color || "#6366f1",
    is_active: service?.is_active ?? true,
  });

  const queryClient = useQueryClient();

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData) => {
      if (service) {
        const { error } = await supabase
          .from("services")
          .update(data)
          .eq("id", service.id);
        if (error) throw error;
      } else {
        // Get the max display_order for new services
        const { data: maxOrderData } = await supabase
          .from("services")
          .select("display_order")
          .order("display_order", { ascending: false })
          .limit(1);
        
        const nextOrder = maxOrderData && maxOrderData.length > 0 
          ? (maxOrderData[0].display_order || 0) + 1 
          : 0;

        const { error } = await supabase
          .from("services")
          .insert([{ ...data, display_order: nextOrder }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["services"] });
      toast.success(
        service ? "Serviço atualizado com sucesso" : "Serviço criado com sucesso"
      );
      onClose();
    },
    onError: () => {
      toast.error("Erro ao salvar serviço");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    saveMutation.mutate(formData);
  };

  const SelectedIcon = (Icons as any)[formData.icon] || Icons.Folder;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <Label htmlFor="name">Nome do Serviço</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          required
        />
      </div>

      <div>
        <Label htmlFor="description">Descrição</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) =>
            setFormData({ ...formData, description: e.target.value })
          }
          rows={3}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="category">Categoria</Label>
          <Select
            value={formData.category}
            onValueChange={(value) =>
              setFormData({ ...formData, category: value as typeof formData.category })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {categories.map((cat) => (
                <SelectItem key={cat.value} value={cat.value}>
                  {cat.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label htmlFor="price">Preço (R$)</Label>
          <Input
            id="price"
            type="number"
            step="0.01"
            value={formData.price}
            onChange={(e) =>
              setFormData({ ...formData, price: parseFloat(e.target.value) })
            }
            required
          />
        </div>
      </div>

      <div>
        <Label htmlFor="delivery_days">Prazo de Entrega (dias úteis)</Label>
        <Input
          id="delivery_days"
          type="number"
          value={formData.delivery_days}
          onChange={(e) =>
            setFormData({ ...formData, delivery_days: parseInt(e.target.value) })
          }
          required
        />
      </div>

      <HoursPricingHelper
        hours={formData.hours}
        onHoursChange={(h) => setFormData({ ...formData, hours: h })}
        onApplySuggested={(p) => setFormData({ ...formData, price: p })}
      />

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="icon">Ícone</Label>
          <Select
            value={formData.icon}
            onValueChange={(value) => setFormData({ ...formData, icon: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {iconOptions.map((icon) => {
                const IconComp = (Icons as any)[icon];
                return (
                  <SelectItem key={icon} value={icon}>
                    <div className="flex items-center gap-2">
                      <IconComp className="w-4 h-4" />
                      {icon}
                    </div>
                  </SelectItem>
                );
              })}
            </SelectContent>
          </Select>
          <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
            <SelectedIcon className="w-5 h-5" style={{ color: formData.color }} />
            Preview do ícone
          </div>
        </div>

        <div>
          <Label htmlFor="color">Cor</Label>
          <div className="flex gap-2 flex-wrap mt-2">
            {colorOptions.map((color) => (
              <button
                key={color}
                type="button"
                onClick={() => setFormData({ ...formData, color })}
                className={`w-8 h-8 rounded-full border-2 ${
                  formData.color === color ? "border-foreground" : "border-transparent"
                }`}
                style={{ backgroundColor: color }}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <Label htmlFor="is_active">Serviço Ativo</Label>
        <Switch
          id="is_active"
          checked={formData.is_active}
          onCheckedChange={(checked) =>
            setFormData({ ...formData, is_active: checked })
          }
        />
      </div>

      <div className="flex gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onClose} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={saveMutation.isPending}>
          {saveMutation.isPending ? "Salvando..." : "Salvar"}
        </Button>
      </div>
    </form>
  );
};

export default ServiceForm;
