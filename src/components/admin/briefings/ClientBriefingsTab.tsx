import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import {
  Plus,
  Copy,
  ExternalLink,
  Trash2,
  ClipboardList,
  Eye,
  Edit3,
  ArrowLeft,
  Download,
  CheckCircle2,
  Clock,
  SlidersHorizontal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { generateRandomCode, generateSlug } from "@/lib/utils";
import { DEFAULT_BRANDING_FIELDS, DEFAULT_BRANDING_TEMPLATE_NAME } from "./defaultBriefingTemplate";
import { BriefingFieldsEditor } from "./BriefingTemplateBuilder";
import { isMissingTableError, MigrationNotice } from "../MigrationNotice";
import type {
  BudgetClient,
  BriefingField,
  BriefingTemplate,
  ClientBriefing,
} from "../budgets/types";

interface ClientBriefingsTabProps {
  client: BudgetClient;
}

const ClientBriefingsTab = ({ client }: ClientBriefingsTabProps) => {
  const { user } = useAuth();
  const qc = useQueryClient();

  const [isNewOpen, setIsNewOpen] = useState(false);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("__default__");
  const [newTitle, setNewTitle] = useState(`Briefing — ${client.name}`);
  const [viewingBriefing, setViewingBriefing] = useState<ClientBriefing | null>(null);
  const [editingFieldsBriefing, setEditingFieldsBriefing] = useState<ClientBriefing | null>(null);
  const [fieldsDraft, setFieldsDraft] = useState<BriefingField[]>([]);

  const {
    data: briefings = [],
    isLoading,
    error,
  } = useQuery({
    queryKey: ["client_briefings", client.id],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("client_briefings")
        .select("*")
        .eq("client_id", client.id)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data || []) as ClientBriefing[];
    },
  });

  const { data: templates = [] } = useQuery({
    queryKey: ["briefing_templates"],
    queryFn: async () => {
      const { data, error } = await (supabase as any)
        .from("briefing_templates")
        .select("*")
        .order("is_default", { ascending: false });
      if (error) return [] as BriefingTemplate[];
      return (data || []) as BriefingTemplate[];
    },
  });

  const createBriefing = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Não autenticado");
      const chosenTpl = templates.find((t) => t.id === selectedTemplateId);
      const snapshot = chosenTpl ? chosenTpl.schema : DEFAULT_BRANDING_FIELDS;
      const baseSlug =
        generateSlug(client.company || client.name || "briefing").slice(0, 18) ||
        "briefing";
      const token = `${baseSlug}-${generateRandomCode(8)}`;

      const { data, error } = await (supabase as any)
        .from("client_briefings")
        .insert([
          {
            user_id: user.id,
            client_id: client.id,
            template_id: chosenTpl ? chosenTpl.id : null,
            title: newTitle.trim() || `Briefing — ${client.name}`,
            share_token: token,
            questions_snapshot: snapshot,
            responses: {},
            status: "pending",
          },
        ])
        .select()
        .single();
      if (error) throw error;
      return data as ClientBriefing;
    },
    onSuccess: async (created) => {
      qc.invalidateQueries({ queryKey: ["client_briefings", client.id] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      setIsNewOpen(false);
      const url = `${window.location.origin}/briefing/${created.share_token}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Briefing criado e link copiado");
      } catch {
        toast.success("Briefing criado");
      }
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao criar briefing"),
  });

  const saveCustomFields = useMutation({
    mutationFn: async () => {
      if (!editingFieldsBriefing) return;
      const { error } = await (supabase as any)
        .from("client_briefings")
        .update({ questions_snapshot: fieldsDraft })
        .eq("id", editingFieldsBriefing.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_briefings", client.id] });
      setEditingFieldsBriefing(null);
      toast.success("Perguntas atualizadas");
    },
    onError: (e: any) => toast.error(e?.message || "Erro ao atualizar perguntas"),
  });

  const delBriefing = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await (supabase as any)
        .from("client_briefings")
        .delete()
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["client_briefings", client.id] });
      qc.invalidateQueries({ queryKey: ["admin-home-stats"] });
      if (viewingBriefing) setViewingBriefing(null);
      toast.success("Briefing excluído");
    },
  });

  const copyLink = async (token: string) => {
    const url = `${window.location.origin}/briefing/${token}`;
    await navigator.clipboard.writeText(url);
    toast.success("Link do briefing copiado");
  };

  if (isMissingTableError(error)) {
    return <MigrationNotice featureName="Briefings" />;
  }

  // ── Editing customized questions for a specific briefing ──
  if (editingFieldsBriefing) {
    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E5E7E2] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setEditingFieldsBriefing(null)}
              className="studio-press p-2 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <h3 className="text-sm font-semibold text-[#111412]">
                Personalizar perguntas — {editingFieldsBriefing.title}
              </h3>
              <p className="text-xs text-[#5E6862]">
                Alterações afetam apenas este link do cliente.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => saveCustomFields.mutate()}
            disabled={saveCustomFields.isPending}
            className="studio-press rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2 cursor-pointer disabled:opacity-50"
          >
            {saveCustomFields.isPending ? "Salvando..." : "Salvar perguntas"}
          </button>
        </div>

        <div className="bg-white border border-[#E5E7E2] rounded-3xl p-5 sm:p-6">
          <BriefingFieldsEditor fields={fieldsDraft} onChange={setFieldsDraft} />
        </div>
      </div>
    );
  }

  // ── Viewing Responses of a Briefing ──
  if (viewingBriefing) {
    const questions = Array.isArray(viewingBriefing.questions_snapshot)
      ? viewingBriefing.questions_snapshot
      : [];
    const responses = viewingBriefing.responses || {};

    const sections = questions.reduce<Record<string, BriefingField[]>>((acc, q) => {
      const sec = q.section?.trim() || "Geral";
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(q);
      return acc;
    }, {});

    const copyResponsesText = async () => {
      const lines: string[] = [
        `# ${viewingBriefing.title} — ${client.name}`,
        viewingBriefing.submitted_at
          ? `Respondido em: ${new Date(viewingBriefing.submitted_at).toLocaleString("pt-BR")}`
          : "Status: Aguardando resposta",
        "",
      ];
      questions.forEach((q) => {
        const val = responses[q.id];
        if (!val) return;
        let textVal = "";
        if (typeof val === "string") textVal = val;
        else if (Array.isArray(val)) textVal = val.join(", ");
        else if (typeof val === "object") {
          const parts = [];
          if (val.text) parts.push(val.text);
          if (Array.isArray(val.swatches) && val.swatches.length) parts.push(`Cores: ${val.swatches.join(", ")}`);
          if (Array.isArray(val.files) && val.files.length) parts.push(`Arquivos: ${val.files.map((f: any) => f.url).join(", ")}`);
          textVal = parts.join(" | ");
        }
        if (textVal) lines.push(`**${q.label}**\n${textVal}\n`);
      });
      await navigator.clipboard.writeText(lines.join("\n"));
      toast.success("Respostas copiadas");
    };

    return (
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3 bg-white border border-[#E5E7E2] rounded-2xl p-4">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setViewingBriefing(null)}
              className="studio-press p-2 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] cursor-pointer"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold text-[#111412]">
                  {viewingBriefing.title}
                </h3>
                <span
                  className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${
                    viewingBriefing.status === "submitted"
                      ? "bg-[#E6F7EE] text-[#053825]"
                      : "bg-[#F3F4F0] text-[#5E6862]"
                  }`}
                >
                  {viewingBriefing.status === "submitted" ? "Respondido" : "Aguardando"}
                </span>
              </div>
              {viewingBriefing.submitted_at && (
                <p className="text-xs text-[#5E6862] studio-nums mt-0.5">
                  Enviado em {new Date(viewingBriefing.submitted_at).toLocaleString("pt-BR")}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => copyLink(viewingBriefing.share_token)}
              className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-3.5 py-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5" />
              Copiar link
            </button>
            <button
              type="button"
              onClick={copyResponsesText}
              className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              <Copy className="w-3.5 h-3.5 text-[#CCFF00]" />
              Copiar respostas
            </button>
          </div>
        </div>

        <div className="space-y-5">
          {Object.entries(sections).map(([secName, secFields]) => (
            <div
              key={secName}
              className="bg-white border border-[#E5E7E2] rounded-3xl p-6 space-y-5"
            >
              <h4 className="text-sm font-bold text-[#00A859] pb-2.5 border-b border-[#F0F1EC]">
                {secName}
              </h4>

              <div className="grid grid-cols-1 gap-5">
                {secFields.map((q) => {
                  const val = responses[q.id];
                  const isEmpty =
                    val === undefined ||
                    val === null ||
                    val === "" ||
                    (Array.isArray(val) && val.length === 0) ||
                    (typeof val === "object" &&
                      !Array.isArray(val) &&
                      !val.text &&
                      !(val.swatches?.length) &&
                      !(val.files?.length));

                  return (
                    <div key={q.id} className="space-y-1.5">
                      <p className="text-xs font-semibold text-[#5E6862]">
                        {q.label}
                      </p>

                      {isEmpty ? (
                        <p className="text-sm text-[#9DA7A1] italic">Sem resposta</p>
                      ) : Array.isArray(val) ? (
                        <div className="flex flex-wrap gap-1.5 pt-0.5">
                          {val.map((item, idx) => (
                            <span
                              key={idx}
                              className="inline-flex items-center px-3 py-1 rounded-full bg-[#E6F7EE] text-[#053825] text-xs font-medium"
                            >
                              {item}
                            </span>
                          ))}
                        </div>
                      ) : typeof val === "object" ? (
                        <div className="space-y-2.5 pt-0.5">
                          {val.text && (
                            <p className="text-sm text-[#111412] whitespace-pre-wrap leading-relaxed bg-[#FAFAF7] border border-[#F0F1EC] rounded-xl p-3">
                              {val.text}
                            </p>
                          )}
                          {Array.isArray(val.swatches) && val.swatches.length > 0 && (
                            <div className="flex flex-wrap gap-2">
                              {val.swatches.map((hex: string, idx: number) => (
                                <span
                                  key={idx}
                                  className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-[#FAFAF7] border border-[#E5E7E2] text-xs font-mono text-[#111412]"
                                >
                                  <span
                                    className="w-3.5 h-3.5 rounded-full border border-black/10"
                                    style={{ backgroundColor: hex }}
                                  />
                                  {hex}
                                </span>
                              ))}
                            </div>
                          )}
                          {Array.isArray(val.files) && val.files.length > 0 && (
                            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                              {val.files.map((file: { name: string; url: string }, idx: number) => {
                                const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(file.url);
                                return (
                                  <a
                                    key={idx}
                                    href={file.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="group rounded-xl border border-[#E5E7E2] overflow-hidden bg-[#FAFAF7] hover:border-[#111412] transition-colors flex flex-col"
                                  >
                                    {isImg ? (
                                      <img
                                        src={file.url}
                                        alt={file.name}
                                        className="w-full h-28 object-cover"
                                      />
                                    ) : (
                                      <div className="h-28 flex items-center justify-center text-xs font-medium text-[#5E6862]">
                                        Arquivo
                                      </div>
                                    )}
                                    <div className="p-2 flex items-center justify-between gap-1 text-[11px] text-[#111412] border-t border-[#E5E7E2]">
                                      <span className="truncate">{file.name}</span>
                                      <Download className="w-3 h-3 shrink-0 text-[#5E6862]" />
                                    </div>
                                  </a>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      ) : (
                        <p className="text-sm text-[#111412] whitespace-pre-wrap leading-relaxed bg-[#FAFAF7] border border-[#F0F1EC] rounded-xl p-3">
                          {String(val)}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  // ── List of Briefings for this Client ──
  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h3 className="text-lg font-semibold text-[#111412]">Briefings</h3>

        <button
          type="button"
          onClick={() => {
            setNewTitle(`Briefing — ${client.name}`);
            setSelectedTemplateId(templates[0]?.id || "__default__");
            setIsNewOpen(true);
          }}
          className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-4 py-2 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          Novo briefing
        </button>
      </div>

      {isLoading ? (
        <div className="h-40 rounded-3xl bg-white border border-[#E5E7E2] animate-pulse" />
      ) : briefings.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-[#D6D9D2] bg-white p-10 text-center space-y-3">
          <ClipboardList className="w-10 h-10 text-[#00A859] mx-auto opacity-60" />
          <p className="text-sm text-[#5E6862]">
            Nenhum briefing enviado ainda para {client.name}.
          </p>
          <button
            type="button"
            onClick={() => setIsNewOpen(true)}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-5 py-2.5 cursor-pointer"
          >
            <Plus className="w-4 h-4 text-[#CCFF00]" />
            Gerar primeiro briefing
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {briefings.map((b) => {
            const isSubmitted = b.status === "submitted";
            return (
              <div
                key={b.id}
                className="bg-white border border-[#E5E7E2] hover:border-[#C5CBC2] rounded-2xl p-5 flex flex-col justify-between gap-4 transition-colors"
              >
                <div className="space-y-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-base font-semibold text-[#111412] truncate">
                      {b.title}
                    </h4>
                    <span
                      className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full shrink-0 ${
                        isSubmitted
                          ? "bg-[#E6F7EE] text-[#053825]"
                          : "bg-[#F3F4F0] text-[#5E6862]"
                      }`}
                    >
                      {isSubmitted ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      {isSubmitted ? "Respondido" : "Aguardando"}
                    </span>
                  </div>

                  <p className="text-xs text-[#5E6862] studio-nums">
                    {b.questions_snapshot?.length || 0} perguntas ·{" "}
                    {isSubmitted && b.submitted_at
                      ? `Respondido em ${new Date(b.submitted_at).toLocaleDateString("pt-BR")}`
                      : `Criado em ${new Date(b.created_at).toLocaleDateString("pt-BR")}`}
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-[#F0F1EC]">
                  <button
                    type="button"
                    onClick={() => copyLink(b.share_token)}
                    className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-3 py-1.5 cursor-pointer"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    Copiar link
                  </button>

                  <a
                    href={`/briefing/${b.share_token}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="studio-press p-1.5 rounded-full text-[#5E6862] hover:text-[#111412] hover:bg-[#F6F6F2]"
                    title="Abrir link público"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>

                  <button
                    type="button"
                    onClick={() => {
                      setEditingFieldsBriefing(b);
                      setFieldsDraft(b.questions_snapshot || []);
                    }}
                    className="studio-press p-1.5 rounded-full text-[#5E6862] hover:text-[#111412] hover:bg-[#F6F6F2] cursor-pointer"
                    title="Personalizar perguntas"
                  >
                    <SlidersHorizontal className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      if (confirm(`Excluir "${b.title}"?`)) {
                        delBriefing.mutate(b.id);
                      }
                    }}
                    className="studio-press p-1.5 rounded-full text-[#8FA399] hover:text-red-600 hover:bg-red-50 cursor-pointer"
                    title="Excluir"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>

                  <button
                    type="button"
                    onClick={() => setViewingBriefing(b)}
                    className="studio-press ml-auto inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-[#CCFF00]" />
                    Ver respostas
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal: Criar Briefing */}
      <Dialog open={isNewOpen} onOpenChange={setIsNewOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Novo briefing — {client.name}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-[#5E6862] block mb-1.5">
                Título
              </label>
              <input
                type="text"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder={`Briefing — ${client.name}`}
                className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3.5 py-2 text-sm text-[#111412] outline-none"
              />
            </div>

            <div>
              <label className="text-xs font-medium text-[#5E6862] block mb-1.5">
                Template base
              </label>
              <select
                value={selectedTemplateId}
                onChange={(e) => setSelectedTemplateId(e.target.value)}
                className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3 py-2 text-sm text-[#111412] outline-none"
              >
                {templates.length > 0 ? (
                  templates.map((t) => (
                    <option key={t.id} value={t.id}>
                      {t.name} ({t.schema?.length || 0} perguntas)
                    </option>
                  ))
                ) : (
                  <option value="__default__">
                    {DEFAULT_BRANDING_TEMPLATE_NAME} ({DEFAULT_BRANDING_FIELDS.length} perguntas)
                  </option>
                )}
              </select>
            </div>
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <button
              type="button"
              onClick={() => setIsNewOpen(false)}
              className="studio-press rounded-full bg-[#F6F6F2] hover:bg-[#EBECE6] text-[#111412] text-xs font-semibold px-4 py-2 cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => createBriefing.mutate()}
              disabled={createBriefing.isPending}
              className="studio-press rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-xs font-semibold px-5 py-2 cursor-pointer disabled:opacity-50"
            >
              {createBriefing.isPending ? "Gerando..." : "Gerar link"}
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ClientBriefingsTab;
