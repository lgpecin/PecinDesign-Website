import type { BoardBlockType, KanbanStatus } from "../budgets/types";

export const BOARD_BLOCK_CATALOG: {
  type: BoardBlockType;
  label: string;
  description: string;
  defaultSpan: 1 | 2 | 3 | 4;
  defaultData: Record<string, any>;
}[] = [
  {
    type: "logo",
    label: "Logotipo",
    description: "Versões da marca com preview claro/escuro e download.",
    defaultSpan: 2,
    defaultData: {
      items: [], // { id, name, variant, format, url }
    },
  },
  {
    type: "palette",
    label: "Paleta de Cores",
    description: "Cores da marca com códigos HEX, RGB e CMYK copiáveis.",
    defaultSpan: 2,
    defaultData: {
      colors: [], // { id, name, role, hex, rgb, cmyk }
    },
  },
  {
    type: "typography",
    label: "Tipografia",
    description: "Fontes oficiais, pesos, prévia e download.",
    defaultSpan: 2,
    defaultData: {
      fonts: [], // { id, family, role, weights, url }
    },
  },
  {
    type: "budgets",
    label: "Orçamentos",
    description: "Exibe os orçamentos marcados para este cliente.",
    defaultSpan: 2,
    defaultData: {
      allowAccept: true,
    },
  },
  {
    type: "kanban",
    label: "Kanban",
    description: "Progresso das entregas (somente visualização para o cliente).",
    defaultSpan: 4,
    defaultData: {},
  },
  {
    type: "documents",
    label: "Documentos",
    description: "Contratos, manuais de marca e PDFs.",
    defaultSpan: 2,
    defaultData: {
      items: [], // { id, title, category, url }
    },
  },
  {
    type: "files",
    label: "Arquivos",
    description: "Galeria de materiais, artes e entregas finais.",
    defaultSpan: 2,
    defaultData: {
      items: [], // { id, title, tag, url }
    },
  },
  {
    type: "links",
    label: "Links",
    description: "Atalhos para Figma, Drive, Notion ou redes.",
    defaultSpan: 1,
    defaultData: {
      items: [], // { id, label, url }
    },
  },
  {
    type: "notes",
    label: "Notas",
    description: "Texto livre para orientações e avisos.",
    defaultSpan: 2,
    defaultData: {
      text: "",
    },
  },
];

export const KANBAN_COLUMNS: { key: KanbanStatus; label: string; badgeClass: string }[] = [
  { key: "backlog", label: "Backlog", badgeClass: "bg-[#F3F4F0] text-[#5E6862]" },
  { key: "todo", label: "A fazer", badgeClass: "bg-[#EFECE3] text-[#111412]" },
  { key: "doing", label: "Em andamento", badgeClass: "bg-[#F1F8D0] text-[#1F2E05]" },
  { key: "done", label: "Concluído", badgeClass: "bg-[#E6F7EE] text-[#053825]" },
];

export const hexToRgb = (hex: string): string => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "";
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "";
  return `${r}, ${g}, ${b}`;
};

export const hexToCmyk = (hex: string): string => {
  const clean = hex.replace("#", "");
  if (clean.length !== 6) return "";
  const r = parseInt(clean.slice(0, 2), 16) / 255;
  const g = parseInt(clean.slice(2, 4), 16) / 255;
  const b = parseInt(clean.slice(4, 6), 16) / 255;
  if (isNaN(r) || isNaN(g) || isNaN(b)) return "";

  const k = 1 - Math.max(r, g, b);
  if (k === 1) return "0, 0, 0, 100";
  const c = Math.round(((1 - r - k) / (1 - k)) * 100);
  const m = Math.round(((1 - g - k) / (1 - k)) * 100);
  const y = Math.round(((1 - b - k) / (1 - k)) * 100);
  const kPct = Math.round(k * 100);
  return `${c}, ${m}, ${y}, ${kPct}`;
};
