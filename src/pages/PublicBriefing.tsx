import { useEffect, useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/logo.png";
import { CheckCircle2, Loader2, Upload, X, Send, Palette } from "lucide-react";
import { toast } from "sonner";
import "@/components/admin/admin.css";
import type { BriefingField } from "@/components/admin/budgets/types";

interface PublicBriefingPayload {
  id: string;
  title: string;
  status: string;
  submitted_at: string | null;
  questions_snapshot: BriefingField[];
  responses: Record<string, any>;
  share_token: string;
  client_name: string;
  client_company: string | null;
}

const PublicBriefing = () => {
  const { token } = useParams<{ token: string }>();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<PublicBriefingPayload | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [responses, setResponses] = useState<Record<string, any>>({});
  const [submitting, setSubmitting] = useState(false);
  const [submittedDone, setSubmittedDone] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);
  const [colorInputDraft, setColorInputDraft] = useState<Record<string, string>>({});

  useEffect(() => {
    document.body.classList.add("studio-theme");
    return () => document.body.classList.remove("studio-theme");
  }, []);

  useEffect(() => {
    const load = async () => {
      if (!token) {
        setErrorMsg("Link inválido.");
        setLoading(false);
        return;
      }

      const { data: rpcData, error } = await (supabase as any).rpc(
        "get_public_briefing",
        { p_token: token }
      );

      if (error || !rpcData) {
        setErrorMsg("Briefing não encontrado ou link expirado.");
        setLoading(false);
        return;
      }

      setData(rpcData);
      const savedDraft = localStorage.getItem(`briefing_draft_${token}`);
      if (rpcData.status === "submitted") {
        setSubmittedDone(true);
        setResponses(rpcData.responses || {});
      } else if (savedDraft) {
        try {
          setResponses(JSON.parse(savedDraft));
        } catch {
          setResponses(rpcData.responses || {});
        }
      } else {
        setResponses(rpcData.responses || {});
      }
      setLoading(false);
    };

    load();
  }, [token]);

  const updateAnswer = (fieldId: string, value: any) => {
    setResponses((prev) => {
      const next = { ...prev, [fieldId]: value };
      if (token) {
        try {
          localStorage.setItem(`briefing_draft_${token}`, JSON.stringify(next));
        } catch {
          // ignore storage quota errors
        }
      }
      return next;
    });
  };

  const questions = useMemo(() => {
    return Array.isArray(data?.questions_snapshot) ? data!.questions_snapshot : [];
  }, [data]);

  const sections = useMemo(() => {
    return questions.reduce<Record<string, BriefingField[]>>((acc, q) => {
      const sec = q.section?.trim() || "Perguntas";
      if (!acc[sec]) acc[sec] = [];
      acc[sec].push(q);
      return acc;
    }, {});
  }, [questions]);

  const answeredCount = useMemo(() => {
    return questions.filter((q) => {
      const val = responses[q.id];
      if (!val) return false;
      if (typeof val === "string") return val.trim().length > 0;
      if (Array.isArray(val)) return val.length > 0;
      if (typeof val === "object") {
        return !!(val.text?.trim() || val.swatches?.length || val.files?.length);
      }
      return false;
    }).length;
  }, [questions, responses]);

  const handleFileUpload = async (fieldId: string, files: FileList | null) => {
    if (!files || !files.length || !token) return;
    setUploadingField(fieldId);
    try {
      const existing = responses[fieldId]?.files || [];
      const uploaded: { name: string; url: string }[] = [];

      for (const file of Array.from(files)) {
        const ext = file.name.split(".").pop() || "bin";
        const path = `briefing-uploads/${token}/${Date.now()}-${Math.random()
          .toString(36)
          .slice(2, 7)}.${ext}`;

        const { error: upErr } = await supabase.storage
          .from("client-assets")
          .upload(path, file);

        if (upErr) throw upErr;

        const { data: urlData } = supabase.storage
          .from("client-assets")
          .getPublicUrl(path);

        uploaded.push({ name: file.name, url: urlData.publicUrl });
      }

      updateAnswer(fieldId, { files: [...existing, ...uploaded] });
      toast.success("Arquivos anexados");
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Erro ao enviar arquivo");
    } finally {
      setUploadingField(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    // Validate required fields
    for (const q of questions) {
      if (!q.required) continue;
      const val = responses[q.id];
      const empty =
        !val ||
        (typeof val === "string" && !val.trim()) ||
        (Array.isArray(val) && val.length === 0) ||
        (typeof val === "object" &&
          !Array.isArray(val) &&
          !val.text?.trim() &&
          !val.swatches?.length &&
          !val.files?.length);

      if (empty) {
        toast.error(`Por favor, preencha: "${q.label}"`);
        return;
      }
    }

    setSubmitting(true);
    try {
      const { error } = await (supabase as any).rpc("submit_public_briefing", {
        p_token: token,
        p_responses: responses,
      });
      if (error) throw error;
      localStorage.removeItem(`briefing_draft_${token}`);
      setSubmittedDone(true);
      toast.success("Briefing enviado com sucesso");
    } catch (e: any) {
      toast.error(e?.message || "Erro ao enviar briefing");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center">
        <Loader2 className="w-7 h-7 animate-spin text-[#00A859]" />
      </div>
    );
  }

  if (errorMsg || !data) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center px-4">
        <div className="max-w-md w-full bg-white border border-[#E5E7E2] rounded-3xl p-8 text-center space-y-3">
          <div className="bg-[#111412] inline-flex px-4 py-2 rounded-full mb-2">
            <img src={logo} alt="Pecin Design" className="h-6 w-auto" />
          </div>
          <h1 className="text-lg font-bold text-[#111412]">Link indisponível</h1>
          <p className="text-sm text-[#5E6862]">{errorMsg}</p>
        </div>
      </div>
    );
  }

  if (submittedDone) {
    return (
      <div className="min-h-[100dvh] bg-[#F6F6F2] flex items-center justify-center px-4 py-12">
        <div className="max-w-lg w-full bg-white border border-[#E5E7E2] rounded-3xl p-8 sm:p-10 text-center space-y-5">
          <div className="bg-[#111412] inline-flex px-4 py-2 rounded-full">
            <img src={logo} alt="Pecin Design" className="h-6 w-auto" />
          </div>
          <div className="w-14 h-14 rounded-full bg-[#E6F7EE] text-[#00A859] flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-7 h-7" />
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl font-bold text-[#111412]">
              Briefing enviado!
            </h1>
            <p className="text-sm text-[#5E6862] leading-relaxed">
              Obrigado, <strong>{data.client_name}</strong>. Suas respostas já foram salvas para iniciarmos o projeto.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setSubmittedDone(false)}
            className="studio-press text-xs font-semibold text-[#5E6862] hover:text-[#111412] underline cursor-pointer"
          >
            Revisar ou editar respostas
          </button>
        </div>
      </div>
    );
  }

  const progress =
    questions.length > 0 ? Math.round((answeredCount / questions.length) * 100) : 0;

  return (
    <div className="min-h-[100dvh] bg-[#F6F6F2] text-[#111412] pb-20">
      {/* Clean Sticky Header */}
      <header className="sticky top-0 z-30 bg-[#111412] text-white border-b border-[#1F2723]">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-3.5 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <img src={logo} alt="Pecin Design" className="h-7 w-auto shrink-0" />
            <div className="min-w-0">
              <p className="text-xs text-[#8FA399] truncate">
                {data.client_company || data.client_name}
              </p>
              <p className="text-sm font-semibold truncate">{data.title}</p>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <span className="text-xs font-semibold text-[#CCFF00] studio-nums">
              {progress}%
            </span>
          </div>
        </div>
        <div className="h-1 bg-[#1C231F] w-full">
          <div
            className="h-full bg-[#00E57A] transition-[width] duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
      </header>

      {/* Main Form */}
      <form onSubmit={handleSubmit} className="max-w-3xl mx-auto px-4 sm:px-6 pt-8 space-y-6">
        <div className="bg-white border border-[#E5E7E2] rounded-3xl p-6 sm:p-8 space-y-2">
          <span className="inline-block text-[11px] font-semibold px-3 py-1 rounded-full bg-[#E6F7EE] text-[#053825]">
            Briefing de Projeto
          </span>
          <h1 className="text-2xl sm:text-3xl font-bold text-[#111412] pt-1">
            {data.title}
          </h1>
          <p className="text-sm text-[#5E6862] leading-relaxed">
            Responda com calma e naturalidade. Seu rascunho fica salvo automaticamente neste navegador até você clicar em enviar.
          </p>
        </div>

        {Object.entries(sections).map(([secName, secFields]) => (
          <div
            key={secName}
            className="bg-white border border-[#E5E7E2] rounded-3xl p-6 sm:p-8 space-y-6"
          >
            <h2 className="text-base font-bold text-[#00A859] pb-3 border-b border-[#F0F1EC]">
              {secName}
            </h2>

            <div className="space-y-6">
              {secFields.map((q) => {
                const val = responses[q.id];

                return (
                  <div key={q.id} className="space-y-2">
                    <label className="block text-sm font-semibold text-[#111412] leading-snug">
                      {q.label}
                      {q.required && <span className="text-red-500 ml-1">*</span>}
                    </label>
                    {q.helperText && (
                      <p className="text-xs text-[#5E6862]">{q.helperText}</p>
                    )}

                    {/* Short Text / Email / Links / Tags */}
                    {(q.type === "text" ||
                      q.type === "email" ||
                      q.type === "links" ||
                      q.type === "tags") && (
                      <input
                        type={q.type === "email" ? "email" : "text"}
                        value={typeof val === "string" ? val : ""}
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder || "Sua resposta..."}
                        className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] focus:bg-white px-4 py-2.5 text-sm text-[#111412] placeholder:text-[#9DA7A1] outline-none transition-colors"
                      />
                    )}

                    {/* Paragraph */}
                    {q.type === "textarea" && (
                      <textarea
                        rows={4}
                        value={typeof val === "string" ? val : ""}
                        onChange={(e) => updateAnswer(q.id, e.target.value)}
                        placeholder={q.placeholder || "Escreva aqui..."}
                        className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] focus:bg-white px-4 py-3 text-sm text-[#111412] placeholder:text-[#9DA7A1] outline-none transition-colors resize-y"
                      />
                    )}

                    {/* Radio */}
                    {q.type === "radio" && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {(q.options || []).map((opt) => {
                            const selected = val === opt;
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => updateAnswer(q.id, opt)}
                                className={`studio-press px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer ${
                                  selected
                                    ? "bg-[#111412] text-white border-[#111412]"
                                    : "bg-[#FAFAF7] text-[#111412] border-[#E5E7E2] hover:border-[#111412]"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {q.allowOther && (
                          <input
                            type="text"
                            value={
                              typeof val === "string" && !(q.options || []).includes(val)
                                ? val
                                : ""
                            }
                            onChange={(e) => updateAnswer(q.id, e.target.value)}
                            placeholder="Ou especifique outro estilo..."
                            className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3.5 py-2 text-xs text-[#111412] outline-none"
                          />
                        )}
                      </div>
                    )}

                    {/* Checkbox (multi-select) */}
                    {q.type === "checkbox" && (
                      <div className="space-y-2 pt-1">
                        <div className="flex flex-wrap gap-2">
                          {(q.options || []).map((opt) => {
                            const arr: string[] = Array.isArray(val) ? val : [];
                            const selected = arr.includes(opt);
                            return (
                              <button
                                key={opt}
                                type="button"
                                onClick={() => {
                                  const next = selected
                                    ? arr.filter((x) => x !== opt)
                                    : [...arr, opt];
                                  updateAnswer(q.id, next);
                                }}
                                className={`studio-press px-4 py-2 rounded-full text-xs font-semibold border cursor-pointer ${
                                  selected
                                    ? "bg-[#00A859] text-white border-[#00A859]"
                                    : "bg-[#FAFAF7] text-[#111412] border-[#E5E7E2] hover:border-[#111412]"
                                }`}
                              >
                                {opt}
                              </button>
                            );
                          })}
                        </div>
                        {q.allowOther && (
                          <div className="flex gap-2">
                            <input
                              type="text"
                              placeholder="Adicionar outro item e apertar Enter..."
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  const txt = e.currentTarget.value.trim();
                                  if (!txt) return;
                                  const arr: string[] = Array.isArray(val) ? val : [];
                                  if (!arr.includes(txt)) {
                                    updateAnswer(q.id, [...arr, txt]);
                                  }
                                  e.currentTarget.value = "";
                                }
                              }}
                              className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-3.5 py-2 text-xs text-[#111412] outline-none"
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* Colors */}
                    {q.type === "colors" && (
                      <div className="space-y-2.5">
                        <input
                          type="text"
                          value={val?.text || ""}
                          onChange={(e) =>
                            updateAnswer(q.id, {
                              ...(typeof val === "object" ? val : {}),
                              text: e.target.value,
                            })
                          }
                          placeholder={q.placeholder || "Descreva as cores..."}
                          className="w-full rounded-xl bg-[#FAFAF7] border border-[#E5E7E2] focus:border-[#111412] px-4 py-2.5 text-sm text-[#111412] outline-none"
                        />

                        <div className="flex flex-wrap items-center gap-2">
                          <input
                            type="color"
                            value={colorInputDraft[q.id] || "#00A859"}
                            onChange={(e) =>
                              setColorInputDraft((p) => ({ ...p, [q.id]: e.target.value }))
                            }
                            className="w-8 h-8 rounded-full border border-[#E5E7E2] cursor-pointer bg-transparent p-0"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              const hex = colorInputDraft[q.id] || "#00A859";
                              const existing: string[] = val?.swatches || [];
                              if (!existing.includes(hex)) {
                                updateAnswer(q.id, {
                                  ...(typeof val === "object" ? val : {}),
                                  swatches: [...existing, hex],
                                });
                              }
                            }}
                            className="studio-press inline-flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-full bg-[#F3F4F0] hover:bg-[#E5E7E2] text-[#111412] cursor-pointer"
                          >
                            <Palette className="w-3.5 h-3.5" />
                            Adicionar cor
                          </button>

                          {(val?.swatches || []).map((hex: string) => (
                            <span
                              key={hex}
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white border border-[#E5E7E2] text-xs font-mono"
                            >
                              <span
                                className="w-3 h-3 rounded-full border border-black/10"
                                style={{ backgroundColor: hex }}
                              />
                              {hex}
                              <button
                                type="button"
                                onClick={() =>
                                  updateAnswer(q.id, {
                                    ...(typeof val === "object" ? val : {}),
                                    swatches: (val?.swatches || []).filter((c: string) => c !== hex),
                                  })
                                }
                                className="text-[#8FA399] hover:text-red-600 cursor-pointer"
                              >
                                <X className="w-3 h-3" />
                              </button>
                            </span>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Files upload */}
                    {q.type === "files" && (
                      <div className="space-y-3">
                        <label className="studio-press flex items-center justify-center gap-2 border border-dashed border-[#CFD4CC] hover:border-[#111412] bg-[#FAFAF7] rounded-2xl p-5 cursor-pointer text-xs font-semibold text-[#5E6862] hover:text-[#111412]">
                          {uploadingField === q.id ? (
                            <Loader2 className="w-4 h-4 animate-spin text-[#00A859]" />
                          ) : (
                            <Upload className="w-4 h-4 text-[#00A859]" />
                          )}
                          <span>
                            {uploadingField === q.id
                              ? "Enviando arquivos..."
                              : "Clique para enviar imagens ou PDFs de referência"}
                          </span>
                          <input
                            type="file"
                            multiple
                            accept="image/*,.pdf"
                            onChange={(e) => handleFileUpload(q.id, e.target.files)}
                            className="hidden"
                            disabled={uploadingField === q.id}
                          />
                        </label>

                        {Array.isArray(val?.files) && val.files.length > 0 && (
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            {val.files.map((f: { name: string; url: string }, idx: number) => {
                              const isImg = /\.(png|jpe?g|webp|gif|svg)$/i.test(f.url);
                              return (
                                <div
                                  key={idx}
                                  className="relative rounded-xl border border-[#E5E7E2] overflow-hidden bg-white"
                                >
                                  {isImg ? (
                                    <img
                                      src={f.url}
                                      alt={f.name}
                                      className="w-full h-24 object-cover"
                                    />
                                  ) : (
                                    <div className="h-24 flex items-center justify-center text-xs text-[#5E6862] p-2 text-center">
                                      {f.name}
                                    </div>
                                  )}
                                  <button
                                    type="button"
                                    onClick={() =>
                                      updateAnswer(q.id, {
                                        files: val.files.filter((_: any, i: number) => i !== idx),
                                      })
                                    }
                                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-black/70 text-white flex items-center justify-center cursor-pointer"
                                  >
                                    <X className="w-3 h-3" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        ))}

        <div className="flex justify-end pt-2">
          <button
            type="submit"
            disabled={submitting}
            className="studio-press inline-flex items-center gap-2 rounded-full bg-[#00A859] hover:bg-[#00924E] text-white text-sm font-semibold px-7 py-3.5 shadow-sm cursor-pointer disabled:opacity-50"
          >
            {submitting ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Send className="w-4 h-4" />
            )}
            {submitting ? "Enviando..." : "Enviar briefing"}
          </button>
        </div>
      </form>
    </div>
  );
};

export default PublicBriefing;
