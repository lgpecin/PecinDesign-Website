import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Trash2, Calculator, FileDown } from "lucide-react";
import jsPDF from "jspdf";
import type { Service } from "./budgets/types";

interface BudgetCalculatorProps {
  services: Service[];
}

interface LineItem {
  id: string;
  serviceId: string;
  quantity: number;
}

const categoryNames: Record<string, string> = {
  estatico: "Estático",
  carrossel: "Carrossel",
  reels: "Reels",
  branding: "Branding",
  marca: "Marca",
  ebook: "E-book",
  outros: "Outros",
};

const BudgetCalculator = ({ services }: BudgetCalculatorProps) => {
  const [items, setItems] = useState<LineItem[]>([]);
  const [discount, setDiscount] = useState<number>(0);
  const [urgency, setUrgency] = useState<number>(0);

  const activeServices = useMemo(
    () => services.filter((s) => s.is_active),
    [services]
  );

  const addItem = () => {
    if (activeServices.length === 0) return;
    setItems((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        serviceId: activeServices[0].id,
        quantity: 1,
      },
    ]);
  };

  const updateItem = (id: string, patch: Partial<LineItem>) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch } : it)));
  };

  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
  };

  const subtotal = items.reduce((sum, it) => {
    const svc = services.find((s) => s.id === it.serviceId);
    if (!svc) return sum;
    return sum + svc.price * (it.quantity || 0);
  }, 0);

  const safeDiscount = Math.max(0, Math.min(100, Number(discount) || 0));
  const safeUrgency = Math.max(0, Math.min(500, Number(urgency) || 0));

  const discountValue = (subtotal * safeDiscount) / 100;
  const urgencyValue = ((subtotal - discountValue) * safeUrgency) / 100;
  const total = subtotal - discountValue + urgencyValue;

  const maxDeliveryDays = items.reduce((max, it) => {
    const svc = services.find((s) => s.id === it.serviceId);
    if (!svc) return max;
    return Math.max(max, svc.delivery_days);
  }, 0);

  const formatBRL = (v: number) =>
    v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

  const exportPDF = () => {
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    const pageW = doc.internal.pageSize.getWidth();
    const marginX = 40;
    let y = 50;

    doc.setFont("helvetica", "bold");
    doc.setFontSize(18);
    doc.text("Orçamento", marginX, y);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.text(
      new Date().toLocaleDateString("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric",
      }),
      pageW - marginX,
      y,
      { align: "right" }
    );
    y += 24;
    doc.setDrawColor(200);
    doc.line(marginX, y, pageW - marginX, y);
    y += 24;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(11);
    doc.text("Serviço", marginX, y);
    doc.text("Qtd", pageW - marginX - 180, y, { align: "right" });
    doc.text("Unit.", pageW - marginX - 90, y, { align: "right" });
    doc.text("Subtotal", pageW - marginX, y, { align: "right" });
    y += 8;
    doc.line(marginX, y, pageW - marginX, y);
    y += 16;

    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    items.forEach((it) => {
      const svc = services.find((s) => s.id === it.serviceId);
      if (!svc) return;
      if (y > 760) {
        doc.addPage();
        y = 50;
      }
      const lineTotal = svc.price * (it.quantity || 0);
      const nameLines = doc.splitTextToSize(svc.name, pageW - marginX * 2 - 220);
      doc.text(nameLines, marginX, y);
      doc.text(String(it.quantity), pageW - marginX - 180, y, { align: "right" });
      doc.text(formatBRL(svc.price), pageW - marginX - 90, y, { align: "right" });
      doc.text(formatBRL(lineTotal), pageW - marginX, y, { align: "right" });
      y += 14 * nameLines.length + 6;
    });

    y += 10;
    doc.line(marginX, y, pageW - marginX, y);
    y += 20;

    const rightLabel = (label: string, value: string, bold = false) => {
      doc.setFont("helvetica", bold ? "bold" : "normal");
      doc.text(label, pageW - marginX - 140, y, { align: "right" });
      doc.text(value, pageW - marginX, y, { align: "right" });
      y += 16;
    };

    rightLabel("Subtotal:", formatBRL(subtotal));
    if (safeDiscount > 0)
      rightLabel(`Desconto (${safeDiscount}%):`, `- ${formatBRL(discountValue)}`);
    if (safeUrgency > 0)
      rightLabel(`Urgência (${safeUrgency}%):`, `+ ${formatBRL(urgencyValue)}`);
    if (maxDeliveryDays > 0)
      rightLabel(
        "Prazo estimado:",
        `${maxDeliveryDays} ${maxDeliveryDays === 1 ? "dia" : "dias"}`
      );
    y += 4;
    doc.setFontSize(13);
    rightLabel("TOTAL:", formatBRL(total), true);

    y += 30;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(9);
    doc.setTextColor(120);
    doc.text(
      "Orçamento válido por 7 dias. Valores sujeitos a alteração conforme escopo final.",
      marginX,
      y
    );

    doc.save(`orcamento-${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <div className="flex items-center gap-2">
          <Calculator className="h-5 w-5 text-primary" />
          <p className="text-sm text-muted-foreground">
            Monte um orçamento somando serviços, quantidades, desconto e urgência.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            onClick={exportPDF}
            size="sm"
            variant="outline"
            disabled={items.length === 0}
          >
            <FileDown className="h-4 w-4 mr-1" />
            Exportar PDF
          </Button>
          <Button onClick={addItem} size="sm" disabled={activeServices.length === 0}>
            <Plus className="h-4 w-4 mr-1" />
            Adicionar serviço
          </Button>
        </div>
      </div>

      {items.length === 0 ? (
        <Card className="p-8 text-center text-muted-foreground border-dashed">
          Nenhum serviço adicionado ainda. Clique em "Adicionar serviço" para começar.
        </Card>
      ) : (
        <div className="space-y-3">
          {items.map((item) => {
            const svc = services.find((s) => s.id === item.serviceId);
            const lineTotal = (svc?.price || 0) * (item.quantity || 0);
            return (
              <Card key={item.id} className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-[1fr_120px_140px_40px] gap-3 items-end">
                  <div className="space-y-1">
                    <Label className="text-xs">Serviço</Label>
                    <Select
                      value={item.serviceId}
                      onValueChange={(v) => updateItem(item.id, { serviceId: v })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {activeServices.map((s) => (
                          <SelectItem key={s.id} value={s.id}>
                            {s.name}{" "}
                            <span className="text-muted-foreground text-xs">
                              ({categoryNames[s.category] || s.category} ·{" "}
                              {formatBRL(s.price)})
                            </span>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Quantidade</Label>
                    <Input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateItem(item.id, {
                          quantity: Math.max(1, parseInt(e.target.value) || 1),
                        })
                      }
                    />
                  </div>

                  <div className="space-y-1">
                    <Label className="text-xs">Subtotal</Label>
                    <div className="h-10 flex items-center font-semibold text-primary">
                      {formatBRL(lineTotal)}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removeItem(item.id)}
                    className="hover:bg-destructive/10 hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
                {svc && (
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <Badge variant="secondary" className="text-xs">
                      {svc.delivery_days}{" "}
                      {svc.delivery_days === 1 ? "dia" : "dias"} de entrega
                    </Badge>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      <Card className="p-5 space-y-4 bg-muted/30">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="space-y-1">
            <Label htmlFor="discount">Desconto (%)</Label>
            <Input
              id="discount"
              type="number"
              min={0}
              max={100}
              step={0.5}
              value={discount}
              onChange={(e) => setDiscount(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
          <div className="space-y-1">
            <Label htmlFor="urgency">Acréscimo por urgência (%)</Label>
            <Input
              id="urgency"
              type="number"
              min={0}
              max={500}
              step={1}
              value={urgency}
              onChange={(e) => setUrgency(parseFloat(e.target.value) || 0)}
              placeholder="0"
            />
          </div>
        </div>

        <div className="border-t pt-4 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span>{formatBRL(subtotal)}</span>
          </div>
          {safeDiscount > 0 && (
            <div className="flex justify-between text-destructive">
              <span>Desconto ({safeDiscount}%)</span>
              <span>- {formatBRL(discountValue)}</span>
            </div>
          )}
          {safeUrgency > 0 && (
            <div className="flex justify-between text-amber-500">
              <span>Urgência ({safeUrgency}%)</span>
              <span>+ {formatBRL(urgencyValue)}</span>
            </div>
          )}
          {maxDeliveryDays > 0 && (
            <div className="flex justify-between text-muted-foreground">
              <span>Prazo estimado</span>
              <span>
                {maxDeliveryDays} {maxDeliveryDays === 1 ? "dia" : "dias"}
              </span>
            </div>
          )}
          <div className="flex justify-between text-xl font-bold pt-2 border-t">
            <span>Total</span>
            <span className="text-primary">{formatBRL(total)}</span>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default BudgetCalculator;
