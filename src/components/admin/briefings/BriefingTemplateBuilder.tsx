import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Trash2,
  ArrowUp,
  ArrowDown,
  Save,
  Copy,
  ClipboardList,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import {
  DEFAULT_BRANDING_FIELDS,
  DEFAULT_BRANDING_TEMPLATE_DESC,
  DEFAULT_BRANDING_TEMPLATE_NAME,
  BRIEFING_FIELD_TYPE_LABELS,
} from "./defaultBriefingTemplate";
import { isMissingTableError, MigrationNotice } from "../MigrationNotice";
import type { BriefingField, BriefingFieldType, BriefingTemplate } from "../budgets/types";

interface BriefingFieldsEditorProps {
  fields: BriefingField[];
  onChange: (fields: BriefingField[]) => void;
}

export const BriefingFieldsEditor = ({ fields, onChange }: BriefingFieldsEditorProps) => {
  const addField = () => {
    const lastSection = fields[fields.length - 1]?.section || "Geral";
    const next: BriefingField = {
      id: `q_${crypto.randomUUID().slice(0, 8)}`,
      section: lastSection,
      label: "Nova pergunta",
      type: "text",
      placeholder: "",
      required: false,
      options: [],
    };
    onChange([...fields, next]);
  };

  const updateField = (id: string, patch: Partial<BriefingField>) => {
    onChange(fields.map((f) => (f.id === id ? { ...f, ...patch } : f)));
  };

  const removeField = (id: string) => {
    onChange(fields.filter((f) => f.id !== id));
  };

  const moveField = (idx: number, dir: "up" | "down") => {
    const next = [...fields];
    const target = dir === "up" ? idx - 1 : idx + 1;
    if (target < 0 || target >= next.length) return;
    const [moved] = next.splice(idx, 1);
    next.splice(target, 0, moved);
    onChange(next);
  };

  return (
    <div className="space-y-3">
      {fields.map((field, idx) => {
        const hasOptions = field.type === "radio" || field.type === "checkbox";
        return (
          <div
            key={field.id}
            className="rounded-2xl bg-[#FAFAF7] border border-[#E5E7E2] p-4 space-y-3"
          >
            <div className="flex items-start justify-between gap-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-2.5 flex-1">
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-medium text-[#5E6862] block mb-1">
                    Seção
                  </label>
                  <input
                    type="text"
                    value={field.section || ""}
                    onChange={(e) => updateField(field.id, { section: e.target.value })}
                    placeholder="Ex: Identidade"
                    className="w-full rounded-xl bg-white border border-[#E5E7E2] focus:border-[#111412] px-3 py-1.5 text-xs text-[#111412] outline-none"
                  />
                </div>
                <div className="sm:col-span-3">
                  <label className="text-[11px] font-medium text-[#5E6862] block mb-1">
                    Tipo de caixa
                  </label>
                  <select
                    value={field.type}
                    onChange={(e) => {
                      const newType = e.target.value as BriefingFieldType;
                      updateField(field.id, {
                        type: newType,
                        options:
                          (newType === "radio" || newType === "checkbox") &&
                          (!field.options || field.options.length === 0)
                            ? ["Opção 1", "Opção 2"]
                            : field.options,
                      });
                    }}
                    className="w-full rounded-xl bg-white border border-[#E5E7E2] focus:border-[#111412] px-2.5 py-1.5 text-xs text-[#111412] outline-none"
                  >
                    {Object.entries(BRIEFING_FIELD_TYPE_LABELS).map(([k, label]) => (
                      <option key={k} value={k}>
                        {label}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="sm:col-span-6">
                  <label className="text-[11px] font-medium text-[#5E6862] block mb-1">
                    Pergunta
                  </label>
                  <input
                    type="text"
                    value={field.label}
                    onChange={(e) => updateField(field.id, { label: e.target.value })}
                    placeholder="Digite a pergunta..."
                    className="w-full rounded-xl bg-white border border-[#E5E7E2] focus:border-[#111412] px-3 py-1.5 text-xs font-medium text-[#111412] outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-1 pt-5 shrink-0">
                <button
                  type="button"
                  onClick={() => moveField(idx, "up")}
                  disabled={idx === 0}
                  className="p-1.5 rounded-lg text-[#5E6862] hover:bg-[#EBECE6] disabled:opacity-30 cursor-pointer"
                  title="Subir"
                >
                  <ArrowUp className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => moveField(idx, "down")}
                  disabled={idx === fields.length - 1}
                  className="p-1.5 rounded-lg text-[#5E6862] hover:bg-[#EBECE6] disabled:opacity-30 cursor-pointer"
                  title="Descer"
                >
                  <ArrowDown className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => removeField(field.id)}
                  className="p-1.5 rounded-lg text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                  title="Remover"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <input
                type="text"
                value={field.placeholder || ""}
                onChange={(e) => updateField(field.id, { placeholder: e.target.value })}
                placeholder="Texto de exemplo / dica (opcional)"
                className="flex-1 min-w-[200px] rounded-xl bg-white border border-[#E5E7E2] focus:border-[#111412] px-3 py-1.5 text-xs text-[#5E6862] outline-none"
              />

              <label className="inline-flex items-center gap-2 text-xs text-[#5E6862] cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={!!field.required}
                  onChange={(e) => updateField(field.id, { required: e.target.checked })}
                  className="rounded border-[#D6D9D2] accent-[#00A859]"
                />
                Obrigatória
              </label>

              {hasOptions && (
                <label className="inline-flex items-center gap-2 text-xs text-[#5E6862] cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={!!field.allowOther}
                    onChange={(e) => updateField(field.id, { allowOther: e.target.checked })}
                    className="rounded border-[#D6D9D2] accent-[#00A859]"
                  />
                  Campo "Outro"
                </label>
              )}
            </div>

            {hasOptions && (
              <div className="pt-2 border-t border-[#E5E7E2] space-y-2">
                <span className="text-[11px] font-medium text-[#5E6862] block">
                  Opções de resposta
                </span>
                <div className="flex flex-wrap gap-2">
                  {(field.options || []).map((opt, oIdx) => (
                    <div
                      key={oIdx}
                      className="inline-flex items-center gap-1 bg-white border border-[#E5E7E2] rounded-full pl-3 pr-1.5 py-1"
                    >
                      <input
                        type="text"
                        value={opt}
                        onChange={(e) => {
                          const nextOpts = [...(field.options || [])];
                          nextOpts[oIdx] = e.target.value;
                          updateField(field.id, { options: nextOpts });
                        }}
                        className="text-xs text-[#111412] bg-transparent outline-none w-28 sm:w-36"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          const nextOpts = (field.options || []).filter((_, i) => i !== oIdx);
                          updateField(field.id, { options: nextOpts });
                        }}
                        className="text-[#8FA399] hover:text-red-600 px-1 cursor-pointer text-xs"
                      >
                        ×
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() =>
                      updateField(field.id, {
                        options: [...(field.options || []), `Opção ${(field.options?.length || 0) + 1}`],
                      })
                    }
                    className="inline-flex items-center gap-1 text-xs font-medium text-[#00A859] hover:bg-[#E6F7EE] rounded-full px-3 py-1 border border-dashed border-[#00A859]/40 cursor-pointer"
                  >
                    <Plus className="w-3 h-3" />
                    Opção
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button
        type="button"
        onClick={addField}
        className="studio-press w-full py-3 rounded-2xl border border-dashed border-[#CFD4CC] hover:border-[#111412] text-xs font-semibold text-[#5E6862] hover:text-[#111412] bg-white cursor-pointer flex items-center justify-center gap-1.5"
      >
        <Plus className="w-4 h-4" />
        Adicionar pergunta
      </button>
    </div>
  );
};

const BriefingTemplateBuilder = () => {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [nameDraft, setNameDraft] = useState("");
  const [descDraft, setDescDraft] = useState("");
  const [fieldsDraft, setFieldsDraft] = useState<BriefingField[]>([]);

  const {
    data: templates = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["briefing_templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("briefing_templates")
        .select("*")
        .order("is_default", { ascending: false })
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data || []) as BriefingTemplate[];
    },
  });

  // Auto-seed default template from user's spreadsheet if table exists and is empty
  const seedDefault = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await (supabase as any)
        .from("briefing_templates")
        .insert([
          {
            user_id: user.id,
            name: DEFAULT_BRANDING_TEMPLATE_NAME,
            description: DEFAULT_BRANDING_TEMPLATE_DESC,
            schema: DEFAULT_BRANDING_FIELDS,
            is_default: true,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data as BriefingTemplate;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["briefing_templates"] });
      setSelectedId(created.id);
      toast.success("Template padrão criado a partir da planilha");
    },
  });

  useEffect(() => {
    if (!isLoading && !error && templates.length > 0 && !selectedId) {
      setSelectedId(templates[0].id);
    }
  }, [templates, isLoading, error, selectedId]);

  const activeTemplate = templates.find((t) => t.id === selectedId) || null;

  useEffect(() => {
    if (activeTemplate) {
      setNameDraft(activeTemplate.name);
      setDescDraft(activeTemplate.description || "");
      setFieldsDraft(Array.isArray(activeTemplate.schema) ? activeTemplate.schema : []);
    }
  }, [activeTemplate?.id]);

  const saveTemplate = useMutation({
    mutationFn: async () => {
      if (!activeTemplate) return;
      const { error } = await (supabase as any)
        .from("briefing_templates")
        .update({
          name: nameDraft.trim() || "Template sem nome",
          description: descDraft.trim() || null,
          schema: fieldsDraft,
        })
        .eq("id", activeTemplate.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["briefing_templates"] });
      toast.success("Template salvo");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao salvar template"),
  });

  const createTemplate = useMutation({
    mutationFn: async (base?: BriefingTemplate) => {
      if (!user) throw new Error("Não autenticado");
      const { data, error } = await (supabase as any)
        .from("briefing_templates")
        .insert([
          {
            user_id: user.id,
            name: base ? `${base.name} (cópia)` : "Novo template",
            description: base?.description || "",
            schema: base?.schema || DEFAULT_BRANDING_FIELDS.slice(0, 4),
            is_default: false,
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data as BriefingTemplate;
    },
    onSuccess: (created) => {
      qc.invalidateQueries({ queryKey: ["briefing_templates"] });
      setSelectedId(created.id);
      toast.success("Template criado");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("briefing_templates")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["briefing_templates"] });
      setSelectedId(null);
      toast.success("Template excluído");
    },
  });

  if (isMissingTableError(error)) {
    return <MigrationNotice featureName="Templates de Briefing" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold text-[#111412]">
            Templates de Briefing
          </h2>
          <p className="text-xs text-[#5E6862]">
            Configure formulários modulares reutilizáveis para enviar aos clientes.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {templates.length === 0 && !isLoading && (
            <button
              type="button"
              onClick={() => seedDefault.mutate()}
              disabled={seedDefault.isPending}
              className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#E6F7EE] text-[#053825] border border-[#C6EBD7] text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Importar modelo da planilha
            </button>
          )}
          <button
            type="button"
            onClick={() => createTemplate.mutate(undefined)}
            disabled={createTemplate.isPending}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#CCFF00]" />
            Novo template
          </button>
        </div>
      </div>

      {isLoading ? (
        <div className="h-48 rounded-3xl bg-white border border-[#E5E7E2] animate-pulse" />
      ) : templates.length === 0 ? (
        <div className="rounded-3xl bg-white border border-dashed border-[#D6D9D2] p-10 text-center space-y-4">
          <ClipboardList className="w-10 h-10 text-[#00A859] mx-auto opacity-60" />
          <div className="space-y-1">
            <h3 className="text-base font-semibold text-[#111412]">
              Nenhum template cadastrado ainda
            </h3>
            <p className="text-xs text-[#5E6862] max-w-md mx-auto">
              Você pode gerar automaticamente o template de Marca / Identidade Visual com todas as 22 perguntas da sua planilha.
            </p>
          </div>
          <button
            type="button"
            onClick={() => seedDefault.mutate()}
            className="studio-press inline-flex items-center gap-2 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2.5 cursor-pointer"
          >
            <Sparkles className="w-4 h-4" />
            Criar template padrão da planilha
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
          {/* Templates Sidebar List */}
          <div className="lg:col-span-4 space-y-2">
            {templates.map((tpl) => {
              const active = tpl.id === activeTemplate?.id;
              return (
                <div
                  key={tpl.id}
                  onClick={() => setSelectedId(tpl.id)}
                  className={`studio-press rounded-2xl border p-4 cursor-pointer transition-colors ${
                    active
                      ? "bg-[#111412] text-white border-[#111412]"
                      : "bg-white text-[#111412] border-[#E5E7E2] hover:border-[#C5CBC2]"
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <h3 className="text-sm font-semibold truncate">{tpl.name}</h3>
                      <p
                        className={`text-xs mt-1 line-clamp-2 ${
                          active ? "text-[#8FA399]" : "text-[#5E6862]"
                        }`}
                      >
                        {tpl.description || `${tpl.schema?.length || 0} perguntas`}
                      </p>
                    </div>
                    <span
                      className={`text-[11px] font-semibold px-2 py-0.5 rounded-full studio-nums shrink-0 ${
                        active
                          ? "bg-[#1C231F] text-[#CCFF00]"
                          : "bg-[#F3F4F0] text-[#5E6862]"
                      }`}
                    >
                      {tpl.schema?.length || 0}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Active Template Editor */}
          {activeTemplate && (
            <div className="lg:col-span-8 bg-white border border-[#E5E7E2] rounded-3xl p-5 sm:p-6 space-y-5">
              <div className="flex flex-wrap items-start justify-between gap-3 pb-4 border-b border-[#F0F1EC]">
                <div className="space-y-2 flex-1 min-w-[220px]">
                  <input
                    type="text"
                    value={nameDraft}
                    onChange={(e) => setNameDraft(e.target.value)}
                    placeholder="Nome do template"
                    className="w-full text-lg font-bold text-[#111412] bg-transparent border-b border-transparent focus:border-[#E5E7E2] outline-none pb-0.5"
                  />
                  <input
                    type="text"
                    value={descDraft}
                    onChange={(e) => setDescDraft(e.target.value)}
                    placeholder="Descrição curta (opcional)"
                    className="w-full text-xs text-[#5E6862] bg-transparent border-b border-transparent focus:border-[#E5E7E2] outline-none"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => createTemplate.mutate(activeTemplate)}
                    className="studio-press p-2 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] cursor-pointer"
                    title="Duplicar template"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir template "${activeTemplate.name}"?`)) {
                        deleteTemplate.mutate(activeTemplate.id);
                      }
                    }}
                    className="studio-press p-2 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir template"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => saveTemplate.mutate()}
                    disabled={saveTemplate.isPending}
                    className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer disabled:opacity-50"
                  >
                    {saveTemplate.isPending ? (
                      "Salvando..."
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        Salvar
                      </>
                    )}
                  </button>
                </div>
              </div>

              <BriefingFieldsEditor fields={fieldsDraft} onChange={setFieldsDraft} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default BriefingTemplateBuilder;
