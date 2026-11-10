import { Copy, Check, Database } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import migrationSql from "../../../supabase/migrations/20261110140000_admin_briefings_and_boards.sql?raw";

export const isMissingTableError = (error: unknown): boolean => {
  if (!error || typeof error !== "object") return false;
  const err = error as { code?: string; message?: string; details?: string };
  const msg = `${err.code || ""} ${err.message || ""} ${err.details || ""}`.toLowerCase();
  return (
    err.code === "42P01" ||
    err.code === "PGRST205" ||
    err.code === "42703" ||
    msg.includes("does not exist") ||
    msg.includes("schema cache")
  );
};

interface MigrationNoticeProps {
  featureName?: string;
}

export const MigrationNotice = ({ featureName = "este módulo" }: MigrationNoticeProps) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(migrationSql);
    setCopied(true);
    toast.success("SQL copiado. Cole no SQL Editor do Supabase e execute.");
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="rounded-2xl border border-[#E5E7E2] bg-white p-6 space-y-4">
      <div className="flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl bg-[#E6F7EE] text-[#053825] flex items-center justify-center shrink-0">
          <Database className="w-5 h-5" />
        </div>
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-[#111412]">
            Ativar tabelas de {featureName} no Supabase
          </h3>
          <p className="text-sm text-[#5E6862] leading-relaxed">
            As novas tabelas para Briefings, Quadro do Cliente e uploads ainda não foram aplicadas no seu banco Supabase. Copie o script abaixo e execute no SQL Editor do Supabase uma única vez.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleCopy}
          className="studio-press inline-flex items-center gap-2 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-[#00E57A]" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "SQL copiado" : "Copiar SQL da migração"}
        </button>
        <span className="text-xs text-[#5E6862]">
          Arquivo: <code className="bg-[#F3F4F0] px-1.5 py-0.5 rounded text-[#111412]">supabase/migrations/20261110140000_admin_briefings_and_boards.sql</code>
        </span>
      </div>
    </div>
  );
};
