import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Copy,
  ExternalLink,
  Eye,
  Edit3,
  Trash2,
  ArrowLeft,
  ArrowRight,
  LayoutGrid,
  Loader2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateRandomCode, generateSlug } from "@/lib/utils";
import { BOARD_BLOCK_CATALOG } from "./boardDefaults";
import { BoardBlockRenderer, type SharedBudgetView } from "./BoardBlockRenderer";
import { BoardBlockEditorDialog } from "./BoardBlockEditorDialog";
import { isMissingTableError, MigrationNotice } from "../MigrationNotice";
import type {
  BudgetClient,
  ClientBoard,
  ClientBoardBlock,
  ClientKanbanCard,
  KanbanStatus,
  BoardBlockType,
} from "../budgets/types";

interface ClientBoardTabProps {
  client: BudgetClient;
}

const SPAN_CLASS: Record<number, string> = {
  1: "md:col-span-1 lg:col-span-1",
  2: "md:col-span-2 lg:col-span-2",
  3: "md:col-span-2 lg:col-span-3",
  4: "md:col-span-2 lg:col-span-4",
};

const ClientBoardTab = ({ client }: ClientBoardTabProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [previewMode, setPreviewMode] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [editingBlock, setEditingBlock] = useState<ClientBoardBlock | null>(null);
  const [titleDraft, setTitleDraft] = useState("");

  // 1. Fetch or auto-create board for this client
  const {
    data: board,
    isLoading: boardLoading,
    error: boardError,
    refetch: refetchBoard,
  } = useQuery({
    queryKey: ["client_board", client.id, user?.id],
    enabled: !!user?.id,
    retry: 1,
    queryFn: async () => {
      const { data: existing, error } = await (supabase as any)
        .from("client_boards")
        .select("*")
        .eq("client_id", client.id)
        .maybeSingle();

      if (error) throw error;
      if (existing) return existing as ClientBoard;

      const baseSlug =
        generateSlug(client.company || client.name || "portal").slice(0, 18) ||
        "portal";
      const shareToken = `${baseSlug}-${generateRandomCode(8)}`;

      const { data: created, error: createErr } = await (supabase as any)
        .from("client_boards")
        .insert([
          {
            user_id: user!.id,
            client_id: client.id,
            share_token: shareToken,
            is_active: true,
            title: client.company || client.name,
          },
        ])
        .select()
        .single();

      if (createErr) {
        if (createErr.code === "23505") {
          const { data: fallback, error: fbErr } = await (supabase as any)
            .from("client_boards")
            .select("*")
            .eq("client_id", client.id)
            .single();
          if (fbErr) throw fbErr;
          return fallback as ClientBoard;
        }
        throw createErr;
      }
      return created as ClientBoard;
    },
  });

  useEffect(() => {
    if (board) setTitleDraft(board.title);
  }, [board?.id]);

  // 2. Fetch blocks
  const { data: blocks = [] } = useQuery({
    queryKey: ["client_board_blocks", board?.id],
    enabled: !!board?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_board_blocks")
        .select("*")
        .eq("board_id", board!.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as ClientBoardBlock[];
    },
  });

  // 3. Fetch Kanban cards
  const { data: kanbanCards = [] } = useQuery({
    queryKey: ["client_kanban_cards", board?.id],
    enabled: !!board?.id,
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_kanban_cards")
        .select("*")
        .eq("board_id", board!.id)
        .order("display_order", { ascending: true });
      if (error) throw error;
      return (data || []) as ClientKanbanCard[];
    },
  });

  // 4. Fetch shared budgets for this client
  const { data: sharedBudgets = [] } = useQuery({
    queryKey: ["client_shared_budgets", client.id],
    queryFn: async () => {
      const { data: budgets, error } = await (supabase as any)
        .from("client_budgets")
        .select("*, items:budget_items(*)")
        .eq("client_id", client.id)
        .eq("share_on_board", true)
        .order("created_at", { ascending: false });
      if (error) return [] as SharedBudgetView[];
      return (budgets || []) as unknown as SharedBudgetView[];
    },
  });

  const updateBoardMeta = useMutation({
    mutationFn: async (patch: Partial<ClientBoard>) => {
      if (!board) return;
      const { error } = await (supabase as any)
        .from("client_boards")
        .update(patch)
        .eq("id", board.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["client_board", client.id] }),
  });

  const addBlock = useMutation({
    mutationFn: async (type: BoardBlockType) => {
      if (!board) return;
      const def = BOARD_BLOCK_CATALOG.find((c) => c.type === type)!;
      const nextOrder = blocks.reduce((m, b) => Math.max(m, b.display_order), 0) + 1;
      const { error } = await (supabase as any).from("client_board_blocks").insert([
        {
          board_id: board.id,
          block_type: type,
          title: def.label,
          col_span: def.defaultSpan,
          display_order: nextOrder,
          data: def.defaultData,
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_board_blocks", board?.id] });
      setIsAddOpen(false);
      toast.success("Bloco adicionado");
    },
  });

  const updateBlock = useMutation({
    mutationFn: async ({
      id,
      patch,
    }: {
      id: string;
      patch: Partial<ClientBoardBlock>;
    }) => {
      const { error } = await (supabase as any)
        .from("client_board_blocks")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_board_blocks", board?.id] });
      setEditingBlock(null);
      toast.success("Bloco atualizado");
    },
  });

  const removeBlock = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("client_board_blocks")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_board_blocks", board?.id] });
      toast.success("Bloco removido");
    },
  });

  const moveBlockOrder = async (index: number, dir: "prev" | "next") => {
    const target = dir === "prev" ? index - 1 : index + 1;
    if (target < 0 || target >= blocks.length) return;
    const reordered = [...blocks];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(target, 0, moved);

    await Promise.all(
      reordered.map((blk, i) =>
        (supabase as any)
          .from("client_board_blocks")
          .update({ display_order: i })
          .eq("id", blk.id)
      )
    );
    qc.invalidateQueries({ queryKey: ["client_board_blocks", board?.id] });
  };

  // Kanban card handlers
  const handleAddKanbanCard = async (column: KanbanStatus, title: string) => {
    if (!board || !user) return;
    const nextOrder =
      kanbanCards.reduce((m, c) => Math.max(m, c.display_order), 0) + 1;
    const { error } = await (supabase as any).from("client_kanban_cards").insert([
      {
        board_id: board.id,
        user_id: user.id,
        column_key: column,
        title,
        display_order: nextOrder,
        checklist: [],
        tags: [],
      },
    ]);
    if (error) {
      toast.error("Erro ao criar tarefa");
      return;
    }
    qc.invalidateQueries({ queryKey: ["client_kanban_cards", board.id] });
  };

  const handleMoveKanbanCard = async (cardId: string, column: KanbanStatus) => {
    await (supabase as any)
      .from("client_kanban_cards")
      .update({ column_key: column })
      .eq("id", cardId);
    qc.invalidateQueries({ queryKey: ["client_kanban_cards", board?.id] });
  };

  const handleDeleteKanbanCard = async (cardId: string) => {
    await (supabase as any).from("client_kanban_cards").delete().eq("id", cardId);
    qc.invalidateQueries({ queryKey: ["client_kanban_cards", board?.id] });
  };

  const handleToggleChecklist = async (card: ClientKanbanCard, itemId: string) => {
    const nextList = (card.checklist || []).map((i) =>
      i.id === itemId ? { ...i, done: !i.done } : i
    );
    await (supabase as any)
      .from("client_kanban_cards")
      .update({ checklist: nextList })
      .eq("id", card.id);
    qc.invalidateQueries({ queryKey: ["client_kanban_cards", board?.id] });
  };

  const handleAddChecklistItem = async (card: ClientKanbanCard, text: string) => {
    const nextList = [
      ...(card.checklist || []),
      { id: crypto.randomUUID(), text, done: false },
    ];
    await (supabase as any)
      .from("client_kanban_cards")
      .update({ checklist: nextList })
      .eq("id", card.id);
    qc.invalidateQueries({ queryKey: ["client_kanban_cards", board?.id] });
  };

  if (isMissingTableError(boardError)) {
    return <MigrationNotice featureName="Quadro do Cliente" />;
  }

  if (boardError) {
    return (
      <div className="rounded-3xl bg-white border border-[#E5E7E2] p-8 text-center space-y-3">
        <p className="text-sm font-semibold text-[#111412]">
          Não foi possível carregar o Quadro deste cliente.
        </p>
        <p className="text-xs text-[#5E6862]">
          {(boardError as any)?.message || "Erro inesperado ao consultar o Supabase."}
        </p>
        <button
          type="button"
          onClick={() => refetchBoard()}
          className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          Tentar novamente
        </button>
      </div>
    );
  }

  if (!user || boardLoading || !board) {
    return (
      <div className="h-44 rounded-3xl bg-white border border-[#E5E7E2] flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#00A859]" />
      </div>
    );
  }

  const publicUrl = `${window.location.origin}/quadro/${board.share_token}`;

  const copyBoardLink = async () => {
    await navigator.clipboard.writeText(publicUrl);
    toast.success("Link do Quadro copiado");
  };

  return (
    <div className="space-y-5">
      {/* Top Bar */}
      <div className="bg-white border border-[#E5E7E2] rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-[200px]">
          <input
            type="text"
            value={titleDraft}
            onChange={(e) => setTitleDraft(e.target.value)}
            onBlur={() => {
              if (titleDraft.trim() && titleDraft !== board.title) {
                updateBoardMeta.mutate({ title: titleDraft.trim() });
              }
            }}
            className="text-base font-bold text-[#111412] bg-transparent border-b border-transparent focus:border-[#E5E7E2] outline-none pb-0.5 max-w-xs w-full"
          />
          <button
            type="button"
            onClick={() => updateBoardMeta.mutate({ is_active: !board.is_active })}
            className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full cursor-pointer ${
              board.is_active
                ? "bg-[#E6F7EE] text-[#053825]"
                : "bg-[#F3F4F0] text-[#5E6862]"
            }`}
          >
            {board.is_active ? "Ativo" : "Pausado"}
          </button>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPreviewMode((v) => !v)}
            className={`studio-press inline-flex items-center gap-1.5 rounded-full text-xs font-semibold px-3.5 py-2 cursor-pointer border ${
              previewMode
                ? "bg-[#111412] text-white border-[#111412]"
                : "bg-[#F6F6F2] text-[#111412] border-[#E5E7E2] hover:bg-[#EBECE6]"
            }`}
          >
            {previewMode ? <Edit3 className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {previewMode ? "Modo edição" : "Visualizar como cliente"}
          </button>

          <button
            type="button"
            onClick={copyBoardLink}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] text-[#111412] text-xs font-semibold px-3.5 py-2 cursor-pointer"
          >
            <Copy className="w-3.5 h-3.5" />
            Copiar link
          </button>

          <a
            href={publicUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="studio-press p-2 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] border border-[#E5E7E2] text-[#111412]"
            title="Abrir quadro público"
          >
            <ExternalLink className="w-3.5 h-3.5" />
          </a>

          {!previewMode && (
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
              className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Adicionar bloco
            </button>
          )}
        </div>
      </div>

      {/* Adaptive 4-Column Constructive Grid */}
      {blocks.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D6D9D2] bg-white p-12 text-center space-y-4">
          <LayoutGrid className="w-10 h-10 text-[#00A859] mx-auto opacity-60" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#111412]">
              Monte o Quadro de {client.name}
            </h3>
            <p className="text-xs text-[#5E6862] max-w-md mx-auto">
              Divida em até 4 colunas e combine blocos de Logotipo, Paleta, Tipografia, Kanban, Orçamentos, Documentos, Arquivos e Links.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setIsAddOpen(true)}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-5 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#CCFF00]" />
            Adicionar primeiro bloco
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 items-start">
          {blocks.map((blk, idx) => (
            <div
              key={blk.id}
              className={`${SPAN_CLASS[blk.col_span] || "lg:col-span-2"} bg-white border border-[#E5E7E2] rounded-3xl p-5 space-y-4`}
            >
              {!previewMode && (
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#F0F1EC]">
                  <div className="flex items-center gap-1">
                    {([1, 2, 3, 4] as const).map((span) => (
                      <button
                        key={span}
                        type="button"
                        onClick={() =>
                          updateBlock.mutate({ id: blk.id, patch: { col_span: span } })
                        }
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full cursor-pointer studio-nums ${
                          blk.col_span === span
                            ? "bg-[#111412] text-white"
                            : "bg-[#F3F4F0] text-[#5E6862] hover:text-[#111412]"
                        }`}
                        title={`${span} de 4 colunas`}
                      >
                        {span}/4
                      </button>
                    ))}
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={idx === 0}
                      onClick={() => moveBlockOrder(idx, "prev")}
                      className="p-1.5 rounded-full hover:bg-[#F3F4F0] text-[#5E6862] disabled:opacity-30 cursor-pointer"
                      title="Mover para trás"
                    >
                      <ArrowLeft className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      disabled={idx === blocks.length - 1}
                      onClick={() => moveBlockOrder(idx, "next")}
                      className="p-1.5 rounded-full hover:bg-[#F3F4F0] text-[#5E6862] disabled:opacity-30 cursor-pointer"
                      title="Mover para frente"
                    >
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditingBlock(blk)}
                      className="studio-press text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[#F3F4F0] hover:bg-[#E5E7E2] text-[#111412] cursor-pointer ml-1"
                    >
                      Editar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Remover bloco "${blk.title}"?`)) {
                          removeBlock.mutate(blk.id);
                        }
                      }}
                      className="p-1.5 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              <BoardBlockRenderer
                block={blk}
                kanbanCards={kanbanCards}
                sharedBudgets={sharedBudgets}
                isAdminEdit={!previewMode}
                onAddKanbanCard={handleAddKanbanCard}
                onMoveKanbanCard={handleMoveKanbanCard}
                onDeleteKanbanCard={handleDeleteKanbanCard}
                onToggleChecklistItem={handleToggleChecklist}
                onAddChecklistItem={handleAddChecklistItem}
              />
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Adicionar Bloco */}
      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Adicionar bloco ao Quadro</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 py-2">
            {BOARD_BLOCK_CATALOG.map((item) => (
              <button
                key={item.type}
                type="button"
                onClick={() => addBlock.mutate(item.type)}
                disabled={addBlock.isPending}
                className="studio-press text-left rounded-2xl border border-[#E5E7E2] hover:border-[#00A859] bg-[#FAFAF7] hover:bg-[#E6F7EE]/50 p-4 space-y-1.5 cursor-pointer"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[#111412]">
                    {item.label}
                  </span>
                  <span className="text-[10px] font-semibold text-[#5E6862] studio-nums">
                    {item.defaultSpan}/4
                  </span>
                </div>
                <p className="text-xs text-[#5E6862] leading-snug">
                  {item.description}
                </p>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar Conteúdo do Bloco */}
      <BoardBlockEditorDialog
        block={editingBlock}
        boardId={board.id}
        open={!!editingBlock}
        onOpenChange={(open) => !open && setEditingBlock(null)}
        saving={updateBlock.isPending}
        onSave={(patch) =>
          editingBlock && updateBlock.mutate({ id: editingBlock.id, patch })
        }
      />
    </div>
  );
};

export default ClientBoardTab;
