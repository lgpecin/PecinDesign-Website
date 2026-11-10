import { useEffect, useRef, useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  Plus,
  Download,
  Save,
  LibraryBig,
  Eye,
  EyeOff,
  FileDown,
  ArrowUp,
  ArrowDown,
  Clock,
  LayoutGrid,
  Percent,
} from "lucide-react";
import { toast } from "sonner";
import logo from "@/assets/logo.png";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import type {
  BudgetClient,
  ClientBudget,
  BudgetItem,
  ClientService,
  Service,
} from "./types";

type Props = {
  client: BudgetClient;
  budget: ClientBudget;
  onBack: () => void;
};

export const COLOR_KEYS = ["verde", "lima", "ciano", "roxo", "rosa", "ambar", "branco"] as const;
export type ColorKey = (typeof COLOR_KEYS)[number];

export const COLOR_VALUES: Record<ColorKey, string> = {
  verde: "#00e57a",
  lima: "#c6ff00",
  ciano: "#35e0ff",
  roxo: "#b794ff",
  rosa: "#ff6fb5",
  ambar: "#ffb938",
  branco: "#ffffff",
};

export const getColorHex = (c: string): string => {
  if (c in COLOR_VALUES) return COLOR_VALUES[c as ColorKey];
  if (c.startsWith("#")) return c;
  return "#00e57a";
};

type EditorRow = {
  id: string;
  client_service_id: string | null;
  color: ColorKey | string;
  name: string;
  format: string;
  prazo: string;
  hours: number;
  price: number;
};

type EditorSection = {
  id: string;
  name: string;
  rows: EditorRow[];
};

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const parseBRL = (val: string): number => {
  if (!val) return 0;
  let clean = val.replace(/[^\d,.-]/g, "");
  if (clean.includes(",")) {
    clean = clean.replace(/\./g, "").replace(",", ".");
  }
  const n = parseFloat(clean);
  return isNaN(n) ? 0 : n;
};

const STATUS_OPTIONS = [
  { value: "draft", label: "Rascunho" },
  { value: "sent", label: "Enviado" },
  { value: "approved", label: "Aprovado" },
  { value: "rejected", label: "Recusado" },
];

