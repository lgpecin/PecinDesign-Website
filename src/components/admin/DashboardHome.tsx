import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  FolderOpen,
  Users,
  FileText,
  ClipboardList,
  Plus,
  ArrowUpRight,
  Images,
  Calculator,
  LayoutTemplate,
} from "lucide-react";
import vectorFlower from "@/assets/redesign/Vector.svg";
import { useHourlyRate } from "@/hooks/useHourlyRate";
import type { AdminSection } from "./DashboardLayout";
import type { BudgetClient } from "./budgets/types";

interface DashboardHomeProps {
  onNavigate: (section: AdminSection) => void;
  onQuickNewProject: () => void;
  onQuickNewClient: () => void;
  onOpenClient: (client: BudgetClient, initialTab?: "budgets" | "briefings" | "board") => void;
}

const formatBRL = (v: number) =>
  v.toLocaleString("pt-BR", { style: "currency", currency: "BRL" });

const DashboardHome = ({
  onNavigate,
  onQuickNewProject,
  onQuickNewClient,
  onOpenClient,
}: DashboardHomeProps) => {
  const { hourlyRate } = useHourlyRate();

  const { data: stats } = useQuery({
    queryKey: ["admin-home-stats"],
    queryFn: async () => {
      const [projectsRes, carouselRes, clientsRes, budgetsRes, briefingsRes] =
        await Promise.all([
          supabase.from("projects").select("id", { count: "exact", head: true }),
          supabase.from("carousel_images").select("id", { count: "exact", head: true }),
          supabase.from("budget_clients").select("*").order("created_at", { ascending: false }),
          supabase
            .from("client_budgets")
            .select("id, name, status, client_id, created_at, accepted_at")
            .order("created_at", { ascending: false })
            .limit(8),
          (supabase as any)
            .from("client_briefings")
            .select("id, title, status, client_id, created_at, submitted_at")
            .order("created_at", { ascending: false })
            .limit(8),
        ]);

      const clients = (clientsRes.data || []) as BudgetClient[];
      const clientsMap = new Map(clients.map((c) => [c.id, c]));

      const budgets = budgetsRes.data || [];
      const briefings = briefingsRes.error ? [] : briefingsRes.data || [];

      const recentActivity = [
        ...briefings.map((b: any) => ({
          id: `br-${b.id}`,
          type: "briefing" as const,
          title: b.title || "Briefing",
          client: clientsMap.get(b.client_id),
          status: b.status === "submitted" ? "Respondido" : "Aguardando",
          isPositive: b.status === "submitted",
          date: b.submitted_at || b.created_at,
        })),
        ...budgets.map((b: any) => ({
          id: `bd-${b.id}`,
          type: "budget" as const,
          title: b.name || "Orçamento",
          client: clientsMap.get(b.client_id),
          status: b.status === "approved" ? "Aprovado" : "Em aberto",
          isPositive: b.status === "approved",
          date: b.accepted_at || b.created_at,
        })),
      ]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 6);

      return {
        projectsCount: projectsRes.count || 0,
        carouselCount: carouselRes.count || 0,
        clientsCount: clients.length,
        budgetsCount: budgets.length,
        approvedBudgetsCount: budgets.filter((b: any) => b.status === "approved").length,
        briefingsCount: briefings.length,
        submittedBriefingsCount: briefings.filter((b: any) => b.status === "submitted").length,
        recentActivity,
      };
    },
  });

  const todayFormatted = new Intl.DateTimeFormat("pt-BR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  }).format(new Date());

  return (
    <div className="space-y-7">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
        <div>
          <p className="text-xs font-medium text-[#5E6862] capitalize">
            {todayFormatted}
          </p>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#111412] mt-1">
            Estúdio Pecin
          </h1>
        </div>

        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={onQuickNewProject}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-white hover:bg-[#EFEFEA] border border-[#E5E7E2] text-[#111412] text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            Novo projeto
          </button>
          <button
            type="button"
            onClick={onQuickNewClient}
            className="studio-press inline-flex items-center gap-1.5 rounded-full bg-[#111412] hover:bg-[#232925] text-white text-xs font-semibold px-4 py-2.5 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5 text-[#CCFF00]" />
            Novo cliente
          </button>
        </div>
      </div>

      {/* Top Row: 4 Bento Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Card 1: Projetos (Soft Mint) */}
        <button
          type="button"
          onClick={() => onNavigate("projects")}
          className="studio-press group relative overflow-hidden text-left rounded-3xl bg-[#E6F7EE] p-5 border border-[#D3EFE0] cursor-pointer"
        >
          <img
            src={vectorFlower}
            alt=""
            aria-hidden="true"
            className="w-20 h-20 absolute -right-4 -bottom-4 opacity-[0.07] invert pointer-events-none select-none"
          />
          <div className="flex items-center justify-between text-[#053825]">
            <span className="text-xs font-semibold">Projetos</span>
            <FolderOpen className="w-4 h-4 opacity-70" strokeWidth={1.7} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold studio-nums text-[#053825]">
              {stats?.projectsCount ?? "—"}
            </span>
            <span className="text-xs text-[#0B6B3A] font-medium studio-nums">
              {stats ? `${stats.carouselCount} no carrossel` : ""}
            </span>
          </div>
        </button>

        {/* Card 2: Clientes (Soft Lime) */}
        <button
          type="button"
          onClick={() => onNavigate("clients")}
          className="studio-press group relative overflow-hidden text-left rounded-3xl bg-[#F1F8D0] p-5 border border-[#E3EEB3] cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#1F2E05]">
            <span className="text-xs font-semibold">Clientes</span>
            <Users className="w-4 h-4 opacity-70" strokeWidth={1.7} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold studio-nums text-[#1F2E05]">
              {stats?.clientsCount ?? "—"}
            </span>
            <span className="text-xs text-[#435B10] font-medium">
              cadastrados
            </span>
          </div>
        </button>

        {/* Card 3: Orçamentos (Warm Cream) */}
        <button
          type="button"
          onClick={() => onNavigate("clients")}
          className="studio-press text-left rounded-3xl bg-[#EFECE3] p-5 border border-[#E3DFD3] cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#111412]">
            <span className="text-xs font-semibold">Orçamentos</span>
            <FileText className="w-4 h-4 opacity-60" strokeWidth={1.7} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold studio-nums text-[#111412]">
              {stats?.budgetsCount ?? "—"}
            </span>
            <span className="text-xs text-[#5E6862] font-medium studio-nums">
              {stats ? `${stats.approvedBudgetsCount} aprovados` : ""}
            </span>
          </div>
        </button>

        {/* Card 4: Briefings (Crisp White) */}
        <button
          type="button"
          onClick={() => onNavigate("clients")}
          className="studio-press text-left rounded-3xl bg-white p-5 border border-[#E5E7E2] hover:border-[#CFD4CC] cursor-pointer"
        >
          <div className="flex items-center justify-between text-[#111412]">
            <span className="text-xs font-semibold">Briefings</span>
            <ClipboardList className="w-4 h-4 opacity-60" strokeWidth={1.7} />
          </div>
          <div className="mt-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold studio-nums text-[#111412]">
              {stats?.briefingsCount ?? 0}
            </span>
            <span className="text-xs text-[#5E6862] font-medium studio-nums">
              {stats ? `${stats.submittedBriefingsCount} respondidos` : ""}
            </span>
          </div>
        </button>
      </div>

      {/* Bottom Row: 2-Column Bento */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
        {/* Left: Recent Activity List (Clean White Card) */}
        <div className="lg:col-span-7 bg-white border border-[#E5E7E2] rounded-3xl p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold text-[#111412]">
                Atividade recente
              </h2>
              <button
                type="button"
                onClick={() => onNavigate("clients")}
                className="text-xs font-medium text-[#5E6862] hover:text-[#111412] cursor-pointer"
              >
                Ver clientes
              </button>
            </div>

            {!stats?.recentActivity?.length ? (
              <div className="py-12 text-center text-sm text-[#5E6862]">
                Nenhuma movimentação recente de briefings ou orçamentos.
              </div>
            ) : (
              <div className="divide-y divide-[#F0F1EC]">
                {stats.recentActivity.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    disabled={!item.client}
                    onClick={() => {
                      if (item.client) {
                        onOpenClient(
                          item.client,
                          item.type === "briefing" ? "briefings" : "budgets"
                        );
                      }
                    }}
                    className="w-full py-3 flex items-center justify-between gap-3 text-left hover:bg-[#FAFAF7] -mx-2 px-2 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div
                        className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 ${
                          item.type === "briefing"
                            ? "bg-[#F1F8D0] text-[#1F2E05]"
                            : "bg-[#E6F7EE] text-[#053825]"
                        }`}
                      >
                        {item.type === "briefing" ? (
                          <ClipboardList className="w-4 h-4" strokeWidth={1.7} />
                        ) : (
                          <FileText className="w-4 h-4" strokeWidth={1.7} />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold text-[#111412] truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-[#5E6862] truncate">
                          {item.client?.name || "Cliente"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-3 shrink-0">
                      <span
                        className={`text-[11px] font-medium px-2.5 py-0.5 rounded-full ${
                          item.isPositive
                            ? "bg-[#E6F7EE] text-[#053825]"
                            : "bg-[#F3F4F0] text-[#5E6862]"
                        }`}
                      >
                        {item.status}
                      </span>
                      <span className="text-xs text-[#8FA399] studio-nums hidden sm:inline">
                        {new Date(item.date).toLocaleDateString("pt-BR")}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right: Dark Studio Feature Card (Inspired by Coinview dark card) */}
        <div className="lg:col-span-5 bg-[#111412] text-white rounded-3xl p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-[#8FA399]">
                Atalhos do estúdio
              </span>
              {hourlyRate > 0 && (
                <span className="text-xs font-semibold studio-nums px-2.5 py-1 rounded-full bg-[#1C231F] text-[#CCFF00]">
                  {formatBRL(hourlyRate)}/h
                </span>
              )}
            </div>

            <h2 className="text-xl font-semibold leading-snug">
              Acesse o portfólio, carrossel e biblioteca de templates
            </h2>
          </div>

          <div className="grid grid-cols-1 gap-2">
            <button
              type="button"
              onClick={() => onNavigate("projects")}
              className="studio-press flex items-center justify-between px-4 py-3 rounded-2xl bg-[#1A201C] hover:bg-[#222A25] text-sm font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Images className="w-4 h-4 text-[#00E57A]" strokeWidth={1.7} />
                Portfólio & Carrossel
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#8FA399]" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("library")}
              className="studio-press flex items-center justify-between px-4 py-3 rounded-2xl bg-[#1A201C] hover:bg-[#222A25] text-sm font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <LayoutTemplate className="w-4 h-4 text-[#CCFF00]" strokeWidth={1.7} />
                Templates de Briefing e Serviços
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#8FA399]" />
            </button>

            <button
              type="button"
              onClick={() => onNavigate("library")}
              className="studio-press flex items-center justify-between px-4 py-3 rounded-2xl bg-[#1A201C] hover:bg-[#222A25] text-sm font-medium cursor-pointer"
            >
              <span className="flex items-center gap-2.5">
                <Calculator className="w-4 h-4 text-[#8FA399]" strokeWidth={1.7} />
                Custos & Valor/Hora
              </span>
              <ArrowUpRight className="w-4 h-4 text-[#8FA399]" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardHome;
