import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Plus, Trash2, Upload, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { hexToCmyk, hexToRgb } from "./boardDefaults";
import type { ClientBoardBlock } from "../budgets/types";

interface BoardBlockEditorDialogProps {
  block: ClientBoardBlock | null;
  boardId: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (patch: { title: string; col_span: 1 | 2 | 3 | 4; data: Record<string, any> }) => void;
  saving?: boolean;
}

export const BoardBlockEditorDialog = ({
  block,
  boardId,
  open,
  onOpenChange,
  onSave,
  saving,
}: BoardBlockEditorDialogProps) => {
  const [title, setTitle] = useState("");
  const [colSpan, setColSpan] = useState<1 | 2 | 3 | 4>(2);
  const [data, setData] = useState<Record<string, any>>({});
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (block) {
      setTitle(block.title);
      setColSpan(block.col_span);
      setData(JSON.parse(JSON.stringify(block.data || {})));
    }
  }, [block]);

  if (!block) return null;

  const uploadFileToBoard = async (file: File): Promise<string> => {
    const ext = file.name.split(".").pop() || "bin";
    const path = `boards/${boardId}/${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}.${ext}`;
    const { error } = await supabase.storage
      .from("client-assets")
      .upload(path, file);
    if (error) throw error;
    const { data: urlData } = supabase.storage
      .from("client-assets")
      .getPublicUrl(path);
    return urlData.publicUrl;
  };

  const handleMultiUpload = async (
    files: FileList | null,
    targetKey: "items" | "fonts",
    mapFile: (file: File, url: string) => any
  ) => {
    if (!files || !files.length) return;
    setUploading(true);
    try {
      const added: any[] = [];
      for (const file of Array.from(files)) {
        const url = await uploadFileToBoard(file);
        added.push(mapFile(file, url));
      }
      setData((prev) => ({
        ...prev,
        [targetKey]: [...(prev[targetKey] || []), ...added],
      }));
      toast.success("Arquivos enviados");
    } catch (e: any) {
      toast.error(e?.message || "Erro no upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[88vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Editar bloco — {block.title}</DialogTitle>
        </DialogHeader>

        <div className="space-y-5 py-2">
          {/* Common Title & Width Controls */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="sm:col-span-2">
              <label className="text-xs font-medium text-[#5E6862] block mb-1">
                Título do bloco
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3.5 py-2 text-sm text-[#111412] outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-[#5E6862] block mb-1">
                Largura (de 4 colunas)
              </label>
              <select
                value={colSpan}
                onChange={(e) => setColSpan(Number(e.target.value) as 1 | 2 | 3 | 4)}
                className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3 py-2 text-sm text-[#111412] outline-none"
              >
                <option value={1}>1 coluna (25%)</option>
                <option value={2}>2 colunas (50%)</option>
                <option value={3}>3 colunas (75%)</option>
                <option value={4}>4 colunas (100%)</option>
              </select>
            </div>
          </div>

          {/* ── LOGOTIPO ── */}
          {block.block_type === "logo" && (
            <div className="space-y-3">
              <label className="studio-press flex items-center justify-center gap-2 border border-dashed border-[#CFD4CC] hover:border-[#111412] rounded-2xl p-4 bg-[#FAFAF7] cursor-pointer text-xs font-semibold text-[#111412]">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#00A859]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#00A859]" />
                )}
                {uploading ? "Enviando..." : "Enviar arquivos do logotipo (SVG, PNG, PDF, AI...)"}
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    handleMultiUpload(e.target.files, "items", (file, url) => ({
                      id: crypto.randomUUID(),
                      name: file.name.replace(/\.[^.]+$/, ""),
                      variant: "Principal",
                      format: file.name.split(".").pop()?.toUpperCase() || "",
                      url,
                    }))
                  }
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {(data.items || []).map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-2.5"
                >
                  <input
                    type="text"
                    value={item.name}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, name: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="Nome"
                    className="sm:col-span-4 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={item.variant || ""}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, variant: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="Variação (Principal, Branca...)"
                    className="sm:col-span-4 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={item.format || ""}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, format: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="Formato (SVG, PNG)"
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        items: data.items.filter((_: any, i: number) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-[#8FA399] hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* ── PALETA DE CORES ── */}
          {block.block_type === "palette" && (
            <div className="space-y-3">
              {(data.colors || []).map((c: any, idx: number) => (
                <div
                  key={c.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-2.5"
                >
                  <div className="sm:col-span-1 flex justify-center">
                    <input
                      type="color"
                      value={c.hex || "#00A859"}
                      onChange={(e) => {
                        const hex = e.target.value;
                        const next = [...data.colors];
                        next[idx] = {
                          ...c,
                          hex,
                          rgb: hexToRgb(hex),
                          cmyk: hexToCmyk(hex),
                        };
                        setData({ ...data, colors: next });
                      }}
                      className="w-8 h-8 rounded-lg border border-[#E5E7E2] cursor-pointer p-0 bg-transparent"
                    />
                  </div>
                  <input
                    type="text"
                    value={c.name}
                    onChange={(e) => {
                      const next = [...data.colors];
                      next[idx] = { ...c, name: e.target.value };
                      setData({ ...data, colors: next });
                    }}
                    placeholder="Nome (Verde Principal)"
                    className="sm:col-span-4 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={c.role || ""}
                    onChange={(e) => {
                      const next = [...data.colors];
                      next[idx] = { ...c, role: e.target.value };
                      setData({ ...data, colors: next });
                    }}
                    placeholder="Função (Primária, Apoio...)"
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={c.hex}
                    onChange={(e) => {
                      const hex = e.target.value;
                      const next = [...data.colors];
                      next[idx] = {
                        ...c,
                        hex,
                        rgb: hexToRgb(hex) || c.rgb,
                        cmyk: hexToCmyk(hex) || c.cmyk,
                      };
                      setData({ ...data, colors: next });
                    }}
                    placeholder="#00A859"
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs font-mono outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        colors: data.colors.filter((_: any, i: number) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-[#8FA399] hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    colors: [
                      ...(data.colors || []),
                      {
                        id: crypto.randomUUID(),
                        name: "Nova cor",
                        role: "Primária",
                        hex: "#00A859",
                        rgb: hexToRgb("#00A859"),
                        cmyk: hexToCmyk("#00A859"),
                      },
                    ],
                  })
                }
                className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A859] bg-[#E6F7EE] rounded-full px-4 py-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar cor
              </button>
            </div>
          )}

          {/* ── TIPOGRAFIA ── */}
          {block.block_type === "typography" && (
            <div className="space-y-3">
              {(data.fonts || []).map((f: any, idx: number) => (
                <div
                  key={f.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-2.5"
                >
                  <input
                    type="text"
                    value={f.family}
                    onChange={(e) => {
                      const next = [...data.fonts];
                      next[idx] = { ...f, family: e.target.value };
                      setData({ ...data, fonts: next });
                    }}
                    placeholder="Família (Ex: Montserrat)"
                    className="sm:col-span-4 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={f.role || ""}
                    onChange={(e) => {
                      const next = [...data.fonts];
                      next[idx] = { ...f, role: e.target.value };
                      setData({ ...data, fonts: next });
                    }}
                    placeholder="Uso (Títulos, Texto)"
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={f.weights || ""}
                    onChange={(e) => {
                      const next = [...data.fonts];
                      next[idx] = { ...f, weights: e.target.value };
                      setData({ ...data, fonts: next });
                    }}
                    placeholder="Pesos (400, 700)"
                    className="sm:col-span-2 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={f.url || ""}
                    onChange={(e) => {
                      const next = [...data.fonts];
                      next[idx] = { ...f, url: e.target.value };
                      setData({ ...data, fonts: next });
                    }}
                    placeholder="URL download"
                    className="sm:col-span-2 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        fonts: data.fonts.filter((_: any, i: number) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-[#8FA399] hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() =>
                    setData({
                      ...data,
                      fonts: [
                        ...(data.fonts || []),
                        { id: crypto.randomUUID(), family: "", role: "Títulos", weights: "Regular / Bold", url: "" },
                      ],
                    })
                  }
                  className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#111412] bg-[#F3F4F0] rounded-full px-4 py-2 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Adicionar fonte
                </button>

                <label className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A859] bg-[#E6F7EE] rounded-full px-4 py-2 cursor-pointer">
                  <Upload className="w-3.5 h-3.5" />
                  Upload (.ttf / .otf / .zip)
                  <input
                    type="file"
                    multiple
                    onChange={(e) =>
                      handleMultiUpload(e.target.files, "fonts", (file, url) => ({
                        id: crypto.randomUUID(),
                        family: file.name.replace(/\.[^.]+$/, ""),
                        role: "Família oficial",
                        weights: "",
                        url,
                      }))
                    }
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          )}

          {/* ── ORÇAMENTOS ── */}
          {block.block_type === "budgets" && (
            <div className="space-y-3 p-4 rounded-2xl bg-[#FAFAF7] border border-[#E5E7E2]">
              <label className="flex items-center gap-2.5 text-sm text-[#111412] cursor-pointer">
                <input
                  type="checkbox"
                  checked={data.allowAccept !== false}
                  onChange={(e) => setData({ ...data, allowAccept: e.target.checked })}
                  className="rounded border-[#D6D9D2] accent-[#00A859]"
                />
                Permitir que o cliente clique em "Aprovar" nos orçamentos compartilhados
              </label>
              <p className="text-xs text-[#5E6862]">
                Para escolher quais orçamentos aparecem aqui, ative a opção "Mostrar no Quadro" dentro de cada orçamento.
              </p>
            </div>
          )}

          {/* ── DOCUMENTOS & ARQUIVOS ── */}
          {(block.block_type === "documents" || block.block_type === "files") && (
            <div className="space-y-3">
              <label className="studio-press flex items-center justify-center gap-2 border border-dashed border-[#CFD4CC] hover:border-[#111412] rounded-2xl p-4 bg-[#FAFAF7] cursor-pointer text-xs font-semibold text-[#111412]">
                {uploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-[#00A859]" />
                ) : (
                  <Upload className="w-4 h-4 text-[#00A859]" />
                )}
                {uploading
                  ? "Enviando..."
                  : block.block_type === "documents"
                  ? "Enviar documentos (PDF, contratos, manuais...)"
                  : "Enviar materiais e arquivos (PNG, JPG, ZIP...)"}
                <input
                  type="file"
                  multiple
                  onChange={(e) =>
                    handleMultiUpload(e.target.files, "items", (file, url) => ({
                      id: crypto.randomUUID(),
                      title: file.name.replace(/\.[^.]+$/, ""),
                      category: file.name.split(".").pop()?.toUpperCase() || "Arquivo",
                      tag: file.name.split(".").pop()?.toUpperCase() || "",
                      url,
                    }))
                  }
                  className="hidden"
                  disabled={uploading}
                />
              </label>

              {(data.items || []).map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-2.5"
                >
                  <input
                    type="text"
                    value={item.title}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, title: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="Título"
                    className="sm:col-span-5 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={block.block_type === "documents" ? item.category || "" : item.tag || ""}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] =
                        block.block_type === "documents"
                          ? { ...item, category: e.target.value }
                          : { ...item, tag: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder={block.block_type === "documents" ? "Tipo (Contrato, Manual)" : "Categoria"}
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, url: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="URL do arquivo"
                    className="sm:col-span-3 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        items: data.items.filter((_: any, i: number) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-[#8FA399] hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}

              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    items: [
                      ...(data.items || []),
                      { id: crypto.randomUUID(), title: "Novo link de arquivo", category: "PDF", tag: "Entrega", url: "" },
                    ],
                  })
                }
                className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#5E6862] hover:text-[#111412] bg-[#F3F4F0] rounded-full px-3.5 py-1.5 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar por link externo
              </button>
            </div>
          )}

          {/* ── LINKS ── */}
          {block.block_type === "links" && (
            <div className="space-y-3">
              {(data.items || []).map((item: any, idx: number) => (
                <div
                  key={item.id}
                  className="grid grid-cols-1 sm:grid-cols-12 gap-2 items-center bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-2.5"
                >
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, label: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="Nome (Ex: Pasta no Drive)"
                    className="sm:col-span-5 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <input
                    type="text"
                    value={item.url}
                    onChange={(e) => {
                      const next = [...data.items];
                      next[idx] = { ...item, url: e.target.value };
                      setData({ ...data, items: next });
                    }}
                    placeholder="https://..."
                    className="sm:col-span-6 rounded-lg bg-white border border-[#E5E7E2] px-2.5 py-1.5 text-xs outline-none"
                  />
                  <button
                    type="button"
                    onClick={() =>
                      setData({
                        ...data,
                        items: data.items.filter((_: any, i: number) => i !== idx),
                      })
                    }
                    className="sm:col-span-1 text-[#8FA399] hover:text-red-600 flex justify-center cursor-pointer"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
              <button
                type="button"
                onClick={() =>
                  setData({
                    ...data,
                    items: [...(data.items || []), { id: crypto.randomUUID(), label: "", url: "" }],
                  })
                }
                className="studio-press inline-flex items-center gap-1.5 text-xs font-semibold text-[#00A859] bg-[#E6F7EE] rounded-full px-4 py-2 cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                Adicionar link
              </button>
            </div>
          )}

          {/* ── NOTAS ── */}
          {block.block_type === "notes" && (
            <div>
              <label className="text-xs font-medium text-[#5E6862] block mb-1.5">
                Texto
              </label>
              <textarea
                rows={5}
                value={data.text || ""}
                onChange={(e) => setData({ ...data, text: e.target.value })}
                placeholder="Orientações, observações ou boas-vindas..."
                className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] p-3 text-sm text-[#111412] outline-none"
              />
            </div>
          )}

          {/* ── KANBAN info ── */}
          {block.block_type === "kanban" && (
            <p className="text-xs text-[#5E6862] bg-[#FAFAF7] border border-[#E5E7E2] rounded-xl p-3.5">
              Adicione, mova e gerencie as tarefas diretamente nas colunas do Kanban dentro do quadro. No link público, o cliente apenas visualiza o andamento.
            </p>
          )}
        </div>

        <DialogFooter className="gap-2 sm:gap-0">
          <button
            type="button"
            onClick={() => onOpenChange(false)}
            className="studio-press rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-4 py-2 cursor-pointer"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => onSave({ title: title.trim() || block.title, col_span: colSpan, data })}
            className="studio-press rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2 cursor-pointer disabled:opacity-50"
          >
            {saving ? "Salvando..." : "Salvar bloco"}
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
