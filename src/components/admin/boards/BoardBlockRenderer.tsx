import { useState } from "react";
import {
  Download,
  ExternalLink,
  Sun,
  Moon,
  FileText,
  CheckCircle2,
  Plus,
  Trash2,
  ArrowLeft,
  ArrowRight,
  Calendar,
  CheckSquare,
  Square,
  Image as ImageIcon,
} from "lucide-react";
import { toast } from "sonner";
import { KANBAN_COLUMNS } from "./boardDefaults";
import type {
  ClientBoardBlock,
  ClientKanbanCard,
  KanbanStatus,
} from "../budgets/types";

export interface SharedBudgetView {
  id: string;
  name: string;
  status: string;
  start_date: string | null;
  validity_label?: string | null;
  discount_type: string;
  discount_value: number;
  notes: string | null;
  accepted_at?: string | null;
  items: {
    id: string;
    name: string;
    description: string | null;
    price: number;
    delivery_days: number;
    quantity: number;
    group_label: string | null;
  }[];
}

interface BoardBlockRendererProps {
  block: ClientBoardBlock;
  kanbanCards: ClientKanbanCard[];
  sharedBudgets: SharedBudgetView[];
  isAdminEdit?: boolean;
  onAcceptBudget?: (budgetId: string) => void;
  acceptingBudgetId?: string | null;
  // Kanban Admin-only callbacks
  onAddKanbanCard?: (column: KanbanStatus, title: string) => void;
  onMoveKanbanCard?: (cardId: string, column: KanbanStatus) => void;
  onDeleteKanbanCard?: (cardId: string) => void;
  onToggleChecklistItem?: (card: ClientKanbanCard, itemId: string) => void;
  onAddChecklistItem?: (card: ClientKanbanCard, text: string) => void;
}

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const copyText = async (value: string, label?: string) => {
  await navigator.clipboard.writeText(value);
  toast.success(label ? `${label} copiado` : "Copiado");
};