const BudgetEditor = ({ client, budget, onBack }: Props) => {
  const qc = useQueryClient();
  const paperRef = useRef<HTMLDivElement>(null);
  const { hourlyRate } = useHourlyRate();

  const [clientName, setClientName] = useState(
    budget.client_display_name || client.name || ""
  );
  const [date, setDate] = useState(
    budget.start_date
      ? new Date(budget.start_date + "T12:00:00").toLocaleDateString("pt-BR")
      : new Date().toLocaleDateString("pt-BR")
  );
  const [validade, setValidade] = useState(budget.validity_label || "15 dias");
  const [projectName, setProjectName] = useState(budget.name || "");
  const [status, setStatus] = useState(budget.status || "draft");
  const [shareOnBoard, setShareOnBoard] = useState(Boolean(budget.share_on_board));
  const [discountType, setDiscountType] = useState<"none" | "percent" | "value">(
    (budget.discount_type as "none" | "percent" | "value") || "none"
  );
  const [discountValue, setDiscountValue] = useState(Number(budget.discount_value) || 0);
  const [showDiscountControls, setShowDiscountControls] = useState(
    (Number(budget.discount_value) || 0) > 0
  );
  const [notes, setNotes] = useState(
    budget.notes || "50% na aprovação e 50% na entrega."
  );
  const [hideValues, setHideValues] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Editing price focus key so input stays raw while typing
  const [focusedPriceId, setFocusedPriceId] = useState<string | null>(null);
  const [priceDraft, setPriceDraft] = useState<string>("");

  // Import dialog
  const [isImportOpen, setIsImportOpen] = useState(false);
  const [targetSectionId, setTargetSectionId] = useState<string | null>(null);

  const { data: dbItems = [], isLoading } = useQuery({
    queryKey: ["budget_items", budget.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("budget_items")
        .select("*")
        .eq("budget_id", budget.id)
        .order("display_order", { ascending: true })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as BudgetItem[];
    },
  });

  const { data: clientServices = [] } = useQuery({
    queryKey: ["client_services", client.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("client_services")
        .select("*")
        .eq("client_id", client.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return data as ClientService[];
    },
  });

  const { data: globalTemplates = [] } = useQuery({
    queryKey: ["services"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("services")
        .select("*")
        .order("display_order", { ascending: true });
      if (error) return [];
      return data as Service[];
    },
  });

  const [sections, setSections] = useState<EditorSection[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    if (isInitialized) return;

    if (dbItems.length > 0) {
      const groupsMap = new Map<string, EditorRow[]>();
      dbItems.forEach((item) => {
        const groupName = item.group_label || "Entregáveis";
        const rows = groupsMap.get(groupName) || [];
        rows.push({
          id: item.id,
          client_service_id: item.client_service_id,
          color: (item.group_color as ColorKey) || "verde",
          name: item.name,
          format: item.description || "",
          prazo: item.delivery_days ? `${item.delivery_days} dias` : "",
          hours: Number(item.hours) || 0,
          price: Number(item.price) || 0,
        });
        groupsMap.set(groupName, rows);
      });

      const initialSections: EditorSection[] = [];
      groupsMap.forEach((rows, name) => {
        initialSections.push({
          id: `sec-${crypto.randomUUID()}`,
          name,
          rows,
        });
      });
      setSections(initialSections);
      setIsInitialized(true);
    } else if (!isLoading && dbItems.length === 0) {
      setSections([
        {
          id: "sec-1",
          name: "Identidade visual",
          rows: [
            {
              id: "row-1",
              client_service_id: null,
              color: "verde",
              name: "Logotipo",
              format: "Vetor + PNG",
              prazo: "7 dias",
              hours: 0,
              price: 1800,
            },
            {
              id: "row-2",
              client_service_id: null,
              color: "lima",
              name: "Manual de marca",
              format: "PDF",
              prazo: "5 dias",
              hours: 0,
              price: 900,
            },
          ],
        },
        {
          id: "sec-2",
          name: "Redes sociais",
          rows: [
            {
              id: "row-3",
              client_service_id: null,
              color: "ciano",
              name: "Kit de posts",
              format: "10 artes · Figma",
              prazo: "10 dias",
              hours: 0,
              price: 1200,
            },
          ],
        },
      ]);
      setIsInitialized(true);
    }
  }, [dbItems, isLoading, isInitialized]);

  const subtotal = useMemo(() => {
    return sections.reduce(
      (acc, sec) =>
        acc + sec.rows.reduce((rAcc, r) => rAcc + (Number(r.price) || 0), 0),
      0
    );
  }, [sections]);

  const discountAmount = useMemo(() => {
    if (discountType === "percent") return subtotal * (discountValue / 100);
    if (discountType === "value") return discountValue;
    return 0;
  }, [subtotal, discountType, discountValue]);

  const total = Math.max(0, subtotal - discountAmount);

  const addSection = (name = "Nova sessão") => {
    setSections((prev) => [
      ...prev,
      {
        id: `sec-${crypto.randomUUID()}`,
        name,
        rows: [
          {
            id: `tmp-${crypto.randomUUID()}`,
            client_service_id: null,
            color: "verde",
            name: "",
            format: "",
            prazo: "",
            hours: 0,
            price: 0,
          },
        ],
      },
    ]);
  };

  const removeSection = (secId: string) => {
    setSections((prev) => prev.filter((s) => s.id !== secId));
  };

  const moveSection = (secIndex: number, direction: "up" | "down") => {
    setSections((prev) => {
      const next = [...prev];
      const targetIndex = direction === "up" ? secIndex - 1 : secIndex + 1;
      if (targetIndex < 0 || targetIndex >= next.length) return prev;
      const [moved] = next.splice(secIndex, 1);
      next.splice(targetIndex, 0, moved);
      return next;
    });
  };

  const updateSectionName = (secId: string, name: string) => {
    setSections((prev) =>
      prev.map((s) => (s.id === secId ? { ...s, name } : s))
    );
  };

  const addRow = (secId: string, color: ColorKey = "verde") => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        const lastColor =
          s.rows.length > 0 ? s.rows[s.rows.length - 1].color : color;
        return {
          ...s,
          rows: [
            ...s.rows,
            {
              id: `tmp-${crypto.randomUUID()}`,
              client_service_id: null,
              color: lastColor,
              name: "",
              format: "",
              prazo: "",
              hours: 0,
              price: 0,
            },
          ],
        };
      })
    );
  };

  const removeRow = (secId: string, rowId: string) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        return { ...s, rows: s.rows.filter((r) => r.id !== rowId) };
      })
    );
  };

  const moveRow = (secId: string, rowIndex: number, direction: "up" | "down") => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        const nextRows = [...s.rows];
        const targetIndex = direction === "up" ? rowIndex - 1 : rowIndex + 1;
        if (targetIndex < 0 || targetIndex >= nextRows.length) return s;
        const [moved] = nextRows.splice(rowIndex, 1);
        nextRows.splice(targetIndex, 0, moved);
        return { ...s, rows: nextRows };
      })
    );
  };

  const updateRow = (
    secId: string,
    rowId: string,
    patch: Partial<EditorRow>
  ) => {
    setSections((prev) =>
      prev.map((s) => {
        if (s.id !== secId) return s;
        return {
          ...s,
          rows: s.rows.map((r) => (r.id === rowId ? { ...r, ...patch } : r)),
        };
      })
    );
  };

  const importService = (
    svc: { id: string; name: string; description: string | null; price: number; delivery_days: number; hours?: number; color: string | null },
    isClientService: boolean,
    targetSecId?: string
  ) => {
    const newRow: EditorRow = {
      id: `tmp-${crypto.randomUUID()}`,
      client_service_id: isClientService ? svc.id : null,
      color: (svc.color as ColorKey) || "verde",
      name: svc.name,
      format: svc.description || "",
      prazo: svc.delivery_days ? `${svc.delivery_days} dias` : "",
      hours: Number(svc.hours) || 0,
      price: Number(svc.price) || 0,
    };

    setSections((prev) => {
      const targetId = targetSecId || prev[0]?.id;
      if (!targetId) {
        return [
          {
            id: `sec-${crypto.randomUUID()}`,
            name: "Serviços",
            rows: [newRow],
          },
        ];
      }
      return prev.map((s) =>
        s.id === targetId ? { ...s, rows: [...s.rows, newRow] } : s
      );
    });

    setIsImportOpen(false);
    toast.success(`"${svc.name}" adicionado`);
  };

  // Parse dd/mm/yyyy to yyyy-mm-dd for Postgres DATE column safely
  const parseDisplayDateToIso = (d: string): string | null => {
    const m = d.trim().match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
    if (m) return `${m[3]}-${m[2]}-${m[1]}`;
    if (/^\d{4}-\d{2}-\d{2}$/.test(d.trim())) return d.trim();
    return null;
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      const baseUpdate: Record<string, any> = {
        name: projectName.trim() || "Orçamento",
        status,
        start_date: parseDisplayDateToIso(date),
        discount_type: discountType,
        discount_value: discountValue,
        notes,
        validity_label: validade,
        client_display_name: clientName,
        share_on_board: shareOnBoard,
      };

      const { error: bErr } = await supabase
        .from("client_budgets")
        .update(baseUpdate as any)
        .eq("id", budget.id);

      // Graceful fallback if new columns aren't migrated yet
      if (bErr && bErr.message?.toLowerCase().includes("column")) {
        const { error: fallbackErr } = await supabase
          .from("client_budgets")
          .update({
            name: projectName.trim() || "Orçamento",
            status,
            start_date: parseDisplayDateToIso(date),
            discount_type: discountType,
            discount_value: discountValue,
            notes,
          })
          .eq("id", budget.id);
        if (fallbackErr) throw fallbackErr;
      } else if (bErr) {
        throw bErr;
      }

      const allRows: { row: EditorRow; secName: string; order: number }[] = [];
      let globalIdx = 0;
      sections.forEach((sec) => {
        sec.rows.forEach((r) => {
          allRows.push({
            row: r,
            secName: sec.name,
            order: globalIdx++,
          });
        });
      });

      const existingIds = dbItems.map((i) => i.id);
      const currentDbIds = allRows
        .filter(({ row }) => !row.id.startsWith("tmp-") && !row.id.startsWith("row-"))
        .map(({ row }) => row.id);
      const toDelete = existingIds.filter((id) => !currentDbIds.includes(id));

      if (toDelete.length > 0) {
        const { error: dErr } = await supabase
          .from("budget_items")
          .delete()
          .in("id", toDelete);
        if (dErr) throw dErr;
      }

      const toInsert = allRows
        .filter(({ row }) => row.id.startsWith("tmp-") || row.id.startsWith("row-"))
        .map(({ row, secName, order }) => ({
          budget_id: budget.id,
          client_service_id: row.client_service_id,
          name: row.name || "Item",
          description: row.format,
          price: row.price,
          delivery_days: parseInt(row.prazo.replace(/\D/g, "")) || 0,
          hours: row.hours || 0,
          quantity: 1,
          group_label: secName,
          group_color: row.color,
          display_order: order,
        }));

      if (toInsert.length > 0) {
        const { error: iErr } = await supabase.from("budget_items").insert(toInsert);
        if (iErr) throw iErr;
      }

      const toUpdate = allRows.filter(
        ({ row }) => !row.id.startsWith("tmp-") && !row.id.startsWith("row-")
      );

      for (const { row, secName, order } of toUpdate) {
        const { error: uErr } = await supabase
          .from("budget_items")
          .update({
            name: row.name,
            description: row.format,
            price: row.price,
            delivery_days: parseInt(row.prazo.replace(/\D/g, "")) || 0,
            hours: row.hours || 0,
            group_label: secName,
            group_color: row.color,
            display_order: order,
          })
          .eq("id", row.id);
        if (uErr) throw uErr;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["budget_items", budget.id] });
      qc.invalidateQueries({ queryKey: ["client_budgets", client.id] });
      qc.invalidateQueries({ queryKey: ["client_shared_budgets", client.id] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      toast.success("Orçamento salvo");
    },
    onError: (err: any) => toast.error(err?.message || "Erro ao salvar"),
  });

  const exportPNG = async () => {
    if (!paperRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await document.fonts.ready;
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const a = document.createElement("a");
      const cleanName =
        projectName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "orcamento";
      a.download = `orcamento-${cleanName}.png`;
      a.href = canvas.toDataURL("image/png");
      a.click();
      toast.success("PNG baixado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PNG");
    } finally {
      setIsExporting(false);
    }
  };

  const exportPDF = async () => {
    if (!paperRef.current) return;
    setIsExporting(true);
    try {
      await new Promise((r) => setTimeout(r, 50));
      await document.fonts.ready;
      const [{ default: html2canvas }, { default: jsPDF }] = await Promise.all([
        import("html2canvas"),
        import("jspdf"),
      ]);
      const canvas = await html2canvas(paperRef.current, {
        scale: 2,
        backgroundColor: null,
        useCORS: true,
        logging: false,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: canvas.width > canvas.height ? "landscape" : "portrait",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      const cleanName =
        projectName.toLowerCase().replace(/[^a-z0-9]/g, "-") || "orcamento";
      pdf.save(`orcamento-${cleanName}.pdf`);
      toast.success("PDF baixado");
    } catch (e) {
      console.error(e);
      toast.error("Erro ao gerar PDF");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="space-y-5 pb-14">
      {/* Studio Action Bar */}
      <div className="bg-white border border-[#E5E7E2] rounded-2xl p-3 sm:p-4 flex flex-wrap items-center justify-between gap-3 sticky top-3 z-30 shadow-sm">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={onBack}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#111412] bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] rounded-full px-3.5 py-2 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Voltar
          </button>

          <button
            type="button"
            onClick={() => addSection()}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#111412] bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] rounded-full px-3.5 py-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#00A859]" />
            Sessão
          </button>

          <button
            type="button"
            onClick={() => {
              setTargetSectionId(null);
              setIsImportOpen(true);
            }}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#111412] bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] rounded-full px-3.5 py-2 cursor-pointer"
          >
            <LibraryBig className="w-3.5 h-3.5" />
            Catálogo
          </button>

          <button
            type="button"
            onClick={() => setHideValues((p) => !p)}
            className={`studio-press inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-2 cursor-pointer border ${
              hideValues
                ? "bg-[#111412] text-white border-[#111412]"
                : "bg-[#F6F6F2] text-[#111412] border-[#E5E7E2] hover:bg-[#EBECE6]"
            }`}
          >
            {hideValues ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
            {hideValues ? "Mostrar valores" : "Ocultar valores"}
          </button>

          <button
            type="button"
            onClick={() => setShowDiscountControls((p) => !p)}
            className={`studio-press inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-2 cursor-pointer border ${
              showDiscountControls || discountValue > 0
                ? "bg-[#F1F8D0] text-[#1F2E05] border-[#DCE89D]"
                : "bg-[#F6F6F2] text-[#5E6862] border-[#E5E7E2] hover:text-[#111412]"
            }`}
          >
            <Percent className="w-3.5 h-3.5" />
            Desconto
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-full bg-[#F6F6F2] border border-[#E5E7E2] px-3 py-1.5 text-xs font-semibold text-[#111412] outline-none cursor-pointer"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          <button
            type="button"
            onClick={() => setShareOnBoard((v) => !v)}
            className={`studio-press inline-flex items-center gap-1.5 text-xs font-semibold rounded-full px-3.5 py-2 cursor-pointer border ${
              shareOnBoard
                ? "bg-[#E6F7EE] text-[#053825] border-[#BBE7CF]"
                : "bg-[#F6F6F2] text-[#5E6862] border-[#E5E7E2]"
            }`}
            title="Publicar este orçamento no Quadro do cliente"
          >
            <LayoutGrid className="w-3.5 h-3.5" />
            {shareOnBoard ? "No Quadro" : "Oculto do Quadro"}
          </button>

          <button
            type="button"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#111412] hover:bg-[#232925] rounded-full px-4 py-2 cursor-pointer disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5 text-[#CCFF00]" />
            {saveMutation.isPending ? "Salvando..." : "Salvar"}
          </button>

          <button
            type="button"
            onClick={exportPNG}
            disabled={isExporting}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-white bg-[#00A859] hover:bg-[#00924E] rounded-full px-4 py-2 cursor-pointer disabled:opacity-50"
          >
            <Download className="w-3.5 h-3.5" />
            PNG
          </button>

          <button
            type="button"
            onClick={exportPDF}
            disabled={isExporting}
            className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#111412] bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] rounded-full px-3.5 py-2 cursor-pointer disabled:opacity-50"
          >
            <FileDown className="w-3.5 h-3.5" />
            PDF
          </button>
        </div>
      </div>

      {/* Discount Controls Row (Internal) */}
      {showDiscountControls && (
        <div className="bg-white border border-[#E5E7E2] rounded-2xl p-4 flex flex-wrap items-center gap-4 max-w-[900px] mx-auto">
          <span className="text-xs font-semibold text-[#111412]">Desconto opcional:</span>
          <select
            value={discountType}
            onChange={(e) => setDiscountType(e.target.value as any)}
            className="rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] px-3 py-1.5 text-xs outline-none"
          >
            <option value="none">Sem desconto</option>
            <option value="percent">Porcentagem (%)</option>
            <option value="value">Valor fixo (R$)</option>
          </select>
          {discountType !== "none" && (
            <input
              type="number"
              min={0}
              step="0.01"
              value={discountValue}
              onChange={(e) => setDiscountValue(parseFloat(e.target.value) || 0)}
              className="w-28 rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] px-3 py-1.5 text-xs studio-nums outline-none"
            />
          )}
        </div>
      )}

      {/* Paper Canvas (900px crisp export container) */}
      <div className="overflow-x-auto pb-4">
        <div
          ref={paperRef}
          id="paper"
          className={`w-[900px] mx-auto relative rounded-[6px] border border-[#1c2a23] p-[56px_56px_48px] text-[#f4f7f5] ${
            isExporting ? "exporting" : ""
          }`}
          style={{
            background:
              "radial-gradient(900px 420px at 15% -5%, rgba(0,168,89,0.28), transparent 60%), radial-gradient(600px 400px at 100% 100%, rgba(0,168,89,0.14), transparent 60%), #050806",
          }}
        >
          {/* Header */}
          <div className="flex justify-between items-start gap-6">
            <div>
              <img
                src={logo}
                alt="Pecin Design"
                className="h-[92px] w-auto object-contain block select-none"
              />
              <h1 className="mt-[34px] font-boldonse text-[46px] font-normal leading-[1.25] text-[#f4f7f5]">
                Orçamento
              </h1>
              <div className="mt-2.5 text-[22px] font-semibold flex items-center gap-2">
                <span className="text-[#00e57a]">Para:</span>
                <input
                  type="text"
                  value={clientName}
                  onChange={(e) => setClientName(e.target.value)}
                  placeholder="Nome do cliente"
                  className="bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1.5 py-0.5 rounded text-[#f4f7f5] font-semibold w-[360px]"
                />
              </div>
            </div>

            <div className="text-right text-[14px] text-[#8fa399] leading-[1.7] space-y-1">
              <div className="flex items-center justify-end gap-1.5">
                <span>Data:</span>
                <input
                  type="text"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  placeholder="dd/mm/aaaa"
                  className="bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1.5 rounded text-[#f4f7f5] font-semibold text-right w-28"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span>Validade:</span>
                <input
                  type="text"
                  value={validade}
                  onChange={(e) => setValidade(e.target.value)}
                  placeholder="15 dias"
                  className="bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1.5 rounded text-[#f4f7f5] font-semibold text-right w-28"
                />
              </div>
              <div className="flex items-center justify-end gap-1.5">
                <span>Projeto:</span>
                <input
                  type="text"
                  value={projectName}
                  onChange={(e) => setProjectName(e.target.value)}
                  placeholder="Nome do projeto"
                  className="bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1.5 rounded text-[#f4f7f5] font-semibold text-right w-52"
                />
              </div>
            </div>
          </div>

          {/* Sections */}
          <div className="mt-10 space-y-10">
            {sections.map((section, secIdx) => (
              <div key={section.id} className="relative group/sec">
                <div className="flex items-baseline gap-3.5 pb-2.5 border-b-2 border-[#00e57a] relative">
                  <input
                    type="text"
                    value={section.name}
                    onChange={(e) => updateSectionName(section.id, e.target.value)}
                    placeholder="Nome da sessão"
                    className="font-boldonse text-[20px] leading-[1.3] font-normal text-[#f4f7f5] bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1 rounded flex-1"
                  />

                  <div
                    data-html2canvas-ignore
                    className="opacity-0 group-hover/sec:opacity-100 transition-opacity flex items-center gap-1 bg-[#0d120f] border border-[#1c2a23] rounded-full px-2 py-0.5"
                  >
                    <button
                      type="button"
                      onClick={() => moveSection(secIdx, "up")}
                      disabled={secIdx === 0}
                      className="w-5 h-5 flex items-center justify-center text-[#8fa399] hover:text-white rounded-full disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowUp className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => moveSection(secIdx, "down")}
                      disabled={secIdx === sections.length - 1}
                      className="w-5 h-5 flex items-center justify-center text-[#8fa399] hover:text-white rounded-full disabled:opacity-30 cursor-pointer"
                    >
                      <ArrowDown className="w-3 h-3" />
                    </button>
                    <button
                      type="button"
                      onClick={() => removeSection(section.id)}
                      className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-300 rounded-full cursor-pointer"
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Column Headers */}
                <div
                  className={`grid gap-3.5 px-[18px] pt-[10px] pb-1 text-[12px] font-medium text-[#8fa399] ${
                    hideValues
                      ? "grid-cols-[2.3fr_1.3fr_1fr]"
                      : "grid-cols-[2.2fr_1.3fr_1fr_1.4fr]"
                  }`}
                >
                  <span>Nome</span>
                  <span>Formato</span>
                  <span>Prazo</span>
                  {!hideValues && <span className="text-right">Valor</span>}
                </div>

                {/* Rows */}
                <div className="space-y-2">
                  {section.rows.map((row, rowIdx) => {
                    const rowColor = getColorHex(row.color);
                    const isFocusedPrice = focusedPriceId === row.id;

                    return (
                      <div
                        key={row.id}
                        className={`relative group/row rounded-[10px] px-[18px] py-[13px] ${
                          hideValues
                            ? "grid grid-cols-[2.3fr_1.3fr_1fr] gap-3.5 items-center"
                            : "grid grid-cols-[2.2fr_1.3fr_1fr_1.4fr] gap-3.5 items-center"
                        }`}
                        style={{
                          borderLeft: `5px solid ${rowColor}`,
                          backgroundColor: `color-mix(in srgb, ${rowColor} 11%, #0a100d)`,
                        }}
                      >
                        {/* Floating Hover Controls */}
                        <div
                          data-html2canvas-ignore
                          className="absolute right-2 -top-3 z-20 opacity-0 group-hover/row:opacity-100 transition-opacity flex items-center gap-1 bg-[#0d120f] border border-[#1c2a23] rounded-full px-2 py-0.5 shadow-lg"
                        >
                          <button
                            type="button"
                            onClick={() => moveRow(section.id, rowIdx, "up")}
                            disabled={rowIdx === 0}
                            className="w-5 h-5 flex items-center justify-center text-[#8fa399] hover:text-white rounded-full disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowUp className="w-3 h-3" />
                          </button>
                          <button
                            type="button"
                            onClick={() => moveRow(section.id, rowIdx, "down")}
                            disabled={rowIdx === section.rows.length - 1}
                            className="w-5 h-5 flex items-center justify-center text-[#8fa399] hover:text-white rounded-full disabled:opacity-30 cursor-pointer"
                          >
                            <ArrowDown className="w-3 h-3" />
                          </button>

                          {hourlyRate > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                const input = prompt(
                                  `Quantas horas estimadas? (Taxa atual: ${formatBRL(hourlyRate)}/h)`,
                                  String(row.hours || 4)
                                );
                                if (input !== null) {
                                  const hrs = parseFloat(input.replace(",", ".")) || 0;
                                  updateRow(section.id, row.id, {
                                    hours: hrs,
                                    price: Math.round(hrs * hourlyRate * 100) / 100,
                                  });
                                }
                              }}
                              title={`Calcular por hora (${formatBRL(hourlyRate)}/h)`}
                              className="inline-flex items-center gap-0.5 px-1.5 h-5 rounded-full text-[10px] font-semibold text-[#c6ff00] hover:bg-[#1f2f26] cursor-pointer"
                            >
                              <Clock className="w-3 h-3" />
                              {row.hours > 0 ? `${row.hours}h` : "h"}
                            </button>
                          )}

                          <div className="flex items-center gap-1 mx-1">
                            {COLOR_KEYS.map((k) => (
                              <button
                                key={k}
                                type="button"
                                onClick={() =>
                                  updateRow(section.id, row.id, { color: k })
                                }
                                title={k}
                                className={`w-3.5 h-3.5 rounded-full cursor-pointer ${
                                  row.color === k
                                    ? "ring-2 ring-white ring-offset-1 ring-offset-[#0d120f]"
                                    : ""
                                }`}
                                style={{ backgroundColor: COLOR_VALUES[k] }}
                              />
                            ))}
                          </div>

                          <button
                            type="button"
                            onClick={() => removeRow(section.id, row.id)}
                            className="w-5 h-5 flex items-center justify-center text-red-400 hover:text-red-300 rounded-full cursor-pointer"
                          >
                            ×
                          </button>
                        </div>

                        <input
                          type="text"
                          value={row.name}
                          onChange={(e) =>
                            updateRow(section.id, row.id, { name: e.target.value })
                          }
                          placeholder="Nome"
                          className="w-full bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1 rounded font-boldonse text-[14px] leading-[1.4]"
                          style={{ color: rowColor }}
                        />

                        <input
                          type="text"
                          value={row.format}
                          onChange={(e) =>
                            updateRow(section.id, row.id, { format: e.target.value })
                          }
                          placeholder="Formato"
                          className="w-full bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1 rounded text-[14px] text-[#d5dfd9]"
                        />

                        <input
                          type="text"
                          value={row.prazo}
                          onChange={(e) =>
                            updateRow(section.id, row.id, { prazo: e.target.value })
                          }
                          placeholder="Prazo"
                          className="w-full bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1 rounded text-[14px] text-[#d5dfd9]"
                        />

                        {!hideValues && (
                          <input
                            type="text"
                            value={
                              isFocusedPrice
                                ? priceDraft
                                : row.price > 0
                                ? formatBRL(row.price)
                                : ""
                            }
                            onFocus={() => {
                              setFocusedPriceId(row.id);
                              setPriceDraft(row.price > 0 ? String(row.price) : "");
                            }}
                            onChange={(e) => {
                              setPriceDraft(e.target.value);
                              updateRow(section.id, row.id, {
                                price: parseBRL(e.target.value),
                              });
                            }}
                            onBlur={() => {
                              setFocusedPriceId(null);
                              updateRow(section.id, row.id, {
                                price: parseBRL(priceDraft),
                              });
                            }}
                            placeholder="R$ 0,00"
                            className="w-full bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1 rounded font-boldonse text-[14px] leading-[1.4] text-right text-[#f4f7f5]"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Add Line / From Catalog */}
                <div data-html2canvas-ignore className="flex items-center gap-2.5 mt-3">
                  <button
                    type="button"
                    onClick={() => addRow(section.id)}
                    className="text-[13px] font-medium text-[#8fa399] hover:text-[#c6ff00] hover:border-[#c6ff00] bg-transparent border border-dashed border-[#2a3a31] rounded-lg px-3.5 py-2 cursor-pointer"
                  >
                    + linha
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setTargetSectionId(section.id);
                      setIsImportOpen(true);
                    }}
                    className="text-[13px] font-medium text-[#8fa399] hover:text-[#00e57a] hover:border-[#00e57a] bg-transparent border border-dashed border-[#2a3a31] rounded-lg px-3.5 py-2 cursor-pointer"
                  >
                    + do catálogo
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Discount Summary Line if applied */}
          {!hideValues && discountAmount > 0 && (
            <div className="mt-8 flex justify-end gap-6 text-xs text-[#8fa399] px-2">
              <span>Subtotal: {formatBRL(subtotal)}</span>
              <span className="text-[#00e57a]">
                Desconto:{" "}
                {discountType === "percent"
                  ? `${discountValue}% (-${formatBRL(discountAmount)})`
                  : `-${formatBRL(discountAmount)}`}
              </span>
            </div>
          )}

          {/* Total Banner */}
          <div className="mt-[44px] flex bg-white rounded-[6px] px-2">
            <div className="flex-1 flex justify-between items-center bg-[#00a859] px-8 py-4 border-r-[14px] border-l-[14px] border-[#0b6b3a]">
              <span className="font-boldonse text-[16px] text-white">
                Valor total
              </span>
              <span className="font-boldonse text-[28px] leading-[1.2] text-white">
                {hideValues ? "Sob consulta" : formatBRL(total)}
              </span>
            </div>
          </div>

          {/* Notes */}
          <div className="mt-[22px] text-[13px] text-[#8fa399] leading-[1.6] flex items-center gap-1.5">
            <b className="text-[#00e57a] font-semibold shrink-0">Pagamento:</b>
            <input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="50% na aprovação e 50% na entrega."
              className="bg-transparent border-none outline-none hover:bg-white/5 focus:bg-[#c6ff00]/10 px-1.5 py-0.5 rounded text-[#8fa399] flex-1"
            />
          </div>
        </div>
      </div>

      {/* Import Service / Template Dialog */}
      <Dialog open={isImportOpen} onOpenChange={setIsImportOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Importar serviço</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            {clientServices.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5E6862]">
                  Serviços de {client.name}
                </p>
                {clientServices.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => importService(svc, true, targetSectionId || undefined)}
                    className="studio-press w-full text-left p-3 rounded-2xl border border-[#E5E7E2] hover:border-[#00A859] bg-[#FAFAF7] flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111412] truncate">
                        {svc.name}
                      </p>
                      <p className="text-xs text-[#5E6862] studio-nums">
                        {formatBRL(svc.price)} · {svc.delivery_days} dias
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-[#00A859] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {globalTemplates.length > 0 && (
              <div className="space-y-2">
                <p className="text-xs font-semibold text-[#5E6862]">
                  Templates de serviços
                </p>
                {globalTemplates.map((svc) => (
                  <button
                    key={svc.id}
                    type="button"
                    onClick={() => importService(svc, false, targetSectionId || undefined)}
                    className="studio-press w-full text-left p-3 rounded-2xl border border-[#E5E7E2] hover:border-[#111412] bg-white flex items-center justify-between gap-3 cursor-pointer"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-[#111412] truncate">
                        {svc.name}
                      </p>
                      <p className="text-xs text-[#5E6862] studio-nums">
                        {formatBRL(svc.price)} · {svc.delivery_days} dias
                      </p>
                    </div>
                    <Plus className="w-4 h-4 text-[#111412] shrink-0" />
                  </button>
                ))}
              </div>
            )}

            {clientServices.length === 0 && globalTemplates.length === 0 && (
              <p className="text-sm text-[#5E6862] text-center py-6">
                Nenhum serviço ou template cadastrado ainda.
              </p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BudgetEditor;