export const BoardBlockRenderer = ({
  block,
  kanbanCards,
  sharedBudgets,
  isAdminEdit = false,
  onAcceptBudget,
  acceptingBudgetId,
  onAddKanbanCard,
  onMoveKanbanCard,
  onDeleteKanbanCard,
  onToggleChecklistItem,
  onAddChecklistItem,
}: BoardBlockRendererProps) => {
  const [logoDarkBg, setLogoDarkBg] = useState(false);
  const [newCardDrafts, setNewCardDrafts] = useState<Record<string, string>>({});
  const [expandedCardId, setExpandedCardId] = useState<string | null>(null);
  const [newCheckItem, setNewCheckItem] = useState<Record<string, string>>({});
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);

  const data = block.data || {};

  // ── 1. LOGOTIPO ──
  if (block.block_type === "logo") {
    const items: { id: string; name: string; variant?: string; format?: string; url: string }[] =
      data.items || [];
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
          <button
            type="button"
            onClick={() => setLogoDarkBg((v) => !v)}
            className="studio-press inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] border border-[#E5E7E2] cursor-pointer"
          >
            {logoDarkBg ? <Sun className="w-3 h-3" /> : <Moon className="w-3 h-3" />}
            {logoDarkBg ? "Fundo claro" : "Fundo escuro"}
          </button>
        </div>

        {items.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhuma variação de logotipo adicionada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const isPreviewable = /\.(png|jpe?g|webp|svg|gif)$/i.test(item.url);
              return (
                <div
                  key={item.id}
                  className="rounded-2xl border border-[#E5E7E2] overflow-hidden flex flex-col"
                >
                  <div
                    className={`h-28 flex items-center justify-center p-4 transition-colors ${
                      logoDarkBg ? "bg-[#111412]" : "bg-[#FAFAF7]"
                    }`}
                  >
                    {isPreviewable ? (
                      <img
                        src={item.url}
                        alt={item.name}
                        className="max-h-20 max-w-full object-contain"
                      />
                    ) : (
                      <span
                        className={`text-xs font-semibold uppercase ${
                          logoDarkBg ? "text-white" : "text-[#111412]"
                        }`}
                      >
                        {item.format || "Arquivo"}
                      </span>
                    )}
                  </div>
                  <div className="px-3.5 py-2.5 bg-white border-t border-[#E5E7E2] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111412] truncate">
                        {item.name}
                      </p>
                      {(item.variant || item.format) && (
                        <p className="text-[11px] text-[#5E6862] truncate">
                          {[item.variant, item.format].filter(Boolean).join(" · ")}
                        </p>
                      )}
                    </div>
                    <a
                      href={item.url}
                      download={item.name}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="studio-press p-2 rounded-full bg-[#F6F6F2] hover:bg-[#111412] text-[#111412] hover:text-white transition-colors shrink-0"
                      title="Baixar"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── 2. PALETA DE CORES ──
  if (block.block_type === "palette") {
    const colors: { id: string; name: string; role?: string; hex: string; rgb?: string; cmyk?: string }[] =
      data.colors || [];
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {colors.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhuma cor adicionada.
          </p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {colors.map((c) => (
              <div
                key={c.id}
                className="rounded-2xl border border-[#E5E7E2] bg-[#FAFAF7] p-3 flex items-center gap-3"
              >
                <button
                  type="button"
                  onClick={() => copyText(c.hex, c.hex)}
                  className="w-14 h-14 rounded-xl shrink-0 border border-black/10 cursor-pointer studio-press"
                  style={{ backgroundColor: c.hex }}
                  title={`Copiar ${c.hex}`}
                />
                <div className="min-w-0 flex-1 space-y-1">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs font-semibold text-[#111412] truncate">
                      {c.name}
                    </span>
                    {c.role && (
                      <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-white border border-[#E5E7E2] text-[#5E6862] shrink-0">
                        {c.role}
                      </span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1.5 text-[10px] font-mono text-[#5E6862]">
                    <button
                      type="button"
                      onClick={() => copyText(c.hex, "HEX")}
                      className="hover:text-[#111412] bg-white border border-[#E5E7E2] rounded px-1.5 py-0.5 cursor-pointer"
                    >
                      {c.hex.toUpperCase()}
                    </button>
                    {c.rgb && (
                      <button
                        type="button"
                        onClick={() => copyText(`rgb(${c.rgb})`, "RGB")}
                        className="hover:text-[#111412] bg-white border border-[#E5E7E2] rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        RGB {c.rgb}
                      </button>
                    )}
                    {c.cmyk && (
                      <button
                        type="button"
                        onClick={() => copyText(c.cmyk!, "CMYK")}
                        className="hover:text-[#111412] bg-white border border-[#E5E7E2] rounded px-1.5 py-0.5 cursor-pointer"
                      >
                        CMYK {c.cmyk}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 3. TIPOGRAFIA ──
  if (block.block_type === "typography") {
    const fonts: { id: string; family: string; role?: string; weights?: string; url?: string }[] =
      data.fonts || [];
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {fonts.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhuma tipografia adicionada.
          </p>
        ) : (
          <div className="space-y-2.5">
            {fonts.map((f) => (
              <div
                key={f.id}
                className="rounded-2xl border border-[#E5E7E2] bg-[#FAFAF7] p-3.5 flex items-center justify-between gap-3"
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-[#111412] truncate">
                      {f.family}
                    </span>
                    {f.role && (
                      <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-[#E6F7EE] text-[#053825]">
                        {f.role}
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-[#5E6862] mt-0.5">
                    Aa Bb Cc 123{f.weights ? ` · ${f.weights}` : ""}
                  </p>
                </div>
                {f.url && (
                  <a
                    href={f.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="studio-press inline-flex items-center gap-1 rounded-full bg-white border border-[#E5E7E2] hover:border-[#111412] text-xs font-semibold text-[#111412] px-3 py-1.5 shrink-0"
                  >
                    <Download className="w-3.5 h-3.5" />
                    Baixar
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 4. ORÇAMENTOS ──
  if (block.block_type === "budgets") {
    const allowAccept = data.allowAccept !== false;
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {sharedBudgets.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhum orçamento compartilhado neste quadro.
          </p>
        ) : (
          <div className="space-y-3">
            {sharedBudgets.map((b) => {
              const subtotal = (b.items || []).reduce(
                (s, it) => s + Number(it.price || 0) * Number(it.quantity || 1),
                0
              );
              const discount =
                b.discount_type === "percent"
                  ? subtotal * ((Number(b.discount_value) || 0) / 100)
                  : b.discount_type === "value"
                  ? Number(b.discount_value) || 0
                  : 0;
              const total = Math.max(0, subtotal - discount);
              const isApproved = b.status === "approved";

              return (
                <div
                  key={b.id}
                  className="rounded-2xl border border-[#E5E7E2] bg-[#FAFAF7] p-4 space-y-3"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h4 className="text-sm font-semibold text-[#111412] truncate">
                        {b.name}
                      </h4>
                      <p className="text-xs text-[#5E6862] studio-nums mt-0.5">
                        {b.items?.length || 0} itens
                        {b.validity_label ? ` · Validade ${b.validity_label}` : ""}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isApproved
                          ? "bg-[#E6F7EE] text-[#053825]"
                          : "bg-white border border-[#E5E7E2] text-[#5E6862]"
                      }`}
                    >
                      {isApproved ? "Aprovado" : "Em aberto"}
                    </span>
                  </div>

                  {b.items && b.items.length > 0 && (
                    <div className="space-y-1.5 pt-2 border-t border-[#E5E7E2]">
                      {b.items.map((it) => (
                        <div
                          key={it.id}
                          className="flex items-center justify-between gap-2 text-xs"
                        >
                          <span className="text-[#111412] truncate">{it.name}</span>
                          <span className="text-[#5E6862] studio-nums shrink-0">
                            {it.delivery_days ? `${it.delivery_days}d · ` : ""}
                            {formatBRL(Number(it.price) * Number(it.quantity || 1))}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t border-[#E5E7E2]">
                    <div>
                      <span className="text-[11px] text-[#5E6862] block">Total</span>
                      <span className="text-base font-bold text-[#111412] studio-nums">
                        {formatBRL(total)}
                      </span>
                    </div>

                    {!isAdminEdit && allowAccept && !isApproved && onAcceptBudget && (
                      <button
                        type="button"
                        disabled={acceptingBudgetId === b.id}
                        onClick={() => onAcceptBudget(b.id)}
                        className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {acceptingBudgetId === b.id ? "Confirmando..." : "Aprovar"}
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  }

  // ── 5. KANBAN (Strict Read-Only for Client!) ──
  if (block.block_type === "kanban") {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
          <span className="text-[11px] text-[#5E6862] studio-nums">
            {kanbanCards.length} tarefas
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {KANBAN_COLUMNS.map((col, colIdx) => {
            const colCards = kanbanCards.filter((c) => c.column_key === col.key);
            return (
              <div
                key={col.key}
                className="rounded-2xl bg-[#F6F6F2] border border-[#E5E7E2] p-3 flex flex-col gap-2.5"
              >
                <div className="flex items-center justify-between px-1">
                  <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${col.badgeClass}`}>
                    {col.label}
                  </span>
                  <span className="text-xs font-semibold text-[#5E6862] studio-nums">
                    {colCards.length}
                  </span>
                </div>

                <div className="space-y-2">
                  {colCards.map((card) => {
                    const checklist = Array.isArray(card.checklist) ? card.checklist : [];
                    const doneCount = checklist.filter((i) => i.done).length;
                    const isExpanded = expandedCardId === card.id;

                    return (
                      <div
                        key={card.id}
                        className="rounded-xl bg-white border border-[#E5E7E2] p-3 space-y-2"
                      >
                        <div className="flex items-start justify-between gap-2">
                          <button
                            type="button"
                            onClick={() => setExpandedCardId(isExpanded ? null : card.id)}
                            className="text-xs font-semibold text-[#111412] text-left leading-snug hover:text-[#00A859] cursor-pointer flex-1"
                          >
                            {card.title}
                          </button>

                          {isAdminEdit && onDeleteKanbanCard && (
                            <button
                              type="button"
                              onClick={() => onDeleteKanbanCard(card.id)}
                              className="text-[#8FA399] hover:text-red-600 cursor-pointer shrink-0"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        {card.description && (
                          <p className="text-[11px] text-[#5E6862] leading-relaxed">
                            {card.description}
                          </p>
                        )}

                        <div className="flex flex-wrap items-center gap-2 text-[10px] text-[#5E6862] studio-nums">
                          {card.due_date && (
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="w-3 h-3" />
                              {new Date(card.due_date + "T12:00:00").toLocaleDateString("pt-BR")}
                            </span>
                          )}
                          {checklist.length > 0 && (
                            <span className="inline-flex items-center gap-1 font-medium text-[#053825] bg-[#E6F7EE] px-1.5 py-0.5 rounded">
                              {doneCount}/{checklist.length}
                            </span>
                          )}
                        </div>

                        {/* Checklist items (visible if expanded or has items) */}
                        {(isExpanded || checklist.length > 0) && (
                          <div className="pt-1.5 border-t border-[#F0F1EC] space-y-1">
                            {checklist.map((item) => (
                              <div
                                key={item.id}
                                className="flex items-center gap-1.5 text-[11px] text-[#111412]"
                              >
                                {isAdminEdit && onToggleChecklistItem ? (
                                  <button
                                    type="button"
                                    onClick={() => onToggleChecklistItem(card, item.id)}
                                    className="cursor-pointer text-[#00A859] shrink-0"
                                  >
                                    {item.done ? (
                                      <CheckSquare className="w-3.5 h-3.5" />
                                    ) : (
                                      <Square className="w-3.5 h-3.5 text-[#8FA399]" />
                                    )}
                                  </button>
                                ) : item.done ? (
                                  <CheckSquare className="w-3.5 h-3.5 text-[#00A859] shrink-0" />
                                ) : (
                                  <Square className="w-3.5 h-3.5 text-[#8FA399] shrink-0" />
                                )}
                                <span className={item.done ? "line-through text-[#8FA399]" : ""}>
                                  {item.text}
                                </span>
                              </div>
                            ))}

                            {isAdminEdit && isExpanded && onAddChecklistItem && (
                              <div className="flex gap-1 pt-1">
                                <input
                                  type="text"
                                  value={newCheckItem[card.id] || ""}
                                  onChange={(e) =>
                                    setNewCheckItem((p) => ({ ...p, [card.id]: e.target.value }))
                                  }
                                  onKeyDown={(e) => {
                                    if (e.key === "Enter" && newCheckItem[card.id]?.trim()) {
                                      onAddChecklistItem(card, newCheckItem[card.id].trim());
                                      setNewCheckItem((p) => ({ ...p, [card.id]: "" }));
                                    }
                                  }}
                                  placeholder="+ Subtarefa..."
                                  className="flex-1 text-[11px] bg-[#FAFAF7] border border-[#E5E7E2] rounded px-2 py-1 outline-none"
                                />
                              </div>
                            )}
                          </div>
                        )}

                        {/* Admin Column Move Controls */}
                        {isAdminEdit && onMoveKanbanCard && (
                          <div className="flex items-center justify-between pt-1.5 border-t border-[#F0F1EC]">
                            <button
                              type="button"
                              disabled={colIdx === 0}
                              onClick={() =>
                                onMoveKanbanCard(card.id, KANBAN_COLUMNS[colIdx - 1].key)
                              }
                              className="p-1 rounded hover:bg-[#F3F4F0] text-[#5E6862] disabled:opacity-25 cursor-pointer"
                              title="Mover para coluna anterior"
                            >
                              <ArrowLeft className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              disabled={colIdx === KANBAN_COLUMNS.length - 1}
                              onClick={() =>
                                onMoveKanbanCard(card.id, KANBAN_COLUMNS[colIdx + 1].key)
                              }
                              className="p-1 rounded hover:bg-[#F3F4F0] text-[#5E6862] disabled:opacity-25 cursor-pointer"
                              title="Avançar coluna"
                            >
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Admin Quick Add Card */}
                {isAdminEdit && onAddKanbanCard && (
                  <div className="pt-1">
                    <div className="flex gap-1">
                      <input
                        type="text"
                        value={newCardDrafts[col.key] || ""}
                        onChange={(e) =>
                          setNewCardDrafts((p) => ({ ...p, [col.key]: e.target.value }))
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && newCardDrafts[col.key]?.trim()) {
                            onAddKanbanCard(col.key, newCardDrafts[col.key].trim());
                            setNewCardDrafts((p) => ({ ...p, [col.key]: "" }));
                          }
                        }}
                        placeholder="+ Nova tarefa"
                        className="flex-1 text-xs bg-white border border-[#E5E7E2] focus:border-[#111412] rounded-xl px-2.5 py-1.5 outline-none"
                      />
                      {newCardDrafts[col.key]?.trim() && (
                        <button
                          type="button"
                          onClick={() => {
                            onAddKanbanCard(col.key, newCardDrafts[col.key].trim());
                            setNewCardDrafts((p) => ({ ...p, [col.key]: "" }));
                          }}
                          className="p-1.5 rounded-xl bg-[#111412] text-white cursor-pointer"
                        >
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // ── 6. DOCUMENTOS ──
  if (block.block_type === "documents") {
    const items: { id: string; title: string; category?: string; url: string }[] =
      data.items || [];
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhum documento adicionado.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((doc) => (
              <a
                key={doc.id}
                href={doc.url}
                target="_blank"
                rel="noopener noreferrer"
                className="studio-press flex items-center justify-between gap-3 p-3 rounded-2xl border border-[#E5E7E2] bg-[#FAFAF7] hover:border-[#111412] transition-colors"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-xl bg-[#E6F7EE] text-[#053825] flex items-center justify-center shrink-0">
                    <FileText className="w-4 h-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#111412] truncate">
                      {doc.title}
                    </p>
                    {doc.category && (
                      <p className="text-[11px] text-[#5E6862]">{doc.category}</p>
                    )}
                  </div>
                </div>
                <Download className="w-4 h-4 text-[#5E6862] shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 7. ARQUIVOS / MATERIAIS ──
  if (block.block_type === "files") {
    const items: { id: string; title: string; tag?: string; url: string }[] =
      data.items || [];
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhum arquivo adicionado.
          </p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {items.map((f) => {
              const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.url);
              return (
                <div
                  key={f.id}
                  className="rounded-2xl border border-[#E5E7E2] overflow-hidden bg-[#FAFAF7] flex flex-col"
                >
                  <button
                    type="button"
                    onClick={() => (isImg ? setLightboxUrl(f.url) : window.open(f.url, "_blank"))}
                    className="h-28 bg-[#F0F1EC] flex items-center justify-center overflow-hidden cursor-pointer"
                  >
                    {isImg ? (
                      <img src={f.url} alt={f.title} className="w-full h-full object-cover" />
                    ) : (
                      <ImageIcon className="w-6 h-6 text-[#8FA399]" />
                    )}
                  </button>
                  <div className="p-2.5 bg-white border-t border-[#E5E7E2] flex items-center justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold text-[#111412] truncate">
                        {f.title}
                      </p>
                      {f.tag && <p className="text-[10px] text-[#5E6862]">{f.tag}</p>}
                    </div>
                    <a
                      href={f.url}
                      download={f.title}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 rounded-full hover:bg-[#F3F4F0] text-[#5E6862] hover:text-[#111412] shrink-0"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </a>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {lightboxUrl && (
          <div
            onClick={() => setLightboxUrl(null)}
            className="fixed inset-0 z-50 bg-black/85 flex items-center justify-center p-4 cursor-pointer"
          >
            <img
              src={lightboxUrl}
              alt=""
              className="max-w-full max-h-[88vh] rounded-2xl object-contain"
            />
          </div>
        )}
      </div>
    );
  }

  // ── 8. LINKS ──
  if (block.block_type === "links") {
    const items: { id: string; label: string; url: string }[] = data.items || [];
    return (
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
        {items.length === 0 ? (
          <p className="text-xs text-[#8FA399] py-6 text-center bg-[#FAFAF7] rounded-2xl border border-dashed border-[#E5E7E2]">
            Nenhum link adicionado.
          </p>
        ) : (
          <div className="space-y-2">
            {items.map((l) => (
              <a
                key={l.id}
                href={l.url.startsWith("http") ? l.url : `https://${l.url}`}
                target="_blank"
                rel="noopener noreferrer"
                className="studio-press flex items-center justify-between gap-2 px-3.5 py-2.5 rounded-2xl bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold"
              >
                <span className="truncate">{l.label}</span>
                <ExternalLink className="w-3.5 h-3.5 text-[#CCFF00] shrink-0" />
              </a>
            ))}
          </div>
        )}
      </div>
    );
  }

  // ── 9. NOTAS ──
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-semibold text-[#111412]">{block.title}</h3>
      {data.text ? (
        <p className="text-sm text-[#3F4742] whitespace-pre-wrap leading-relaxed">
          {data.text}
        </p>
      ) : (
        <p className="text-xs text-[#8FA399] py-4 bg-[#FAFAF7] rounded-2xl text-center border border-dashed border-[#E5E7E2]">
          Sem anotações neste bloco.
        </p>
      )}
    </div>
  );
};
